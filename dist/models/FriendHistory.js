"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const friendHistorySchema = new mongoose_1.Schema({
    roomId: { type: mongoose_1.Schema.Types.ObjectId, ref: "friendRoom" },
    mcqs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "mcqs" }],
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
}, {
    timestamps: true,
});
const FriendHistoryModel = (0, mongoose_1.model)("friendhistory", friendHistorySchema);
exports.default = FriendHistoryModel;
