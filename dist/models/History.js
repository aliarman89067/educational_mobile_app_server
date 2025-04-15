"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const historySchema = new mongoose_1.Schema({
    mcqs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "mcqs" }],
    user: { type: String },
    roomType: { type: String, required: true },
    soloRoom: { type: mongoose_1.Schema.Types.ObjectId, ref: "soloRoom" },
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
const HistoryModel = (0, mongoose_1.model)("history", historySchema);
exports.default = HistoryModel;
