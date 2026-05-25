// models/Alert.js
const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
  message:    { type: String, required: true }, // the AI-generated advice
  type:       String, // "STOCK_UP", "HIRE_STAFF", "MENU_TRANSLATE", etc.
  language:   String,
  sentAt:     { type: Date, default: Date.now },
});

module.exports = mongoose.model("Alert", alertSchema);