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
router.put("/updateSession", userController_1.updateSession);
router.post("/received-request", userController_1.getUserReceivedRequest);
router.put("/cancel-request", userController_1.cancelRequest);
router.put("/accept-request", userController_1.acceptRequest);
router.put("/unfriend", userController_1.handleUnfriend);
router.post("/get-friends/:userId", userController_1.getUserFriends);
router.post("/user-paper-fields", userController_1.createUserPaperFields);
router.post("/check-paper-journey/:userId", userController_1.checkPaperJourney);
exports.default = router;
