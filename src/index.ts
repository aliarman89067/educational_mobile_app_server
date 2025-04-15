// Lib Imports
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import mongoose from "mongoose";
import dotEnv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
// Route Imports
import quizRoutes from "./routes/quizRoute";
import subjectRoute from "./routes/subjectRoute";
import userRoute from "./routes/userRoute";
import historyRoute from "./routes/historyRoute";

import "./models/Topic";
import "./models/Year";
import "./models/SoloRoom";
import "./models/Subject";
import "./models/Mcq";
import "./models/History";
import "./models/User";

import OnlineHandShakeRoomModel from "./models/OnlineHandShakeRoom";
import yearModel from "./models/Year";
import topicModel from "./models/Topic";
import OnlineRoomModel from "./models/OnlineRoom";
import UserModel from "./models/User";
import OnlineHistoryModel from "./models/OnlineHistory";

dotEnv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(socket.id);
  const createRoom = async (data: any) => {
    const {
      subjectId,
      yearIdOrTopicId,
      quizLimit,
      quizType,
      userId,
      sessionId,
      name,
      imageUrl,
      seconds,
    } = data;

    if (
      !subjectId ||
      !yearIdOrTopicId ||
      !quizLimit ||
      !quizType ||
      !sessionId ||
      !userId ||
      !name ||
      !imageUrl ||
      !seconds
    ) {
      socket.emit("payload-error", { error: "Payload is incorrect" });
      return;
    }
    try {
      // Create handshake room
      const newHandShakeRoom = new OnlineHandShakeRoomModel({
        subjectId,
        sessionId,
        quizLimit,
        quizType,
        isAlive: true,
        user: userId,
        [quizType === "Yearly" ? "yearId" : "topicId"]: yearIdOrTopicId,
      });
      await newHandShakeRoom.save();

      let findSameStudent: any;
      let retryCount = 0;
      const maxRetries = 20;
      let timeoutId;

      const searchStudent = async () => {
        if (retryCount >= maxRetries) return null;
        // Find matching handshake room
        const query = {
          subjectId,
          [quizType === "Yearly" ? "yearId" : "topicId"]: yearIdOrTopicId,
          sessionId: { $ne: sessionId },
          isAlive: true,
        };
        console.log("Find matching student query");
        findSameStudent = await OnlineHandShakeRoomModel.findOne(query);
        if (findSameStudent) {
          console.log("Finded same student");
          return await handleOnlineRoom();
        } else {
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
        // Fetch quiz data
        type ModelWithFindById = {
          findById: (id: any) => {
            select: (projection: string) => Promise<any>;
          };
        };
        const model: ModelWithFindById =
          quizType === "Yearly" ? yearModel : topicModel;
        const { mcqs } = await model.findById(yearIdOrTopicId).select("mcqs");

        // Generate random quiz IDs
        const targetQuiz: any = [];
        while (targetQuiz.length < quizLimit) {
          const randomIndex = Math.floor(Math.random() * mcqs.length);
          const quizId = mcqs[randomIndex];
          if (!targetQuiz.includes(quizId)) targetQuiz.push(quizId);
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

        const onlineRoom = await OnlineRoomModel.findOneAndUpdate(
          filter,
          update,
          options
        );
        // Update session ID if needed
        if (onlineRoom) {
          if (onlineRoom?.user1 === userId) {
            onlineRoom.user1SessionId = sessionId;
          } else if (onlineRoom?.user2 === userId) {
            onlineRoom.user2SessionId = sessionId;
          }
        }
        await onlineRoom?.save();

        return {
          newOnlineRoomId: onlineRoom?._id,
          user1Id: onlineRoom?.user1,
          user2Id: onlineRoom?.user2,
        };
      };

      // Execute search and handle results
      const result: any = await searchStudent();
      clearTimeout(timeoutId);

      if (result) {
        const { newOnlineRoomId, user1Id, user2Id } = result;
        const isUser1 = user1Id === userId;
        const opponentId = isUser1 ? user2Id : user1Id;

        const opponentUser = await UserModel.findOne(
          { clerkId: opponentId },
          "fullName imageUrl"
        );

        // Verify room readiness
        let roomValid = false;
        for (let i = 0; i < 10; i++) {
          const room = await OnlineRoomModel.findById(newOnlineRoomId);
          if (room?.user1 && room?.user2) {
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
        } else {
          socket.emit("no-student-found", { error: "Failed to find student" });
        }

        // // Cleanup handshake rooms
        await OnlineHandShakeRoomModel.findOneAndUpdate(
          { _id: findSameStudent._id },
          { isAlive: false }
        );
      } else {
        await OnlineHandShakeRoomModel.findByIdAndUpdate(newHandShakeRoom._id, {
          isAlive: false,
        });
        socket.emit("no-student-found", { error: "Failed to find student" });
      }
    } catch (error) {
      console.error("Room creation error:", error);
      socket.emit("error", { error: "Internal server error" });
    }
  };
  const submitOnlineRoom = async (data: any) => {
    const { roomId, userId, selectedStates, mcqs, completeTime } = data;
    console.log("Online Submit Payload");
    console.log(roomId, userId, selectedStates, mcqs, completeTime);
    if (roomId && userId && selectedStates && mcqs && completeTime) {
      const newOnlineHistory = await OnlineHistoryModel.create({
        roomId,
        mcqs,
        user: userId,
        roomType: "online-room",
        quizIdAndValue: selectedStates,
        time: completeTime,
      });
      const findOnlineRoom = await OnlineRoomModel.findById(roomId);
      console.log("Target Online Room");
      if (findOnlineRoom?.resignation) {
        if (findOnlineRoom.user1 === userId) {
          io.to(findOnlineRoom.user2SessionId!!).emit("opponent-resign", {
            isCompleted: true,
            time: completeTime,
          });
        } else if (findOnlineRoom.user2 === userId) {
          io.to(findOnlineRoom.user1SessionId!!).emit("opponent-resign", {
            isCompleted: true,
            time: completeTime,
          });
        }
        return;
      } else {
        if (findOnlineRoom?.user1 === userId) {
          await OnlineRoomModel.findOneAndUpdate(
            { _id: roomId },
            { isUser1Alive: false }
          );
          io.to(findOnlineRoom?.user2SessionId!!).emit("opponent-completed", {
            isCompleted: true,
            time: completeTime,
          });
          socket.emit("complete-response", { _id: newOnlineHistory._id });
        } else if (findOnlineRoom?.user2 === userId) {
          await OnlineRoomModel.findOneAndUpdate(
            { _id: roomId },
            { isUser2Alive: false }
          );
          io.to(findOnlineRoom?.user1SessionId!!).emit("opponent-completed", {
            isCompleted: true,
            time: completeTime,
          });
          socket.emit("complete-response", { _id: newOnlineHistory._id });
        }
      }
    } else {
      socket.emit("submit-error", { error: "payload-not-correct" });
    }
  };
  const onlineResignSubmit = async (data: any) => {
    const { roomId, userId, selectedStates, mcqs, completeTime } = data;
    if (roomId && userId && selectedStates && mcqs && completeTime) {
      const newOnlineHistory = await OnlineHistoryModel.create({
        roomId,
        mcqs,
        user: userId,
        roomType: "online-room",
        quizIdAndValue: selectedStates,
        time: completeTime,
      });
      socket.emit("complete-resign-response", { _id: newOnlineHistory._id });
    } else {
      console.log("This payload is not correct");
    }
  };
  const getOnlineHistory = async (data: any) => {
    let timeoutId;
    const { resultId, roomId } = data;
    if (resultId && roomId) {
      const getOpponentHistory = async () => {
        const findOpponentHistory = await OnlineHistoryModel.findOne({
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
        } else {
          return new Promise((resolve) => {
            timeoutId = setTimeout(() => resolve(getOpponentHistory()), 1000);
          });
        }
      };
      clearTimeout(timeoutId);
      const getOnlineHistoryRes = await getOpponentHistory();

      if (getOnlineHistoryRes) {
        socket.emit("get-online-history-data", getOnlineHistoryRes);
      } else {
        socket.emit("get-online-history-error", { error: "not-found" });
      }
    } else {
      socket.emit("get-online-history-error", { error: "payload-error" });
    }
  };

  const leaveByResign = async (data: any) => {
    const { completeTime, mcqs, roomId, selectedStates, userId } = data;
    if (completeTime || mcqs || roomId || selectedStates || userId) {
      // Finding and Validating and Updating Online Room Logic
      const getOnlineRoom = await OnlineRoomModel.findOne({
        _id: roomId,
        isEnded: false,
      });
      if (!getOnlineRoom) {
        // TODO:Handling Error
      }
      if (getOnlineRoom?.user1 === userId || getOnlineRoom?.user2 === userId) {
        await OnlineRoomModel.findOneAndUpdate(
          {
            _id: roomId,
            isEnded: false,
          },
          {
            isUser1Alive: false,
            isUser2Alive: false,
            resignation: userId,
            isEnded: true,
          },
          { new: true }
        );
        // Creating online history object and checking resignation and sending opponent an socket event
        await OnlineHistoryModel.create({
          roomId,
          mcqs,
          user: userId,
          roomType: "online-room",
          quizIdAndValue: selectedStates,
          time: completeTime,
        });
        const findOnlineRoom = await OnlineRoomModel.findById(roomId);
        if (findOnlineRoom?.resignation) {
          if (findOnlineRoom?.user1 === userId) {
            console.log("Sending Resign Event");
            io.to(findOnlineRoom?.user2SessionId!!).emit("opponent-resign", {
              isCompleted: true,
              time: completeTime,
            });
          } else if (findOnlineRoom?.user2 === userId) {
            console.log("Sending Resign Event");
            io.to(findOnlineRoom?.user1SessionId!!).emit("opponent-resign", {
              isCompleted: true,
              time: completeTime,
            });
          }
        }
      } else {
        // TODO:Handling Error
      }
    } else {
      // TODO:Handling Error
    }
  };
  const handleOpponentIndex = async (data: any) => {
    const { index, roomId, userId } = data;
    if (!index || !roomId || !userId) {
      throw new Error("Payload is not correct");
      return;
    }
    const findOnlineRoom = await OnlineRoomModel.findById(roomId);
    if (!findOnlineRoom) {
      throw new Error("Online room not found!");
    }
    if (findOnlineRoom.user1 === userId) {
      io.to(findOnlineRoom.user2SessionId!!).emit("opponent-send-index", {
        index,
      });
    } else if (findOnlineRoom.user2 === userId) {
      io.to(findOnlineRoom.user1SessionId!!).emit("opponent-send-index", {
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
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
app.use(cookieParser());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
// Routes
app.use("/quiz", quizRoutes);
app.use("/subject", subjectRoute);
app.use("/user", userRoute);
app.use("/history", historyRoute);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World" });
});

const PORT = process.env.PORT || 4001;

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error: any) => {
    console.log(`Failed to connect database ${error.message ?? error}`);
  });
