import { io } from "socket.io-client";
import { getAccessToken, refreshToken } from "../utils/auth";

const isLocalUrl = (url = '') => /https?:\/\/(localhost|127\.0\.0\.1)/i.test(url);
const isDeployedHost =
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1'].includes(window.location.hostname);

let socket = null;
let currentPath = "/ws/notifications/socket.io"; 
const rawSocketBaseUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BASE_URL ||
  "";
const SOCKET_BASE_URL =
  (isDeployedHost && isLocalUrl(rawSocketBaseUrl)
    ? ""
    : rawSocketBaseUrl) ||
  "https://hr-payroll-full.onrender.com";
// let currentPath = "/ws/notifications/"; 

export function connectSocket(userId, path = currentPath) {
  currentPath = path;

  if (socket && socket.connected) {
    return socket;
  }

  const token = getAccessToken();
  if (!token) return null;

  socket = io(SOCKET_BASE_URL, {
    transports: ["polling"],
    query: { userId }, // Pass userId for backend session
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 8000,
    randomizationFactor: 0.5,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    console.log("🚀 Transport:", socket.io.engine.transport.name);
  });

  socket.on("disconnect", (reason) => {
    console.log("⚠️ Socket disconnected:", reason);
  });

  socket.on("connect_error", async (err) => {
    console.warn("❌ Socket error:", err.message);

    if (err.message === "jwt_expired") {
      const newToken = await refreshToken();
      if (newToken) {
        disconnectSocket();
        connectSocket(currentPath);
      }
    }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}















// import { io } from "socket.io-client";
// import { getAccessToken, refreshToken } from "../utils/auth";

// let socket = null;
// let currentPath = "/ws/notifications";

// export function connectSocket(path = currentPath) {
//   currentPath = path;

//   if (socket && socket.connected) {
//     return socket;
//   }

//   const token = getAccessToken();
//   if (!token) return null;

//   socket = io("http://172.16.27.124:3000", {
//     path, // 🔥 VERY IMPORTANT
//     transports: ["polling", "websocket"], // polling first = better errors
//     query: { token },
//     reconnection: true,
//     reconnectionAttempts: Infinity,
//     reconnectionDelay: 2000,
//   });

//   socket.on("connect", () => {
//     console.log("✅ Socket connected:", socket.id);
//   });

//   socket.on("disconnect", (reason) => {
//     console.log("⚠️ Socket disconnected:", reason);
//   });

//   socket.on("connect_error", async (err) => {
//     console.warn("❌ Socket error:", err.message);

//     if (err.message === "jwt_expired") {
//       const newToken = await refreshToken();
//       if (newToken) {
//         disconnectSocket();
//         connectSocket(currentPath);
//       }
//     }
//   });

//   return socket;
// }

// export function getSocket() {
//   return socket;
// }


// export function disconnectSocket() {
//   if (socket) {
//     socket.disconnect();
//     socket = null;
//   }
// }
