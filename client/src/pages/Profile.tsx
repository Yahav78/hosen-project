import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import AppToolbar from '../components/AppToolbar';

const Profile: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isRtl = i18n.language?.startsWith('he');

    if (!user) {
        return null;
    }

    const loc = user.location;
    const lastUp = user.lastStatusUpdate
        ? new Date(user.lastStatusUpdate).toLocaleString(i18n.language)
        : t('never');

    const row = (label: string, value: React.ReactNode) => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 1fr) 2fr',
                gap: '0.75rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--border-color)',
                alignItems: 'start'
            }}
        >
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</span>
            <span style={{ wordBreak: 'break-word' }}>{value ?? '—'}</span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }} dir={isRtl ? 'rtl' : 'ltr'}>
            <AppToolbar />
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
                <h2 style={{ color: 'var(--primary-color)', marginTop: 0, marginBottom: '1.5rem' }}>{t('profile_title')}</h2>
                {row(t('first_name'), user.firstName)}
                {row(t('last_name'), user.lastName)}
                {row(t('username'), user.username)}
                {row(t('email_address'), user.email)}
                {row(t('home_address'), user.homeAddress || '—')}
                {row(t('profile_role'), user.role === 'admin' ? t('role_admin') : t('role_user'))}
                {row(t('profile_status'), user.status)}
                {row(t('resilience_score'), `${user.resilienceScore ?? 0}%`)}
                {row(
                    t('profile_location'),
                    loc?.lat != null && loc?.lng != null
                        ? `${Number(loc.lat).toFixed(5)}, ${Number(loc.lng).toFixed(5)}`
                        : t('profile_location_none')
                )}
                {row(t('profile_last_status'), lastUp)}
            </div>
        </div>
    );
};

export default Profile;
