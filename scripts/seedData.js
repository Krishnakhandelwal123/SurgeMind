// scripts/seedData.js
require("dotenv").config();
const mongoose = require("mongoose");
const Match = require("../models/Match");
const Business = require("../models/Business");

// Real FIFA 2026 matches (partial list — add more from the full schedule)
const matches = [
  {
    date: new Date("2026-06-14T20:00:00Z"),
    city: "Dallas",
    venue: "AT&T Stadium",
    teams: ["Argentina", "Mexico"],
    expectedCrowd: 80000,
    ticketsSold: 72000,
    fanNationalities: [{ country: "Argentina", pct: 60 }, { country: "Mexico", pct: 35 }]
  },
  {
    date: new Date("2026-06-15T20:00:00Z"),
    city: "Miami",
    venue: "Hard Rock Stadium",
    teams: ["Brazil", "Colombia"],
    expectedCrowd: 65000,
    ticketsSold: 61000,
    fanNationalities: [{ country: "Brazil", pct: 50 }, { country: "Colombia", pct: 45 }]
  },
  {
    date: new Date("2026-06-20T19:00:00Z"),
    city: "New York",
    venue: "MetLife Stadium",
    teams: ["France", "Portugal"],
    expectedCrowd: 82000,
    ticketsSold: 80000,
    fanNationalities: [{ country: "France", pct: 55 }, { country: "Portugal", pct: 40 }]
  },
];

// Sample Businesses (add 5-10 per city)
const businesses = [
  { name: "Maria's Taco Shop", type: "restaurant", city: "Dallas", language: "es" },
  { name: "Dallas Sports Bar", type: "bar", city: "Dallas", language: "en" },
  { name: "Miami Beach Hotel", type: "hotel", city: "Miami", language: "en" },
  { name: "Little Havana Cafe", type: "cafe", city: "Miami", language: "es" },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await Match.deleteMany({});
  await Business.deleteMany({});

  await Match.insertMany(matches);
  await Business.insertMany(businesses);

  console.log(`✅ Seeded ${matches.length} matches and ${businesses.length} businesses`);
  process.exit(0);
}

seed().catch(console.error);