import { Schema, model } from "mongoose";

const GuestSchema = new Schema(
  {
    fullName: { type: String, default: "Guest" },
    count: { type: Number },
    imageUrl: {
      type: String,
      default:
        "https://i.pinimg.com/736x/87/14/55/8714556a52021ba3a55c8e7a3547d28c.jpg",
    },
  },
  { timestamps: true }
);

const GuestModel = model("guest", GuestSchema);

export default GuestModel;
