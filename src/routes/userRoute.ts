import bodyParser from "body-parser";
import express from "express";
import { createUserWebhook } from "../controllers/userRoute";

const router = express.Router();

router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  createUserWebhook
);

export default router;
