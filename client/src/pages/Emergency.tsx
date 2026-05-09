import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import io, { Socket } from 'socket.io-client';

export type EmergencyTrigger = 'manual' | 'audio' | 'family';

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(mq.matches);
        const onChange = () => setReduced(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return reduced;
}

const Emergency: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const socketRef = useRef<Socket | null>(null);
    const isRtl = i18n.language?.startsWith('he');
    const prefersReducedMotion = usePrefersReducedMotion();

    const state = location.state as { trigger?: EmergencyTrigger } | null;
    const trigger: EmergencyTrigger = state?.trigger ?? 'manual';

    const startedAt = useMemo(() => new Date(), []);

    const triggerSocketType =
        trigger === 'audio' ? 'audio_trigger' : trigger === 'family' ? 'family_trigger' : 'manual_trigger';

    const triggerLabel = () => {
        if (trigger === 'audio') return t('emergency_trigger_audio');
        if (trigger === 'family') return t('emergency_trigger_family');
        return t('emergency_trigger_manual');
    };

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socketRef.current = newSocket;

        if (user) {
            newSocket.emit('triggerEmergency', {
                familyId: 'family1',
                userId: user._id,
                type: triggerSocketType
            });
        }

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
        };
    }, [user, triggerSocketType]);

    const handleImSafe = () => {
        if (socketRef.current && user) {
            socketRef.current.emit('updateStatus', {
                familyId: 'family1',
                userId: user._id,
                status: 'safe'
            });
        }
        navigate('/');
    };

    const handleDeactivate = () => {
        navigate('/');
    };

    const pulseAnimation = prefersReducedMotion ? 'none' : 'pulse 1.5s infinite alternate';

    const hasLocation = Boolean(user?.location?.lat != null && user?.location?.lng != null);

    return (
        <div
            dir={isRtl ? 'rtl' : 'ltr'}
            lang={i18n.language}
            className="emergency-screen-root"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'black',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                animation: pulseAnimation,
                zIndex: 9999
            }}
        >
            <style>
                {`
                    @keyframes pulse {
                        0% { background-color: #000; box-shadow: inset 0 0 50px rgba(255,0,0,0.2); }
                        100% { background-color: #1a0000; box-shadow: inset 0 0 150px rgba(255,0,0,0.8); }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .emergency-screen-root { animation: none !important; }
                    }
                    .siren-text {
                        color: #ff0000;
                        font-size: clamp(2rem, 8vw, 5rem);
                        font-family: var(--font-heading);
                        font-weight: 800;
                        text-align: center;
                        letter-spacing: ${isRtl ? '0.05em' : '0.5rem'};
                        text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
                        margin-bottom: 1rem;
                        line-height: 1.15;
                    }
                    .siren-text-latin {
                        text-transform: uppercase;
                    }
                    .emergency-meta {
                        color: var(--text-secondary);
                        font-size: 0.9rem;
                        text-align: center;
                        margin-bottom: 1rem;
                        max-width: 520px;
                        padding: 0 1rem;
                        line-height: 1.5;
                    }
                `}
            </style>

            <div className={`siren-text ${isRtl ? '' : 'siren-text-latin'}`}>
                {t('emergency_line1')}
                <br />
                {t('emergency_line2')}
                <br />
                {t('emergency_line3')}
            </div>

            <div className="emergency-meta">
                <div>
                    <strong>{t('emergency_activated_at')}:</strong>{' '}
                    {startedAt.toLocaleString(i18n.language)}
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                    <strong>{t('emergency_trigger_label')}:</strong> {triggerLabel()}
                </div>
            </div>

            {hasLocation && (
                <p
                    style={{
                        color: '#bae6fd',
                        fontSize: '0.95rem',
                        marginBottom: '1rem',
                        maxWidth: '560px',
                        textAlign: 'center',
                        padding: '0 1rem',
                        lineHeight: 1.5
                    }}
                >
                    {t('emergency_gps_hint')}
                </p>
            )}

            <p
                style={{
                    color: 'white',
                    fontSize: '1.2rem',
                    marginBottom: '2rem',
                    maxWidth: '600px',
                    textAlign: 'center',
                    padding: '0 1rem'
                }}
            >
                {t('emergency_instruction')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    type="button"
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--success-color)', fontSize: '1.2rem', padding: '1rem 3rem' }}
                    onClick={handleImSafe}
                >
                    {t('i_am_safe')}
                </button>
                <button
                    type="button"
                    className="btn btn-danger"
                    style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
                    onClick={handleDeactivate}
                >
                    {t('emergency_deactivate')}
                </button>
            </div>

            <div style={{ position: 'absolute', bottom: '2rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 1rem', fontSize: '0.85rem' }}>
                {t('emergency_triggered_by')} {user?.firstName} {user?.lastName} · {t('emergency_footer_source')}:{' '}
                {triggerLabel()}
            </div>
        </div>
    );
};

export default Emergency;
