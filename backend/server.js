const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();

app.use(
  cors({
    origin: "*", // Render rewrite handles same-domain calls
    methods: ["GET", "POST"]
  })
);

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Intervue Live Polling System API running");
});

/* -------------------------------------------------------
                    IN-MEMORY STATE
------------------------------------------------------- */
let students = {}; 
let currentQuestion = null;
let nextQuestionId = 1;
let questionTimer = null;
let history = [];
let chatMessages = []; // last 100 only

/* -------------------------------------------------------
                        HELPERS
------------------------------------------------------- */
function broadcastState(io) {
  io.emit("state:update", {
    students: Object.values(students),
    currentQuestion,
    history,
    chatMessages
  });
}

function endQuestion(io, reason = "completed") {
  if (!currentQuestion || !currentQuestion.isActive) return;

  if (questionTimer) {
    clearTimeout(questionTimer);
    questionTimer = null;
  }

  currentQuestion.isActive = false;
  currentQuestion.endedAt = Date.now();
  currentQuestion.endedReason = reason;

  history.push(currentQuestion);
  if (history.length > 15) history = history.slice(-15);

  io.emit("question:ended", currentQuestion);
  broadcastState(io);
}

/* -------------------------------------------------------
                    SOCKET SERVER
------------------------------------------------------- */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 30000,
  pingInterval: 20000,
  transports: ["websocket", "polling"], 
  allowEIO3: true,
  path: "/socket.io" // Important for Render rewrite setup
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.emit("state:init", {
    students: Object.values(students),
    currentQuestion,
    history,
    chatMessages
  });

  socket.on("state:request", () => {
    socket.emit("state:init", {
      students: Object.values(students),
      currentQuestion,
      history,
      chatMessages
    });
  });

  /* -------------------------------------------------------
                        CHAT SYSTEM
  ------------------------------------------------------- */
  socket.on("chat:send", (payload) => {
    if (!payload || !payload.text) return;

    const msg = {
      id: Date.now().toString(),
      sender: socket.id,
      senderName: payload.senderName || "User",
      text: payload.text.trim(),
      timestamp: Date.now(),
    };

    if (!msg.text.length) return;

    chatMessages.push(msg);
    if (chatMessages.length > 100) {
      chatMessages = chatMessages.slice(-100);
    }

    io.emit("chat:newMessage", msg);
    broadcastState(io);
  });

  /* -------------------------------------------------------
                    TEACHER ACTIONS
  ------------------------------------------------------- */
  socket.on("teacher:startQuestion", (payload) => {
    const { question, options, durationSeconds } = payload || {};

    const trimmedQ = (question || "").trim();
    if (!trimmedQ) {
      socket.emit("error:message", "Question cannot be empty.");
      return;
    }

    const validOptions = (options || [])
      .filter(o => (o.text || "").trim().length > 0)
      .map((o, i) => ({
        id: i.toString(),
        text: o.text.trim(),
        isCorrect: !!o.isCorrect,
        votes: 0
      }));

    if (validOptions.length < 2) {
      socket.emit("error:message", "At least 2 options are required.");
      return;
    }

    if (currentQuestion && currentQuestion.isActive) {
      socket.emit("error:message", "Finish the current question first.");
      return;
    }

    Object.keys(students).forEach((id) => {
      students[id].hasAnsweredCurrent = false;
      students[id].isCorrectAnswer = undefined;
    });

    const duration = Number(durationSeconds) || 60;

    currentQuestion = {
      id: nextQuestionId++,
      text: trimmedQ,
      options: validOptions,
      createdAt: Date.now(),
      expiresAt: Date.now() + duration * 1000,
      isActive: true
    };

    io.emit("question:started", currentQuestion);
    broadcastState(io);

    if (questionTimer) clearTimeout(questionTimer);

    questionTimer = setTimeout(() => {
      console.log("Timer ended - auto-ending question");
      endQuestion(io, "timeout");
    }, duration * 1000);
  });

  socket.on("teacher:endQuestion", () => {
    endQuestion(io, "manual");
  });

  socket.on("teacher:removeStudent", (studentId) => {
    const target = io.sockets.sockets.get(studentId);

    if (target) {
      target.emit("force:disconnect", "Removed by teacher");
      target.disconnect(true);
    }

    delete students[studentId];
    broadcastState(io);
  });

  /* -------------------------------------------------------
                    STUDENT ACTIONS
  ------------------------------------------------------- */
  socket.on("student:join", (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      socket.emit("error:message", "Name is required.");
      return;
    }

    students[socket.id] = {
      id: socket.id,
      name: trimmed,
      hasAnsweredCurrent: false,
      isCorrectAnswer: undefined
    };

    broadcastState(io);
  });

  socket.on("student:answer", (optionId) => {
    const student = students[socket.id];
    if (!student) {
      socket.emit("error:message", "You must enter your name first.");
      return;
    }

    if (!currentQuestion || !currentQuestion.isActive) {
      socket.emit("error:message", "No active question.");
      return;
    }

    if (student.hasAnsweredCurrent) {
      socket.emit("error:message", "You already answered this question.");
      return;
    }

    const option = currentQuestion.options.find(o => o.id === optionId);
    if (!option) {
      socket.emit("error:message", "Invalid option.");
      return;
    }

    option.votes += 1;
    student.hasAnsweredCurrent = true;
    student.isCorrectAnswer = option.isCorrect;

    io.emit("results:update", currentQuestion);
    broadcastState(io);

    const allAnswered =
      Object.values(students).length > 0 &&
      Object.values(students).every(s => s.hasAnsweredCurrent);

    if (allAnswered) {
      console.log("All students answered - auto-ending question");
      endQuestion(io, "allAnswered");
    }
  });

  /* -------------------------------------------------------
                    DISCONNECT
  ------------------------------------------------------- */
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    delete students[socket.id];
    broadcastState(io);
  });
});

/* -------------------------------------------------------
                    START SERVER
------------------------------------------------------- */
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Intervue Poll server running on port ${PORT}`);
});
