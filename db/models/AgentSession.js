const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    reasoningSteps: [{ text: String, status: String }],
  },
  { timestamps: true }
);

const toolCallSchema = new mongoose.Schema(
  {
    tool: String,
    args: String,
    result: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const agentSessionSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New session" },
    messages: [messageSchema],
    toolCalls: [toolCallSchema],
    stats: {
      queriesRun: { type: Number, default: 0 },
      alertsGenerated: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AgentSession", agentSessionSchema);
