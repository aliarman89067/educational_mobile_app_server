"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const onlineHistorySchema = new mongoose_1.Schema({
    roomId: { type: mongoose_1.Schema.Types.ObjectId, ref: "onlineroom" },
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
const OnlineHistoryModel = (0, mongoose_1.model)("onlinehistory", onlineHistorySchema);
exports.default = OnlineHistoryModel;
