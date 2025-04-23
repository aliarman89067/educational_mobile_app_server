"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuest = void 0;
const Guest_1 = __importDefault(require("../models/Guest"));
const createGuest = async (req, res) => {
    var _a;
    try {
        const guestCount = await Guest_1.default.countDocuments();
        const guest = await Guest_1.default.create({
            count: guestCount,
            fullName: `Guest_${guestCount}`,
        });
        res.json(guest);
    }
    catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: `Failed to create guest ${(_a = error.message) !== null && _a !== void 0 ? _a : error}` });
    }
};
exports.createGuest = createGuest;
