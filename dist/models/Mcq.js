"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mcqSchema = new mongoose_1.Schema({
    mcq: { type: String, required: true },
    options: [
        {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
        },
    ],
}, { timestamps: true });
const mcqModel = (0, mongoose_1.model)("mcqs", mcqSchema);
exports.default = mcqModel;
