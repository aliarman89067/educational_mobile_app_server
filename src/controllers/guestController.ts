import { Request, Response } from "express";
import GuestModel from "../models/Guest";

export const createGuest = async (req: Request, res: Response) => {
  try {
    const guestCount = await GuestModel.countDocuments();
    const guest = await GuestModel.create({
      count: guestCount,
      fullName: `Guest_${guestCount}`,
    });
    res.json(guest);
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Failed to create guest ${error.message ?? error}` });
  }
};
