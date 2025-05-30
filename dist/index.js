"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Lib Imports
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// Route Imports
const quizRoute_1 = __importDefault(require("./routes/quizRoute"));
const subjectRoute_1 = __importDefault(require("./routes/subjectRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const historyRoute_1 = __importDefault(require("./routes/historyRoute"));
const guestRoute_1 = __importDefault(require("./routes/guestRoute"));
require("./models/Topic");
require("./models/Year");
require("./models/SoloRoom");
require("./models/Subject");
require("./models/Mcq");
require("./models/History");
require("./models/User");
const OnlineHandShakeRoom_1 = __importDefault(require("./models/OnlineHandShakeRoom"));
const Year_1 = __importDefault(require("./models/Year"));
const Topic_1 = __importDefault(require("./models/Topic"));
const OnlineRoom_1 = __importDefault(require("./models/OnlineRoom"));
const User_1 = __importDefault(require("./models/User"));
const OnlineHistory_1 = __importDefault(require("./models/OnlineHistory"));
const Guest_1 = __importDefault(require("./models/Guest"));
const FriendRoom_1 = __importDefault(require("./models/FriendRoom"));
const FriendHistory_1 = __importDefault(require("./models/FriendHistory"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    const createRoom = async (data) => {
        const { subjectId, yearIdOrTopicId, quizLimit, quizType, userId, sessionId, name, imageUrl, seconds, isGuest, } = data;
        if (!subjectId ||
            !yearIdOrTopicId ||
            !quizLimit ||
            !quizType ||
            !sessionId ||
            !userId ||
            !name ||
            !imageUrl ||
            !seconds) {
            socket.emit("payload-error", { error: "Payload is incorrect" });
            return;
        }
        try {
            // Create handshake room
            const newHandShakeRoom = new OnlineHandShakeRoom_1.default({
                subjectId,
                sessionId,
                quizLimit,
                quizType,
                isGuest,
                isAlive: true,
                user: userId,
                [quizType === "Yearly" ? "yearId" : "topicId"]: yearIdOrTopicId,
            });
            await newHandShakeRoom.save();
            let findSameStudent;
            let retryCount = 0;
            const maxRetries = 20;
            let timeoutId;
            const searchStudent = async () => {
                if (retryCount >= maxRetries)
                    return null;
                // Find matching handshake room
                const query = {
                    subjectId,
                    [quizType === "Yearly" ? "yearId" : "topicId"]: yearIdOrTopicId,
                    sessionId: { $ne: sessionId },
                    isAlive: true,
                };
                console.log("Find matching student query");
                findSameStudent = await OnlineHandShakeRoom_1.default.findOne(query);
                if (findSameStudent) {
                    console.log("Finded same student");
                    return await handleOnlineRoom();
                }
                else {
                    retryCount++;
                    return new Promise((resolve) => {
                        timeoutId = setTimeout(() => resolve(searchStudent()), 500);
                    });
                }
            };
            const handleOnlineRoom = async () => {
                // Generate unique room key
                const uniqueKey = [userId, findSameStudent.user].sort().join("_");
                console.log("Unique Id for both users", uniqueKey);
                const model = quizType === "Yearly" ? Year_1.default : Topic_1.default;
                const { mcqs } = await model.findById(yearIdOrTopicId).select("mcqs");
                // Generate random quiz IDs
                const targetQuiz = [];
                while (targetQuiz.length < quizLimit) {
                    const randomIndex = Math.floor(Math.random() * mcqs.length);
                    const quizId = mcqs[randomIndex];
                    if (!targetQuiz.includes(quizId))
                        targetQuiz.push(quizId);
                }
                // Atomic room creation/update
                const filter = { uniqueKey, isEnded: false };
                const update = {
                    $setOnInsert: {
                        subjectId,
                        quizType,
                        isUser1Alive: true,
                        isUser2Alive: true,
                        quizes: targetQuiz,
                        seconds,
                        user1: userId,
                        user1SessionId: sessionId,
                        user2: findSameStudent.user,
                        user2SessionId: findSameStudent.sessionId,
                        isGuest1: isGuest,
                        isGuest2: findSameStudent.isGuest,
                        [quizType === "Yearly" ? "yearId" : "topicId"]: yearIdOrTopicId,
                    },
                };
                const options = { upsert: true, new: true, setDefaultsOnInsert: true };
                const onlineRoom = await OnlineRoom_1.default.findOneAndUpdate(filter, update, options);
                // Update session ID if needed
                if (onlineRoom) {
                    if ((onlineRoom === null || onlineRoom === void 0 ? void 0 : onlineRoom.user1) === userId) {
                        onlineRoom.user1SessionId = sessionId;
                    }
                    else if ((onlineRoom === null || onlineRoom === void 0 ? void 0 : onlineRoom.user2) === userId) {
                        onlineRoom.user2SessionId = sessionId;
                    }
                }
                await (onlineRoom === null || onlineRoom === void 0 ? void 0 : onlineRoom.save());
                return {
                    newOnlineRoomId: onlineRoom === null || onlineRoom === void 0 ? void 0 : onlineRoom._id,
                    user1Id: onlineRoom === null || onlineRoom === void 0 ? void 0 : onlineRoom.user1,
                    user2Id: onlineRoom === null || onlineRoom === void 0 ? void 0 : onlineRoom.user2,
                    isGuest1: onlineRoom === null || onlineRoom === void 0 ? void 0 : onlineRoom.isGuest1,
                    isGuest2: onlineRoom === null || onlineRoom === void 0 ? void 0 : onlineRoom.isGuest2,
                };
            };
            // Execute search and handle results
            const result = await searchStudent();
            clearTimeout(timeoutId);
            if (result) {
                const { newOnlineRoomId, user1Id, user2Id, isGuest1, isGuest2 } = result;
                const isUser1 = user1Id === userId;
                const opponentId = isUser1 ? user2Id : user1Id;
                const isOpponentGuest = isUser1 ? isGuest2 : isGuest1;
                let opponentUser;
                if (isOpponentGuest) {
                    opponentUser = await Guest_1.default.findOne({ _id: opponentId });
                }
                else {
                    opponentUser = await User_1.default.findOne({ _id: opponentId });
                }
                // Verify room readiness
                let roomValid = false;
                for (let i = 0; i < 10; i++) {
                    const room = await OnlineRoom_1.default.findById(newOnlineRoomId);
                    if ((room === null || room === void 0 ? void 0 : room.user1) && (room === null || room === void 0 ? void 0 : room.user2)) {
                        roomValid = true;
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
                if (roomValid) {
                    socket.emit("student-find", {
                        roomId: newOnlineRoomId,
                        opponent: opponentUser,
                    });
                }
                else {
                    socket.emit("no-student-found", { error: "Failed to find student" });
                }
                // // Cleanup handshake rooms
                await OnlineHandShakeRoom_1.default.findOneAndUpdate({ _id: findSameStudent._id }, { isAlive: false });
            }
            else {
                await OnlineHandShakeRoom_1.default.findByIdAndUpdate(newHandShakeRoom._id, {
                    isAlive: false,
                });
                socket.emit("no-student-found", { error: "Failed to find student" });
            }
        }
        catch (error) {
            console.error("Room creation error:", error);
            socket.emit("error", { error: "Internal server error" });
        }
    };
    const submitOnlineRoom = async (data) => {
        const { roomId, userId, selectedStates, mcqs, completeTime } = data;
        console.log("Online Submit Payload");
        console.log(roomId, userId, selectedStates, mcqs, completeTime);
        if (roomId && userId && selectedStates && mcqs && completeTime) {
            const newOnlineHistory = await OnlineHistory_1.default.create({
                roomId,
                mcqs,
                user: userId,
                roomType: "online-room",
                quizIdAndValue: selectedStates,
                time: completeTime,
            });
            const findOnlineRoom = await OnlineRoom_1.default.findById(roomId);
            console.log("Target Online Room");
            if (findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.resignation) {
                if (findOnlineRoom.user1 === userId) {
                    io.to(findOnlineRoom.user2SessionId).emit("opponent-resign", {
                        isCompleted: true,
                        time: completeTime,
                    });
                }
                else if (findOnlineRoom.user2 === userId) {
                    io.to(findOnlineRoom.user1SessionId).emit("opponent-resign", {
                        isCompleted: true,
                        time: completeTime,
                    });
                }
                return;
            }
            else {
                if ((findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user1) === userId) {
                    await OnlineRoom_1.default.findOneAndUpdate({ _id: roomId }, { isUser1Alive: false });
                    io.to(findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user2SessionId).emit("opponent-completed", {
                        isCompleted: true,
                        time: completeTime,
                    });
                    socket.emit("complete-response", { _id: newOnlineHistory._id });
                }
                else if ((findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user2) === userId) {
                    await OnlineRoom_1.default.findOneAndUpdate({ _id: roomId }, { isUser2Alive: false });
                    io.to(findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user1SessionId).emit("opponent-completed", {
                        isCompleted: true,
                        time: completeTime,
                    });
                    socket.emit("complete-response", { _id: newOnlineHistory._id });
                }
            }
        }
        else {
            socket.emit("submit-error", { error: "payload-not-correct" });
        }
    };
    const onlineResignSubmit = async (data) => {
        const { roomId, userId, selectedStates, mcqs, completeTime } = data;
        if (roomId && userId && selectedStates && mcqs && completeTime) {
            const newOnlineHistory = await OnlineHistory_1.default.create({
                roomId,
                mcqs,
                user: userId,
                roomType: "online-room",
                quizIdAndValue: selectedStates,
                time: completeTime,
            });
            socket.emit("complete-resign-response", { _id: newOnlineHistory._id });
        }
        else {
            console.log("This payload is not correct");
        }
    };
    const getOnlineHistory = async (data) => {
        let timeoutId;
        const { resultId, roomId } = data;
        if (resultId && roomId) {
            const getOpponentHistory = async () => {
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
                if (findOpponentHistory) {
                    return findOpponentHistory;
                }
                else {
                    return new Promise((resolve) => {
                        timeoutId = setTimeout(() => resolve(getOpponentHistory()), 1000);
                    });
                }
            };
            clearTimeout(timeoutId);
            const getOnlineHistoryRes = await getOpponentHistory();
            if (getOnlineHistoryRes) {
                socket.emit("get-online-history-data", getOnlineHistoryRes);
            }
            else {
                socket.emit("get-online-history-error", { error: "not-found" });
            }
        }
        else {
            socket.emit("get-online-history-error", { error: "payload-error" });
        }
    };
    const leaveByOnlineResign = async (data) => {
        const { completeTime, mcqs, roomId, selectedStates, userId } = data;
        if (completeTime || mcqs || roomId || selectedStates || userId) {
            // Finding and Validating and Updating Online Room Logic
            const getOnlineRoom = await OnlineRoom_1.default.findOne({
                _id: roomId,
                isEnded: false,
            });
            if (!getOnlineRoom) {
                // TODO:Handling Error
            }
            if ((getOnlineRoom === null || getOnlineRoom === void 0 ? void 0 : getOnlineRoom.user1) === userId || (getOnlineRoom === null || getOnlineRoom === void 0 ? void 0 : getOnlineRoom.user2) === userId) {
                await OnlineRoom_1.default.findOneAndUpdate({
                    _id: roomId,
                    isEnded: false,
                }, {
                    isUser1Alive: false,
                    isUser2Alive: false,
                    resignation: userId,
                    isEnded: true,
                }, { new: true });
                // Creating online history object and checking resignation and sending opponent an socket event
                await OnlineHistory_1.default.create({
                    roomId,
                    mcqs,
                    user: userId,
                    roomType: "online-room",
                    quizIdAndValue: selectedStates,
                    time: completeTime,
                });
                const findOnlineRoom = await OnlineRoom_1.default.findById(roomId);
                if (findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.resignation) {
                    if ((findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user1) === userId) {
                        console.log("Sending Resign Event");
                        io.to(findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user2SessionId).emit("opponent-resign", {
                            isCompleted: true,
                            time: completeTime,
                        });
                    }
                    else if ((findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user2) === userId) {
                        console.log("Sending Resign Event");
                        io.to(findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user1SessionId).emit("opponent-resign", {
                            isCompleted: true,
                            time: completeTime,
                        });
                    }
                }
            }
            else {
                // TODO:Handling Error
            }
        }
        else {
            console.log("Resign payload is not correct");
            // TODO:Handling Error
        }
    };
    const handleOpponentIndex = async (data) => {
        const { index, roomId, userId } = data;
        if (!index || !roomId || !userId) {
            throw new Error("Payload is not correct");
            return;
        }
        const findOnlineRoom = await OnlineRoom_1.default.findById(roomId);
        const findFriendRoom = await FriendRoom_1.default.findById(roomId);
        if (!findOnlineRoom && !findFriendRoom) {
            throw new Error("Online room not found!");
        }
        if (findOnlineRoom) {
            if (findOnlineRoom.user1 === userId) {
                io.to(findOnlineRoom.user2SessionId).emit("opponent-send-index", {
                    index,
                });
            }
            else if (findOnlineRoom.user2 === userId) {
                io.to(findOnlineRoom.user1SessionId).emit("opponent-send-index", {
                    index,
                });
            }
        }
        else if (findFriendRoom) {
            if (findFriendRoom.user1 === userId) {
                io.to(findFriendRoom.user2SessionId).emit("opponent-send-index", {
                    index,
                });
            }
            else if (findFriendRoom.user2 === userId) {
                io.to(findFriendRoom.user1SessionId).emit("opponent-send-index", {
                    index,
                });
            }
        }
    };
    const handleAddFriend = async (data) => {
        const { userId, friendId, friendSessionId } = data;
        if (!userId || !friendId || !friendSessionId) {
            socket.emit("friend-payload-error", { data: "Payload is wrong" });
            return;
        }
        const session = await mongoose_1.default.startSession();
        try {
            let status = "added";
            session.startTransaction();
            const existingFriend = await User_1.default.findById(friendId).session(session);
            if (!existingFriend) {
                socket.emit("friend-payload-error", { data: "Payload is wrong" });
                return;
            }
            const isAlreadyAdded = existingFriend.requestsRecieved.includes(userId);
            let friendData;
            if (isAlreadyAdded) {
                friendData = await User_1.default.findByIdAndUpdate(friendId, { $pull: { requestsRecieved: userId } }, { session });
                status = "removed";
            }
            else {
                friendData = await User_1.default.findByIdAndUpdate(friendId, { $push: { requestsRecieved: userId } }, { session });
                status = "added";
            }
            const existingMyData = await User_1.default.findById(userId).session(session);
            if (!existingMyData) {
                socket.emit("friend-payload-error", { data: "Payload is wrong" });
                return;
            }
            const isAlreadyMyData = existingMyData.requestsSend.includes(friendId);
            let myData;
            if (isAlreadyMyData) {
                myData = await User_1.default.findByIdAndUpdate(userId, { $pull: { requestsSend: friendId } }, { session });
            }
            else {
                myData = await User_1.default.findByIdAndUpdate(userId, { $push: { requestsSend: friendId } }, { session });
            }
            await session.commitTransaction();
            io.to(friendData === null || friendData === void 0 ? void 0 : friendData.sessionId).emit("request-received", {
                fullName: myData === null || myData === void 0 ? void 0 : myData.fullName,
                emailAddress: myData === null || myData === void 0 ? void 0 : myData.emailAddress,
                imageUrl: myData === null || myData === void 0 ? void 0 : myData.imageUrl,
                id: myData === null || myData === void 0 ? void 0 : myData._id,
                sessionId: myData === null || myData === void 0 ? void 0 : myData.sessionId,
                status,
            });
            socket.emit("update-friend-state", {
                status,
                friendId,
                userId,
            });
        }
        catch (error) {
            await session.abortTransaction();
            console.log(error);
        }
        finally {
            await session.endSession();
        }
    };
    const handleSendQuizRequest = async (data) => {
        const { roomId, friendId, userId } = data;
        try {
            const existingFriend = await User_1.default.findById(friendId);
            if (!existingFriend) {
                console.log("Friend not found!");
                socket.emit("request-payload-error", { message: "Friend not found!" });
                return;
            }
            const existingUser = await User_1.default.findById(userId);
            if (!existingUser) {
                console.log("User not found!");
                socket.emit("request-payload-error", { message: "User not found!" });
                return;
            }
            const existingRoom = await FriendRoom_1.default.findOne({
                _id: roomId,
                status: "pending",
            })
                .populate({ path: "subjectId" })
                .populate({ path: "yearId" })
                .populate({ path: "topicId" });
            if (!existingRoom) {
                console.log("Friend room is not found!");
                socket.emit("request-payload-error", { message: "Friend not found!" });
                return;
            }
            const friendData = {
                roomId,
                // @ts-ignore
                subject: existingRoom.subjectId.subject,
                // @ts-ignore
                type: existingRoom.quizType,
                topicOrYear: existingRoom.quizType === "Yearly"
                    ? // @ts-ignore
                        existingRoom.yearId.year
                    : // @ts-ignore
                        existingRoom.topicId.topic,
                friendSessionId: existingUser.sessionId,
                friendId: existingUser.id,
                name: existingUser.fullName,
                imageUrl: existingUser.imageUrl,
                length: existingRoom.quizes.length,
                seconds: existingRoom.seconds,
            };
            io.to(existingFriend.sessionId).emit("quiz-request-receive", friendData);
            const userData = {
                roomId,
                // @ts-ignore
                subject: existingRoom.subjectId.subject,
                // @ts-ignore
                type: existingRoom.quizType,
                topicOrYear: existingRoom.quizType === "Yearly"
                    ? // @ts-ignore
                        existingRoom.yearId.year
                    : // @ts-ignore
                        existingRoom.topicId.topic,
                friendSessionId: existingFriend.sessionId,
                friendId: existingFriend.id,
                name: existingFriend.fullName,
                imageUrl: existingFriend.imageUrl,
                length: existingRoom.quizes.length,
                seconds: existingRoom.seconds,
            };
            socket.emit("quiz-request-sended", userData);
        }
        catch (error) {
            console.log(error);
            socket.emit("request-server-error", { message: "Something went wrong" });
        }
    };
    const handleCancelQuizRequest = async (data) => {
        const { roomId, friendId } = data;
        if (!roomId || !friendId) {
            socket.emit("cancel-quiz-error", {
                message: "Payload data is not correct!",
            });
            return;
        }
        const room = await FriendRoom_1.default.findOne({
            _id: roomId,
            status: {
                $ne: "ended",
            },
        });
        if (!room) {
            socket.emit("cancel-quiz-error", {
                message: "Online room is not found or it's ended!",
            });
            return;
        }
        const friend = await User_1.default.findById(friendId);
        if (!friend) {
            socket.emit("cancel-quiz-error", {
                message: "Friend is not found!",
            });
            return;
        }
        const friendSessionId = friend.sessionId;
        socket.emit("cancel-quiz-completed");
        io.to(friendSessionId).emit("cancel-quiz-completed");
    };
    const handleAcceptRequest = async (data) => {
        const { roomId, friendId, userId } = data;
        if (!roomId || !friendId || !userId) {
            socket.emit("quiz-accepted-error", {
                message: "Payload is not correct!",
            });
            return;
        }
        const friend = await User_1.default.findById(friendId);
        if (!friend) {
            socket.emit("quiz-accepted-error", { message: "Friend is not found!" });
            return;
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            socket.emit("quiz-accepted-error", { message: "User is not found!" });
            return;
        }
        const room = await FriendRoom_1.default.findOne({
            _id: roomId,
            status: {
                $ne: "ended",
            },
        });
        if (!room) {
            socket.emit("quiz-accepted-error", { message: "Room is not found!" });
            return;
        }
        const updatedRoom = await FriendRoom_1.default.findByIdAndUpdate(roomId, {
            status: "playing",
            user2: user.id,
            isUser2Alive: true,
            user2SessionId: user.sessionId,
        });
        socket.emit("request-accept-room-redirect", { roomId: updatedRoom === null || updatedRoom === void 0 ? void 0 : updatedRoom.id });
        io.to(friend.sessionId).emit("request-accept-room-redirect", {
            roomId: updatedRoom === null || updatedRoom === void 0 ? void 0 : updatedRoom.id,
        });
    };
    const submitFriendRoom = async (data) => {
        const { roomId, userId, selectedStates, mcqs, completeTime } = data;
        if (roomId && userId && selectedStates && mcqs && completeTime) {
            const newFriendHistory = await FriendHistory_1.default.create({
                roomId,
                mcqs,
                user: userId,
                roomType: "friend-room",
                quizIdAndValue: selectedStates,
                time: completeTime,
            });
            const findFriendRoom = await FriendRoom_1.default.findById(roomId);
            if (findFriendRoom === null || findFriendRoom === void 0 ? void 0 : findFriendRoom.resignation) {
                if (findFriendRoom.user1 === userId) {
                    io.to(findFriendRoom.user2SessionId).emit("opponent-resign", {
                        isCompleted: true,
                        time: completeTime,
                    });
                }
                else if (findFriendRoom.user2 === userId) {
                    io.to(findFriendRoom.user1SessionId).emit("opponent-resign", {
                        isCompleted: true,
                        time: completeTime,
                    });
                }
                return;
            }
            else {
                if ((findFriendRoom === null || findFriendRoom === void 0 ? void 0 : findFriendRoom.user1) === userId) {
                    await FriendRoom_1.default.findOneAndUpdate({ _id: roomId }, { isUser1Alive: false });
                    io.to(findFriendRoom === null || findFriendRoom === void 0 ? void 0 : findFriendRoom.user2SessionId).emit("opponent-completed", {
                        isCompleted: true,
                        time: completeTime,
                    });
                    socket.emit("complete-response", { _id: newFriendHistory._id });
                }
                else if ((findFriendRoom === null || findFriendRoom === void 0 ? void 0 : findFriendRoom.user2) === userId) {
                    await FriendRoom_1.default.findOneAndUpdate({ _id: roomId }, { isUser2Alive: false });
                    io.to(findFriendRoom === null || findFriendRoom === void 0 ? void 0 : findFriendRoom.user1SessionId).emit("opponent-completed", {
                        isCompleted: true,
                        time: completeTime,
                    });
                    socket.emit("complete-response", { _id: newFriendHistory._id });
                }
            }
        }
        else {
            socket.emit("submit-error", { error: "payload-not-correct" });
        }
    };
    const leaveByFriendResign = async (data) => {
        const { completeTime, mcqs, roomId, selectedStates, userId } = data;
        if (completeTime || mcqs || roomId || selectedStates || userId) {
            // Finding and Validating and Updating Online Room Logic
            const getFriendRoom = await FriendRoom_1.default.findOne({
                _id: roomId,
                status: "playing",
            });
            if (!getFriendRoom) {
                // TODO:Handling Error
            }
            if ((getFriendRoom === null || getFriendRoom === void 0 ? void 0 : getFriendRoom.user1) === userId || (getFriendRoom === null || getFriendRoom === void 0 ? void 0 : getFriendRoom.user2) === userId) {
                await FriendRoom_1.default.findOneAndUpdate({
                    _id: roomId,
                    status: "playing",
                }, {
                    isUser1Alive: false,
                    isUser2Alive: false,
                    resignation: userId,
                    status: "ended",
                }, { new: true });
                // Creating online history object and checking resignation and sending opponent an socket event
                await FriendHistory_1.default.create({
                    roomId,
                    mcqs,
                    user: userId,
                    roomType: "friend-room",
                    quizIdAndValue: selectedStates,
                    time: completeTime,
                });
                const findOnlineRoom = await FriendRoom_1.default.findById(roomId);
                if (findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.resignation) {
                    if ((findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user1) === userId) {
                        console.log("Sending Resign Event");
                        io.to(findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user2SessionId).emit("opponent-resign", {
                            isCompleted: true,
                            time: completeTime,
                        });
                    }
                    else if ((findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user2) === userId) {
                        console.log("Sending Resign Event");
                        io.to(findOnlineRoom === null || findOnlineRoom === void 0 ? void 0 : findOnlineRoom.user1SessionId).emit("opponent-resign", {
                            isCompleted: true,
                            time: completeTime,
                        });
                    }
                }
            }
            else {
                // TODO:Handling Error
            }
        }
        else {
            console.log("Resign payload is not correct");
            // TODO:Handling Error
        }
    };
    const friendResignSubmit = async (data) => {
        const { roomId, userId, selectedStates, mcqs, completeTime } = data;
        if (roomId && userId && selectedStates && mcqs && completeTime) {
            const newFriendHistory = await FriendHistory_1.default.create({
                roomId,
                mcqs,
                user: userId,
                roomType: "friend-room",
                quizIdAndValue: selectedStates,
                time: completeTime,
            });
            socket.emit("complete-resign-response", { _id: newFriendHistory._id });
        }
        else {
            console.log("This payload is not correct");
        }
    };
    const getFriendHistory = async (data) => {
        let timeoutId;
        const { resultId, roomId } = data;
        if (resultId && roomId) {
            const getOpponentHistory = async () => {
                const findOpponentHistory = await FriendHistory_1.default.findOne({
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
                if (findOpponentHistory) {
                    return findOpponentHistory;
                }
                else {
                    return new Promise((resolve) => {
                        timeoutId = setTimeout(() => resolve(getOpponentHistory()), 1000);
                    });
                }
            };
            clearTimeout(timeoutId);
            const getOnlineHistoryRes = await getOpponentHistory();
            if (getOnlineHistoryRes) {
                socket.emit("get-friend-history-data", getOnlineHistoryRes);
            }
            else {
                socket.emit("get-friend-history-error", { error: "not-found" });
            }
        }
        else {
            socket.emit("get-friend-history-error", { error: "payload-error" });
        }
    };
    socket.on("create-online-room", createRoom);
    socket.on("online-submit", submitOnlineRoom);
    socket.on("online-resign-submit", onlineResignSubmit);
    socket.on("online-resign-by-leave", leaveByOnlineResign);
    socket.on("get-online-history", getOnlineHistory);
    socket.on("opponent-quiz-index", handleOpponentIndex);
    socket.on("add-friend", handleAddFriend);
    socket.on("add-friend", handleAddFriend);
    socket.on("send-quiz-request", handleSendQuizRequest);
    socket.on("cancel-quiz-request", handleCancelQuizRequest);
    socket.on("quiz-request-accepted", handleAcceptRequest);
    socket.on("friend-submit", submitFriendRoom);
    socket.on("friend-resign-by-leave", leaveByFriendResign);
    socket.on("friend-resign-submit", friendResignSubmit);
    socket.on("get-friend-history", getFriendHistory);
    socket.on("disconnect", async () => {
        socket.off("create-online-room", createRoom);
        socket.off("online-submit", submitOnlineRoom);
        socket.off("online-resign-submit", onlineResignSubmit);
        socket.off("online-resign-by-leave", leaveByOnlineResign);
        socket.off("get-online-history", getOnlineHistory);
        socket.off("opponent-quiz-index", handleOpponentIndex);
        socket.off("add-friend", handleAddFriend);
        socket.off("send-quiz-request", handleSendQuizRequest);
        socket.off("cancel-quiz-request", handleCancelQuizRequest);
        socket.off("quiz-request-accepted", handleAcceptRequest);
        socket.off("friend-submit", submitFriendRoom);
        socket.off("friend-resign-by-leave", leaveByFriendResign);
        socket.off("friend-resign-submit", friendResignSubmit);
        socket.off("get-friend-history", getFriendHistory);
    });
});
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "*",
}));
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
// Routes
app.use("/quiz", quizRoute_1.default);
app.use("/subject", subjectRoute_1.default);
app.use("/user", userRoute_1.default);
app.use("/history", historyRoute_1.default);
app.use("/guest", guestRoute_1.default);
app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello World" });
});
const PORT = process.env.PORT || 4001;
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    var _a;
    console.log(`Failed to connect database ${(_a = error.message) !== null && _a !== void 0 ? _a : error}`);
});
