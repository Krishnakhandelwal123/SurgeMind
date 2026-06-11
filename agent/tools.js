const Match = require("../db/models/Match");
const Business = require("../db/models/Business");
const Alert = require("../db/models/Alert");

const CITY_BASELINE = {
  Atlanta: 7500,
  Boston: 6000,
  Dallas: 8000,
  Guadalajara: 5500,
  Houston: 7000,
  "Kansas City": 4500,
  "Los Angeles": 10000,
  "Mexico City": 9000,
  Miami: 7000,
  Monterrey: 5500,
  "New York/New Jersey": 12000,
  Philadelphia: 6500,
  "San Francisco Bay Area": 5500,
  "Santa Clara": 5000,
  Seattle: 5000,
  Toronto: 5500,
  Vancouver: 5000,
};

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getUpcomingMatches({ city, daysAhead = 14, limit = 3, matchId }) {
  if (matchId) {
    const selected = await Match.findById(matchId);
    if (selected) return [selected];
  }

  const from = new Date();
  const to = new Date(Date.now() + daysAhead * 86400000);
  const cityRegex = new RegExp(`^${escapeRegex(city)}$`, "i");

  const matches = await Match.find({
    city: cityRegex,
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 }).limit(limit);

  if (matches.length) return matches;

  return Match.find({
    city: cityRegex,
    date: { $gte: from },
  }).sort({ date: 1 }).limit(limit);
}

async function getCrowdForecast({ city, daysAhead = 14 }) {
  const matches = await getUpcomingMatches({ city, daysAhead, limit: 5 });
  const totalCrowd = matches.reduce((sum, m) => sum + (m.expectedCrowd || 0), 0);
  const baseline = CITY_BASELINE[city] || 5000;
  const raw = (totalCrowd / baseline) * 5;
  const surgeScore = totalCrowd ? Math.min(10, Math.round(raw * 10) / 10) : 0;
  return { surgeScore, matchCount: matches.length, totalCrowd, matches };
}

async function getBusinessProfile({ businessId }) {
  return Business.findById(businessId);
}

function inferAlertTypes(text) {
  const types = [];
  const lower = text.toLowerCase();
  if (/stock|inventory|order|supply|ingredient|beverage/.test(lower)) types.push("STOCK_UP");
  if (/hire|staff|shift|employee|server|team/.test(lower)) types.push("HIRE_STAFF");
  if (/menu|spanish|translate|bilingual|language|signage/.test(lower)) types.push("MENU_TRANSLATE");
  if (/price|pricing|bundle|markup|discount|offer/.test(lower)) types.push("PRICE_ADJUST");
  if (/hour|extend|open|close|checkout|queue/.test(lower)) types.push("HOURS_EXTEND");
  return [...new Set(types.length ? types : ["STOCK_UP", "HIRE_STAFF"])];
}

function categoryForLine(line, fallback) {
  const lower = line.toLowerCase();
  if (/stock|inventory|order|supply|ingredient|beverage/.test(lower)) return "STOCK_UP";
  if (/hire|staff|shift|employee|server|team/.test(lower)) return "HIRE_STAFF";
  if (/menu|translate|bilingual|language|signage/.test(lower)) return "MENU_TRANSLATE";
  if (/price|pricing|bundle|discount|offer|revenue/.test(lower)) return "PRICE_ADJUST";
  if (/hour|extend|open|close|checkout|queue/.test(lower)) return "HOURS_EXTEND";
  return fallback || "OTHER";
}

function buildChecklist(advice, types) {
  const lines = advice
    .split("\n")
    .map((line) => line.replace(/^[\s\-*>]+/, "").trim())
    .filter((line) => line.length > 12 && !/^(surge score|estimated extra revenue)/i.test(line));

  const actionLines = lines.filter((line) =>
    /order|stock|hire|schedule|print|translate|extend|prepare|create|launch|brief|set|add/i.test(line)
  );

  const source = (actionLines.length ? actionLines : lines).slice(0, 8);
  const items = source.map((line, i) => ({
    text: line,
    completed: false,
    category: categoryForLine(line, types[i % types.length]),
  }));

  if (items.length) return items;

  return [
    { text: "Review upcoming match timing and expected crowd size", completed: false, category: "OTHER" },
    { text: "Prepare inventory and staffing plan for the busiest match window", completed: false, category: "STOCK_UP" },
    { text: "Create bilingual signage for visiting fans", completed: false, category: "MENU_TRANSLATE" },
  ];
}

function estimateRevenue(surgeScore, businessType, business = {}) {
  const base = { restaurant: 3200, bar: 2800, hotel: 4500, retail: 1800, cafe: 1500 };
  const capacityBoost = Math.max(0.8, Math.min(1.8, (business.dailyCapacity || 120) / 120));
  const ticketBoost = Math.max(0.8, Math.min(1.8, (business.averageTicket || 28) / 28));
  const mult = Math.max(0.25, (surgeScore / 10) * 1.4);
  const mid = Math.round((base[businessType] || 2500) * mult * capacityBoost * ticketBoost);
  return { min: Math.round(mid * 0.85), max: Math.round(mid * 1.15) };
}

function getSeverity(surgeScore) {
  if (surgeScore >= 9) return "CRITICAL";
  if (surgeScore >= 7) return "HIGH";
  if (surgeScore >= 4) return "MEDIUM";
  return "LOW";
}

function buildRevenueRationale(revenue, business, totalCrowd, surgeScore) {
  const ticket = business?.averageTicket || 28;
  const captureRate = Math.max(2, Math.round(surgeScore * 1.4));
  return `Based on a $${ticket} average ticket, ${totalCrowd.toLocaleString()} expected fans, and an estimated ${captureRate}% local capture opportunity for a ${business?.type || "business"}.`;
}

async function saveAlert({
  businessId,
  message,
  language,
  surgeScore,
  matches,
  business,
  reasoningTrace,
}) {
  const types = inferAlertTypes(message);
  const revenue = estimateRevenue(surgeScore, business?.type, business);
  const primary = matches[0];
  const totalCrowd = matches.reduce((sum, match) => sum + (match.expectedCrowd || 0), 0);
  const dueDate = primary?.date
    ? new Date(primary.date.getTime() - (business?.alertLeadTimeDays || 7) * 86400000)
    : undefined;
  const fanBreakdown = (primary?.fanNationalities || []).map((f) => ({
    country: f.country,
    pct: f.pct,
    flag: f.country === "Argentina" ? "AR" : f.country === "Mexico" ? "MX" : f.country === "Brazil" ? "BR" : "INTL",
  }));

  const payload = {
    message,
    summary: message.split("\n").find((line) => line.trim().length > 40)?.slice(0, 220) || message.slice(0, 220),
    types,
    language,
    surgeScore,
    severity: getSeverity(surgeScore),
    matchIds: matches.map((m) => m._id),
    matchLabel: primary
      ? `${primary.teams.join(" vs ")} - ${primary.date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`
      : "No match found",
    venue: primary?.venue || "",
    city: primary?.city || business?.city,
    revenueMin: revenue.min,
    revenueMax: revenue.max,
    revenueRationale: buildRevenueRationale(revenue, business, totalCrowd, surgeScore),
    dueDate,
    reasoningTrace: reasoningTrace || [],
    fanBreakdown,
    sentAt: new Date(),
  };

  const existing = primary
    ? await Alert.findOne({ businessId, matchIds: primary._id }).sort({ sentAt: -1 })
    : null;

  const alert = existing || new Alert({ businessId, read: false });
  Object.assign(alert, payload);
  if (!existing || !alert.checklist?.length) {
    alert.checklist = buildChecklist(message, types);
  }
  if (existing) alert.read = false;
  await alert.save();

  return alert;
}

module.exports = {
  getUpcomingMatches,
  getCrowdForecast,
  getBusinessProfile,
  saveAlert,
  inferAlertTypes,
  estimateRevenue,
  getSeverity,
  CITY_BASELINE,
};
