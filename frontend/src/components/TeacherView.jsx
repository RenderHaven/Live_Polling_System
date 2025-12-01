import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import "./style.css"
import {
  ChatView,
  PollHistory,
  QuestionView,
} from "./Helper";

export default function TeacherView({ onBack }) {
  const [students, setStudents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [history, setHistory] = useState([]);

  const [screen, setScreen] = useState("main"); // main | history

  const [error, setError] = useState("");

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  /* ============================================================
      SOCKET LISTENERS
  ============================================================ */
  useEffect(() => {
    socket.on("state:init", (state) => {
      setStudents(state.students || []);
      setCurrentQuestion(state.currentQuestion || null);
      setHistory(state.history || []);
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
      setCurrentQuestion(state.currentQuestion || null);
      setHistory(state.history || []);
      setChatMessages(state.chatMessages || []);
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
      setScreen("main");
    });

    socket.on("results:update", (q) => setCurrentQuestion(q));

    socket.on("question:ended", (q) => {
      setCurrentQuestion(q);
      setRemainingSeconds(0);
    });

    socket.on("error:message", (msg) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    });

    socket.emit("state:request");

    return () => socket.off();
  }, []);

  /* ============================================================
      TIMER EFFECT
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
  const removeStudent = (id) => {
    socket.emit("teacher:removeStudent", id);
  };

  const sendChat = (text) => {
    socket.emit("chat:send", { text, senderName: "Teacher" });
  };

  const endQuestion = () => socket.emit("teacher:endQuestion");

  return (
    <div className="teacher-container">
      {/* HEADER */}
      <div className="header">
        <button className="back-btn" onClick={onBack}>← Back</button>


        <div style={{ flex: 1 }} />

        <button
          className="view-history-btn"
          onClick={() => setScreen("history")}
        >
          📜 Poll History
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* ==========================
           POLL HISTORY
      ========================== */}
      {screen === "history" ? (
        <PollHistory history={history} onClose={() => setScreen("main")} />
      ) : (
        <>
          {/* ==========================
               LIVE QUESTION (QuestionView)
          ========================== */}
          {currentQuestion && currentQuestion.isActive ? (
            <>
              <QuestionView
                currentQuestion={currentQuestion}
                remainingSeconds={remainingSeconds}
              />

              {/* Teacher Only Button */}
              <button className="ask-btn" onClick={endQuestion}>
                + Ask a new question
              </button>
            </>
          ) : (
            <>
              {/* ============================================================
                  NEW QUESTION FORM
              ============================================================ */}
              <NewQuestionForm />
            </>
          )}
        </>
      )}

      {/* CHAT */}
      <ChatView
        chatMessages={chatMessages}
        students={students}
        onSend={sendChat}
        onKick={removeStudent}
        canKick={true}
        selfName="Teacher"
      />
    </div>
  );
}

/* ============================================================
   NEW QUESTION FORM
============================================================ */
function NewQuestionForm() {
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState(60);

  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const startQuestion = () => {
    socket.emit("teacher:startQuestion", {
      question,
      options,
      durationSeconds: Number(duration),
    });
  };

  return (
    <div className="create-card">
      <div className="badge">✨ Intervue Poll</div>
      <h2>Let’s <strong>Get Started</strong></h2>
      <p className="light-subtitle">
        you’ll have the ability to create and manage polls, ask questions, and monitor
your students' responses in real-time.
      </p>

      {/* Question Input */}
      <div className="label-box" >
        <label className="label">Enter your question</label><div className="q-row">
          <select
            className="dropdown"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="30">30 seconds</option>
            <option value="60">60 seconds</option>
            <option value="90">90 seconds</option>
          </select>
        </div>
      </div>

      <textarea
        className="question-input"
        value={question}
        maxLength={100}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="char-count">{question.length}/100</div>

      <h3>Edit Options</h3>

      {/* Options */}
      {options.map((opt, idx) => (
        <div className="option-row" key={idx}>
          <div className="num">{idx + 1}</div>

          <input
            className="opt-input"
            placeholder={`Option ${idx + 1}`}
            value={opt.text}
            onChange={(e) => {
              const next = [...options];
              next[idx].text = e.target.value;
              setOptions(next);
            }}
          />

          {/* Correct / Incorrect */}
          <div className="radio-box">
            <label>
              <input
                type="radio"
                checked={opt.isCorrect}
                onChange={() => {
                  const next = options.map((o, i) => ({
                    ...o,
                    isCorrect: i === idx,
                  }));
                  setOptions(next);
                }}
              /> Yes
            </label>

            <label>
              <input
                type="radio"
                checked={!opt.isCorrect}
                onChange={() => {
                  const next = [...options];
                  next[idx].isCorrect = false;
                  setOptions(next);
                }}
              /> No
            </label>
          </div>
        </div>
      ))}

      <button
        className="add-option-btn"
        onClick={() => setOptions([...options, { text: "", isCorrect: false }])}
      >
        + Add More option
      </button>

      <button className="ask-btn" onClick={startQuestion}>Ask Question</button>
    </div>
  );
}
