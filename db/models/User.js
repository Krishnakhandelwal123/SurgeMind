const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 10 },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
    onboardingComplete: { type: Boolean, default: false },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    notificationPrefs: {
      emailAlerts: { type: Boolean, default: true },
      inAppAlerts: { type: Boolean, default: true },
      timing: { type: String, default: "7" },
      types: {
        STOCK_UP: { type: Boolean, default: true },
        HIRE_STAFF: { type: Boolean, default: true },
        MENU_TRANSLATE: { type: Boolean, default: true },
        PRICE_ADJUST: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
