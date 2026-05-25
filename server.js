require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err));
} else {
  console.warn("⚠️ MONGODB_URI not set — API will fail until configured");
}

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/api"));

app.get("/api/matches/next/global", async (_req, res) => {
  try {
    const Match = require("./db/models/Match");
    const next = await Match.findOne({ date: { $gte: new Date() } }).sort({ date: 1 });
    if (!next) return res.json(null);
    const diff = next.date - Date.now();
    res.json({
      match: next,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
    });
  } catch {
    res.json(null);
  }
});

// Public stats for landing (no auth)
app.get("/api/public/stats", async (_req, res) => {
  try {
    const Match = require("./db/models/Match");
    const cities = await Match.distinct("city");
    const count = await Match.countDocuments();
    res.json({
      cities: cities.length || 16,
      matches: count || 49,
      categories: 5,
      languages: 3,
    });
  } catch {
    res.json({ cities: 16, matches: 49, categories: 5, languages: 3 });
  }
});

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "frontend/build");
  app.use(express.static(buildPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 SurgeMind API on port ${PORT}`));
