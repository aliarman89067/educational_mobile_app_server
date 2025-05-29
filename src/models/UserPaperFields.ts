import { Schema, model } from "mongoose";

const UserPaperFields = new Schema({
  user: { type: Schema.Types.ObjectId, required: true, ref: "user" },
  board: { type: String, required: true },
  grade: { type: String, required: true },
  subjects: [
    {
      id: { type: Number, required: true },
      name: { type: String, required: true },
    },
  ],
});

const UserPaperFieldsModel = model("userPaperFields", UserPaperFields);

export default UserPaperFieldsModel;
