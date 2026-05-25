require("dotenv").config();
const mongoose = require("mongoose");
const Match = require("../db/models/Match");
const Business = require("../db/models/Business");
const Alert = require("../db/models/Alert");
const User = require("../db/models/User");

const CITIES = [
  "Atlanta", "Boston", "Dallas", "Houston", "Kansas City", "Los Angeles",
  "Miami", "New York", "Philadelphia", "San Francisco", "Seattle",
];

const TEAMS = [
  ["Argentina", "Mexico"], ["Brazil", "Colombia"], ["France", "Portugal"],
  ["USA", "Canada"], ["Germany", "Spain"], ["England", "Italy"],
  ["Netherlands", "Belgium"], ["Japan", "South Korea"], ["Uruguay", "Chile"],
  ["Croatia", "Serbia"], ["Morocco", "Senegal"], ["Australia", "Ecuador"],
];

const FAN_MIX = [
  [{ country: "Argentina", pct: 60 }, { country: "Mexico", pct: 35 }],
  [{ country: "Brazil", pct: 50 }, { country: "Colombia", pct: 45 }],
  [{ country: "France", pct: 55 }, { country: "Portugal", pct: 40 }],
  [{ country: "USA", pct: 70 }, { country: "Canada", pct: 25 }],
];

const VENUES = {
  Dallas: "AT&T Stadium",
  Miami: "Hard Rock Stadium",
  "New York": "MetLife Stadium",
  "Los Angeles": "SoFi Stadium",
  Seattle: "Lumen Field",
  Boston: "Gillette Stadium",
  Atlanta: "Mercedes-Benz Stadium",
  Houston: "NRG Stadium",
  "Kansas City": "Arrowhead Stadium",
  Philadelphia: "Lincoln Financial Field",
  "San Francisco": "Levi's Stadium",
};

function buildMatches() {
  const matches = [];
  const baseDate = new Date("2026-06-11T18:00:00Z");
  let id = 0;
  for (let day = 0; day < 45 && matches.length < 49; day++) {
    for (const city of CITIES) {
      if (matches.length >= 49) break;
      if (day % 3 !== city.charCodeAt(0) % 3) continue;
      const teams = TEAMS[id % TEAMS.length];
      const crowd = 55000 + (id % 5) * 5000;
      matches.push({
        date: new Date(baseDate.getTime() + day * 86400000 + (id % 4) * 3600000),
        city,
        venue: VENUES[city] || `${city} Stadium`,
        teams,
        expectedCrowd: crowd,
        ticketsSold: Math.round(crowd * 0.92),
        fanNationalities: FAN_MIX[id % FAN_MIX.length],
        stage: id < 32 ? "group" : "knockout",
      });
      id += 1;
    }
  }
  return matches.slice(0, 49);
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI required in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const matches = buildMatches();
  await Match.deleteMany({});
  await Alert.deleteMany({});
  await User.deleteMany({});
  await Business.deleteMany({});

  await Match.insertMany(matches);

  const demoUser = await User.create({
    name: "Maria Garcia",
    email: "demo@surgemind.ai",
    password: "demo1234",
    onboardingComplete: true,
    plan: "free",
  });

  const demoBusiness = await Business.create({
    name: "Maria's Taco Shop",
    type: "restaurant",
    city: "Dallas",
    language: "es",
    ownerId: demoUser._id,
    monitoredCities: ["Dallas", "Houston"],
  });

  demoUser.businessId = demoBusiness._id;
  await demoUser.save();

  // Pre-generate demo surge alerts so dashboard has data on first login
  try {
    const { runAgent } = require("../agent/gemini");
    await runAgent(demoBusiness._id, "Dallas", "es");
    console.log("✅ Demo surge alert generated for Maria's Taco Shop");
  } catch (err) {
    console.warn("⚠️ Demo alert skipped:", err.message);
  }

  console.log(`✅ Seeded ${matches.length} matches`);
  console.log(`✅ Demo login: demo@surgemind.ai / demo1234`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
