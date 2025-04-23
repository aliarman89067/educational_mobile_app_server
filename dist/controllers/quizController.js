"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineResult = exports.getOnlineRoom = exports.soloRoomResult = exports.submitSoloRoom = exports.leaveSoloRoom = exports.reactiveSoloRoom = exports.getSoloRoom = exports.createSoloQuiz = exports.getQuizByCategory = void 0;
const Subject_1 = __importDefault(require("../models/Subject"));
const Topic_1 = __importDefault(require("../models/Topic"));
const Year_1 = __importDefault(require("../models/Year"));
const SoloRoom_1 = __importDefault(require("../models/SoloRoom"));
const History_1 = __importDefault(require("../models/History"));
const OnlineRoom_1 = __importDefault(require("../models/OnlineRoom"));
const User_1 = __importDefault(require("../models/User"));
const OnlineHistory_1 = __importDefault(require("../models/OnlineHistory"));
const Guest_1 = __importDefault(require("../models/Guest"));
const getQuizByCategory = async (req, res) => {
    try {
        const { quizType } = req.params;
        let data;
        const subjects = await Subject_1.default.find().select("_id subject");
        if (quizType === "Topical") {
            data = await Subject_1.default
                .find()
                .populate({ path: "topics" })
                .select("-years");
        }
        else {
            data = await Subject_1.default
                .find()
                .populate({ path: "years" })
                .select("-topics");
        }
        console.log(subjects);
        res.status(200).json({ success: true, data: data, subjects });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getQuizByCategory = getQuizByCategory;
const createSoloQuiz = async (req, res) => {
    try {
        const { subjectId, yearIdOrTopicId, quizLimit, quizType, seconds } = req.body;
        console.log(subjectId, yearIdOrTopicId, quizLimit, quizType, seconds);
        if (!subjectId || !yearIdOrTopicId || !quizLimit || !quizType || !seconds) {
            res.status(404).json({
                success: false,
                message: "Payload is not correct!",
            });
            return;
        }
        let data;
        if (quizType === "Yearly") {
            data = await Year_1.default.findOne({ _id: yearIdOrTopicId }).select("mcqs");
        }
        else if (quizType === "Topical") {
            data = await Topic_1.default.findOne({ _id: yearIdOrTopicId }).select("mcqs");
        }
        else {
            res.status(404).json({
                success: false,
                message: "Quiz Type is not correct!",
            });
            return;
        }
        const targetQuiz = [];
        while (targetQuiz.length < quizLimit) {
            const randomQuizId = data.mcqs[Math.ceil(Math.random() * data.mcqs.length - 1)];
            if (!targetQuiz.includes(randomQuizId)) {
                targetQuiz.push(randomQuizId);
            }
        }
        let newSoloRoom;
        if (quizType === "Yearly") {
            newSoloRoom = await SoloRoom_1.default.create({
                subjectId,
                yearId: yearIdOrTopicId,
                quizes: targetQuiz,
                quizType,
                isAlive: true,
                seconds,
            });
        }
        else if (quizType === "Topical") {
            newSoloRoom = await SoloRoom_1.default.create({
                subjectId,
                topicId: yearIdOrTopicId,
                quizType,
                quizes: targetQuiz,
                isAlive: true,
                seconds,
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: "Quiz Type is not correct!",
            });
            return;
        }
        res.status(201).json({ success: true, data: newSoloRoom._id });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: `Failed to create solo quiz ${error !== null && error !== void 0 ? error : error.message}`,
        });
    }
};
exports.createSoloQuiz = createSoloQuiz;
const getSoloRoom = async (req, res) => {
    try {
        const { soloRoomId } = req.params;
        if (!soloRoomId) {
            res
                .status(404)
                .json({ success: false, message: "Solo Room Id is not exist!" });
            return;
        }
        const isSoloRoomAlive = await SoloRoom_1.default.findOne({
            _id: soloRoomId,
        }).select("isAlive");
        if (!isSoloRoomAlive.isAlive || !isSoloRoomAlive) {
            res.status(400).json({
                success: false,
                message: "This Solo Room is not valid. Its expired!",
            });
            return;
        }
        const soloRoomData = await SoloRoom_1.default.findOne({ _id: soloRoomId })
            .populate({ path: "subjectId", select: "_id subject" })
            .populate({ path: "yearId", select: "_id year" })
            .populate({ path: "topicId", select: "_id topic" })
            .populate({ path: "quizes" });
        res.status(200).json({ success: true, data: soloRoomData });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};
exports.getSoloRoom = getSoloRoom;
const reactiveSoloRoom = async (req, res) => {
    var _a;
    try {
        const { soloRoomId, historyId } = req.body;
        if (!soloRoomId) {
            res
                .status(404)
                .json({ success: false, message: "Solo Room Id not exist!" });
            return;
        }
        const soloRoomDoc = await SoloRoom_1.default.findByIdAndUpdate(soloRoomId, { isAlive: true, isHistoryId: historyId }, { new: true });
        res.status(200).json({ success: true, data: soloRoomDoc === null || soloRoomDoc === void 0 ? void 0 : soloRoomDoc._id });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: `Failed to reactive soloroom ${(_a = error.message) !== null && _a !== void 0 ? _a : error}`,
        });
    }
};
exports.reactiveSoloRoom = reactiveSoloRoom;
const leaveSoloRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!roomId) {
            res
                .status(404)
                .json({ success: false, message: "Solo Room Id not exist!" });
            return;
        }
        await SoloRoom_1.default.findByIdAndUpdate(roomId, { isAlive: false });
        res.status(200).json({
            success: true,
            message: "This Solo room is shut down mean isAlive property set to false",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};
exports.leaveSoloRoom = leaveSoloRoom;
const submitSoloRoom = async (req, res) => {
    try {
        const { roomId, type, mcqs, states, userId, time, isGuest } = req.body;
        if (!roomId || !type || !mcqs || !states || !time) {
            res
                .status(404)
                .json({ success: false, message: "Payload are not correct!" });
            return;
        }
        const history = await SoloRoom_1.default.findByIdAndUpdate(roomId, { isAlive: false }, { new: true });
        let historyId;
        if (history === null || history === void 0 ? void 0 : history.isHistoryId) {
            await History_1.default.findByIdAndUpdate(history.isHistoryId, {
                mcqs: mcqs,
                quizIdAndValue: states,
                roomType: type,
                soloRoom: roomId,
                user: userId,
                time,
            });
            historyId = history.isHistoryId;
        }
        else {
            const newHistory = await History_1.default.create({
                mcqs: mcqs,
                quizIdAndValue: states,
                roomType: type,
                soloRoom: roomId,
                user: userId,
                time,
            });
            historyId = newHistory._id;
        }
        res.status(201).json({ success: true, data: historyId });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
exports.submitSoloRoom = submitSoloRoom;
const soloRoomResult = async (req, res) => {
    var _a;
    const { resultId } = req.params;
    try {
        if (!resultId) {
            res.status(404).json({ success: false, message: "Result Id not exist!" });
            return;
        }
        console.log(resultId);
        const data = await History_1.default.findOne({
            _id: resultId,
        })
            .populate({ path: "mcqs" })
            .populate({ path: "user" })
            .populate({
            path: "soloRoom",
            select: "_id subjectId yearId topicId",
            populate: {
                path: "subjectId yearId topicId",
                select: "subject year topic",
            },
        });
        res.status(200).json({ success: true, data: data });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: `Failed to get solo room results ${(_a = error.message) !== null && _a !== void 0 ? _a : error}`,
        });
    }
};
exports.soloRoomResult = soloRoomResult;
const getOnlineRoom = async (req, res) => {
    var _a;
    const { onlineRoomId, userId, isGuest, sessionId } = req.params;
    try {
        if (!onlineRoomId || !userId) {
            console.log("Payload is not correct");
            res.status(404).json({
                success: false,
                message: "Params payload is not correct",
            });
            return;
        }
        const isOnlineRoomAlive = await OnlineRoom_1.default.findOne({
            _id: onlineRoomId,
        }).select("isUser1Alive isUser2Alive user1 user2");
        if ((!(isOnlineRoomAlive === null || isOnlineRoomAlive === void 0 ? void 0 : isOnlineRoomAlive.isUser1Alive) && !(isOnlineRoomAlive === null || isOnlineRoomAlive === void 0 ? void 0 : isOnlineRoomAlive.isUser2Alive)) ||
            !isOnlineRoomAlive) {
            console.log("This room is expired");
            res.status(200).json({
                success: false,
                error: "room-expired",
                message: "This Online Room is not valid. Its expired!",
            });
            return;
        }
        if (isOnlineRoomAlive.user1 === userId && !isOnlineRoomAlive.isUser1Alive) {
            console.log("Room Expired for user 1");
            res.status(200).json({
                success: false,
                error: "room-expired",
                message: "This room is expired for user 1",
            });
            return;
        }
        else if (isOnlineRoomAlive.user2 === userId &&
            !isOnlineRoomAlive.isUser2Alive) {
            console.log("Room Expired for user 2");
            res.status(200).json({
                success: false,
                error: "room-expired",
                message: "This room is expired for user 2",
            });
            return;
        }
        if (isOnlineRoomAlive.user1 !== userId &&
            isOnlineRoomAlive.user2 !== userId) {
            console.log("User id is not matching any of the online room user id's");
            res.status(200).json({
                success: false,
                error: "server-error",
                message: "User id is not matching any of the online room user id's",
            });
            return;
        }
        const onlineRoomData = await OnlineRoom_1.default.findOne({
            _id: onlineRoomId,
        })
            .populate({ path: "subjectId", select: "_id subject" })
            .populate({ path: "yearId", select: "_id year" })
            .populate({ path: "topicId", select: "_id topic" })
            .populate({ path: "quizes" });
        // Finding opponent
        // Validating that both user exist in online room
        if (!(onlineRoomData === null || onlineRoomData === void 0 ? void 0 : onlineRoomData.user1) || !onlineRoomData.user2) {
            console.log("One user is missing in online room means its not completely updated!");
            res.status(200).json({
                success: false,
                error: "server-error",
                message: "One user is missing in online room means its not completely updated!",
            });
            return;
        }
        let opponent;
        let remainingTime = "";
        const isUser1 = onlineRoomData.user1 === userId;
        const isOpponentGuest = isUser1
            ? onlineRoomData.isGuest2
            : onlineRoomData.isGuest1;
        if (onlineRoomData.user1 === userId) {
            const updatedOnlineRoom = await OnlineRoom_1.default.findOneAndUpdate({
                _id: onlineRoomId,
                isEnded: false,
            }, {
                user1SessionId: sessionId,
            }, { new: true });
            remainingTime = updatedOnlineRoom === null || updatedOnlineRoom === void 0 ? void 0 : updatedOnlineRoom.user1RemainingTime;
            if (isOpponentGuest) {
                opponent = await Guest_1.default.findOne({
                    _id: onlineRoomData.user2,
                });
            }
            else {
                opponent = await User_1.default.findOne({
                    _id: onlineRoomData.user2,
                });
            }
        }
        else if (onlineRoomData.user2 === userId) {
            const updatedOnlineRoom = await OnlineRoom_1.default.findOneAndUpdate({
                _id: onlineRoomId,
                isEnded: false,
            }, {
                user2SessionId: sessionId,
            }, { new: true });
            remainingTime = updatedOnlineRoom === null || updatedOnlineRoom === void 0 ? void 0 : updatedOnlineRoom.user2RemainingTime;
            if (isOpponentGuest) {
                opponent = await Guest_1.default.findOne({
                    _id: onlineRoomData.user1,
                });
            }
            else {
                opponent = await User_1.default.findOne({
                    _id: onlineRoomData.user1,
                });
            }
        }
        if (!opponent) {
            console.log("Can't find your opponent");
            res.status(200).json({
                success: false,
                error: "opponent-left",
                message: "Can't find your opponent",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: { onlineRoomData, opponent, remainingTime },
        });
    }
    catch (error) {
        console.log(error);
        console.log("Failed to get online room");
        res
            .status(500)
            .json({ message: `Failed to get online room ${(_a = error.message) !== null && _a !== void 0 ? _a : error}` });
    }
};
exports.getOnlineRoom = getOnlineRoom;
const getOnlineResult = async (req, res) => {
    var _a;
    const { resultId, roomId, isGuest } = req.params;
    try {
        if (!resultId || !roomId) {
            res.status(404).json({
                success: false,
                message: "Result Id or Room Id is not exist!",
            });
            return;
        }
        const findOpponentHistory = await OnlineHistory_1.default.findOne({
            roomId,
            _id: { $ne: resultId },
        })
            .populate({ path: "mcqs" })
            .populate({
            path: "roomId",
            select: "_id subjectId yearId topicId quizType",
            populate: {
                path: "subjectId yearId topicId",
                select: "subject year topic",
            },
        });
        const myHistory = await OnlineHistory_1.default.findOne({
            roomId,
            _id: resultId,
        })
            .populate({ path: "mcqs" })
            .populate({
            path: "roomId",
            select: "_id subjectId yearId topicId quizType",
            populate: {
                path: "subjectId yearId topicId",
                select: "subject year topic",
            },
        });
        const findOnlineRoom = await OnlineRoom_1.default.findOneAndUpdate({
            _id: roomId,
        }, {
            isEnded: true,
        }, {
            new: true,
        });
        if ((findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user1) === (myHistory === null || myHistory === void 0 ? void 0 : myHistory.user)) {
            await OnlineRoom_1.default.findOneAndUpdate({
                _id: roomId,
            }, {
                quizIdAndValue1: myHistory === null || myHistory === void 0 ? void 0 : myHistory.quizIdAndValue,
                quizIdAndValue2: findOpponentHistory === null || findOpponentHistory === void 0 ? void 0 : findOpponentHistory.quizIdAndValue,
            });
        }
        else {
            await OnlineRoom_1.default.findOneAndUpdate({
                _id: roomId,
            }, {
                quizIdAndValue2: myHistory === null || myHistory === void 0 ? void 0 : myHistory.quizIdAndValue,
                quizIdAndValue1: findOpponentHistory === null || findOpponentHistory === void 0 ? void 0 : findOpponentHistory.quizIdAndValue,
            });
        }
        if (!findOnlineRoom) {
            res.status(400).json({ success: false, message: "Room is expired!" });
            return;
        }
        let opponentUser;
        if (findOnlineRoom.user1 === (myHistory === null || myHistory === void 0 ? void 0 : myHistory.user)) {
            if (isGuest === "true") {
                opponentUser = await Guest_1.default.findOne({
                    _id: findOnlineRoom.user2,
                });
            }
            else {
                opponentUser = await User_1.default.findOne({
                    clerkId: findOnlineRoom.user2,
                }).select("fullName imageUrl clerkId");
            }
        }
        else {
            if (isGuest === "true") {
                opponentUser = await Guest_1.default.findOne({
                    clerkId: findOnlineRoom.user1,
                });
            }
            else {
                opponentUser = await User_1.default.findOne({
                    clerkId: findOnlineRoom.user1,
                }).select("fullName imageUrl clerkId");
            }
        }
        if (findOpponentHistory) {
            const resignation = (_a = findOnlineRoom.resignation) !== null && _a !== void 0 ? _a : "";
            res.status(200).json({
                success: true,
                isPending: false,
                data: {
                    myHistory,
                    opponentUser,
                    opponentHistory: findOpponentHistory,
                    resignation,
                },
            });
        }
        else {
            res.status(200).json({
                success: true,
                isPending: true,
                data: {
                    myData: myHistory,
                    opponentUser,
                    time: {
                        fullTime: findOnlineRoom.seconds,
                        timeTaken: myHistory === null || myHistory === void 0 ? void 0 : myHistory.time,
                    },
                },
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};
exports.getOnlineResult = getOnlineResult;
