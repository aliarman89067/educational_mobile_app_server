import express from "express";
import { getAllHistory } from "../controllers/historyController";

const router = express.Router();

router.get("/all/:userId", getAllHistory);

export default router;
