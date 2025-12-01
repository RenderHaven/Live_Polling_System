import { io } from "socket.io-client";

const SOCKET_URL = window.location.origin;   // always frontend domain

export const socket = io(SOCKET_URL, {
  path: "/socket.io",             // 🔥 REQUIRED FOR RENDER
  transports: ["websocket"],      // 🔥 WebSocket only (fast & stable)
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

export default socket;
