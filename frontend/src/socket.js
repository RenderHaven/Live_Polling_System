import { io } from "socket.io-client";

// If env variable exists → use backend URL
// Else → fallback to same-domain routing (rewrite rules)
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || window.location.origin;

export const socket = io(SOCKET_URL, {
  path: "/socket.io",             // required for Render rewrites
  transports: ["websocket"],      // no long polling issues
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

export default socket;
