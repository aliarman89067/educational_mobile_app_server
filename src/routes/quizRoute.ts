import express from "express";
import {
  createSoloQuiz,
  getQuizByCategory,
  getSoloRoom,
  leaveSoloRoom,
  submitSoloRoom,
  soloRoomResult,
  getOnlineRoom,
  getOnlineResult,
  reactiveSoloRoom,
  createFriendRoom,
  getFriendRoom,
  getFriendResult,
} from "../controllers/quizController";
import { disabledFriendRoom } from "../controllers/userController";

const router = express.Router();

router.get("/get-all/:quizType", getQuizByCategory);
router.post("/solo-player", createSoloQuiz);
router.get("/get/solo-room/:soloRoomId", getSoloRoom);
router.put("/reactive-solo-room", reactiveSoloRoom);
router.put("/leave/solo-room/:roomId", leaveSoloRoom);
router.post("/submit/solo-room", submitSoloRoom);
router.get("/get-solo-result/:resultId", soloRoomResult);
router.get(
  "/get-online-room/:onlineRoomId/:userId/:isGuest/:sessionId",
  getOnlineRoom
);
router.get("/get-friend-room/:friendRoomId/:userId/:sessionId", getFriendRoom);
router.get("/get-online-history/:resultId/:roomId/:isGuest", getOnlineResult);
router.post("/create-friendroom", createFriendRoom);
router.put("/disabled-friend-room", disabledFriendRoom);
router.get("/get-friend-history/:resultId/:roomId", getFriendResult);

export default router;
