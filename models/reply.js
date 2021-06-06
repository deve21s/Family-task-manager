const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const replySchema = new Schema({
  name: String,
  text: String,
});

module.exports = mongoose.model("Reply", replySchema);
