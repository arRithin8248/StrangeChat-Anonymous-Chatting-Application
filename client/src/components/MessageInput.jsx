import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const MessageInput = ({ roomId, typingUsers }) => {
    const [message, setMessage] = useState('');
    const [selfDestruct, setSelfDestruct] = useState(false);
    const [destructTime, setDestructTime] = useState(60);
    const [showOptions, setShowOptions] = useState(false);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { sendMessage, startTyping, stopTyping } = useSocket();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleChange = (e) => {
        setMessage(e.target.value);

        // Typing indicator
        startTyping(roomId);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(roomId);
        }, 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!message.trim()) return;

        sendMessage(
            roomId,
            message.trim(),
            selfDestruct,
            selfDestruct ? destructTime : null
        );

        setMessage('');
        stopTyping(roomId);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const typingText = typingUsers.length > 0
        ? typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.length} people are typing...`
        : '';

    return (
        <div className="message-input-container">
            <div className="typing-indicator">
                {typingText && <span>{typingText}</span>}
            </div>

            <form onSubmit={handleSubmit} className="message-input-wrapper">
                <button
                    type="button"
                    className={`btn btn-ghost options-btn ${showOptions ? 'active' : ''}`}
                    onClick={() => setShowOptions(!showOptions)}
                    title="Message options"
                >
                    ⚙️
                </button>

                <textarea
                    ref={textareaRef}
                    className="message-input"
                    placeholder="Type a message..."
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />

                <button
                    type="submit"
                    className="btn btn-primary send-button"
                    disabled={!message.trim()}
                >
                    ➤
                </button>
            </form>

            {showOptions && (
                <div className="message-options">
                    <label className="option-item">
                        <input
                            type="checkbox"
                            checked={selfDestruct}
                            onChange={(e) => setSelfDestruct(e.target.checked)}
                        />
                        <span>Self-destruct message</span>
                    </label>

                    {selfDestruct && (
                        <div className="option-item">
                            <label>Destroy after:</label>
                            <select
                                value={destructTime}
                                onChange={(e) => setDestructTime(Number(e.target.value))}
                                className="input"
                            >
                                <option value={30}>30 seconds</option>
                                <option value={60}>1 minute</option>
                                <option value={300}>5 minutes</option>
                                <option value={3600}>1 hour</option>
                            </select>
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .options-btn {
          padding: var(--spacing-xs);
          font-size: 1.1rem;
        }
        
        .options-btn.active {
          color: var(--accent-primary);
        }
        
        .message-options {
          margin-top: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          animation: fadeIn 0.2s ease;
        }
        
        .option-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        
        .option-item:last-child {
          margin-bottom: 0;
        }
        
        .option-item input[type="checkbox"] {
          accent-color: var(--accent-primary);
          width: 16px;
          height: 16px;
        }
        
        .option-item select {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 0.85rem;
          min-width: 120px;
        }
      `}</style>
        </div>
    );
};

export default MessageInput;
