const { GoogleGenerativeAI } = require("@google/generative-ai");
const tools = require("./tools");

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const SYSTEM_PROMPT = `You are SurgeMind, an AI business advisor for small local businesses preparing for FIFA World Cup 2026 fan surges.

When generating advice you MUST:
1. Use specific numbers (inventory multiples, staff count, revenue estimates)
2. Reference fan nationalities and language needs
3. Structure output with sections: INVENTORY, STAFFING, MENU, OPERATIONS
4. End with estimated extra revenue range in dollars

Be direct. No vague tips.`;

function buildReasoningTrace(matches, forecast, business) {
  const city = business?.city || "city";
  return [
    { step: `Queried matches in ${city} (next 7 days)`, status: "done" },
    { step: `Found ${matches.length} match(es). Calculated surge score ${forecast.surgeScore}`, status: "done" },
    {
      step: matches[0]?.fanNationalities?.length
        ? `Fan mix: ${matches[0].fanNationalities.map((f) => `${f.pct}% ${f.country}`).join(", ")}`
        : "Analyzed fan nationality data",
      status: "done",
    },
    { step: "Generated personalized action plan", status: "done" },
  ];
}

function fallbackAdvice(business, matches, forecast) {
  const top = matches[0];
  const fans = top?.fanNationalities?.[0]?.country || "international";
  return `Surge Score: ${forecast.surgeScore}/10 — Critical prep needed.

INVENTORY
→ Order 3× your normal inventory by Thursday before ${top ? top.teams.join(" vs ") : "match day"}
→ Stock beverages and high-demand items for ${forecast.totalCrowd.toLocaleString()} expected fans

STAFFING
→ Hire 2 part-time staff for Saturday and Sunday match shifts
→ Brief team on ${fans} fan preferences and bilingual service

MENU
→ Print bilingual menus (${business.language === "es" ? "Spanish/English" : "English + fan languages"}) by Friday
→ Add 2–3 popular dishes for visiting fan nationalities

OPERATIONS
→ Extend hours by 2 hours on match days
→ Consider express checkout for peak crowds

Estimated extra revenue: $${tools.estimateRevenue(forecast.surgeScore, business.type).min} – $${tools.estimateRevenue(forecast.surgeScore, business.type).max} this match week.`;
}

async function runAgent(businessId, city, language = "en", options = {}) {
  const business = await tools.getBusinessProfile({ businessId });
  const targetCity = city || business?.city;
  const matches = await tools.getUpcomingMatches({ city: targetCity, daysAhead: options.daysAhead || 7 });
  const forecast = await tools.getCrowdForecast({ city: targetCity, daysAhead: options.daysAhead || 7 });
  const reasoningTrace = buildReasoningTrace(matches, forecast, business);

  let advice;
  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const userMessage = `
Business: ${business.name} (${business.type}) in ${targetCity}.
Owner language: ${language}.
Upcoming matches: ${JSON.stringify(matches.map((m) => ({
        teams: m.teams,
        date: m.date,
        crowd: m.expectedCrowd,
        fans: m.fanNationalities,
      })))}.
Surge score: ${forecast.surgeScore}/10. Total crowd: ${forecast.totalCrowd}.
Generate a detailed action plan.`;
      const result = await model.generateContent(SYSTEM_PROMPT + "\n\n" + userMessage);
      advice = result.response.text();
    } catch (err) {
      console.warn("Gemini fallback:", err.message);
      advice = fallbackAdvice(business, matches, forecast);
    }
  } else {
    advice = fallbackAdvice(business, matches, forecast);
  }

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

async function runAgentChat(businessId, city, language, userMessage, history = []) {
  const business = await tools.getBusinessProfile({ businessId });
  const targetCity = city || business?.city;
  const matches = await tools.getUpcomingMatches({ city: targetCity, daysAhead: 7 });
  const forecast = await tools.getCrowdForecast({ city: targetCity, daysAhead: 7 });

  const reasoningSteps = [
    { text: `Querying upcoming matches in ${targetCity} (next 7 days)...`, status: "done" },
    {
      text: matches.length
        ? `Found ${matches.length} match(es): ${matches.map((m) => `${m.teams.join(" vs ")} (${m.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`).join(", ")}`
        : "No matches in the next 7 days",
      status: "done",
    },
    { text: `Calculating crowd forecast: ${forecast.totalCrowd.toLocaleString()} fans — surge ${forecast.surgeScore}/10`, status: "done" },
    { text: "Generating personalized response...", status: "done" },
  ];

  let content;
  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `${SYSTEM_PROMPT}\n\nBusiness: ${business.name} (${business.type}), ${targetCity}.\nSurge: ${forecast.surgeScore}/10, ${forecast.totalCrowd} fans.\nMatches: ${JSON.stringify(matches)}\n\nUser: ${userMessage}\n\nRespond as SurgeMind with structured advice.`;
      const result = await model.generateContent(prompt);
      content = result.response.text();
    } catch {
      content = fallbackAdvice(business, matches, forecast);
    }
  } else {
    content = fallbackAdvice(business, matches, forecast);
  }

  return { content, reasoningSteps, forecast, matches };
}

module.exports = { runAgent, runAgentChat, buildReasoningTrace };
