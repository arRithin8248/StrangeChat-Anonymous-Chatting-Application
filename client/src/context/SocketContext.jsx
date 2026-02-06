import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        // Connect to Socket.IO
        const newSocket = io('http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        newSocket.on('room-joined', (data) => {
            setCurrentRoom(data.roomId);
            setOnlineUsers([]);
        });

        newSocket.on('user-joined', (data) => {
            setOnlineUsers(prev => [...new Set([...prev, data.anonymousName])]);
        });

        newSocket.on('user-left', (data) => {
            setOnlineUsers(prev => prev.filter(u => u !== data.anonymousName));
            setTypingUsers(prev => prev.filter(u => u !== data.anonymousName));
        });

        newSocket.on('online-users', (data) => {
            setOnlineUsers(data.users);
        });

        newSocket.on('user-typing', (data) => {
            if (data.isTyping) {
                setTypingUsers(prev => [...new Set([...prev, data.anonymousName])]);
            } else {
                setTypingUsers(prev => prev.filter(u => u !== data.anonymousName));
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated]);

    const joinRoom = useCallback((roomId) => {
        if (socket && connected) {
            socket.emit('join-room', roomId);
        }
    }, [socket, connected]);

    const leaveRoom = useCallback((roomId) => {
        if (socket && connected) {
            socket.emit('leave-room', roomId);
            setCurrentRoom(null);
            setOnlineUsers([]);
            setTypingUsers([]);
        }
    }, [socket, connected]);

    const sendMessage = useCallback((roomId, content, selfDestruct = false, destructTime = null) => {
        if (socket && connected) {
            socket.emit('send-message', { roomId, content, selfDestruct, destructTime });
        }
    }, [socket, connected]);

    const startTyping = useCallback((roomId) => {
        if (socket && connected) {
            socket.emit('typing-start', roomId);
        }
    }, [socket, connected]);

    const stopTyping = useCallback((roomId) => {
        if (socket && connected) {
            socket.emit('typing-stop', roomId);
        }
    }, [socket, connected]);

    const getOnlineUsers = useCallback((roomId) => {
        if (socket && connected) {
            socket.emit('get-online-users', roomId);
        }
    }, [socket, connected]);

    const value = {
        socket,
        connected,
        currentRoom,
        onlineUsers,
        typingUsers,
        joinRoom,
        leaveRoom,
        sendMessage,
        startTyping,
        stopTyping,
        getOnlineUsers
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
