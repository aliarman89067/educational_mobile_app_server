"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSubject = void 0;
const Subject_1 = __importDefault(require("../models/Subject"));
const getAllSubject = async (req, res) => {
    var _a;
    try {
        const subjects = await Subject_1.default.find().select("_id subject");
        res.status(200).json(subjects);
    }
    catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: `Failed to get subject ${(_a = error.message) !== null && _a !== void 0 ? _a : error}` });
    }
};
exports.getAllSubject = getAllSubject;
