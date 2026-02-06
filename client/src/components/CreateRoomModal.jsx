import { useState } from 'react';

const CreateRoomModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('group');
    const [expiresIn, setExpiresIn] = useState('24');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Room name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onCreate({
                name: name.trim(),
                type,
                expiresIn: expiresIn === '0' ? null : parseInt(expiresIn)
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Create New Room</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="roomName">Room Name</label>
                        <input
                            id="roomName"
                            type="text"
                            className="input"
                            placeholder="Enter room name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Room Type</label>
                        <div className="radio-group">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="type"
                                    value="group"
                                    checked={type === 'group'}
                                    onChange={(e) => setType(e.target.value)}
                                />
                                <span className="radio-label">
                                    <span className="radio-icon">👥</span>
                                    <span>
                                        <strong>Group Chat</strong>
                                        <small>Multiple anonymous users</small>
                                    </span>
                                </span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="type"
                                    value="one-to-one"
                                    checked={type === 'one-to-one'}
                                    onChange={(e) => setType(e.target.value)}
                                />
                                <span className="radio-label">
                                    <span className="radio-icon">👤</span>
                                    <span>
                                        <strong>One-to-One</strong>
                                        <small>Private anonymous chat</small>
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="expiry">Room Expiry</label>
                        <select
                            id="expiry"
                            className="input"
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(e.target.value)}
                        >
                            <option value="1">1 hour</option>
                            <option value="12">12 hours</option>
                            <option value="24">24 hours</option>
                            <option value="72">3 days</option>
                            <option value="168">1 week</option>
                            <option value="0">Never (permanent)</option>
                        </select>
                        <small className="form-hint">
                            Room and messages will be automatically deleted after this time
                        </small>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Create Room'}
                        </button>
                    </div>
                </form>

                <style>{`
          .radio-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
          }
          
          .radio-option {
            cursor: pointer;
          }
          
          .radio-option input {
            display: none;
          }
          
          .radio-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            padding: var(--spacing-md);
            background: var(--bg-tertiary);
            border: 2px solid var(--border-color);
            border-radius: var(--radius-md);
            transition: all var(--transition-fast);
          }
          
          .radio-option input:checked + .radio-label {
            border-color: var(--accent-primary);
            background: rgba(99, 102, 241, 0.1);
          }
          
          .radio-icon {
            font-size: 1.5rem;
          }
          
          .radio-label strong {
            display: block;
          }
          
          .radio-label small {
            color: var(--text-muted);
            font-size: 0.8rem;
          }
          
          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-sm);
            margin-top: var(--spacing-lg);
          }
        `}</style>
            </div>
        </div>
    );
};

export default CreateRoomModal;
