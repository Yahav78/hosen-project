import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    kind: ToastKind;
}

interface ToastContextValue {
    showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const { i18n } = useTranslation();

    const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, kind }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4200);
    }, []);

    const bg: Record<ToastKind, string> = {
        success: 'rgba(34, 197, 94, 0.95)',
        error: 'rgba(239, 68, 68, 0.95)',
        info: 'rgba(30, 41, 59, 0.95)'
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                role="region"
                aria-live="polite"
                aria-label={i18n.t('toast_region_label')}
                style={{
                    position: 'fixed',
                    zIndex: 100000,
                    bottom: '1rem',
                    insetInlineEnd: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxWidth: 'min(420px, calc(100vw - 2rem))',
                    pointerEvents: 'none'
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        style={{
                            pointerEvents: 'auto',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.9rem',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            backgroundColor: bg[t.kind]
                        }}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return ctx;
};
