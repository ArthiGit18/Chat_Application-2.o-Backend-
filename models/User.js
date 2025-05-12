const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      default: null,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      }, // Only required if not using Google Login
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: '/1.jpg',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
