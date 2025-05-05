import express from "express";
import {
  createUser,
  getUsers,
  migrateUser,
  migrateUserOnline,
  updateSession,
  getUserReceivedRequest,
  cancelRequest,
  acceptRequest,
  handleUnfriend,
  getUserFriends,
} from "../controllers/userController";

const router = express.Router();

// router.post(
//   "/",
//   bodyParser.raw({ type: "application/json" }),
//   createUserWebhook
// );
router.post("/", createUser);
router.post("/migration", migrateUser);
router.post("/migration-online", migrateUserOnline);
router.get("/:name/:userId", getUsers);
router.put("/updateSession", updateSession);
router.post("/received-request", getUserReceivedRequest);
router.put("/cancel-request", cancelRequest);
router.put("/accept-request", acceptRequest);
router.put("/unfriend", handleUnfriend);
router.post("/get-friends/:userId", getUserFriends);

export default router;
