import { Request, Response } from "express";
import UserModel from "../models/User";
import SoloRoomModel from "../models/SoloRoom";
import HistoryModel from "../models/History";
import OnlineHistoryModel from "../models/OnlineHistory";
import OnlineRoomModel from "../models/OnlineRoom";
import GuestModel from "../models/Guest";

// export const createUserWebhook = async (req: Request, res: Response) => {
//   try {
//     const SIGNING_SECRET = process.env.SIGNING_SECRET;
//     if (!SIGNING_SECRET) {
//       throw new Error("please add SIGNING_SECRET in your env to continue!");
//     }

//     switch (req.body.type) {
//       case "user.created":
//         const createUser = async () => {
//           const clerkId = req.body.data.id;
//           const fullName =
//             req.body.data.first_name + " " + req.body.data.last_name;
//           const imageUrl = req.body.data.image_url;
//           const emailAddress = req.body.data.email_addresses[0].email_address;
//           await UserModel.create({
//             clerkId,
//             fullName,
//             imageUrl,
//             emailAddress,
//           });
//         };
//         createUser();
//         break;
//       case "user.updated":
//         const updateUser = async () => {
//           const clerkId = req.body.data.id;
//           const fullName =
//             req.body.data.first_name + " " + req.body.data.last_name;
//           const imageUrl = req.body.data.image_url;
//           const emailAddress = req.body.data.email_addresses[0].email_address;
//           await UserModel.findOneAndUpdate(
//             { clerkId },
//             {
//               fullName,
//               imageUrl,
//               emailAddress,
//             }
//           );
//         };
//         updateUser();
//         break;
//       case "user.deleted":
//         const deleteUser = async () => {
//           const clerkId = req.body.data.id;
//           await UserModel.findOneAndDelete({ clerkId });
//         };
//         deleteUser();
//         break;
//     }
//     res.status(200).json({ message: "Webhook Completed" });
//   } catch (error: any) {
//     console.log(error);
//     res
//       .status(500)
//       .json({ message: `Failed to create user ${error.message ?? error}` });
//   }
// };

export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullName, emailAddress, imageUrl, sessionId } = req.body;
    if (!fullName || !emailAddress || !imageUrl || !sessionId) {
      res.status(404).json({ message: "Payload in not correct" });
      return;
    }
    const existingUser = await UserModel.findOne({ emailAddress });
    if (existingUser) {
      res.status(200).json(existingUser);
      return;
    }
    const user = new UserModel({
      fullName,
      emailAddress,
      imageUrl,
      sessionId,
    });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create user" });
  }
};
export const migrateUser = async (req: Request, res: Response) => {
  try {
    const { guestId, fullName, emailAddress, imageUrl, sessionId } = req.body;
    if (!guestId || !fullName || !emailAddress || !imageUrl || !sessionId) {
      res.status(404).json({ message: "Payload in not correct" });
      return;
    }
    let user: any;
    user = await UserModel.findOne({ emailAddress });
    if (!user) {
      user = await UserModel.create({
        fullName,
        emailAddress,
        imageUrl,
        sessionId,
      });
    }
    const histories = await HistoryModel.find({
      user: guestId,
    });
    if (histories) {
      histories.forEach(async (history) => {
        await HistoryModel.findByIdAndUpdate(history.id, {
          user: user.id,
        });
      });
    }
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

export const migrateUserOnline = async (req: Request, res: Response) => {
  try {
    const {
      guestId,
      fullName,
      emailAddress,
      imageUrl,
      resultId,
      roomId,
      sessionId,
    } = req.body;
    if (
      !guestId ||
      !fullName ||
      !emailAddress ||
      !imageUrl ||
      !resultId ||
      !roomId ||
      !sessionId
    ) {
      res.status(404).json({ message: "Payload in not correct" });
      return;
    }
    let user: any;
    user = await UserModel.findOne({ emailAddress });
    if (!user) {
      user = await UserModel.create({
        fullName,
        emailAddress,
        imageUrl,
        sessionId,
      });
    }
    const onlineHistories = await OnlineHistoryModel.find({ user: guestId });

    onlineHistories.forEach(async (history) => {
      await OnlineHistoryModel.findByIdAndUpdate(history.id, {
        user: user.id,
      });
    });
    const onlineRooms = await OnlineRoomModel.find({
      $or: [{ user1: guestId }, { user2: guestId }],
    });

    onlineRooms.forEach(async (room) => {
      const isUser1 = room.user1 === guestId;
      if (isUser1) {
        await OnlineRoomModel.findByIdAndUpdate(room.id, {
          user1: user.id,
        });
      } else {
        await OnlineRoomModel.findByIdAndUpdate(room.id, {
          user2: user.id,
        });
      }
    });
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  const { name, userId } = req.params;
  console.log(name, userId);
  try {
    const existingUser = await UserModel.findById(userId);
    const existingGuest = await GuestModel.findById(userId);
    if (!existingUser && !existingGuest) {
      console.log("User not found!");
      res.status(404).json({ message: "Unauthorizes user!" });
      return;
    }
    const users = await UserModel.find({
      fullName: {
        $regex: `${name}`,
        $options: "i",
      },
      _id: { $ne: userId },
    });
    res.status(200).json(users);
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Failed to get users ${error.message ?? error}` });
  }
};
