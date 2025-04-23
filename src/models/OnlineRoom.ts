import { model, Schema } from "mongoose";

const onlineRoomSchema = new Schema(
  {
    uniqueKey: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true, ref: "subjects" },
    yearId: { type: Schema.Types.ObjectId, ref: "years" },
    topicId: { type: Schema.Types.ObjectId, ref: "topics" },
    quizType: { type: String, required: true },
    quizes: [{ type: Schema.Types.ObjectId, required: true, ref: "mcqs" }],
    user1: { type: String },
    user2: { type: String },
    quizIdAndValue1: [
      {
        _id: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        selected: { type: String, required: true },
      },
    ],
    quizIdAndValue2: [
      {
        _id: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        selected: { type: String, required: true },
      },
    ],
    user1SessionId: { type: String },
    user2SessionId: { type: String },
    isUser1Alive: { type: Boolean, required: true },
    isUser2Alive: { type: Boolean, required: true },
    user1RemainingTime: { type: String },
    user2RemainingTime: { type: String },
    resignation: { type: String, default: "" },
    seconds: { type: String, required: true },
    isEnded: { type: Boolean, required: true, default: false },
    isGuest1: { type: Boolean },
    isGuest2: { type: Boolean },
  },
  {
    timestamps: true,
  }
);
onlineRoomSchema.index({ uniqueKey: 1 }), { uniqueKey: true };

const OnlineRoomModel = model("onlineroom", onlineRoomSchema);
export default OnlineRoomModel;
