const mongoose = require("mongoose");

const fanNationalitySchema = new mongoose.Schema(
  { country: String, pct: Number },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    city: { type: String, required: true, trim: true },
    venue: { type: String, required: true },
    teams: { type: [String], required: true },
    expectedCrowd: { type: Number, required: true },
    ticketsSold: { type: Number, default: 0 },
    fanNationalities: [fanNationalitySchema],
    stage: { type: String, default: "group" },
  },
  { timestamps: true }
);

matchSchema.index({ city: 1, date: 1 });

module.exports = mongoose.model("Match", matchSchema);
