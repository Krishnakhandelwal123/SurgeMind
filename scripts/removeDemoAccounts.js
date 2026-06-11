require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../db/models/User");
const Business = require("../db/models/Business");
const Alert = require("../db/models/Alert");
const AgentSession = require("../db/models/AgentSession");

async function removeDemoAccounts() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI required in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const demoUsers = await User.find({ email: "demo@surgemind.ai" }).select("_id businessId");
  const businessIds = demoUsers.map((user) => user.businessId).filter(Boolean);
  const userIds = demoUsers.map((user) => user._id);

  await Promise.all([
    Alert.deleteMany({ businessId: { $in: businessIds } }),
    AgentSession.deleteMany({ userId: { $in: userIds } }),
    Business.deleteMany({ _id: { $in: businessIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ]);

  console.log(`Removed ${userIds.length} demo account(s).`);
  await mongoose.disconnect();
}

removeDemoAccounts().catch((err) => {
  console.error(err);
  process.exit(1);
});
