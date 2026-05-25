const jwt = require("jsonwebtoken");
const User = require("../db/models/User");
const Business = require("../db/models/Business");

const JWT_SECRET = process.env.JWT_SECRET || "surgemind-dev-secret-change-in-production";

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const payload = jwt.verify(token, JWT_SECRET);
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

module.exports = { signToken, requireAuth, JWT_SECRET };
