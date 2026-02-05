import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, auth } = useAuth(); // Assuming useAuth provides user object

    useEffect(() => {
        if (auth?.user) {
            // Initialize Socket
            // Use Backend URL. Usually vite proxy or direct.
            // Assuming localhost:8000 for backend
            const backendUrl = 'http://127.0.0.1:8000'; 
            
            const newSocket = io(backendUrl, {
                transports: ['polling'], // Force polling as per plan
                query: {
                    userId: auth.user.id
                }
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                // Join user room
                if (auth.user.employee_id || auth.user.id) {
                     const roomId = `user_${auth.user.employee_id}`; 
                     newSocket.emit('join_room', { room: roomId });
                     console.log('Joined room:', roomId);
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [auth?.user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
