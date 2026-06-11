const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ["STOCK_UP", "HIRE_STAFF", "MENU_TRANSLATE", "PRICE_ADJUST", "HOURS_EXTEND", "OTHER"],
      default: "OTHER",
    },
  },
  { _id: true }
);

const alertSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    message: { type: String, required: true },
    summary: { type: String, default: "" },
    types: [{
      type: String,
      enum: ["STOCK_UP", "HIRE_STAFF", "MENU_TRANSLATE", "PRICE_ADJUST", "HOURS_EXTEND"],
    }],
    language: { type: String, default: "en" },
    surgeScore: { type: Number, min: 0, max: 10 },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },
    matchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Match" }],
    matchLabel: { type: String, default: "" },
    venue: { type: String, default: "" },
    city: { type: String, default: "" },
    revenueMin: { type: Number, default: 0 },
    revenueMax: { type: Number, default: 0 },
    revenueRationale: { type: String, default: "" },
    dueDate: { type: Date },
    reasoningTrace: [{ step: String, status: { type: String, enum: ["done", "active", "pending"], default: "done" } }],
    checklist: [checklistItemSchema],
    fanBreakdown: [{ country: String, pct: Number, flag: String }],
    read: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

alertSchema.index({ businessId: 1, sentAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
