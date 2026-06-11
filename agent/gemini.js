const { GoogleGenerativeAI } = require("@google/generative-ai");
const tools = require("./tools");

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const HOST_CITY_TIMEZONES = {
  Atlanta: "America/New_York",
  Boston: "America/New_York",
  Dallas: "America/Chicago",
  Guadalajara: "America/Mexico_City",
  Houston: "America/Chicago",
  "Kansas City": "America/Chicago",
  "Los Angeles": "America/Los_Angeles",
  "Mexico City": "America/Mexico_City",
  Miami: "America/New_York",
  Monterrey: "America/Monterrey",
  "New York/New Jersey": "America/New_York",
  Philadelphia: "America/New_York",
  "San Francisco Bay Area": "America/Los_Angeles",
  Seattle: "America/Los_Angeles",
  Toronto: "America/Toronto",
  Vancouver: "America/Vancouver",
};

const SYSTEM_PROMPT = `You are SurgeMind, an AI operations agent for local businesses preparing for FIFA World Cup 2026 fan surges.

Rules:
1. Use the supplied database/tool data only. Do not invent matches, venues, or crowd sizes.
2. Be specific: quantities, staff counts, timing, revenue range, and language needs.
3. Write like an operations advisor, not a generic chatbot.
4. Structure output with these sections: EXECUTIVE BRIEF, INVENTORY, STAFFING, MENU/LANGUAGE, OPERATIONS, REVENUE.
5. Keep recommendations practical for a small business owner.`;

function buildReasoningTrace(matches, forecast, business) {
  const city = business?.city || "city";
  const top = matches[0];
  return [
    { step: `Read business profile for ${business?.name || "business"} in ${city}`, status: "done" },
    { step: `Queried upcoming FIFA 2026 matches for ${city}`, status: "done" },
    {
      step: top
        ? `Selected next match: ${top.teams.join(" vs ")} at ${top.venue} with ${top.expectedCrowd.toLocaleString()} expected fans`
        : "No upcoming match found for the selected city",
      status: "done",
    },
    { step: `Calculated ${forecast.totalCrowd.toLocaleString()} total expected fans and surge score ${forecast.surgeScore}/10`, status: "done" },
    {
      step: top?.fanNationalities?.length
        ? `Analyzed fan mix: ${top.fanNationalities.map((f) => `${f.pct}% ${f.country}`).join(", ")}`
        : "Fan nationality mix unavailable",
      status: "done",
    },
    { step: "Generated a business-specific action plan", status: "done" },
  ];
}

function productList(business) {
  return business?.topProducts?.length ? business.topProducts.join(", ") : "best-selling items";
}

function formatMatchDate(date, city) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: HOST_CITY_TIMEZONES[city] || "UTC",
  }).format(date);
}

function fallbackAdvice(business, matches, forecast) {
  const top = matches[0];
  const fans = top?.fanNationalities?.map((f) => `${f.country} (${f.pct}%)`).join(", ") || "international fans";
  const matchName = top ? top.teams.join(" vs ") : "the next FIFA match";
  const matchDate = top ? formatMatchDate(top.date, top.city) : "match day";
  const capacity = business?.dailyCapacity || 120;
  const staff = business?.staffCount || 8;
  const extraStaff = Math.max(2, Math.ceil(staff * 0.35));
  const inventoryMultiple = forecast.surgeScore >= 9 ? 3 : forecast.surgeScore >= 7 ? 2.5 : 1.8;
  const revenue = tools.estimateRevenue(forecast.surgeScore, business?.type, business);

  if (!top) {
    return `EXECUTIVE BRIEF
No upcoming FIFA 2026 match is currently available for ${business?.city}. Keep the profile ready and refresh once match data is loaded.

OPERATIONS
- Confirm business hours, staff count, capacity, and top products in Settings.
- Prepare a reusable match-day checklist for inventory, staffing, signage, and checkout.

REVENUE
Estimated extra revenue: $0 - $0 until a match is found.`;
  }

  return `EXECUTIVE BRIEF
${matchName} on ${matchDate} is expected to bring an estimated ${top.expectedCrowd.toLocaleString()} fans near ${top.venue}. SurgeMind rates this as ${forecast.surgeScore}/10 for ${business?.name}. Fan mix: ${fans}.

INVENTORY
- Order ${inventoryMultiple}x normal inventory for ${productList(business)} no later than ${business?.alertLeadTimeDays || 7} days before kickoff.
- Prepare fast-moving bundles for at least ${Math.round(capacity * 1.4)} customers across the peak pre-match and post-match windows.
- Hold a 20% buffer for beverages, takeaway packaging, and high-margin add-ons.

STAFFING
- Schedule ${extraStaff} additional staff for the 4 hours before kickoff and 2 hours after the match.
- Assign one person to queue control, one to mobile/order pickup, and one to restocking.
- Brief the team on likely visiting fans: ${fans}.

MENU/LANGUAGE
- Print a one-page match-day menu in ${business?.language === "es" ? "Spanish and English" : business?.language === "fr" ? "French and English" : "English plus simple fan-language labels"}.
- Feature 3 quick-serve items from ${productList(business)} and make prices visible from the entrance.
- Add signage for restrooms, pickup, card-only lanes, and fastest-selling items.

OPERATIONS
- Extend operating hours from ${business?.operatingHours || "normal hours"} by 90 minutes after the match if staffing allows.
- Set a separate express checkout path for bundles and bottled drinks.
- Review inventory every 45 minutes during the match window.

REVENUE
Estimated extra revenue: $${revenue.min.toLocaleString()} - $${revenue.max.toLocaleString()} this match window.`;
}

function buildPrompt({ business, matches, forecast, language, userMessage }) {
  return `${SYSTEM_PROMPT}

Business profile:
${JSON.stringify({
  name: business?.name,
  type: business?.type,
  city: business?.city,
  language,
  dailyCapacity: business?.dailyCapacity,
  staffCount: business?.staffCount,
  averageTicket: business?.averageTicket,
  operatingHours: business?.operatingHours,
  topProducts: business?.topProducts,
  alertLeadTimeDays: business?.alertLeadTimeDays,
}, null, 2)}

Tool data:
${JSON.stringify({
  matches: matches.map((m) => ({
    teams: m.teams,
    date: formatMatchDate(m.date, m.city),
    city: m.city,
    venue: m.venue,
    expectedCrowd: m.expectedCrowd,
    fanNationalities: m.fanNationalities,
    stage: m.stage,
  })),
  forecast: {
    surgeScore: forecast.surgeScore,
    totalCrowd: forecast.totalCrowd,
    matchCount: forecast.matchCount,
  },
}, null, 2)}

${userMessage ? `Owner question: ${userMessage}` : "Task: Generate the main match-day action plan."}

Respond in ${language}.`;
}

async function generateAdvice({ business, matches, forecast, language, userMessage }) {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    return fallbackAdvice(business, matches, forecast);
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(buildPrompt({ business, matches, forecast, language, userMessage }));
    return result.response.text();
  } catch (err) {
    console.warn("Gemini fallback:", err.message);
    return fallbackAdvice(business, matches, forecast);
  }
}

async function runAgent(businessId, city, language = "en", options = {}) {
  const business = await tools.getBusinessProfile({ businessId });
  const targetCity = city || business?.city;
  const daysAhead = options.daysAhead || business?.alertLeadTimeDays || 14;
  const matches = await tools.getUpcomingMatches({ city: targetCity, daysAhead, limit: 3, matchId: options.matchId });
  const forecast = options.matchId
    ? buildSelectedMatchForecast(matches, matches[0]?.city || targetCity)
    : await tools.getCrowdForecast({ city: targetCity, daysAhead });
  const reasoningTrace = buildReasoningTrace(matches, forecast, business);
  const advice = await generateAdvice({ business, matches, forecast, language });

  const alert = await tools.saveAlert({
    businessId,
    message: advice,
    language,
    surgeScore: forecast.surgeScore,
    matches,
    business,
    reasoningTrace,
  });

  return {
    advice,
    alert,
    surgeScore: forecast.surgeScore,
    matchCount: matches.length,
    totalCrowd: forecast.totalCrowd,
    matches,
    reasoningTrace,
  };
}

function buildSelectedMatchForecast(matches, city) {
  const totalCrowd = matches.reduce((sum, m) => sum + (m.expectedCrowd || 0), 0);
  const baseline = tools.CITY_BASELINE[city] || 5000;
  const raw = (totalCrowd / baseline) * 5;
  return {
    surgeScore: totalCrowd ? Math.min(10, Math.round(raw * 10) / 10) : 0,
    matchCount: matches.length,
    totalCrowd,
    matches,
  };
}

async function runAgentChat(businessId, city, language, userMessage) {
  const business = await tools.getBusinessProfile({ businessId });
  const targetCity = city || business?.city;
  const daysAhead = business?.alertLeadTimeDays || 14;
  const matches = await tools.getUpcomingMatches({ city: targetCity, daysAhead, limit: 3 });
  const forecast = await tools.getCrowdForecast({ city: targetCity, daysAhead });

  const reasoningSteps = [
    { text: `Read ${business?.name || "business"} profile`, status: "done" },
    {
      text: matches.length
        ? `Found ${matches.length} upcoming match(es): ${matches.map((m) => `${m.teams.join(" vs ")} (${m.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`).join(", ")}`
        : "No upcoming matches found for this city",
      status: "done",
    },
    { text: `Calculated ${forecast.totalCrowd.toLocaleString()} expected fans and surge ${forecast.surgeScore}/10`, status: "done" },
    { text: "Generated an operations-focused answer", status: "done" },
  ];

  const content = await generateAdvice({ business, matches, forecast, language, userMessage });
  return { content, reasoningSteps, forecast, matches };
}

module.exports = { runAgent, runAgentChat, buildReasoningTrace };
