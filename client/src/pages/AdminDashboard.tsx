import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';
import io from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [connectedUsers, setConnectedUsers] = useState<User[]>([]);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/users`);
                setConnectedUsers(res.data);
            } catch (err) {
                console.error('Failed to fetch admin network users:', err);
            }
        };

        if (user && user.role === 'admin') {
            fetchUsers();
        }

        socket.on('statusUpdated', (data: { userId: string; status: string }) => {
            setConnectedUsers((prev) =>
                prev.map((u) =>
                    u._id === data.userId ? { ...u, status: data.status, lastStatusUpdate: new Date() as unknown as Date } : u
                )
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const handleBack = () => {
        navigate('/');
    };

    const fmtTime = (d?: Date | string) => {
        if (!d) return t('admin_na');
        try {
            return new Date(d).toLocaleTimeString(i18n.language);
        } catch {
            return t('admin_na');
        }
    };

    const statusLabel = (s: string) => {
        if (s === 'in-danger') return t('admin_status_in_danger');
        return (s || '').toUpperCase();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }} dir={i18n.language?.startsWith('he') ? 'rtl' : 'ltr'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ color: 'var(--primary-color)' }}>{t('admin_title')}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('admin_subtitle')}</p>
                </div>
                <button type="button" className="btn" style={{ backgroundColor: 'var(--surface-color)', color: 'white' }} onClick={handleBack}>
                    {t('admin_back')}
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>{t('admin_nodes_online', { count: connectedUsers.length })}</h3>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            <th style={{ padding: '1rem' }}>{t('admin_table_user')}</th>
                            <th style={{ padding: '1rem' }}>{t('admin_table_username')}</th>
                            <th style={{ padding: '1rem' }}>{t('admin_table_role')}</th>
                            <th style={{ padding: '1rem' }}>{t('admin_table_status')}</th>
                            <th style={{ padding: '1rem' }}>{t('admin_table_last_update')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {connectedUsers.map((u) => (
                            <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>
                                    {u.firstName} {u.lastName} {u._id === user?._id ? `(${t('you')})` : ''}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>@{u.username}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span
                                        style={{
                                            backgroundColor: u.role === 'admin' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                                            color: u.role === 'admin' ? 'var(--warning-color)' : 'var(--primary-hover)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {u.role === 'admin' ? t('role_admin') : t('role_user')}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span
                                        style={{
                                            color: u.status === 'safe' ? 'var(--success-color)' : u.status === 'in-danger' ? 'var(--danger-color)' : 'var(--text-secondary)',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {u.status === 'in-danger' ? `⚠️ ${statusLabel(u.status)}` : statusLabel(u.status)}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{fmtTime(u.lastStatusUpdate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
