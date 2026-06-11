const jwt = require("jsonwebtoken");
const User = require("../db/models/User");
const Business = require("../db/models/Business");

const COOKIE_NAME = "surgemind_session";
const isProduction = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? null : "surgemind-dev-secret-change-in-production");

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production");
}

if (isProduction && JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

function signToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    {
      expiresIn: "7d",
      issuer: "surgemind-api",
      audience: "surgemind-web",
    }
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: undefined,
  });
}

function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .reduce((value, part) => {
      if (value) return value;
      const [key, ...rest] = part.split("=");
      return key === name ? decodeURIComponent(rest.join("=")) : "";
    }, "");
}

function getToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return readCookie(req, COOKIE_NAME);
}

async function requireAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: "surgemind-api",
      audience: "surgemind-web",
    });
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    if (user.businessId) {
      req.business = await Business.findById(user.businessId);
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function tryAuth(req, _res, next) {
  try {
    const token = getToken(req);
    if (!token) return next();
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: "surgemind-api",
      audience: "surgemind-web",
    });
    const user = await User.findById(payload.userId);
    if (!user) return next();
    req.user = user;
    if (user.businessId) {
      req.business = await Business.findById(user.businessId);
    }
    return next();
  } catch {
    return next();
  }
}

module.exports = {
  signToken,
  requireAuth,
  tryAuth,
  setAuthCookie,
  clearAuthCookie,
  JWT_SECRET,
};
