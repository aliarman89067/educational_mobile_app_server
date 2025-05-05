import { Request, Response } from "express";
import OnlineRoomModel from "../models/OnlineRoom";
import subjectModel from "../models/Subject";
import topicModel from "../models/Topic";
import yearModel from "../models/Year";
import HistoryModel from "../models/History";
import OnlineHistoryModel from "../models/OnlineHistory";
import FriendHistoryModel from "../models/FriendHistory";

export const getAllHistory = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const historyData: any = {};
    const onlineHistory = await OnlineHistoryModel.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "roomId",
        populate: [
          { path: "subjectId", select: "_id subject" },
          { path: "yearId", select: "_id year" },
          { path: "topicId", select: "_id topic" },
        ],
      });

    const formattedOnlineHistory = onlineHistory.map((history) => {
      const room = history.roomId as unknown as {
        _id: string;
        subjectId: {
          _id: string;
          subject: string;
        };
        yearId: {
          _id: string;
          year: string;
        };
        topicId: {
          _id: string;
          topic: string;
        };
        quizType: "Topical" | "Yearly";
        createdAt: string;
        user1: string;
        user2: string;
        quizIdAndValue1: {
          _id: string;
          isCorrect: string;
          selected: string;
        }[];
        quizIdAndValue2: {
          _id: string;
          isCorrect: string;
          selected: string;
        }[];
        resignation: string;
        quizes: string[];
      };

      return {
        historyId: history._id,
        roomId: room._id,
        subjectId: room.subjectId._id,
        subjectName: room.subjectId.subject,
        topicId: room.quizType === "Topical" ? room.topicId._id : "",
        topicName: room.quizType === "Topical" ? room.topicId.topic : "",
        yearId: room.quizType === "Yearly" ? room.yearId._id : "",
        yearName: room.quizType === "Yearly" ? room.yearId.year : "",
        date: room.createdAt,
        quizType: room.quizType,
        quizIdAndValue:
          room.user1 === userId ? room.quizIdAndValue1 : room.quizIdAndValue2,
        opponentQuizIdAndValue:
          room.user1 === userId ? room.quizIdAndValue2 : room.quizIdAndValue1,
        resignation: room.resignation,
        mcqLength: room.quizes.length,
      };
    });

    const soloHistory = await HistoryModel.find({ user: userId })
      .select("_id createdAt quizIdAndValue mcqs")
      .populate({
        path: "soloRoom",
        populate: [
          { path: "subjectId", select: "_id subject" },
          { path: "yearId", select: "_id year" },
          { path: "topicId", select: "_id topic" },
        ],
      });

    const formattedSoloHistory = soloHistory.map((history) => {
      const soloRoom = history.soloRoom as unknown as {
        _id: string;
        subjectId: {
          _id: string;
          subject: string;
        };
        topicId: {
          _id: string;
          topic: string;
        };
        yearId: {
          _id: string;
          year: string;
        };
        quizType: string;
        createdAt: string;
      };
      return {
        historyId: history._id,
        roomId: history.soloRoom?._id,
        subjectId: soloRoom.subjectId._id,
        subjectName: soloRoom.subjectId.subject,
        topicId: soloRoom.quizType === "Topical" ? soloRoom.topicId._id : "",
        topicName:
          soloRoom.quizType === "Topical" ? soloRoom.topicId.topic : "",
        yearId: soloRoom.quizType === "Yearly" ? soloRoom.yearId._id : "",
        yearName: soloRoom.quizType === "Yearly" ? soloRoom.yearId.year : "",
        quizType: soloRoom.quizType,
        date: history.createdAt,
        quizIdAndValue: history.quizIdAndValue,
        mcqLength: history.mcqs.length,
      };
    });

    const friendHistory = await FriendHistoryModel.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "roomId",
        populate: [
          { path: "subjectId", select: "_id subject" },
          { path: "yearId", select: "_id year" },
          { path: "topicId", select: "_id topic" },
        ],
      });

    const formattedFriendHistory = friendHistory.map((history) => {
      const room = history.roomId as unknown as {
        _id: string;
        subjectId: {
          _id: string;
          subject: string;
        };
        yearId: {
          _id: string;
          year: string;
        };
        topicId: {
          _id: string;
          topic: string;
        };
        quizType: "Topical" | "Yearly";
        createdAt: string;
        user1: string;
        user2: string;
        quizIdAndValue1: {
          _id: string;
          isCorrect: string;
          selected: string;
        }[];
        quizIdAndValue2: {
          _id: string;
          isCorrect: string;
          selected: string;
        }[];
        resignation: string;
        quizes: string[];
      };

      return {
        historyId: history._id,
        roomId: room._id,
        subjectId: room.subjectId._id,
        subjectName: room.subjectId.subject,
        topicId: room.quizType === "Topical" ? room.topicId._id : "",
        topicName: room.quizType === "Topical" ? room.topicId.topic : "",
        yearId: room.quizType === "Yearly" ? room.yearId._id : "",
        yearName: room.quizType === "Yearly" ? room.yearId.year : "",
        date: room.createdAt,
        quizType: room.quizType,
        quizIdAndValue:
          room.user1 === userId ? room.quizIdAndValue1 : room.quizIdAndValue2,
        opponentQuizIdAndValue:
          room.user1 === userId ? room.quizIdAndValue2 : room.quizIdAndValue1,
        resignation: room.resignation,
        mcqLength: room.quizes.length,
      };
    });
    console.log(formattedFriendHistory);

    historyData["onlineQuizes"] = formattedOnlineHistory;
    historyData["soloQuizes"] = formattedSoloHistory;
    historyData["friendQuizes"] = formattedFriendHistory;
    res.status(200).json(historyData);
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Failed to get histories ${error.message ?? error}` });
  }
};
