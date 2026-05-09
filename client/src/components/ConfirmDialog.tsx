import React, { useId } from 'react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

/**
 * Accessible modal replacing window.confirm — trap focus is minimal; ESC closes via cancel.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    danger
}) => {
    const titleId = useId();
    if (!open) return null;

    return (
        <div
            role="presentation"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99998,
                backgroundColor: 'rgba(0,0,0,0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}
            onClick={onCancel}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onCancel();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="glass-panel"
                style={{
                    maxWidth: '420px',
                    width: '100%',
                    padding: '1.5rem',
                    borderRadius: '16px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id={titleId} style={{ marginTop: 0, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    {title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button type="button" className="btn" style={{ backgroundColor: 'var(--surface-color)', color: 'white' }} onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={danger ? 'btn btn-danger' : 'btn btn-primary'}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
