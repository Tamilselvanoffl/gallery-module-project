const mongoose = require("mongoose");

const ConfigSchema = new mongoose.Schema({
  width: Number,
  height: Number
});

module.exports = mongoose.model("Config", ConfigSchema);