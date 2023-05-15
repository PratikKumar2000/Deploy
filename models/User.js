const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: [8, "Name should have atleast 8 characters"],
    maxlength: [32, "Name should have atmost 32 characters"],
  },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "invalid email"],
  },
  password: {
    type: String,
    required: true,
    minlength: [8, "Password must have atleast 8 characters"],
    select: false,
  },
  resetToken: String,
  expireToken: Date,
  pic: {
    p_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default:
        "https://pixabay.com/vectors/blank-profile-picture-mystery-man-973460/",
    },
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User',userSchema);