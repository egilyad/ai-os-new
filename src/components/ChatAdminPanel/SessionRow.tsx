import { motion } from 'framer-motion';
import {
    CheckSquare,
    Square,
    MessageSquare,
    Hash,
    History,
    Share2,
    Clock,
    Eye,
    ExternalLink,
    Trash2,
} from 'lucide-react';
import { tdPadding, statBadgePill, flexWrapGap4, flexCenterGap8 } from '../../styles/common';
import { Button } from '../Common';

interface SessionRowProps {
    session: {
        id: string;
        title: string;
        history: Array<{ text: string; responses: Array<{ provider: string; content: string }> }>;
        updatedAt: number;
    };
    isSelected: boolean;
    onToggleSelect: () => void;
    onPreview: () => void;
    onOpenChat: () => void;
    onDelete: () => void;
}

const SessionRow: React.FC<SessionRowProps> = ({
    session,
    isSelected,
    onToggleSelect,
    onPreview,
    onOpenChat,
    onDelete,
}) => (
    <motion.tr
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
            background: isSelected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
            transition: 'background 0.2s',
        }}
        onMouseEnter={(e) =>
            (e.currentTarget.style.background = isSelected
                ? 'rgba(59,130,246,0.12)'
                : 'rgba(255,255,255,0.05)')
        }
        onMouseLeave={(e) =>
            (e.currentTarget.style.background = isSelected
                ? 'rgba(59,130,246,0.08)'
                : 'rgba(255,255,255,0.02)')
        }
    >
        <td style={{ borderRadius: '16px 0 0 16px', padding: '1.25rem' }}>
            <div
                style={{ cursor: 'pointer' }}
                onClick={onToggleSelect}
                role="button"
                tabIndex={0}
                aria-label={`Toggle selection for session ${session.title}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleSelect();
                    }
                }}
            >
                {isSelected ? (
                    <CheckSquare size={20} color="#3b82f6" aria-hidden="true" />
                ) : (
                    <Square size={20} color="#64748b" aria-hidden="true" />
                )}
            </div>
        </td>
        <td style={tdPadding}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div
                    style={{
                        padding: '1rem',
                        background: 'rgba(59,130,246,0.15)',
                        borderRadius: 14,
                    }}
                >
                    <MessageSquare size={24} color="#3b82f6" />
                </div>
                <div>
                    <div
                        style={{
                            fontWeight: 700,
                            color: 'var(--slate-50)',
                            fontSize: '1.1rem',
                            marginBottom: 6,
                        }}
                    >
                        {session.title}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.8rem',
                            color: 'var(--slate-500)',
                            fontFamily: 'monospace',
                        }}
                    >
                        <Hash size={12} /> {session.id}
                    </div>
                </div>
            </div>
        </td>
        <td style={tdPadding}>
            <div style={flexWrapGap4}>
                <div style={statBadgePill}>
                    <History size={16} color="#10b981" /> {session.history.length} Prompts
                </div>
                <div style={statBadgePill}>
                    <Share2 size={16} color="#a855f7" />
                    {session.history.reduce((acc, h) => acc + h.responses.length, 0)} Responses
                </div>
            </div>
        </td>
        <td style={{ padding: '1.25rem', color: 'var(--slate-400)', fontSize: '1rem' }}>
            <div style={flexCenterGap8}>
                <Clock size={18} />
                {new Date(session.updatedAt).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                })}
            </div>
        </td>
        <td style={{ padding: '1.25rem', textAlign: 'right', borderRadius: '0 16px 16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button
                    variant="ghost"
                    onClick={onPreview}
                    className="btn-secondary"
                    title="Preview Session"
                    aria-label={`Preview session ${session.title}`}
                >
                    <Eye size={20} aria-hidden="true" />
                </Button>
                <Button
                    variant="ghost"
                    onClick={onOpenChat}
                    className="btn-secondary"
                    title="Open in Terminal"
                    aria-label={`Open session ${session.title} in chat`}
                >
                    <ExternalLink size={20} aria-hidden="true" />
                </Button>
                <button
                    onClick={onDelete}
                    className="btn-secondary"
                    style={{
                        padding: '0.75rem',
                        color: 'var(--error)',
                        borderColor: 'rgba(239,68,68,0.3)',
                        borderRadius: 12,
                        fontSize: '0.95rem',
                    }}
                    title="Delete Thread"
                    aria-label={`Delete session ${session.title}`}
                >
                    <Trash2 size={20} aria-hidden="true" />
                </button>
            </div>
        </td>
    </motion.tr>
);

export default SessionRow;
