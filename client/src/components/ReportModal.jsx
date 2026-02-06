import { useState } from 'react';

const ReportModal = ({ anonymousName, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const reasons = [
        { value: 'spam', label: 'Spam or advertising' },
        { value: 'harassment', label: 'Harassment or bullying' },
        { value: 'inappropriate', label: 'Inappropriate content' },
        { value: 'threats', label: 'Threats or violence' },
        { value: 'other', label: 'Other' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason) {
            setError('Please select a reason');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSubmit(reason, description);
            setSuccess(true);
            setTimeout(onClose, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit report');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Report User</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {success ? (
                    <div className="report-success">
                        <div className="success-icon">✓</div>
                        <h3>Report Submitted</h3>
                        <p>Thank you for helping keep our community safe.</p>
                    </div>
                ) : (
                    <>
                        <div className="report-user-info">
                            <span>Reporting:</span>
                            <strong>{anonymousName}</strong>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Reason for report</label>
                                <div className="reason-options">
                                    {reasons.map((r) => (
                                        <label key={r.value} className="reason-option">
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={r.value}
                                                checked={reason === r.value}
                                                onChange={(e) => setReason(e.target.value)}
                                            />
                                            <span>{r.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Additional details (optional)</label>
                                <textarea
                                    id="description"
                                    className="input"
                                    placeholder="Provide more context..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-danger" disabled={loading}>
                                    {loading ? <span className="spinner"></span> : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                <style>{`
          .report-user-info {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-md);
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
            margin-bottom: var(--spacing-lg);
          }
          
          .report-user-info strong {
            color: var(--accent-primary);
          }
          
          .reason-options {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
          }
          
          .reason-option {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--bg-tertiary);
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: background var(--transition-fast);
          }
          
          .reason-option:hover {
            background: var(--bg-hover);
          }
          
          .reason-option input {
            accent-color: var(--accent-primary);
          }
          
          .report-success {
            text-align: center;
            padding: var(--spacing-xl);
          }
          
          .success-icon {
            width: 60px;
            height: 60px;
            background: var(--success);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: white;
            margin: 0 auto var(--spacing-lg);
          }
          
          .report-success h3 {
            margin-bottom: var(--spacing-sm);
          }
          
          .report-success p {
            color: var(--text-secondary);
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

export default ReportModal;
