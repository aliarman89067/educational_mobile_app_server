import express from "express";
import { createGuest } from "../controllers/guestController";

const router = express.Router();

router.post("/", createGuest);

export default router;
