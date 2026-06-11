const express = require("express");
const router = express.Router();
const User = require("../db/models/User");
const Business = require("../db/models/Business");
const {
  signToken,
  requireAuth,
  tryAuth,
  setAuthCookie,
  clearAuthCookie,
} = require("../middleware/auth");

const FIFA_CITIES = [
  "Atlanta", "Boston", "Dallas", "Guadalajara", "Houston", "Kansas City",
  "Los Angeles", "Mexico City", "Miami", "Monterrey", "New York/New Jersey",
  "Philadelphia", "San Francisco Bay Area", "Seattle", "Toronto", "Vancouver",
];

router.get("/cities", (_req, res) => {
  res.json(FIFA_CITIES);
});

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 10 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  );
}

const authAttempts = new Map();

function authRateLimit(req, res, next) {
  const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 20;
  const record = authAttempts.get(key) || { count: 0, resetAt: now + windowMs };

  if (record.resetAt <= now) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  authAttempts.set(key, record);

  if (record.count > maxAttempts) {
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  next();
}

router.post("/register", authRateLimit, async (req, res) => {
  try {
    const { businessName, name, password, businessType, city, language } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!businessName || !name || !email || !password || !businessType || !city) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 10 characters and include a letter and number" });
    }
    if (!FIFA_CITIES.includes(city)) {
      return res.status(400).json({ error: "Choose a supported FIFA 2026 city" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({
      name: String(name).trim(),
      email,
      password,
      onboardingComplete: false,
    });

    const business = await Business.create({
      name: String(businessName).trim(),
      type: businessType,
      city,
      language: language || "en",
      ownerId: user._id,
      monitoredCities: [city],
    });

    user.businessId = business._id;
    await user.save();

    const token = signToken(user._id);
    setAuthCookie(res, token);
    res.status(201).json({
      token,
      user: { ...user.toJSON(), business },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

router.post("/login", authRateLimit, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!validateEmail(email) || !password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const business = user.businessId
      ? await Business.findById(user.businessId)
      : null;
    const token = signToken(user._id);
    setAuthCookie(res, token);
    res.json({ token, user: { ...user.toJSON(), business } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: { ...req.user.toJSON(), business: req.business || null },
  });
});

router.get("/session", tryAuth, async (req, res) => {
  res.json({
    user: req.user ? { ...req.user.toJSON(), business: req.business || null } : null,
  });
});

router.patch("/onboarding", requireAuth, async (req, res) => {
  try {
    const {
      step,
      businessName,
      businessType,
      city,
      language,
      monitoredCities,
      dailyCapacity,
      staffCount,
      averageTicket,
      operatingHours,
      topProducts,
      alertLeadTimeDays,
    } = req.body;

    if (req.business) {
      if (businessName) req.business.name = String(businessName).trim();
      if (businessType) req.business.type = businessType;
      if (city) req.business.city = city;
      if (language) req.business.language = language;
      if (dailyCapacity !== undefined) req.business.dailyCapacity = Number(dailyCapacity);
      if (staffCount !== undefined) req.business.staffCount = Number(staffCount);
      if (averageTicket !== undefined) req.business.averageTicket = Number(averageTicket);
      if (operatingHours) req.business.operatingHours = String(operatingHours).trim();
      if (alertLeadTimeDays !== undefined) req.business.alertLeadTimeDays = Number(alertLeadTimeDays);
      if (Array.isArray(topProducts)) {
        req.business.topProducts = topProducts
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 8);
      }
      if (monitoredCities?.length) {
        const max = req.user.plan === "pro" ? 3 : 1;
        req.business.monitoredCities = monitoredCities.slice(0, max);
      }
      await req.business.save();
    }

    if (step === 3 || req.body.complete) {
      req.user.onboardingComplete = true;
      await req.user.save();

      // Generate first surge alert for new users
      if (req.business) {
        const Alert = require("../db/models/Alert");
        const existing = await Alert.countDocuments({ businessId: req.business._id });
        if (existing === 0) {
          try {
            const { runAgent } = require("../agent/gemini");
            await runAgent(req.business._id, req.business.city, req.business.language);
          } catch (err) {
            console.warn("First alert generation skipped:", err.message);
          }
        }
      }
    }

    const business = req.business
      ? await Business.findById(req.business._id)
      : null;

    res.json({
      user: { ...req.user.toJSON(), business },
    });
  } catch (err) {
    res.status(500).json({ error: "Onboarding update failed" });
  }
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (name) req.user.name = String(name).trim();
    if (email) {
      const normalizedEmail = normalizeEmail(email);
      if (!validateEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Enter a valid email address" });
      }
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user._id },
      });
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }
      req.user.email = normalizedEmail;
    }
    await req.user.save();
    res.json({ user: { ...req.user.toJSON(), business: req.business } });
  } catch (err) {
    res.status(500).json({ error: "Profile update failed" });
  }
});

module.exports = router;
