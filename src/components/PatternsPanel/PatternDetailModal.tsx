import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Save } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { providerColors } from './pattern-constants';
import type { PatternNote } from './pattern-constants';

interface Props {
    note: PatternNote | null;
    onClose: () => void;
    onEdit: () => void;
    onSave: () => void;
    editDisabled?: boolean;
}

const PatternDetailModal: React.FC<Props> = ({ note, onClose, onEdit, onSave, editDisabled }) => {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {note && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-panel"
                        style={{
                            width: '100%',
                            maxWidth: 800,
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            padding: '2.5rem',
                            borderRadius: 24,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--slate-900)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '2rem',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    color: providerColors[note.provider || 'all'],
                                    fontWeight: 800,
                                    letterSpacing: '0.1em',
                                }}
                            >
                                {note.provider || t('patterns.detail.generic')} / {note.category}
                            </span>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--slate-500)',
                                    cursor: 'pointer',
                                }}
                            >
                                {t('patterns.detail.close')}
                            </button>
                        </div>
                        <h2
                            style={{
                                fontSize: '1.8rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                                marginBottom: '1.5rem',
                            }}
                        >
                            {note.title}
                        </h2>
                        <div
                            style={{
                                fontSize: '1rem',
                                color: 'var(--slate-200)',
                                lineHeight: 1.8,
                                marginBottom: '2rem',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {note.content}
                        </div>
                        {note.links.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h4
                                    style={{
                                        fontSize: '0.9rem',
                                        color: 'var(--slate-500)',
                                        marginBottom: '0.75rem',
                                    }}
                                >
                                    {t('patterns.detail.resources')}
                                </h4>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {note.links.map((link) => (
                                        <a
                                            key={link}
                                            href={link}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--accent-primary)',
                                                fontSize: '0.9rem',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <ExternalLink size={14} /> {link}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '2rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {note.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            fontSize: '0.8rem',
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: 8,
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={onEdit}
                                    style={{
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: 12,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--slate-50)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        opacity: editDisabled ? 0.5 : 1,
                                    }}
                                >
                                    {t('patterns.detail.edit')}
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={onSave}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.6rem 1.5rem',
                                        borderRadius: 12,
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        opacity: editDisabled ? 0.5 : 1,
                                    }}
                                >
                                    <Save size={18} /> {t('patterns.detail.save')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PatternDetailModal;
