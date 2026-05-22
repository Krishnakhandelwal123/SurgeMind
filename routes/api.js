// routes/api.js
const express = require("express");
const router  = express.Router();
const Business = require("../models/Business");
const Match    = require("../models/Match");
const Alert    = require("../models/Alert");
const { runAgent } = require("../agent/gemini");

// GET all businesses
router.get("/businesses", async (req, res) => {
  const businesses = await Business.find({});
  res.json(businesses);
});

// GET upcoming matches for a city
router.get("/matches/:city", async (req, res) => {
  const { city } = req.params;
  const from = new Date();
  const to   = new Date(Date.now() + 7 * 86400000);
  const matches = await Match.find({
    city: new RegExp(city, "i"),
    date: { $gte: from, $lte: to }
  });
  res.json(matches);
});

// POST generate an AI action plan for a business
router.post("/generate-alert", async (req, res) => {
  const { businessId, city, language } = req.body;
  const result = await runAgent(businessId, city, language);
  res.json(result);
});

// GET alerts for a business
router.get("/alerts/:businessId", async (req, res) => {
  const alerts = await Alert.find({ businessId: req.params.businessId })
    .sort({ sentAt: -1 });
  res.json(alerts);
});

module.exports = router;