// agent/gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const tools = require("./tools");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// This is the "brain" of your agent - the instructions it follows
const SYSTEM_PROMPT = `
You are SurgeMind, an AI business advisor for small local businesses
preparing for FIFA World Cup 2026 fan surges.

When a business owner asks for advice, you MUST:
1. First call getUpcomingMatches to find matches in their city
2. Call getCrowdForecast to calculate the surge score
3. Look at fan nationalities to understand which languages matter
4. Generate SPECIFIC advice - not vague tips

Good advice example:
"Stock 3x your normal beef inventory. 60,000 Argentine fans arrive Friday.
Hire 2 extra staff for Saturday and Sunday. Add Spanish to your menu."

Bad advice example: "Consider increasing your inventory."

Always be specific with numbers. Always mention the fan nationalities.
Translate your final recommendation to the owner's language if not English.
`;

async function runAgent(businessId, city, language = "en") {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const chat = model.startChat({ history: [] });

  // Step 1: Get match data
  const matches = await tools.getUpcomingMatches({ city, daysAhead: 7 });
  const forecast = await tools.getCrowdForecast({ city, daysAhead: 7 });
  const business = await tools.getBusinessProfile({ businessId });

  // Step 2: Build context for Gemini
  const userMessage = `
    Business: ${business.name} (${business.type}) in ${city}.
    Owner language: ${language}.
    Upcoming matches: ${JSON.stringify(matches, null, 2)}.
    Surge score: ${forecast.surgeScore}/10.
    Total expected crowd: ${forecast.totalCrowd} fans.
    Generate a detailed, specific action plan for this business owner.
  `;

  // Step 3: Ask Gemini to generate advice
  const result = await chat.sendMessage(SYSTEM_PROMPT + userMessage);
  const advice = result.response.text();

  // Step 4: Save to MongoDB
  await tools.saveAlert({ businessId, message: advice, type: "FULL_PLAN", language });

  return { advice, surgeScore: forecast.surgeScore, matchCount: matches.length };
}

module.exports = { runAgent };