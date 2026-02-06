import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const response = await api.get('/admin/stats');
                setStats(response.data);
            } else if (activeTab === 'reports') {
                const response = await api.get('/admin/reports');
                setReports(response.data.reports);
            } else if (activeTab === 'users' && isAdmin) {
                const response = await api.get('/admin/users');
                setUsers(response.data.users);
            } else if (activeTab === 'rooms' && isAdmin) {
                const response = await api.get('/admin/rooms');
                setRooms(response.data.rooms);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReportAction = async (reportId, status, action) => {
        try {
            await api.put(`/admin/reports/${reportId}`, { status, action });
            fetchData();
        } catch (error) {
            console.error('Error updating report:', error);
        }
    };

    const handleToggleBan = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/ban`);
            fetchData();
        } catch (error) {
            console.error('Error toggling ban:', error);
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!confirm('Are you sure you want to delete this room?')) return;
        try {
            await api.delete(`/admin/rooms/${roomId}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="admin-page">
            <header className="admin-header">
                <div className="header-left">
                    <Link to="/chat" className="btn btn-ghost">← Back to Chat</Link>
                    <h1>Admin Dashboard</h1>
                </div>
                <div className="header-right">
                    <span className="admin-badge">{user?.role}</span>
                </div>
            </header>

            <div className="admin-content">
                <nav className="admin-nav">
                    <button
                        className={`admin-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={`admin-nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        🚩 Reports
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                👥 Users
                            </button>
                            <button
                                className={`admin-nav-btn ${activeTab === 'rooms' ? 'active' : ''}`}
                                onClick={() => setActiveTab('rooms')}
                            >
                                💬 Rooms
                            </button>
                        </>
                    )}
                </nav>

                <main className="admin-main">
                    {loading ? (
                        <div className="admin-loading">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && stats && (
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-icon">👥</div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.totalUsers}</span>
                                            <span className="stat-label">Total Users</span>
                                        </div>
                                        <div className="stat-change positive">
                                            +{stats.last24Hours.newUsers} today
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">💬</div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.totalRooms}</span>
                                            <span className="stat-label">Active Rooms</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">✉️</div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.totalMessages}</span>
                                            <span className="stat-label">Total Messages</span>
                                        </div>
                                        <div className="stat-change positive">
                                            +{stats.last24Hours.newMessages} today
                                        </div>
                                    </div>
                                    <div className="stat-card warning">
                                        <div className="stat-icon">🚩</div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.pendingReports}</span>
                                            <span className="stat-label">Pending Reports</span>
                                        </div>
                                    </div>
                                    <div className="stat-card error">
                                        <div className="stat-icon">🚫</div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.blockedUsers}</span>
                                            <span className="stat-label">Blocked Users</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reports Tab */}
                            {activeTab === 'reports' && (
                                <div className="reports-list">
                                    {reports.length === 0 ? (
                                        <div className="empty-state">
                                            <span className="empty-icon">✓</span>
                                            <p>No pending reports</p>
                                        </div>
                                    ) : (
                                        reports.map((report) => (
                                            <div key={report._id} className="report-card">
                                                <div className="report-header">
                                                    <span className="report-reason badge">{report.reason}</span>
                                                    <span className="report-date">{formatDate(report.createdAt)}</span>
                                                </div>
                                                <div className="report-body">
                                                    <p><strong>Reported:</strong> {report.anonymousNameReported}</p>
                                                    <p><strong>Room:</strong> {report.room?.name || 'Deleted'}</p>
                                                    {report.description && (
                                                        <p><strong>Details:</strong> {report.description}</p>
                                                    )}
                                                </div>
                                                <div className="report-actions">
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => handleReportAction(report._id, 'dismissed', 'none')}
                                                    >
                                                        Dismiss
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => handleReportAction(report._id, 'resolved', 'warning')}
                                                    >
                                                        Warn User
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleReportAction(report._id, 'resolved', 'ban')}
                                                    >
                                                        Ban User
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Users Tab */}
                            {activeTab === 'users' && isAdmin && (
                                <div className="users-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Username</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Reports</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => (
                                                <tr key={u._id} className={u.isBlocked ? 'blocked' : ''}>
                                                    <td>{u.username}</td>
                                                    <td>{u.email}</td>
                                                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                                                    <td>{u.reportCount}</td>
                                                    <td>
                                                        <span className={`badge ${u.isBlocked ? 'badge-error' : 'badge-success'}`}>
                                                            {u.isBlocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {u.role !== 'admin' && (
                                                            <button
                                                                className={`btn btn-sm ${u.isBlocked ? 'btn-success' : 'btn-danger'}`}
                                                                onClick={() => handleToggleBan(u._id)}
                                                            >
                                                                {u.isBlocked ? 'Unban' : 'Ban'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Rooms Tab */}
                            {activeTab === 'rooms' && isAdmin && (
                                <div className="rooms-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Participants</th>
                                                <th>Created</th>
                                                <th>Expires</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rooms.map((room) => (
                                                <tr key={room._id}>
                                                    <td>{room.name}</td>
                                                    <td>{room.type}</td>
                                                    <td>{room.participantCount}</td>
                                                    <td>{formatDate(room.createdAt)}</td>
                                                    <td>{room.expiresAt ? formatDate(room.expiresAt) : 'Never'}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeleteRoom(room._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
