import React, { useState } from "react";
import TeacherView from "./components/TeacherView";
import StudentView from "./components/StudentView";

export default function App() {
  const [role, setRole] = useState(null);
  const [selected, setSelected] = useState(null);

  if (!role) {
    return (
      <div className="landing-big-wrapper">

        {/* Top Badge */}
        <div className="badge">✨ Intervue Poll</div>

        {/* Title */}
        <h1 className="landing-main-title">
          Welcome to the <span>Live Polling System</span>
        </h1>

        {/* Subtitle */}
        <p className="landing-main-subtext">
          Please select the role that best describes you to begin using the live polling system
        </p>

        {/* Role Cards */}
        <div className="role-card-container">

          {/* STUDENT CARD */}
          <div
            className={`role-card ${selected === "student" ? "selected" : ""}`}
            onClick={() => setSelected("student")}
          >
            <h3>I’m a Student</h3>
            <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry</p>
          </div>

          {/* TEACHER CARD */}
          <div
            className={`role-card ${selected === "teacher" ? "selected" : ""}`}
            onClick={() => setSelected("teacher")}
          >
            <h3>I’m a Teacher</h3>
            <p>Submit answers and view live poll results in real-time.</p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          className={`continue-btn ${!selected ? "disabled" : ""}`}
          disabled={!selected}
          onClick={() => setRole(selected)}
        >
          Continue
        </button>
      </div>
    );
  }

  return role === "teacher" ? (
    <TeacherView onBack={() => setRole(null)} />
  ) : (
    <StudentView onBack={() => setRole(null)} />
  );
}
