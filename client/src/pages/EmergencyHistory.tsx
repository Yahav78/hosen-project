import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AppToolbar from '../components/AppToolbar';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

export type EmergencyEventType =
    | 'manual_trigger'
    | 'audio_trigger'
    | 'family_trigger'
    | 'acoustic_alarm'
    | 'explosion';

export interface EmergencyEventRow {
    _id: string;
    userId: {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    type: EmergencyEventType;
    title?: string;
    location?: { lat: number; lng: number };
    resolved: boolean;
    createdAt: string;
}

const EmergencyHistory: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { showToast } = useToast();
    const isRtl = i18n.language?.startsWith('he');
    const [events, setEvents] = useState<EmergencyEventRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get<EmergencyEventRow[]>(`${API_URL}/emergency-events`);
            setEvents(res.data);
        } catch (err) {
            console.error(err);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleAddManual = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newTitle.trim();
        if (!trimmed) {
            showToast(t('emergency_log_title_required'), 'error');
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/emergency-events`, { title: trimmed });
            setNewTitle('');
            showToast(t('emergency_log_add_success'), 'success');
            await load();
        } catch (err) {
            console.error(err);
            showToast(t('emergency_log_add_error'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const triggerLabel = (type: EmergencyEventType) => {
        switch (type) {
            case 'audio_trigger':
                return t('emergency_log_trigger_audio');
            case 'family_trigger':
                return t('emergency_log_trigger_family');
            case 'acoustic_alarm':
                return t('emergency_log_trigger_legacy_acoustic');
            case 'explosion':
                return t('emergency_log_trigger_legacy_explosion');
            case 'manual_trigger':
            default:
                return t('emergency_log_trigger_manual');
        }
    };

    const personLabel = (row: EmergencyEventRow) => {
        const u = row.userId;
        if (!u) return '—';
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
        return name || u.email || '—';
    };

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} lang={i18n.language} style={{ minHeight: '100vh', padding: '1rem' }}>
            <AppToolbar />
            <div className="glass-panel" style={{ maxWidth: 960, margin: '1rem auto', padding: '1.25rem' }}>
                <h1 style={{ marginTop: 0, fontSize: '1.35rem' }}>{t('emergency_log_title')}</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    {t('emergency_log_desc')}
                </p>

                <form
                    onSubmit={handleAddManual}
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        alignItems: 'center',
                        marginBottom: '1.25rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(0,0,0,0.15)'
                    }}
                >
                    <label htmlFor="manual-emergency-title" style={{ flex: '1 1 220px', minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                            {t('emergency_log_add_label')}
                        </span>
                        <input
                            id="manual-emergency-title"
                            type="text"
                            value={newTitle}
                            onChange={(ev) => setNewTitle(ev.target.value)}
                            placeholder={t('emergency_log_add_placeholder')}
                            maxLength={200}
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '0.55rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                                color: 'inherit'
                            }}
                        />
                    </label>
                    <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'flex-end' }}>
                        {submitting ? t('emergency_log_add_saving') : t('emergency_log_add_button')}
                    </button>
                </form>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
                    {t('emergency_log_add_hint')}
                </p>

                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>{t('emergency_log_loading')}</p>
                ) : events.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>{t('emergency_log_empty')}</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ textAlign: isRtl ? 'right' : 'left', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '0.5rem 0.35rem' }}>{t('emergency_log_col_time')}</th>
                                    <th style={{ padding: '0.5rem 0.35rem' }}>{t('emergency_log_col_user')}</th>
                                    <th style={{ padding: '0.5rem 0.35rem' }}>{t('emergency_log_col_event_name')}</th>
                                    <th style={{ padding: '0.5rem 0.35rem' }}>{t('emergency_log_col_trigger')}</th>
                                    <th style={{ padding: '0.5rem 0.35rem' }}>{t('emergency_log_col_location')}</th>
                                    <th style={{ padding: '0.5rem 0.35rem' }}>{t('emergency_log_col_status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((row) => (
                                    <tr key={row._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <td style={{ padding: '0.55rem 0.35rem', whiteSpace: 'nowrap' }}>
                                            {new Date(row.createdAt).toLocaleString(i18n.language)}
                                        </td>
                                        <td style={{ padding: '0.55rem 0.35rem' }}>{personLabel(row)}</td>
                                        <td style={{ padding: '0.55rem 0.35rem', fontWeight: row.title ? 600 : undefined }}>
                                            {row.title?.trim() ? row.title.trim() : '—'}
                                        </td>
                                        <td style={{ padding: '0.55rem 0.35rem' }}>{triggerLabel(row.type)}</td>
                                        <td style={{ padding: '0.55rem 0.35rem', color: 'var(--text-secondary)' }}>
                                            {row.location?.lat != null && row.location?.lng != null
                                                ? t('emergency_log_location_yes')
                                                : t('emergency_log_location_no')}
                                        </td>
                                        <td style={{ padding: '0.55rem 0.35rem' }}>
                                            {row.resolved ? t('emergency_log_status_resolved') : t('emergency_log_status_active')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyHistory;
