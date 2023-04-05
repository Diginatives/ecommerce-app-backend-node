const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      require: true,
      min: 2,
      max: 50,
    },
    currentNeckName: {
      type: String,
      require: true,
      min: 2,
      max: 50,
    },

    email: {
      type: String,
      require: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      require: true,
      min: 5,
    },
    varified: {
      type: Boolean,
    },
    active: {
      type: Boolean,
      default: true,
    },
    randomToken: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model("User", UserSchema);
module.exports = User;
