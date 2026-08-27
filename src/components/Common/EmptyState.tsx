import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction }) => {
    return (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--slate-500)' }}>
            {icon && <div style={{ opacity: 0.3, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{icon}</div>}
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-400)', marginBottom: 4 }}>{title}</div>
            {description && <div style={{ fontSize: '0.75rem', marginTop: 4, maxWidth: 360, marginInline: 'auto' }}>{description}</div>}
            {actionLabel && onAction && (
                <button onClick={onAction} style={{ marginTop: 12, padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
