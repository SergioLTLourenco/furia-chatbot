const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  opponent: { type: String, required: true },
  tournament: { type: String, required: true },
  stage: String,
  streamLink: String,
  isCompleted: { type: Boolean, default: false },
  score: String
});

module.exports = mongoose.model('Match', MatchSchema);