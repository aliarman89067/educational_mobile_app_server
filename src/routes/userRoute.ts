import bodyParser from "body-parser";
import express from "express";
import {
  createUser,
  getUsers,
  migrateUser,
  migrateUserOnline,
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

export default router;
