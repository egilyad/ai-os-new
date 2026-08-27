import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { FocusScope } from '@react-aria/focus';
import { flexColGap4 } from '../../styles/common';

interface SessionPreview {
    title: string;
    history: Array<{
        text: string;
        responses: Array<{ provider: string; content: string }>;
    }>;
}

interface PreviewModalProps {
    session: SessionPreview | null;
    onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ session, onClose }) => (
    <AnimatePresence>
        {session && (
            <FocusScope contain restoreFocus autoFocus>
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '2rem',
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="preview-modal-title"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') onClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="glass-panel"
                        style={{
                            width: '100%',
                            maxWidth: 900,
                            maxHeight: '80vh',
                            overflow: 'auto',
                            borderRadius: 24,
                            padding: '2rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <h3
                                id="preview-modal-title"
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-50)',
                                    margin: 0,
                                }}
                            >
                                {session.title}
                            </h3>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--slate-400)',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                }}
                                aria-label="Close preview modal"
                            >
                                <X size={28} aria-hidden="true" />
                            </button>
                        </div>
                        <div style={flexColGap4}>
                            {session.history.map((entry, i) => (
                                <div
                                    key={`entry-${entry.text?.substring(0, 20) ?? i}`}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '1.25rem',
                                        borderRadius: 16,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            color: 'var(--accent)',
                                            marginBottom: '0.75rem',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        Prompt:
                                    </div>
                                    <div
                                        style={{
                                            color: 'var(--slate-200)',
                                            marginBottom: '1rem',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        {entry.text}
                                    </div>
                                    {entry.responses.map((res, j) => (
                                        <div
                                            key={j}
                                            style={{
                                                background: 'rgba(16,185,129,0.05)',
                                                padding: '1rem',
                                                borderRadius: 12,
                                                marginTop: '0.75rem',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    color: 'var(--success)',
                                                    marginBottom: '0.5rem',
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                Response ({res.provider}):
                                            </div>
                                            <div style={{ color: 'var(--slate-200)', fontSize: '1rem' }}>
                                                {res.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </FocusScope>
        )}
    </AnimatePresence>
);

export default PreviewModal;
