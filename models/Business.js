// models/Business.js
const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["restaurant", "hotel", "bar", "retail", "cafe"] },
    city: { type: String, required: true },
    language: { type: String, default: "en" }, // "en","es","fr"
    ownerName: String,
    contact: String,
});

module.exports = mongoose.model("Business", businessSchema);