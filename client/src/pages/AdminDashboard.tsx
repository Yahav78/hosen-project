import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import io from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [connectedUsers, setConnectedUsers] = useState<User[]>([]);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        // In a real app, this socket would listen to an 'adminRoom'
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        
        const fetchUsers = async () => {
             try {
                 const res = await axios.get(`${API_URL}/admin/users`);
                 setConnectedUsers(res.data);
             } catch (err) {
                 console.error("Failed to fetch admin network users:", err);
             }
        };

        if (user && user.role === 'admin') {
             fetchUsers();
        }

        socket.on('statusUpdated', (data: any) => {
             // Handle real-time user status changes from anywhere on the platform
             setConnectedUsers(prev => prev.map(u => u._id === data.userId ? {...u, status: data.status, lastStatusUpdate: new Date()} : u));
        });

        return () => { socket.disconnect(); };
    }, [user]);

    const handleBack = () => { navigate('/'); };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <h1 style={{ color: 'var(--primary-color)' }}>Admin Control Center</h1>
                   <p style={{ color: 'var(--text-secondary)' }}>System overview and active user monitoring.</p>
                </div>
                <button className="btn" style={{ backgroundColor: 'var(--surface-color)', color: 'white' }} onClick={handleBack}>
                    Back to Dashboard
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Live Network Status ({connectedUsers.length} Nodes Online)</h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            <th style={{ padding: '1rem' }}>User</th>
                            <th style={{ padding: '1rem' }}>Username</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Last Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        {connectedUsers.map(u => (
                            <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>{u.firstName} {u.lastName} {u._id === user?._id && '(You)'}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>@{u.username}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        backgroundColor: u.role === 'admin' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(37, 99, 235, 0.2)', 
                                        color: u.role === 'admin' ? 'var(--warning-color)' : 'var(--primary-hover)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        color: u.status === 'safe' ? 'var(--success-color)' : (u.status === 'in-danger' ? 'var(--danger-color)' : 'var(--text-secondary)'),
                                        fontWeight: 'bold'
                                    }}>
                                        {u.status === 'in-danger' ? '⚠️ IN DANGER' : u.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {u.lastStatusUpdate ? new Date(u.lastStatusUpdate).toLocaleTimeString() : 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
