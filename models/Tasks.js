const mongooese = require("mongoose");
const Schema = mongooese.Schema;

const taskSchema = Schema(
  {
    title: String,
    des: String,
    dueDate: String,
    isCompleted: Boolean,
    assign: String,
    history: [
      {
        type: Schema.Types.ObjectId,
        ref: "history",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongooese.model("task", taskSchema);
