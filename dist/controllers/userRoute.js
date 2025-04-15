"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserWebhook = void 0;
const User_1 = __importDefault(require("../models/User"));
const createUserWebhook = async (req, res) => {
    var _a;
    try {
        const SIGNING_SECRET = process.env.SIGNING_SECRET;
        if (!SIGNING_SECRET) {
            throw new Error("please add SIGNING_SECRET in your env to continue!");
        }
        switch (req.body.type) {
            case "user.created":
                const createUser = async () => {
                    const clerkId = req.body.data.id;
                    const fullName = req.body.data.first_name + " " + req.body.data.last_name;
                    const imageUrl = req.body.data.image_url;
                    const emailAddress = req.body.data.email_addresses[0].email_address;
                    await User_1.default.create({
                        clerkId,
                        fullName,
                        imageUrl,
                        emailAddress,
                    });
                };
                createUser();
                break;
            case "user.updated":
                const updateUser = async () => {
                    const clerkId = req.body.data.id;
                    const fullName = req.body.data.first_name + " " + req.body.data.last_name;
                    const imageUrl = req.body.data.image_url;
                    const emailAddress = req.body.data.email_addresses[0].email_address;
                    await User_1.default.findOneAndUpdate({ clerkId }, {
                        fullName,
                        imageUrl,
                        emailAddress,
                    });
                };
                updateUser();
                break;
            case "user.deleted":
                const deleteUser = async () => {
                    const clerkId = req.body.data.id;
                    await User_1.default.findOneAndDelete({ clerkId });
                };
                deleteUser();
                break;
        }
        res.status(200).json({ message: "Webhook Completed" });
    }
    catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: `Failed to create user ${(_a = error.message) !== null && _a !== void 0 ? _a : error}` });
    }
};
exports.createUserWebhook = createUserWebhook;
