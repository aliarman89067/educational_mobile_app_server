"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const soloRoomSchema = new mongoose_1.Schema({
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "subjects" },
    yearId: { type: mongoose_1.Schema.Types.ObjectId, ref: "years" },
    topicId: { type: mongoose_1.Schema.Types.ObjectId, ref: "topics" },
    quizType: { type: String, required: true },
    quizes: [{ type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "mcqs" }],
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "users" },
    isAlive: { type: Boolean, required: true },
    seconds: { type: String, required: true },
    isHistoryId: { type: String },
}, {
    timestamps: true,
});
const SoloRoomModel = (0, mongoose_1.model)("soloRoom", soloRoomSchema);
exports.default = SoloRoomModel;
