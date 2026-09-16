import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContextMenuAction {
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
    onClick: () => void;
}

interface ContextMenuProps {
    x: number;
    y: number;
    actions: ContextMenuAction[];
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actions, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [focusIndex, setFocusIndex] = React.useState(0);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusIndex((prev) => (prev + 1) % actions.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusIndex((prev) => (prev - 1 + actions.length) % actions.length);
            }
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const action = actions[focusIndex];
                if (action && !action.disabled) {
                    action.onClick();
                    onClose();
                }
            }
        },
        [onClose, actions, focusIndex],
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
        if (items && items[focusIndex]) (items[focusIndex] as HTMLElement).focus();
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, handleKeyDown, focusIndex]);

    const menuWidth = menuRef.current?.offsetWidth ?? 180;
    const menuHeight = menuRef.current?.offsetHeight ?? actions.length * 36 + 16;
    const adjustedX = Math.min(x, Math.max(0, window.innerWidth - menuWidth));
    const adjustedY = Math.min(y, Math.max(0, window.innerHeight - menuHeight));

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{
                    position: 'fixed',
                    left: adjustedX,
                    top: adjustedY,
                    zIndex: 9999,
                    minWidth: 180,
                    background: 'var(--slate-800)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: '0.35rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                }}
                role="menu"
            >
                {actions.map((action, i) => (
                    <React.Fragment key={action.id}>
                        {action.divider && i > 0 && (
                            <div
                                style={{
                                    height: 1,
                                    background: 'rgba(255,255,255,0.06)',
                                    margin: '0.25rem 0',
                                }}
                            />
                        )}
                        <button
                            onClick={() => {
                                if (!action.disabled) {
                                    action.onClick();
                                    onClose();
                                }
                            }}
                            disabled={action.disabled}
                            role="menuitem"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                padding: '0.45rem 0.65rem',
                                borderRadius: 6,
                                border: 'none',
                                background: 'transparent',
                                color: action.danger
                                    ? '#ef4444'
                                    : action.disabled
                                      ? '#475569'
                                      : '#e2e8f0',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: action.disabled ? 'default' : 'pointer',
                                opacity: action.disabled ? 0.4 : 1,
                                transition: 'background 0.1s',
                            }}
                            onMouseEnter={(e) => {
                                if (!action.disabled)
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {action.icon && (
                                <span
                                    style={{
                                        width: 16,
                                        height: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {action.icon}
                                </span>
                            )}
                            <span style={{ flex: 1, textAlign: 'left' }}>{action.label}</span>
                            {action.shortcut && (
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        marginLeft: 12,
                                    }}
                                >
                                    {action.shortcut}
                                </span>
                            )}
                        </button>
                    </React.Fragment>
                ))}
            </motion.div>
        </AnimatePresence>
    );
};
