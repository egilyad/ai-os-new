import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Zap } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ShortcutEntry {
    keys: string;
    labelKey: string;
    category: string;
    categoryKey: string;
    icon?: React.ReactNode;
    /** false when the shortcut is documented but the global keydown handler is not yet wired */
    wired?: boolean;
}

const SHORTCUTS: ShortcutEntry[] = [
    {
        keys: 'Ctrl+K / ⌘K',
        labelKey: 'shortcuts.command_palette',
        category: 'Global',
        categoryKey: 'shortcuts.category_global',
        icon: <Zap size={14} />,
        wired: true,
    },
    {
        keys: '?',
        labelKey: 'shortcuts.toggle_legend',
        category: 'Global',
        categoryKey: 'shortcuts.category_global',
        wired: true,
    },
    {
        keys: 'Escape',
        labelKey: 'shortcuts.cancel_close',
        category: 'Global',
        categoryKey: 'shortcuts.category_global',
        wired: true,
    },
    {
        keys: 'Ctrl+,',
        labelKey: 'shortcuts.open_settings',
        category: 'Global',
        categoryKey: 'shortcuts.category_global',
        wired: false,
    },
    {
        keys: 'Enter',
        labelKey: 'shortcuts.send_message',
        category: 'Chat',
        categoryKey: 'shortcuts.category_chat',
        icon: <Send size={14} />,
        wired: true,
    },
    {
        keys: 'Ctrl+Shift+N',
        labelKey: 'shortcuts.new_chat',
        category: 'Chat',
        categoryKey: 'shortcuts.category_chat',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+F',
        labelKey: 'shortcuts.search_messages',
        category: 'Chat',
        categoryKey: 'shortcuts.category_chat',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+E',
        labelKey: 'shortcuts.export_chat',
        category: 'Chat',
        categoryKey: 'shortcuts.category_chat',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+D',
        labelKey: 'shortcuts.start_debate',
        category: 'Debate',
        categoryKey: 'shortcuts.category_debate',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+P',
        labelKey: 'shortcuts.pause_resume',
        category: 'Debate',
        categoryKey: 'shortcuts.category_debate',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+S',
        labelKey: 'shortcuts.save_snapshot',
        category: 'Debate',
        categoryKey: 'shortcuts.category_debate',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+H',
        labelKey: 'shortcuts.toggle_health',
        category: 'Providers',
        categoryKey: 'shortcuts.category_providers',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+K',
        labelKey: 'shortcuts.toggle_keys',
        category: 'Providers',
        categoryKey: 'shortcuts.category_providers',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+T',
        labelKey: 'shortcuts.open_traces',
        category: 'Diagnostics',
        categoryKey: 'shortcuts.category_diagnostics',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+L',
        labelKey: 'shortcuts.open_logs',
        category: 'Diagnostics',
        categoryKey: 'shortcuts.category_diagnostics',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+M',
        labelKey: 'shortcuts.open_memory',
        category: 'Knowledge',
        categoryKey: 'shortcuts.category_knowledge',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+R',
        labelKey: 'shortcuts.open_routing',
        category: 'Diagnostics',
        categoryKey: 'shortcuts.category_diagnostics',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+W',
        labelKey: 'shortcuts.toggle_workspace',
        category: 'Tools',
        categoryKey: 'shortcuts.category_tools',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+C',
        labelKey: 'shortcuts.open_cache',
        category: 'Tools',
        categoryKey: 'shortcuts.category_tools',
        wired: false,
    },
    {
        keys: 'Ctrl+Shift+B',
        labelKey: 'shortcuts.toggle_sidebar',
        category: 'Global',
        categoryKey: 'shortcuts.category_global',
        wired: false,
    },
];

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const focusTrapRef = useFocusTrap(isOpen);
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                if (isOpen) onClose();
            }
        },
        [onClose, isOpen],
    );

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={focusTrapRef}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '90%',
                            maxWidth: 520,
                            maxHeight: '80vh',
                            background: 'var(--slate-800)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 16,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1.25rem 1.5rem',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                                {t('shortcuts.title')}
                            </h2>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--slate-400)',
                                    cursor: 'pointer',
                                    padding: 4,
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div
                            style={{
                                padding: '1rem 1.5rem 1.5rem',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.25rem',
                            }}
                        >
                            {categories.map((cat) => {
                                const first = SHORTCUTS.find((s) => s.category === cat);
                                return (
                                    <div key={cat}>
                                        <div
                                            style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                color: 'var(--slate-500)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em',
                                                marginBottom: '0.5rem',
                                            }}
                                        >
                                            {t(first?.categoryKey || cat)}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.35rem',
                                            }}
                                        >
                                            {SHORTCUTS.filter((s) => s.category === cat).map(
                                                (s) => (
                                                    <div
                                                        key={s.keys}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0.4rem 0.5rem',
                                                            borderRadius: 8,
                                                            background: 'rgba(255,255,255,0.02)',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 8,
                                                                fontSize: '0.85rem',
                                                                color: 'var(--slate-200)',
                                                            }}
                                                        >
                                                            {s.icon && (
                                                                <span
                                                                    style={{
                                                                        color: 'var(--slate-500)',
                                                                        display: 'flex',
                                                                    }}
                                                                >
                                                                    {s.icon}
                                                                </span>
                                                            )}
                                                            <span>{t(s.labelKey)}</span>
                                                            {s.wired !== true && (
                                                                <span
                                                                    style={{
                                                                        fontSize: '0.6rem',
                                                                        color: 'var(--slate-500)',
                                                                        background:
                                                                            'rgba(100,116,139,0.15)',
                                                                        padding: '0.1rem 0.35rem',
                                                                        borderRadius: 4,
                                                                        marginLeft: 6,
                                                                    }}
                                                                >
                                                                    Planned
                                                                </span>
                                                            )}
                                                        </div>
                                                        <kbd
                                                            style={{
                                                                padding: '0.2rem 0.5rem',
                                                                background:
                                                                    'rgba(255,255,255,0.06)',
                                                                borderRadius: 4,
                                                                fontSize: '0.7rem',
                                                                fontFamily: 'monospace',
                                                                color: '#a855f7',
                                                                border: '1px solid rgba(168,85,247,0.2)',
                                                                fontWeight: 700,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {s.keys}
                                                        </kbd>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
