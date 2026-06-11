const express = require("express");
const router = express.Router();
const Match = require("../db/models/Match");
const Alert = require("../db/models/Alert");
const Business = require("../db/models/Business");
const AgentSession = require("../db/models/AgentSession");
const { requireAuth } = require("../middleware/auth");
const { runAgent, runAgentChat } = require("../agent/gemini");
const tools = require("../agent/tools");

router.use(requireAuth);

// Dashboard overview
router.get("/dashboard", async (req, res) => {
  try {
    const business = req.business;
    if (!business) {
      return res.status(400).json({ error: "No business profile" });
    }

    const cities = business.monitoredCities?.length ? business.monitoredCities : [business.city];
    let totalSurge = 0;
    let matchCount = 0;
    const timeline = [];

    for (const city of cities) {
      const forecast = await tools.getCrowdForecast({ city, daysAhead: 14 });
      totalSurge += forecast.surgeScore;
      matchCount += forecast.matchCount;
      for (const m of forecast.matches) {
        timeline.push({
          _id: m._id,
          date: m.date,
          city: m.city,
          venue: m.venue,
          teams: m.teams,
          expectedCrowd: m.expectedCrowd,
          surgeScore: forecast.surgeScore,
        });
      }
    }

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    const alerts = await Alert.find({ businessId: business._id }).sort({ sentAt: -1 });
    const unread = alerts.filter((a) => !a.read).length;
    const revenueSum = alerts.slice(0, 5).reduce((s, a) => s + ((a.revenueMin + a.revenueMax) / 2), 0);

    const avgSurge = cities.length ? Math.round((totalSurge / cities.length) * 10) / 10 : 0;

    res.json({
      citiesActive: cities.length,
      citiesTrend: `${matchCount} upcoming match${matchCount === 1 ? "" : "es"}`,
      surgeScore: avgSurge,
      surgeCity: business.city,
      alertsGenerated: alerts.length,
      alertsUnread: unread,
      revenueEstimate: Math.round(revenueSum),
      timeline: timeline.slice(0, 8),
      activeAlerts: alerts.slice(0, 4),
      mapCities: await getMapCityData(cities),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dashboard load failed" });
  }
});

async function getMapCityData(monitoredCities) {
  const allMatches = await Match.find({ date: { $gte: new Date() } });
  const byCity = {};
  for (const m of allMatches) {
    if (!byCity[m.city]) byCity[m.city] = { city: m.city, matches: 0, maxSurge: 0 };
    byCity[m.city].matches += 1;
    const f = await tools.getCrowdForecast({ city: m.city, daysAhead: 14 });
    byCity[m.city].maxSurge = Math.max(byCity[m.city].maxSurge, f.surgeScore);
  }
  return Object.values(byCity).map((c) => ({
    ...c,
    isUserCity: monitoredCities.includes(c.city),
  }));
}

// Matches
router.get("/matches", async (req, res) => {
  const { city, from, to, limit } = req.query;
  const query = {};
  if (city) query.city = new RegExp(city, "i");
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
    else if (!to && !from) query.date.$gte = new Date();
  } else {
    query.date = { $gte: new Date() };
  }
  const matches = await Match.find(query).sort({ date: 1 }).limit(parseInt(limit, 10) || 100);
  res.json(matches);
});

router.get("/matches/calendar/:year/:month", async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  const matches = await Match.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 });

  const byDate = {};
  for (const m of matches) {
    const key = m.date.toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    const forecast = await tools.getCrowdForecast({ city: m.city, daysAhead: 7 });
    byDate[key].push({ ...m.toObject(), surgeScore: forecast.surgeScore });
  }
  res.json({ matches, byDate });
});

router.get("/matches/:city", async (req, res) => {
  const matches = await tools.getUpcomingMatches({ city: req.params.city, daysAhead: 7 });
  res.json(matches);
});

// Alerts
router.get("/alerts", async (req, res) => {
  const { type, city } = req.query;
  const query = { businessId: req.business._id };
  if (type) query.types = type;
  if (city) query.city = new RegExp(city, "i");
  const alerts = await Alert.find(query).sort({ sentAt: -1 });
  res.json(alerts);
});

router.get("/alerts/:id", async (req, res) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    businessId: req.business._id,
  });
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  await Alert.updateOne({ _id: alert._id }, { read: true });
  res.json(alert);
});

router.post("/generate-alert", async (req, res) => {
  try {
    const { city, language, matchId } = req.body;
    const business = req.business;
    const targetCity = city || business.city;
    const result = await runAgent(
      business._id,
      targetCity,
      language || business.language,
      { matchId }
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to generate alert" });
  }
});

router.patch("/alerts/:id/checklist/:itemId", async (req, res) => {
  const alert = await Alert.findOne({
    _id: req.params.id,
    businessId: req.business._id,
  });
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  const item = alert.checklist.id(req.params.itemId);
  if (!item) return res.status(404).json({ error: "Checklist item not found" });

  item.completed = req.body.completed !== undefined ? req.body.completed : !item.completed;
  await alert.save();
  res.json(alert);
});

// Business settings
router.patch("/business", async (req, res) => {
  const allowed = [
    "name",
    "type",
    "city",
    "language",
    "monitoredCities",
    "dailyCapacity",
    "staffCount",
    "averageTicket",
    "operatingHours",
    "topProducts",
    "alertLeadTimeDays",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.business[key] = req.body[key];
  }
  const maxCities = req.user.plan === "pro" ? 3 : 1;
  if (req.business.monitoredCities?.length > maxCities) {
    req.business.monitoredCities = req.business.monitoredCities.slice(0, maxCities);
  }
  if (Array.isArray(req.business.topProducts)) {
    req.business.topProducts = req.business.topProducts.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  }
  await req.business.save();
  res.json(req.business);
});

// Analytics
router.get("/analytics", async (req, res) => {
  const businessId = req.business._id;
  const alerts = await Alert.find({ businessId }).populate("matchIds").sort({ sentAt: -1 });

  const latestByMatch = new Map();
  for (const alert of alerts) {
    const primaryMatch = alert.matchIds?.[0];
    const key = primaryMatch?._id?.toString() || alert._id.toString();
    if (!latestByMatch.has(key)) latestByMatch.set(key, alert);
  }
  const uniqueAlerts = [...latestByMatch.values()];

  const typeCounts = {};
  uniqueAlerts.forEach((a) => {
    (a.types || []).forEach((t) => {
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
  });

  const scoreHistory = uniqueAlerts.slice(0, 30).reverse().map((a) => ({
    date: a.sentAt,
    score: a.surgeScore,
    label: a.matchLabel,
  }));

  const weeklyRevenue = {};
  uniqueAlerts.forEach((a) => {
    const week = getWeekKey(a.sentAt);
    weeklyRevenue[week] = (weeklyRevenue[week] || 0) + (a.revenueMin + a.revenueMax) / 2;
  });

  const matchImpact = uniqueAlerts.map((a) => {
    const primaryMatch = a.matchIds?.[0];
    return {
    date: primaryMatch?.date || a.sentAt,
    generatedAt: a.sentAt,
    match: a.matchLabel,
    city: a.city,
    venue: a.venue,
    surgeScore: a.surgeScore,
    severity: a.severity,
    estRevenue: Math.round((a.revenueMin + a.revenueMax) / 2),
    };
  });

  const totalOpportunity = Object.values(weeklyRevenue).reduce((s, v) => s + v, 0);
  const avgSurge = uniqueAlerts.length
    ? uniqueAlerts.reduce((sum, a) => sum + (a.surgeScore || 0), 0) / uniqueAlerts.length
    : 0;

  res.json({
    scoreHistory,
    typeCounts,
    weeklyRevenue: Object.entries(weeklyRevenue).map(([week, revenue]) => ({ week, revenue })),
    totalMonth: totalOpportunity,
    totalOpportunity,
    generatedPlans: uniqueAlerts.length,
    rawAlertCount: alerts.length,
    duplicatePlansIgnored: Math.max(0, alerts.length - uniqueAlerts.length),
    avgSurge: Math.round(avgSurge * 10) / 10,
    matchImpact,
  });
});

function getWeekKey(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

// AI Agent
router.get("/agent/session", async (req, res) => {
  let session = await AgentSession.findOne({
    businessId: req.business._id,
    userId: req.user._id,
  }).sort({ updatedAt: -1 });

  if (!session) {
    session = await AgentSession.create({
      businessId: req.business._id,
      userId: req.user._id,
      messages: [],
      toolCalls: [],
    });
  }

  const cities = req.business.monitoredCities || [req.business.city];
  const monitoring = [];
  for (const city of cities) {
    const forecast = await tools.getCrowdForecast({ city, daysAhead: req.business.alertLeadTimeDays || 14 });
    const next = await Match.findOne({ city: new RegExp(city, "i"), date: { $gte: new Date() } }).sort({ date: 1 });
    const daysUntil = next ? Math.ceil((next.date - Date.now()) / 86400000) : null;
    monitoring.push({ city, surgeScore: forecast.surgeScore, daysUntil, nextMatch: next });
  }

  res.json({ session, monitoring });
});

router.post("/agent/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Message required" });
    }

    let session = sessionId
      ? await AgentSession.findOne({ _id: sessionId, userId: req.user._id })
      : null;

    if (!session) {
      session = await AgentSession.create({
        businessId: req.business._id,
        userId: req.user._id,
        messages: [],
        toolCalls: [],
      });
    }

    session.messages.push({ role: "user", content: message.trim() });

    const result = await runAgentChat(
      req.business._id,
      req.business.city,
      req.business.language,
      message
    );

    session.messages.push({
      role: "assistant",
      content: result.content,
      reasoningSteps: result.reasoningSteps,
    });

    session.toolCalls.push({
      tool: "getUpcomingMatches",
      args: `(${req.business.city}, ${req.business.alertLeadTimeDays || 14}d)`,
      result: `returned ${result.matches.length} matches`,
    });
    session.toolCalls.push({
      tool: "getCrowdForecast",
      args: `(${req.business.city})`,
      result: `surge: ${result.forecast.surgeScore}`,
    });

    session.stats.queriesRun = (session.stats.queriesRun || 0) + 1;
    await session.save();

    res.json({
      sessionId: session._id,
      reply: result.content,
      reasoningSteps: result.reasoningSteps,
      forecast: result.forecast,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Agent chat failed" });
  }
});

router.post("/agent/new-session", async (req, res) => {
  const session = await AgentSession.create({
    businessId: req.business._id,
    userId: req.user._id,
    title: "New session",
    messages: [],
    toolCalls: [],
  });
  res.json(session);
});

// Notifications prefs (stored on user for simplicity)
router.get("/settings/notifications", async (req, res) => {
  res.json(
    req.user.notificationPrefs || {
      emailAlerts: true,
      inAppAlerts: true,
      timing: "7",
      types: { STOCK_UP: true, HIRE_STAFF: true, MENU_TRANSLATE: true, PRICE_ADJUST: false },
    }
  );
});

router.patch("/settings/notifications", async (req, res) => {
  req.user.notificationPrefs = { ...req.user.notificationPrefs, ...req.body };
  await req.user.save();
  res.json(req.user.notificationPrefs);
});

module.exports = router;
