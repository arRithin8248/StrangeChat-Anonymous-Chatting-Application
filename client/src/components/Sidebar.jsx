import { useState, useEffect } from 'react';
import api from '../services/api';

const Sidebar = ({
    rooms,
    activeRoom,
    onSelectRoom,
    onCreateRoom,
    onLeaveRoom,
    loading,
    isOpen,
    onClose
}) => {
    const [availableRooms, setAvailableRooms] = useState([]);
    const [showAvailable, setShowAvailable] = useState(false);

    useEffect(() => {
        if (showAvailable) {
            fetchAvailableRooms();
        }
    }, [showAvailable]);

    const fetchAvailableRooms = async () => {
        try {
            const response = await api.get('/rooms/available');
            setAvailableRooms(response.data);
        } catch (error) {
            console.error('Error fetching available rooms:', error);
        }
    };

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getRoomIcon = (room) => {
        if (room.type === 'one-to-one') return '👤';
        return '👥';
    };

    const displayRooms = showAvailable ? availableRooms : rooms;

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-tabs">
                        <button
                            className={`sidebar-tab ${!showAvailable ? 'active' : ''}`}
                            onClick={() => setShowAvailable(false)}
                        >
                            My Rooms
                        </button>
                        <button
                            className={`sidebar-tab ${showAvailable ? 'active' : ''}`}
                            onClick={() => setShowAvailable(true)}
                        >
                            Browse
                        </button>
                    </div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={onCreateRoom}
                    >
                        + New
                    </button>
                </div>

                <div className="sidebar-rooms">
                    {loading ? (
                        <div className="sidebar-loading">
                            <div className="spinner"></div>
                        </div>
                    ) : displayRooms.length === 0 ? (
                        <div className="empty-rooms">
                            <div className="empty-rooms-icon">
                                {showAvailable ? '🔍' : '💬'}
                            </div>
                            <p>{showAvailable ? 'No public rooms available' : 'No rooms yet'}</p>
                            <button
                                className="btn btn-primary btn-sm mt-md"
                                onClick={onCreateRoom}
                            >
                                Create Room
                            </button>
                        </div>
                    ) : (
                        displayRooms.map((room) => (
                            <div
                                key={room._id}
                                className={`room-item ${activeRoom?._id === room._id ? 'active' : ''}`}
                                onClick={() => {
                                    onSelectRoom(room._id);
                                    onClose();
                                }}
                            >
                                <div className="room-avatar">
                                    {getRoomIcon(room)}
                                </div>
                                <div className="room-info">
                                    <div className="room-name">{room.name}</div>
                                    <div className="room-preview">
                                        {room.lastMessage
                                            ? `${room.lastMessage.anonymousName}: ${room.lastMessage.content}`
                                            : room.myAnonymousName
                                                ? `You are ${room.myAnonymousName}`
                                                : `${room.participantCount || 0} participants`
                                        }
                                    </div>
                                </div>
                                <div className="room-meta">
                                    {room.lastMessage && (
                                        <span className="room-time">
                                            {formatTime(room.lastMessage.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            <style>{`
        .sidebar-tabs {
          display: flex;
          gap: var(--spacing-xs);
        }
        
        .sidebar-tab {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }
        
        .sidebar-tab:hover {
          color: var(--text-primary);
        }
        
        .sidebar-tab.active {
          color: var(--accent-primary);
          background: rgba(99, 102, 241, 0.1);
        }
        
        .sidebar-loading {
          display: flex;
          justify-content: center;
          padding: var(--spacing-xl);
        }
      `}</style>
        </>
    );
};

export default Sidebar;
