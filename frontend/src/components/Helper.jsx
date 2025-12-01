// Helper.jsx
import React, { useState,useRef,useEffect } from "react";
import "./style.css"
/* ============================================================
   CHAT VIEW (Floating Popup)
============================================================ */
export function ChatView({
  chatMessages = [],
  students = [],
  onSend,
  onKick,
  canKick,
  selfName
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "participants"
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);
  const send = () => {
    const msg = input.trim();
    if (!msg) return;
    onSend(msg);
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <button className="chat-float-btn" onClick={() => setOpen(!open)}>
        💬
      </button>

      {open && (
        <div className="chat-popup">

          {/* Tabs */}
          <div className="cp-tabs">
            <button
              className={activeTab === "chat" ? "active" : ""}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>

            {canKick && (
              <button
                className={activeTab === "participants" ? "active" : ""}
                onClick={() => setActiveTab("participants")}
              >
                Participants
              </button>
            )}

            <button className="close-btn" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          {/* ---------------- CHAT TAB ---------------- */}
          {activeTab === "chat" && (
            <div className="cp-chat-container">

              {/* Messages */}
              <div className="cp-messages">
                {chatMessages.map((msg) => {
                  const isSelf = msg.senderName === selfName;
                  return (
                    <div
                      key={msg.id}
                      className={`cp-msg-row ${isSelf ? "right" : "left"}`}
                    >
                      <div className="cp-name">
                        {!isSelf ? `${msg.senderName}` : `You`}
                      </div>

                      <div className={`cp-msg ${isSelf ? "self" : "other"}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div/>

              {/* Input Row */}
              <div className="cp-input-row">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type message..."
                />
                <button onClick={send}>Send</button>
              </div>
            </div>
          )}

          {/* ---------------- PARTICIPANTS TAB ---------------- */}
          {activeTab === "participants" && canKick && (
            <div className="cp-participants">
              <div className="cp-p-header">
                <span>Name</span>
                <span>Action</span>
              </div>

              {students.map((s) => (
                <div className="cp-p-row" key={s.id}>
                  <span>{s.name}</span>
                  <button className="kick-btn" onClick={() => onKick(s.id)}>
                    Kick out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ============================================================
   OPTION NUMBER CIRCLE (used everywhere)
============================================================ */
function NumberIcon({ num }) {
  return <div className="num-icon">{num}</div>;
}

/* ============================================================
   QUESTION ACTIVE (Student Answer Screen)
============================================================ */
export function QuestionActive({ currentQuestion, selectedOptionId, setSelectedOptionId, onSubmit, remainingSeconds }) {
  return (
    <div className="qv-container">
      {/* Top Row: Question # + Timer */}
      <div className="qa-top-row">
        <h2 className="qa-title">Question {currentQuestion.id}</h2>

        <div className="qa-timer">
          ⏱ <span className="time-red">{remainingSeconds}s</span>
        </div>
      </div>

      <div className="qa-box">
        {/* Gradient Question Header */}
      <div className="qa-question-box">{currentQuestion.text}</div>

      {/* Options */}
      <div className="qa-options">
        {currentQuestion.options.map((o, idx) => {
          const selected = selectedOptionId === o.id;

          return (
            <label
              key={o.id}
              className={`qa-option ${selected ? "selected" : ""}`}
              onClick={() => setSelectedOptionId(o.id)}
            >
              <NumberIcon num={idx + 1} />
              <span>{o.text}</span>
            </label>
          );
        })}
      </div>
      </div>

      {/* Submit Button */}
      <button className="qa-submit-btn" onClick={onSubmit} disabled={!selectedOptionId}>
        Submit
      </button>
    </div>
  );
}

/* ============================================================
   QUESTION VIEW (Live Results)
============================================================ */
export function QuestionView({ currentQuestion, remainingSeconds }) {
  const totalVotes = currentQuestion.options.reduce((sum, o) => sum + o.votes, 0) || 0;

  return (
    <div className="qv-container">
      <div className="qa-top-row">
        <h2 className="qa-title">Question {currentQuestion.id}</h2>
        {remainingSeconds>0 && <div className="qa-timer">
          ⏱ <span className="time-red">{remainingSeconds}s</span>
        </div>}
      </div>
    <div className="qv-box">
      {/* Top Row */}

      {/* Gradient Question Box */}
      <div className="qa-question-box">{currentQuestion.text}</div>

      {/* Result Bars */}
      <div className="qv-results">
        {currentQuestion.options.map((o, idx) => {
          const pct = totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0;

          return (
            <div key={o.id} className="qv-item">
              <NumberIcon num={idx + 1} />
              <div className="qv-text">{o.text}</div>

              <div className="qv-bar">
                <div className="qv-fill" style={{ width: `${pct}%` }} />
              </div>

              <div className="qv-pct">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

/* ============================================================
   POLL HISTORY (Reuses Result UI)
============================================================ */
export function PollHistory({ history, onClose }) {
  return (
    <div className="ph-container">
      <div className="ph-header">
        <h1>
          View <strong>Poll History</strong>
        </h1>

        <button className="ph-back-btn" onClick={onClose}>
          ← Back
        </button>
      </div>

      {history.map((q, i) => {
        const totalVotes = q.options.reduce((a, b) => a + b.votes, 0);

        return (
          <QuestionView
            currentQuestion={q}
            remainingSeconds={0}
          />
        );
      })}
    </div>
  );
}
