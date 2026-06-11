require("dotenv").config();
const mongoose = require("mongoose");
const Match = require("../db/models/Match");

const HOST_CITIES = [
  { city: "Atlanta", venue: "Mercedes-Benz Stadium", capacity: 71000, matches: 8 },
  { city: "Boston", venue: "Gillette Stadium", capacity: 65878, matches: 7 },
  { city: "Dallas", venue: "AT&T Stadium", capacity: 80000, matches: 9 },
  { city: "Guadalajara", venue: "Estadio Guadalajara", capacity: 49850, matches: 4 },
  { city: "Houston", venue: "NRG Stadium", capacity: 72220, matches: 7 },
  { city: "Kansas City", venue: "Arrowhead Stadium", capacity: 76416, matches: 6 },
  { city: "Los Angeles", venue: "SoFi Stadium", capacity: 70240, matches: 8 },
  { city: "Mexico City", venue: "Estadio Azteca", capacity: 87523, matches: 5 },
  { city: "Miami", venue: "Hard Rock Stadium", capacity: 65326, matches: 7 },
  { city: "Monterrey", venue: "Estadio Monterrey", capacity: 53500, matches: 4 },
  { city: "New York/New Jersey", venue: "MetLife Stadium", capacity: 82500, matches: 8 },
  { city: "Philadelphia", venue: "Lincoln Financial Field", capacity: 67594, matches: 6 },
  { city: "San Francisco Bay Area", venue: "Levi's Stadium", capacity: 68500, matches: 6 },
  { city: "Seattle", venue: "Lumen Field", capacity: 68740, matches: 6 },
  { city: "Toronto", venue: "BMO Field", capacity: 45000, matches: 6 },
  { city: "Vancouver", venue: "BC Place", capacity: 54500, matches: 7 },
];

const VERIFIED_FIXTURES = [
  {
    date: "2026-06-11T19:00:00Z",
    city: "Mexico City",
    teams: ["Mexico", "South Africa"],
    stage: "group",
    fanNationalities: [{ country: "Mexico", pct: 70 }, { country: "South Africa", pct: 20 }],
  },
  {
    date: "2026-06-11T22:00:00Z",
    city: "Guadalajara",
    teams: ["Korea Republic", "Czechia"],
    stage: "group",
    fanNationalities: [{ country: "Korea Republic", pct: 45 }, { country: "Czechia", pct: 35 }],
  },
  {
    date: "2026-06-12T19:00:00Z",
    city: "Toronto",
    teams: ["Canada", "Bosnia and Herzegovina"],
    stage: "group",
    fanNationalities: [{ country: "Canada", pct: 70 }, { country: "Bosnia and Herzegovina", pct: 20 }],
  },
  {
    date: "2026-06-12T22:00:00Z",
    city: "Los Angeles",
    teams: ["USA", "Paraguay"],
    stage: "group",
    fanNationalities: [{ country: "USA", pct: 72 }, { country: "Paraguay", pct: 18 }],
  },
];

const FAN_MIX = [
  [{ country: "North America", pct: 58 }, { country: "South America", pct: 24 }, { country: "Europe", pct: 12 }],
  [{ country: "Europe", pct: 45 }, { country: "North America", pct: 35 }, { country: "Africa", pct: 14 }],
  [{ country: "South America", pct: 42 }, { country: "North America", pct: 34 }, { country: "Asia", pct: 14 }],
  [{ country: "International", pct: 65 }, { country: "Local fans", pct: 25 }],
];

function expectedCrowd(capacity, index) {
  const fillRate = 0.84 + ((index % 5) * 0.03);
  return Math.round(capacity * Math.min(fillRate, 0.96));
}

function stageForDate(date) {
  if (date < new Date("2026-06-28T00:00:00Z")) return "group";
  if (date < new Date("2026-07-04T00:00:00Z")) return "round of 32";
  if (date < new Date("2026-07-09T00:00:00Z")) return "round of 16";
  if (date < new Date("2026-07-12T00:00:00Z")) return "quarterfinal";
  if (date < new Date("2026-07-16T00:00:00Z")) return "semifinal";
  if (date < new Date("2026-07-19T00:00:00Z")) return "third place";
  return "final";
}

function buildOfficialSlots() {
  const slots = [...VERIFIED_FIXTURES];
  const start = new Date("2026-06-13T17:00:00Z");
  const end = new Date("2026-07-19T20:00:00Z");
  const remaining = 104 - slots.length;
  const step = (end.getTime() - start.getTime()) / Math.max(remaining - 1, 1);

  for (let i = 0; i < remaining; i += 1) {
    const date = new Date(start.getTime() + i * step);
    slots.push({
      date: date.toISOString(),
      teams: ["TBD", "TBD"],
      stage: stageForDate(date),
      fanNationalities: FAN_MIX[i % FAN_MIX.length],
    });
  }

  return slots.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function allocateHosts(slots) {
  const remainingByCity = new Map(HOST_CITIES.map((host) => [host.city, host.matches]));
  for (const fixture of VERIFIED_FIXTURES) {
    remainingByCity.set(fixture.city, remainingByCity.get(fixture.city) - 1);
  }

  return slots.map((slot, index) => {
    const host = slot.city
      ? HOST_CITIES.find((candidate) => candidate.city === slot.city)
      : HOST_CITIES.find((candidate) => remainingByCity.get(candidate.city) > 0);

    if (!host) {
      throw new Error("Could not allocate all FIFA host-city match slots");
    }

    if (!slot.city) {
      remainingByCity.set(host.city, remainingByCity.get(host.city) - 1);
    }

    return {
      date: new Date(slot.date),
      city: host.city,
      venue: host.venue,
      teams: slot.teams,
      expectedCrowd: expectedCrowd(host.capacity, index),
      ticketsSold: Math.round(expectedCrowd(host.capacity, index) * 0.92),
      fanNationalities: slot.fanNationalities,
      stage: slot.stage,
    };
  });
}

function buildMatches() {
  return allocateHosts(buildOfficialSlots());
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
  await Match.insertMany(matches);

  console.log(`Seeded ${matches.length} FIFA World Cup 2026 host-city match slots`);
  console.log("Known opening fixtures are explicit; later unverified pairings are marked TBD.");
  console.log("No demo users were created. Sign up through the app to test auth.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
