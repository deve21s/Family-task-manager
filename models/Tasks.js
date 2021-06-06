const mongooese = require("mongoose");
const Schema = mongooese.Schema;

const taskSchema = Schema(
  {
    title: String,
    des: String,
    dueDate: String,
    isCompleted: Boolean,
    assign: String,
  },
  {
    timestamp: true,
  }
);

module.exports = mongooese.model("task", taskSchema);
