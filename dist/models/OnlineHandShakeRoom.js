"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OnlineHandShakeRoomSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true },
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "subjects" },
    yearId: { type: mongoose_1.Schema.Types.ObjectId, ref: "years" },
    topicId: { type: mongoose_1.Schema.Types.ObjectId, ref: "topics" },
    quizLimit: { type: Number, required: true },
    user: { type: String, required: true },
    isGuest: { type: Boolean },
    quizType: { type: String, required: true },
    isAlive: { type: Boolean, required: true },
});
const OnlineHandShakeRoomModel = (0, mongoose_1.model)("onlinehandshakeroom", OnlineHandShakeRoomSchema);
exports.default = OnlineHandShakeRoomModel;
