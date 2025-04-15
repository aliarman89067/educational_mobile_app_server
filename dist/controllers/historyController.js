"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllHistory = void 0;
const History_1 = __importDefault(require("../models/History"));
const OnlineHistory_1 = __importDefault(require("../models/OnlineHistory"));
const getAllHistory = async (req, res) => {
    var _a;
    const { userId } = req.params;
    try {
        const historyData = {};
        const onlineHistory = await OnlineHistory_1.default.find({
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
            const room = history.roomId;
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
                quizIdAndValue: room.user1 === userId ? room.quizIdAndValue1 : room.quizIdAndValue2,
                opponentQuizIdAndValue: room.user1 === userId ? room.quizIdAndValue2 : room.quizIdAndValue1,
                resignation: room.resignation,
                mcqLength: room.quizes.length,
            };
        });
        const soloHistory = await History_1.default.find({ user: userId })
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
            var _a;
            const soloRoom = history.soloRoom;
            return {
                historyId: history._id,
                roomId: (_a = history.soloRoom) === null || _a === void 0 ? void 0 : _a._id,
                subjectId: soloRoom.subjectId._id,
                subjectName: soloRoom.subjectId.subject,
                topicId: soloRoom.quizType === "Topical" ? soloRoom.topicId._id : "",
                topicName: soloRoom.quizType === "Topical" ? soloRoom.topicId.topic : "",
                yearId: soloRoom.quizType === "Yearly" ? soloRoom.yearId._id : "",
                yearName: soloRoom.quizType === "Yearly" ? soloRoom.yearId.year : "",
                quizType: soloRoom.quizType,
                date: history.createdAt,
                quizIdAndValue: history.quizIdAndValue,
                mcqLength: history.mcqs.length,
            };
        });
        historyData["onlineQuizes"] = formattedOnlineHistory;
        historyData["soloQuizes"] = formattedSoloHistory;
        res.status(200).json(historyData);
    }
    catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: `Failed to get histories ${(_a = error.message) !== null && _a !== void 0 ? _a : error}` });
    }
};
exports.getAllHistory = getAllHistory;
