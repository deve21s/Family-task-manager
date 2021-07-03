const mongooese = require("mongoose");
const Schema = mongooese.Schema;

const familyschema = Schema({
  Tasks: [
    {
      type: Schema.Types.ObjectId,
      ref: "task",
    },
  ],
});

module.exports = mongooese.model("family", familyschema);
