"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const FriendRoomSchema = new mongoose_1.Schema({
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "subjects" },
    yearId: { type: mongoose_1.Schema.Types.ObjectId, ref: "years" },
    topicId: { type: mongoose_1.Schema.Types.ObjectId, ref: "topics" },
    quizType: { type: String, required: true },
    quizes: [{ type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "mcqs" }],
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
    isUser1Alive: { type: Boolean, default: false },
    isUser2Alive: { type: Boolean, default: false },
    user1RemainingTime: { type: String },
    user2RemainingTime: { type: String },
    resignation: { type: String, default: "" },
    seconds: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "playing", "ended"],
        default: "pending",
    },
    isGuest1: { type: Boolean },
    isGuest2: { type: Boolean },
}, {
    timestamps: true,
});
const FriendRoomModel = (0, mongoose_1.model)("friendRoom", FriendRoomSchema);
exports.default = FriendRoomModel;
