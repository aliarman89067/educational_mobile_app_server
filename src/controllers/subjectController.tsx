import { Request, Response } from "express";
import subjectModel from "../models/Subject";

export const getAllSubject = async (req: Request, res: Response) => {
  try {
    const subjects = await subjectModel.find().select("_id subject");
    res.status(200).json(subjects);
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Failed to get subject ${error.message ?? error}` });
  }
};
