import { Request, Response } from "express";
import UserModel from "../models/User";

export const createUserWebhook = async (req: Request, res: Response) => {
  try {
    const SIGNING_SECRET = process.env.SIGNING_SECRET;
    if (!SIGNING_SECRET) {
      throw new Error("please add SIGNING_SECRET in your env to continue!");
    }

    switch (req.body.type) {
      case "user.created":
        const createUser = async () => {
          const clerkId = req.body.data.id;
          const fullName =
            req.body.data.first_name + " " + req.body.data.last_name;
          const imageUrl = req.body.data.image_url;
          const emailAddress = req.body.data.email_addresses[0].email_address;
          await UserModel.create({
            clerkId,
            fullName,
            imageUrl,
            emailAddress,
          });
        };
        createUser();
        break;
      case "user.updated":
        const updateUser = async () => {
          const clerkId = req.body.data.id;
          const fullName =
            req.body.data.first_name + " " + req.body.data.last_name;
          const imageUrl = req.body.data.image_url;
          const emailAddress = req.body.data.email_addresses[0].email_address;
          await UserModel.findOneAndUpdate(
            { clerkId },
            {
              fullName,
              imageUrl,
              emailAddress,
            }
          );
        };
        updateUser();
        break;
      case "user.deleted":
        const deleteUser = async () => {
          const clerkId = req.body.data.id;
          await UserModel.findOneAndDelete({ clerkId });
        };
        deleteUser();
        break;
    }
    res.status(200).json({ message: "Webhook Completed" });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Failed to create user ${error.message ?? error}` });
  }
};
