const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const memberSchema = new Schema({
  email: { type: String },
  password: String,
  role: String,
  familyId: String,
});

module.exports = mongoose.model("member", memberSchema);
