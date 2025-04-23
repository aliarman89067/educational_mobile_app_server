import mongoose, { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    emailAddress: { type: String, required: true, unique: true },
    imageUrl: {
      type: String,
      default:
        "https://i.pinimg.com/736x/87/14/55/8714556a52021ba3a55c8e7a3547d28c.jpg",
    },
    sessionId: { type: String },
    friends: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    requestsSend: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    requestsRecieved: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const UserModel = model("user", userSchema);
export default UserModel;
