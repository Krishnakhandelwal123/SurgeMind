require("dotenv").config();
const mongoose = require("mongoose");
const Alert = require("../db/models/Alert");
require("../db/models/Match");

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

function matchLabel(match) {
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: HOST_CITY_TIMEZONES[match.city] || "UTC",
  }).format(match.date);
  return `${match.teams.join(" vs ")} - ${date}`;
}

async function cleanGeneratedAlerts() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI required in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const alerts = await Alert.find().populate("matchIds").sort({ sentAt: -1 });
  const seen = new Set();
  let removed = 0;
  let updated = 0;

  for (const alert of alerts) {
    const match = alert.matchIds?.[0];
    if (!match) {
      await Alert.deleteOne({ _id: alert._id });
      removed += 1;
      continue;
    }

    const key = `${alert.businessId}:${match._id}`;
    if (seen.has(key)) {
      await Alert.deleteOne({ _id: alert._id });
      removed += 1;
      continue;
    }
    seen.add(key);

    const nextLabel = matchLabel(match);
    if (alert.matchLabel !== nextLabel || alert.city !== match.city || alert.venue !== match.venue) {
      alert.matchLabel = nextLabel;
      alert.city = match.city;
      alert.venue = match.venue;
      await alert.save();
      updated += 1;
    }
  }

  const remaining = await Alert.countDocuments();
  console.log(JSON.stringify({ updated, removed, remaining }, null, 2));
  await mongoose.disconnect();
}

cleanGeneratedAlerts().catch((err) => {
  console.error(err);
  process.exit(1);
});
