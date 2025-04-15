"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quizController_1 = require("../controllers/quizController");
const router = express_1.default.Router();
router.get("/get-all/:quizType", quizController_1.getQuizByCategory);
router.post("/solo-player", quizController_1.createSoloQuiz);
router.get("/get/solo-room/:soloRoomId", quizController_1.getSoloRoom);
router.put("/reactive-solo-room", quizController_1.reactiveSoloRoom);
router.put("/leave/solo-room/:roomId", quizController_1.leaveSoloRoom);
router.post("/submit/solo-room", quizController_1.submitSoloRoom);
router.get("/get-solo-result/:resultId", quizController_1.soloRoomResult);
router.get("/get-online-room/:onlineRoomId/:userId/:sessionId", quizController_1.getOnlineRoom);
router.get("/get-online-history/:resultId/:roomId", quizController_1.getOnlineResult);
exports.default = router;
