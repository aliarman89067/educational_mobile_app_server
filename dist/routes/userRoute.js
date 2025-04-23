"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
// router.post(
//   "/",
//   bodyParser.raw({ type: "application/json" }),
//   createUserWebhook
// );
router.post("/", userController_1.createUser);
router.post("/migration", userController_1.migrateUser);
router.post("/migration-online", userController_1.migrateUserOnline);
router.get("/:name/:userId", userController_1.getUsers);
exports.default = router;
