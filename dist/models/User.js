"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    clerkId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    emailAddress: { type: String, required: true, unique: true },
    imageUrl: {
        type: String,
        default: "https://i.pinimg.com/736x/87/14/55/8714556a52021ba3a55c8e7a3547d28c.jpg",
    },
});
const UserModel = (0, mongoose_1.model)("user", userSchema);
exports.default = UserModel;
