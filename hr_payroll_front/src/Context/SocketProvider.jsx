import React, { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../api/socket";

const SocketContext = createContext(null);

import useAuth from "./AuthContext";

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    if (!auth?.accessToken || !auth?.user?.id) return;

    // Pass user.id to connectSocket
    const s = connectSocket(auth.user.id);

    if (s) {
      setSocket(s);

      const joinRoom = () => {
        if (auth.user?.id) {
            // Use user_{id} to match backend
            const room = `user_${auth.user.id}`;
            s.emit('join_room', { room });
            console.log("Socket: Joined room", room);
        }
      };

      if (s.connected) joinRoom();
      s.on('connect', joinRoom);
    }

    return () => {
      // Optional: disconnectSocket(); 
    };
  }, [auth.accessToken, auth.user?.id]);

  if (!socket) {
    return (
      <SocketContext.Provider value={null}>
        {children}
      </SocketContext.Provider>
    );
  }

  return (
    <SocketContext.Provider
      value={{
        socket,

        emit: (event, payload) => {
          socket.emit(event, payload);
        },

        on: (event, callback) => {
          socket.on(event, callback);
        },

        off: (event, callback) => {
          socket.off(event, callback);
        },
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}





















// import React, { createContext, useContext, useEffect, useMemo } from "react";
// import { connectSocket, disconnectSocket, getSocket } from "../api/socket";

// const SocketContext = createContext(null);

// export function SocketProvider({ children }) {
//   useEffect(() => {
//     connectSocket(); // connect once globally

//     return () => {
//       disconnectSocket(); // cleanup on app unload
//     };
//   }, []);

//   const value = useMemo(() => {
//     const socket = getSocket();
//     if (!socket) return null;

//     return {
//       socket,

//       emit: (event, payload) => {
//         socket.emit(event, payload);
//       },

//       on: (event, callback) => {
//         socket.on(event, callback);
//       },

//       off: (event, callback) => {
//         socket.off(event, callback);
//       },
//     };
//   }, []);

//   return (
//     <SocketContext.Provider value={value}>
//       {children}
//     </SocketContext.Provider>
//   );
// }

// export function useSocket() {
//   return useContext(SocketContext);
// }
