"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserPaperFields = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "user" },
    board: { type: String, required: true },
    grade: { type: String, required: true },
    subjects: [
        {
            id: { type: Number, required: true },
            name: { type: String, required: true },
        },
    ],
});
const UserPaperFieldsModel = (0, mongoose_1.model)("userPaperFields", UserPaperFields);
exports.default = UserPaperFieldsModel;
