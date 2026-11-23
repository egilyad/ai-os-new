import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { eventBus, EVENTS } from '../kernel/instances/events';
import type { InboxType } from '../kernel/contracts/notification-inbox';

interface Toast {
    id: string;
    message: string;
    type: InboxType;
}

const TOAST_MS = 5000;
const MAX_TOASTS = 4;

const ICONS: Record<InboxType, React.ReactNode> = {
    success: <CheckCircle2 size={16} color="var(--success)" />,
    error: <AlertTriangle size={16} color="var(--error)" />,
    warning: <AlertTriangle size={16} color="var(--warning)" />,
    info: <Info size={16} color="var(--accent)" />,
};

const NotificationToasts: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const seq = useRef(0);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const unsubscribe = eventBus.on(EVENTS.NOTIFICATION, (data) => {
            const payload = data as { message?: unknown; type?: unknown } | undefined;
            if (!payload || typeof payload.message !== 'string') return;
            const type: InboxType =
                payload.type === 'success' ||
                payload.type === 'error' ||
                payload.type === 'warning' ||
                payload.type === 'info'
                    ? payload.type
                    : 'info';
            const id = `toast-${Date.now()}-${++seq.current}`;
            setToasts((prev) =>
                [...prev, { id, message: payload.message as string, type }].slice(-MAX_TOASTS),
            );
            timers.current.push(
                setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_MS),
            );
        });
        return () => {
            unsubscribe();
            timers.current.forEach(clearTimeout);
            timers.current = [];
        };
    }, []);

    if (typeof document !== 'undefined' && document.hidden) return null;
    if (toasts.length === 0) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                right: 20,
                bottom: 20,
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxWidth: 380,
            }}
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '0.75rem 1rem',
                        borderRadius: 10,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow)',
                        fontSize: '0.8rem',
                    }}
                >
                    {ICONS[toast.type]}
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button
                        type="button"
                        aria-label="Dismiss notification"
                        onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--slate-500)',
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationToasts;
