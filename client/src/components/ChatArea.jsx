import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import MessageInput from './MessageInput';
import ReportModal from './ReportModal';
import api from '../services/api';

const ChatArea = ({ room, onRoomUpdate }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const messagesEndRef = useRef(null);
    const {
        socket,
        connected,
        joinRoom,
        leaveRoom,
        onlineUsers,
        typingUsers,
        getOnlineUsers
    } = useSocket();

    // Join room on mount/change
    useEffect(() => {
        if (room && connected) {
            joinRoom(room._id);
            fetchMessages();
            getOnlineUsers(room._id);
        }

        return () => {
            if (room) {
                leaveRoom(room._id);
            }
        };
    }, [room?._id, connected]);

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            setMessages(prev => [...prev, {
                ...message,
                isOwn: message.anonymousName === room?.myAnonymousName
            }]);
        };

        socket.on('new-message', handleNewMessage);

        return () => {
            socket.off('new-message', handleNewMessage);
        };
    }, [socket, room?.myAnonymousName]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        if (!room) return;
        setLoading(true);
        try {
            const response = await api.get(`/messages/${room._id}`);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleReport = (anonymousName) => {
        setReportTarget(anonymousName);
    };

    const submitReport = async (reason, description) => {
        try {
            await api.post('/reports', {
                roomId: room._id,
                anonymousNameReported: reportTarget,
                reason,
                description
            });
            setReportTarget(null);
        } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
        }
    };

    if (!room) {
        return (
            <div className="chat-area">
                <div className="empty-chat">
                    <div className="empty-chat-icon">💬</div>
                    <h2>Welcome to StrangeChat</h2>
                    <p>Select a room from the sidebar or create a new one to start chatting anonymously.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-area">
            {/* Header */}
            <div className="chat-area-header">
                <div className="chat-room-info">
                    <h2 className="chat-room-name">{room.name}</h2>
                    <div className="chat-room-meta">
                        <span className="online-count">
                            {onlineUsers.length || room.participantCount || 0} online
                        </span>
                        {room.myAnonymousName && (
                            <span className="my-identity">
                                You: <strong>{room.myAnonymousName}</strong>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
                {loading ? (
                    <div className="messages-loading">
                        <div className="spinner"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-messages">
                        <p>No messages yet. Be the first to say something!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message._id}
                            className={`message ${message.isOwn ? 'outgoing' : 'incoming'}`}
                        >
                            <div className="message-header">
                                <span className="message-sender">{message.anonymousName}</span>
                                <span className="message-time">{formatTime(message.createdAt)}</span>
                            </div>
                            <div className="message-bubble">
                                <p className="message-content">{message.content}</p>
                                {message.isSelfDestructing && (
                                    <span className="self-destruct-badge">⏱️ Self-destructing</span>
                                )}
                            </div>
                            {!message.isOwn && (
                                <button
                                    className="report-btn"
                                    onClick={() => handleReport(message.anonymousName)}
                                    title="Report user"
                                >
                                    🚩
                                </button>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput
                roomId={room._id}
                typingUsers={typingUsers}
            />

            {/* Report Modal */}
            {reportTarget && (
                <ReportModal
                    anonymousName={reportTarget}
                    onClose={() => setReportTarget(null)}
                    onSubmit={submitReport}
                />
            )}

            <style>{`
        .messages-loading,
        .empty-messages {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: var(--text-muted);
        }
        
        .my-identity {
          background: var(--bg-tertiary);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
        }
        
        .my-identity strong {
          color: var(--accent-primary);
        }
        
        .report-btn {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity var(--transition-fast);
          padding: 4px;
          font-size: 0.8rem;
        }
        
        .message:hover .report-btn {
          opacity: 0.5;
        }
        
        .report-btn:hover {
          opacity: 1 !important;
        }
      `}</style>
        </div>
    );
};

export default ChatArea;
