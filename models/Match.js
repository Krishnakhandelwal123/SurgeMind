// models/Match.js
const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    city: { type: String, required: true },
    venue: { type: String, required: true },
    teams: [String],
    expectedCrowd: { type: Number, default: 0 },
    ticketsSold: { type: Number, default: 0 },
    fanNationalities: [{
        country: String,
        pct: Number  // percentage e.g. 60 means 60%
    }]
});

// This creates a searchable index on city + date (fast queries!)
matchSchema.index({ city: 1, date: 1 });

module.exports = mongoose.model("Match", matchSchema);