# Live Polling System 🎯

A real-time polling and chat system where a teacher can create questions, students answer instantly, and everyone sees live results. Built using **React**, **Node.js**, **Express**, and **Socket.io**, and deployed using **Render**.

---

## 📌 Features

### 👨‍🏫 Teacher

- Create live questions with multiple options
- Set timer (auto-end) or end manually
- See live student responses in real-time
- Kick/remove participants from the session
- View results instantly as students vote
- Poll history (last 15 questions)

### 👨‍🎓 Students

- Join with a name
- Answer polls instantly
- View results live as they update
- Chat in real-time with other participants
- Clean and responsive UI

### 💬 Chat System

- Real-time messaging between all participants
- Sender name indicators for clarity
- Auto-scroll to new messages
- Runs alongside polling without interference

---

## 🧰 Tech Stack

**Frontend:**

- React (Create React App)
- Socket.io-client for real-time communication

**Backend:**

- Node.js
- Express
- Socket.io for WebSocket connections

**Hosting:**

- Render (Frontend + Backend deployment)
- Rewrite rules for API & Socket.io routing

**Other:**

- CORS enabled for cross-origin requests
- In-memory state (no database; data resets on server restart)

---

## 📁 Project Structure

```
/ (project root)
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── render.yaml
└── README.md
```

---

## 🛠️ Local Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/RenderHaven/Live_Polling_System.git
cd Live_Polling_System
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
node server.js
```

The backend runs on `http://localhost:4000`

### 3️⃣ Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000`

Open `http://localhost:3000` in your browser. The frontend will automatically connect to the backend.

---

## 🔧 Environment Variables

### Frontend (.env)

Create a `.env` file in the `frontend/` directory:

```ini
REACT_APP_SOCKET_URL=https://your-backend-url.onrender.com
```

If not set, the frontend will fallback to `window.location.origin`, which works for local development and same-origin deployments.

### Backend

The backend (in-memory version) does not require environment variables. For production, you may want to add database connection strings or API keys.

---

## 🚀 Deployment on Render

This project is configured for deployment on Render using a Blueprint deployment via `render.yaml`.

### Deploy Steps

1. **Push your code to GitHub** (ensure `render.yaml` is in the root directory)
2. **Go to Render Dashboard** → New → Blueprint Deploy
3. **Select your repository** from GitHub
4. **Render automatically detects and deploys:**
   - Backend: Node.js web service
   - Frontend: Static React build
5. **Add environment variable** in Render dashboard:
   ```
   REACT_APP_SOCKET_URL=https://<your-backend-render-domain>
   ```
6. **Done!** Both frontend and backend will build and deploy automatically

### render.yaml Configuration

The `render.yaml` file sets up:

- Backend web service (Node.js on port 4000)
- Frontend static site (React build)
- Rewrite rules to route `/socket.io/*` and `/api/*` to the backend

---

## 🎮 Usage

1. **Open the app** from the Render URL or `http://localhost:3000`
2. **Choose a role:**
   - Select "Teacher" or "Student"
   - Enter your name
3. **Teacher creates a question:**
   - Write the question text
   - Add multiple options
   - Set an optional timer (or end manually)
4. **Students see the poll** and vote instantly
5. **Results update live** as responses come in
6. **Chat works in real-time** alongside polling
7. **View poll history** to see the last 15 questions

---

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/YourFeature`
3. **Make your changes** and commit: `git commit -m "Add feature"`
4. **Push to your branch:** `git push origin feature/YourFeature`
5. **Open a Pull Request**

Please ensure new features maintain real-time socket functionality or update the README if behavior changes.

---

## 📝 Future Enhancements

- **Persistent Database:** Migrate from in-memory to PostgreSQL/MongoDB for data persistence
- **Authentication:** Add teacher login and student verification
- **Multiple Rooms:** Support multiple concurrent polling sessions
- **Enhanced UI:** Better animations, mobile optimization, and dark mode
- **Advanced Features:** Export poll results, question templates, detailed analytics
- **Mobile App:** Native mobile experience for students

---

## 📜 License

This project is open source and available under the **MIT License**.

---

## 🙋 Support & Issues

Found a bug or have a feature request? Please open an issue on GitHub. We'd love to hear from you!

Thanks for using **Live Polling System**! If this project was helpful, consider giving it a ⭐ on GitHub. Happy polling! 😊
