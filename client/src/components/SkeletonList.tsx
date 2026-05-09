import React from 'react';

interface SkeletonListProps {
    rows?: number;
    /** Optional screen reader label */
    label?: string;
}

/** Simple list skeleton for loading states */
const SkeletonList: React.FC<SkeletonListProps> = ({ rows = 4, label }) => {
    const pulse = {
        background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.2s ease-in-out infinite'
    } as React.CSSProperties;

    return (
        <>
            <style>{`
                @keyframes skeleton-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .skeleton-row { animation: none !important; background: rgba(255,255,255,0.08) !important; }
                }
            `}</style>
            <div role="status" aria-busy="true" aria-label={label}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Array.from({ length: rows }).map((_, i) => (
                        <div
                            key={i}
                            className="skeleton-row glass-panel"
                            style={{
                                ...pulse,
                                height: '56px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)'
                            }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export default SkeletonList;
