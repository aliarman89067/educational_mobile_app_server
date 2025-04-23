"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const guestController_1 = require("../controllers/guestController");
const router = express_1.default.Router();
router.post("/", guestController_1.createGuest);
exports.default = router;
