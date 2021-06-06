const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const historySchema = new Schema(
  {
    hisname: String,
    histype: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("history", historySchema);
