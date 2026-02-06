import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import CreateRoomModal from '../components/CreateRoomModal';
import api from '../services/api';
import './Chat.css';

const Chat = () => {
    const { user, logout, isAdmin, isModerator } = useAuth();
    const { connected } = useSocket();
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await api.get('/rooms');
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (roomData) => {
        try {
            const response = await api.post('/rooms', roomData);
            setRooms([response.data, ...rooms]);
            setActiveRoom(response.data);
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating room:', error);
        }
    };

    const handleJoinRoom = async (roomId) => {
        try {
            const response = await api.post(`/rooms/${roomId}/join`);
            const updatedRoom = response.data;

            // Update rooms list
            const existingIndex = rooms.findIndex(r => r._id === roomId);
            if (existingIndex >= 0) {
                const newRooms = [...rooms];
                newRooms[existingIndex] = updatedRoom;
                setRooms(newRooms);
            } else {
                setRooms([updatedRoom, ...rooms]);
            }

            setActiveRoom(updatedRoom);
        } catch (error) {
            console.error('Error joining room:', error);
        }
    };

    const handleLeaveRoom = async (roomId) => {
        try {
            await api.post(`/rooms/${roomId}/leave`);
            setRooms(rooms.filter(r => r._id !== roomId));
            if (activeRoom?._id === roomId) {
                setActiveRoom(null);
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };

    const handleRoomUpdate = (updatedRoom) => {
        setRooms(prev => prev.map(r => r._id === updatedRoom._id ? updatedRoom : r));
        if (activeRoom?._id === updatedRoom._id) {
            setActiveRoom(updatedRoom);
        }
    };

    return (
        <div className="chat-page">
            {/* Header */}
            <header className="chat-header">
                <div className="header-left">
                    <button
                        className="btn btn-ghost menu-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        ☰
                    </button>
                    <div className="header-brand">
                        <span className="brand-icon">💬</span>
                        <span className="brand-name">StrangeChat</span>
                    </div>
                </div>

                <div className="header-right">
                    <div className={`connection-status ${connected ? 'online' : 'offline'}`}>
                        <span className="status-dot"></span>
                        <span>{connected ? 'Connected' : 'Connecting...'}</span>
                    </div>

                    {(isAdmin || isModerator) && (
                        <Link to="/admin" className="btn btn-ghost btn-sm">
                            Admin
                        </Link>
                    )}

                    <button onClick={logout} className="btn btn-ghost btn-sm">
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="chat-main">
                {/* Sidebar */}
                <Sidebar
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onSelectRoom={handleJoinRoom}
                    onCreateRoom={() => setShowCreateModal(true)}
                    onLeaveRoom={handleLeaveRoom}
                    loading={loading}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Chat Area */}
                <ChatArea
                    room={activeRoom}
                    onRoomUpdate={handleRoomUpdate}
                />
            </div>

            {/* Create Room Modal */}
            {showCreateModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateRoom}
                />
            )}
        </div>
    );
};

export default Chat;
