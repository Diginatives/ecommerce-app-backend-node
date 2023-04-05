const mongoose = require("mongoose");
const UserOTPSchema = new mongoose.Schema(
  {
    userId: String,
    otp: String,
    createdAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);
const UserOTP = mongoose.model("UserOTPvarification", UserOTPSchema);
module.exports = UserOTP;
