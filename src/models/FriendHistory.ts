import { model, Schema } from "mongoose";

const friendHistorySchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "friendRoom" },
    mcqs: [{ type: Schema.Types.ObjectId, ref: "mcqs" }],
    user: { type: String },
    roomType: { type: String, required: true },
    quizIdAndValue: [
      {
        _id: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        selected: { type: String, required: true },
      },
    ],
    time: { type: Number, requried: true },
  },
  {
    timestamps: true,
  }
);

const FriendHistoryModel = model("friendhistory", friendHistorySchema);
export default FriendHistoryModel;
