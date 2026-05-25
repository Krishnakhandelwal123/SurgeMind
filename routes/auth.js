const express = require("express");
const router = express.Router();
const User = require("../db/models/User");
const Business = require("../db/models/Business");
const { signToken, requireAuth } = require("../middleware/auth");

const FIFA_CITIES = [
  "Atlanta", "Boston", "Dallas", "Houston", "Kansas City", "Los Angeles",
  "Miami", "New York", "Philadelphia", "San Francisco", "Seattle",
  "Arlington", "East Rutherford", "Foxborough", "Inglewood", "Santa Clara",
];

router.get("/cities", (_req, res) => {
  res.json(FIFA_CITIES);
});

router.post("/register", async (req, res) => {
  try {
    const { businessName, name, email, password, businessType, city, language } = req.body;
    if (!businessName || !name || !email || !password || !businessType || !city) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      onboardingComplete: false,
    });

    const business = await Business.create({
      name: businessName,
      type: businessType,
      city,
      language: language || "en",
      ownerId: user._id,
      monitoredCities: [city],
    });

    user.businessId = business._id;
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { ...user.toJSON(), business },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const business = user.businessId
      ? await Business.findById(user.businessId)
      : null;
    const token = signToken(user._id);
    res.json({ token, user: { ...user.toJSON(), business } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: { ...req.user.toJSON(), business: req.business || null },
  });
});

router.patch("/onboarding", requireAuth, async (req, res) => {
  try {
    const { step, businessName, businessType, city, language, monitoredCities } = req.body;

    if (req.business) {
      if (businessName) req.business.name = businessName;
      if (businessType) req.business.type = businessType;
      if (city) req.business.city = city;
      if (language) req.business.language = language;
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
    if (name) req.user.name = name;
    if (email) req.user.email = email.toLowerCase();
    await req.user.save();
    res.json({ user: { ...req.user.toJSON(), business: req.business } });
  } catch (err) {
    res.status(500).json({ error: "Profile update failed" });
  }
});

module.exports = router;
