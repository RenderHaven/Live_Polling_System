import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import "./style.css"
import { ChatView, QuestionActive, QuestionView } from "./Helper";

export default function StudentView({ onBack }) {
  const [name, setName] = useState(sessionStorage.getItem("studentName") || "");
  const [isRegistered, setIsRegistered] = useState(
    !!sessionStorage.getItem("studentName")
  );

  const [students, setStudents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState(null);

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [kickedOut, setKickedOut] = useState(false);

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  /* ============================================================
      REGISTER & INITIAL LOAD
  ============================================================ */
  useEffect(() => {
    if (isRegistered) {
      socket.emit("student:join", name);
      socket.emit("state:request");
    }
  }, [isRegistered, name]);

  /* ============================================================
      SOCKET LISTENERS
  ============================================================ */
  useEffect(() => {
    socket.on("state:init", (state) => {
      setCurrentQuestion(state.currentQuestion || null);
      setStudents(state.students || []);
      setChatMessages(state.chatMessages || []);

      if (state.currentQuestion?.isActive) {
        const diff = Math.max(
          0,
          Math.round((state.currentQuestion.expiresAt - Date.now()) / 1000)
        );
        setRemainingSeconds(diff);
      }
    });

    socket.on("state:update", (state) => {
      setStudents(state.students || []);
      setChatMessages(state.chatMessages || []);
      setCurrentQuestion(state.currentQuestion || null);
    });

    socket.on("chat:newMessage", (msg) =>
      setChatMessages((prev) => [...prev, msg])
    );

    socket.on("question:started", (q) => {
      setCurrentQuestion(q);

      const diff = Math.max(
        0,
        Math.round((q.expiresAt - Date.now()) / 1000)
      );
      setRemainingSeconds(diff);

      setSelectedOptionId(null);
      setHasAnswered(false);
    });

    socket.on("results:update", (q) => setCurrentQuestion(q));

    socket.on("question:ended", (q) => {
      setCurrentQuestion(q);
      setRemainingSeconds(0);
      setHasAnswered(true);
    });

    socket.on("force:disconnect", () => {
      sessionStorage.removeItem("studentName");
      setKickedOut(true);
    });

    return () => socket.off();
  }, [hasAnswered]);

  /* ============================================================
      TIMER
  ============================================================ */
  useEffect(() => {
    if (!currentQuestion?.isActive) return;

    const timer = setInterval(() => {
      const diff = Math.max(
        0,
        Math.round((currentQuestion.expiresAt - Date.now()) / 1000)
      );
      setRemainingSeconds(diff);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion]);

  /* ============================================================
      ACTIONS
  ============================================================ */
  const register = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    sessionStorage.setItem("studentName", trimmed);
    setIsRegistered(true);

    socket.emit("student:join", trimmed);
  };

  const submitAnswer = () => {
    socket.emit("student:answer", selectedOptionId);
    setHasAnswered(true);
  };

  const sendChat = (text) => {
    socket.emit("chat:send", { text, senderName: name });
  };

  /* ============================================================
      UI SUBCOMPONENTS
  ============================================================ */

  const KickedOutScreen = () => (
    <div className="student-screen">
      <h2>You’ve been Kicked Out!</h2>
      <p>The teacher removed you from the poll.</p>
    </div>
  );

  /* ---------- UPDATED NAME INPUT SCREEN (MATCHES UI) ---------- */
  const NameInputScreen = () => (
    <div className="student-name-screen">
      <div className="badge">⭐ Intervue Poll</div>

      <h1 className="page-title">
        Let’s <strong>Get Started</strong>
      </h1>

      <p className="page-subtext">
        If you’re a student, you’ll be able to <strong>submit your answers</strong>, 
        participate in live polls, and see how your responses compare with classmates.
      </p>

      <label className="label">Enter your Name</label>
      <input
        className="question-input"
        value={name}
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && register()}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name..."
      />

      <button className="ask-btn" onClick={register}>
        Continue
      </button>
    </div>
  );

  /* ---------- UPDATED WAITING SCREEN (MATCHES UI) ---------- */
  const WaitingScreen = () => (
    <div className="waiting-screen">
      <div className="badge">⭐ Intervue Poll</div>

      <div className="loader-circle"></div>

      <p className="waiting-text">
        Wait for the teacher to ask questions..
      </p>
    </div>
  );

  /* ============================================================
      MAIN RENDER
  ============================================================ */

  if (kickedOut) return <KickedOutScreen />;

  return (
  <div className="student-container">
    <button className="back-btn" onClick={onBack}>← Back</button>

    {!isRegistered ? (
      <NameInputScreen />

    ) : kickedOut ? (
      <KickedOutScreen />

    ) : !currentQuestion ? (
      <WaitingScreen />

    ) : currentQuestion.isActive && !hasAnswered ? (
      <QuestionActive
        currentQuestion={currentQuestion}
        selectedOptionId={selectedOptionId}
        setSelectedOptionId={setSelectedOptionId}
        onSubmit={submitAnswer}
        remainingSeconds={remainingSeconds}
      />

    ) : hasAnswered ? (
      <div className="waiting-screen">
        <QuestionView
          currentQuestion={currentQuestion}
          remainingSeconds={remainingSeconds}
        />
        <p className="waiting-text">
          Wait for the teacher to ask questions..
        </p>
      </div>

    ) : (
      <WaitingScreen />
    )}

    {/* Floating Chat */}
    <ChatView
      chatMessages={chatMessages}
      students={students}
      onSend={sendChat}
      canKick={false}
      selfName={name}
    />
  </div>
);
}
