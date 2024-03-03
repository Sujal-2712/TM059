const mongoose = require("mongoose");
const validator = require("validator");

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    validate: {
      validator: (value) => validator.isLength(value, { min: 3 }),
      message: "Name must be at least 3 characters long.",
    },
  },
  address: {
    type: String,
    required: true,
  },
  hospitalID: {
    type: String,
    required: true,
    unique: true,
  },
  hospitalEmail: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false, // Set the default value as needed
  },
});

const hospitals = mongoose.model("hospitals", hospitalSchema);
module.exports = hospitals;
