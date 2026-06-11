const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["restaurant", "bar", "hotel", "retail", "cafe"],
      required: true,
    },
    city: { type: String, required: true, trim: true },
    language: { type: String, enum: ["en", "es", "fr"], default: "en" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    monitoredCities: [{ type: String, trim: true }],
    avatarUrl: { type: String, default: "" },
    dailyCapacity: { type: Number, min: 0, default: 120 },
    staffCount: { type: Number, min: 0, default: 8 },
    averageTicket: { type: Number, min: 0, default: 28 },
    operatingHours: { type: String, trim: true, default: "10:00 AM - 10:00 PM" },
    topProducts: [{ type: String, trim: true }],
    alertLeadTimeDays: { type: Number, min: 1, max: 30, default: 7 },
  },
  { timestamps: true }
);

businessSchema.pre("save", function ensureMonitoredCities() {
  if (!this.monitoredCities?.length) {
    this.monitoredCities = [this.city];
  }
});

module.exports = mongoose.model("Business", businessSchema);
