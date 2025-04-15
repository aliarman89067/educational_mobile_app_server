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
    console.log(socket.id);
    const createRoom = async (data) => {
        const { subjectId, yearIdOrTopicId, quizLimit, quizType, userId, sessionId, name, imageUrl, seconds, } = data;
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
                console.log(uniqueKey);
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
                };
            };
            // Execute search and handle results
            const result = await searchStudent();
            clearTimeout(timeoutId);
            if (result) {
                const { newOnlineRoomId, user1Id, user2Id } = result;
                const isUser1 = user1Id === userId;
                const opponentId = isUser1 ? user2Id : user1Id;
                const opponentUser = await User_1.default.findOne({ clerkId: opponentId }, "fullName imageUrl");
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
    const leaveByResign = async (data) => {
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
        if (!findOnlineRoom) {
            throw new Error("Online room not found!");
        }
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
    };
    socket.on("create-online-room", createRoom);
    socket.on("online-submit", submitOnlineRoom);
    socket.on("online-resign-submit", onlineResignSubmit);
    socket.on("online-resign-by-leave", leaveByResign);
    socket.on("get-online-history", getOnlineHistory);
    socket.on("opponent-quiz-index", handleOpponentIndex);
    socket.on("disconnect", async () => {
        socket.off("create-online-room", createRoom);
        socket.off("online-submit", submitOnlineRoom);
        socket.off("online-resign-submit", onlineResignSubmit);
        socket.off("online-resign-by-leave", leaveByResign);
        socket.off("get-online-history", getOnlineHistory);
        socket.off("opponent-quiz-index", handleOpponentIndex);
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
