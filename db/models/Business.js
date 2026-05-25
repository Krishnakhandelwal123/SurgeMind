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
  },
  { timestamps: true }
);

businessSchema.pre("save", function ensureMonitoredCities() {
  if (!this.monitoredCities?.length) {
    this.monitoredCities = [this.city];
  }
});

module.exports = mongoose.model("Business", businessSchema);
