"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.migrateUserOnline = exports.migrateUser = exports.createUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const History_1 = __importDefault(require("../models/History"));
const OnlineHistory_1 = __importDefault(require("../models/OnlineHistory"));
const OnlineRoom_1 = __importDefault(require("../models/OnlineRoom"));
const Guest_1 = __importDefault(require("../models/Guest"));
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
const createUser = async (req, res) => {
    try {
        const { fullName, emailAddress, imageUrl, sessionId } = req.body;
        if (!fullName || !emailAddress || !imageUrl || !sessionId) {
            res.status(404).json({ message: "Payload in not correct" });
            return;
        }
        const existingUser = await User_1.default.findOne({ emailAddress });
        if (existingUser) {
            res.status(200).json(existingUser);
            return;
        }
        const user = new User_1.default({
            fullName,
            emailAddress,
            imageUrl,
            sessionId,
        });
        await user.save();
        res.status(201).json(user);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to create user" });
    }
};
exports.createUser = createUser;
const migrateUser = async (req, res) => {
    try {
        const { guestId, fullName, emailAddress, imageUrl, sessionId } = req.body;
        if (!guestId || !fullName || !emailAddress || !imageUrl || !sessionId) {
            res.status(404).json({ message: "Payload in not correct" });
            return;
        }
        let user;
        user = await User_1.default.findOne({ emailAddress });
        if (!user) {
            user = await User_1.default.create({
                fullName,
                emailAddress,
                imageUrl,
                sessionId,
            });
        }
        const histories = await History_1.default.find({
            user: guestId,
        });
        if (histories) {
            histories.forEach(async (history) => {
                await History_1.default.findByIdAndUpdate(history.id, {
                    user: user.id,
                });
            });
        }
        res.status(201).json(user);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to create user" });
    }
};
exports.migrateUser = migrateUser;
const migrateUserOnline = async (req, res) => {
    try {
        const { guestId, fullName, emailAddress, imageUrl, resultId, roomId, sessionId, } = req.body;
        if (!guestId ||
            !fullName ||
            !emailAddress ||
            !imageUrl ||
            !resultId ||
            !roomId ||
            !sessionId) {
            res.status(404).json({ message: "Payload in not correct" });
            return;
        }
        let user;
        user = await User_1.default.findOne({ emailAddress });
        if (!user) {
            user = await User_1.default.create({
                fullName,
                emailAddress,
                imageUrl,
                sessionId,
            });
        }
        const onlineHistories = await OnlineHistory_1.default.find({ user: guestId });
        onlineHistories.forEach(async (history) => {
            await OnlineHistory_1.default.findByIdAndUpdate(history.id, {
                user: user.id,
            });
        });
        const onlineRooms = await OnlineRoom_1.default.find({
            $or: [{ user1: guestId }, { user2: guestId }],
        });
        onlineRooms.forEach(async (room) => {
            const isUser1 = room.user1 === guestId;
            if (isUser1) {
                await OnlineRoom_1.default.findByIdAndUpdate(room.id, {
                    user1: user.id,
                });
            }
            else {
                await OnlineRoom_1.default.findByIdAndUpdate(room.id, {
                    user2: user.id,
                });
            }
        });
        res.status(201).json(user);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to create user" });
    }
};
exports.migrateUserOnline = migrateUserOnline;
const getUsers = async (req, res) => {
    var _a;
    const { name, userId } = req.params;
    console.log(name, userId);
    try {
        const existingUser = await User_1.default.findById(userId);
        const existingGuest = await Guest_1.default.findById(userId);
        if (!existingUser && !existingGuest) {
            console.log("User not found!");
            res.status(404).json({ message: "Unauthorizes user!" });
            return;
        }
        const users = await User_1.default.find({
            fullName: {
                $regex: `${name}`,
                $options: "i",
            },
            _id: { $ne: userId },
        });
        res.status(200).json(users);
    }
    catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: `Failed to get users ${(_a = error.message) !== null && _a !== void 0 ? _a : error}` });
    }
};
exports.getUsers = getUsers;
