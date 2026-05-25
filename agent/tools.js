const Match = require("../db/models/Match");
const Business = require("../db/models/Business");
const Alert = require("../db/models/Alert");

const CITY_BASELINE = {
  Dallas: 8000, Miami: 7000, "New York": 12000, "Los Angeles": 10000,
  Seattle: 5000, Boston: 6000, Atlanta: 7500, Houston: 7000,
  "Kansas City": 4500, Philadelphia: 6500, "San Francisco": 5500,
  Arlington: 8000, "East Rutherford": 12000, Foxborough: 5000,
  Inglewood: 10000, "Santa Clara": 5000,
};

async function getUpcomingMatches({ city, daysAhead = 7 }) {
  const from = new Date();
  const to = new Date(Date.now() + daysAhead * 86400000);
  return Match.find({
    city: new RegExp(`^${city}$`, "i"),
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 });
}

async function getCrowdForecast({ city, daysAhead = 7 }) {
  const matches = await getUpcomingMatches({ city, daysAhead });
  const totalCrowd = matches.reduce((sum, m) => sum + (m.expectedCrowd || 0), 0);
  const baseline = CITY_BASELINE[city] || 5000;
  const raw = (totalCrowd / baseline) * 5;
  const surgeScore = Math.min(10, Math.round(raw * 10) / 10) || 1;
  return { surgeScore, matchCount: matches.length, totalCrowd, matches };
}

async function getBusinessProfile({ businessId }) {
  return Business.findById(businessId);
}

function inferAlertTypes(text) {
  const types = [];
  const lower = text.toLowerCase();
  if (/stock|inventory|order|beef|supply/.test(lower)) types.push("STOCK_UP");
  if (/hire|staff|shift|employee/.test(lower)) types.push("HIRE_STAFF");
  if (/menu|spanish|translate|bilingual|language/.test(lower)) types.push("MENU_TRANSLATE");
  if (/price|pricing|markup|%\s*up/.test(lower)) types.push("PRICE_ADJUST");
  if (/hour|extend|open|close/.test(lower)) types.push("HOURS_EXTEND");
  return types.length ? types : ["STOCK_UP"];
}

function buildChecklist(advice, types) {
  const lines = advice.split("\n").filter((l) => l.trim().length > 10);
  const actionLines = lines.filter((l) =>
    /^[\s]*[-→•☐□]/.test(l) || /^(INVENTORY|STAFFING|MENU|OPERATIONS)/i.test(l)
  );
  const items = (actionLines.length ? actionLines : lines.slice(0, 6)).slice(0, 8).map((line, i) => ({
    text: line.replace(/^[\s\-→•☐□]+/, "").trim(),
    completed: false,
    category: types[i % types.length] || "OTHER",
  }));
  if (!items.length) {
    return [
      { text: "Review surge plan and prepare inventory", completed: false, category: "STOCK_UP" },
      { text: "Schedule extra staff for match weekend", completed: false, category: "HIRE_STAFF" },
    ];
  }
  return items;
}

function estimateRevenue(surgeScore, businessType) {
  const base = { restaurant: 3200, bar: 2800, hotel: 4500, retail: 1800, cafe: 1500 };
  const mult = (surgeScore / 10) * 1.4;
  const mid = Math.round((base[businessType] || 2500) * mult);
  return { min: Math.round(mid * 0.85), max: Math.round(mid * 1.15) };
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
  const revenue = estimateRevenue(surgeScore, business?.type);
  const primary = matches[0];
  const fanBreakdown = (primary?.fanNationalities || []).map((f) => ({
    country: f.country,
    pct: f.pct,
    flag: f.country === "Argentina" ? "🇦🇷" : f.country === "Mexico" ? "🇲🇽" : f.country === "Brazil" ? "🇧🇷" : "🌍",
  }));

  const alert = await Alert.create({
    businessId,
    message,
    summary: message.slice(0, 200),
    types,
    language,
    surgeScore,
    matchIds: matches.map((m) => m._id),
    matchLabel: primary
      ? `${primary.teams.join(" vs ")} · ${primary.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : "",
    venue: primary?.venue || "",
    city: primary?.city || business?.city,
    revenueMin: revenue.min,
    revenueMax: revenue.max,
    reasoningTrace: reasoningTrace || [],
    checklist: buildChecklist(message, types),
    fanBreakdown,
    read: false,
    sentAt: new Date(),
  });

  return alert;
}

module.exports = {
  getUpcomingMatches,
  getCrowdForecast,
  getBusinessProfile,
  saveAlert,
  inferAlertTypes,
  estimateRevenue,
  CITY_BASELINE,
};
