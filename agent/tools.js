const Match = require("../models/Match");
const Business = require("../models/Business");

// Tool 1: Get upcoming matches in a city
async function getUpcomingMatches({ city, daysAhead = 7 }) {
    const from = new Date();
    const to = new Date(Date.now() + daysAhead * 86400000);
    const matches = await Match.find({
        city: new RegExp(city, "i"),
        date: { $gte: from, $lte: to }
    }).sort({ date: 1 });
    return matches;
}

// Tool 2: Calculate how crowded a city will be (score 1-10)
const CITY_BASELINE = {
    "Dallas": 8000, "Miami": 7000, "New York": 12000,
    "Los Angeles": 10000, "Seattle": 5000, "Boston": 6000
};

async function getCrowdForecast({ city, daysAhead = 7 }) {
    const matches = await getUpcomingMatches({ city, daysAhead });
    const totalCrowd = matches.reduce((sum, m) => sum + m.expectedCrowd, 0);
    const baseline = CITY_BASELINE[city] || 5000;
    const surgeScore = Math.min(10, Math.round((totalCrowd / baseline) * 10) / 10);
    return { surgeScore, matchCount: matches.length, totalCrowd, matches };
}

// Tool 3: Get a business profile from the database
async function getBusinessProfile({ businessId }) {
    return await Business.findById(businessId);
}

// Tool 4: Save an alert to MongoDB
async function saveAlert({ businessId, message, type, language }) {
    const Alert = require("../models/Alert");
    const alert = new Alert({ businessId, message, type, language });
    await alert.save();
    return { success: true, alertId: alert._id };
}

module.exports = { getUpcomingMatches, getCrowdForecast, getBusinessProfile, saveAlert };