import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Clock,
    ExternalLink,
    MessageCircle,
    Play,
    ThumbsUp,
    ThumbsDown,
    Trash2,
    X,
    Plus,
    Edit3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { CATEGORY_CONFIG, STATUS_CONFIG, formatDate } from './hypothesis-constants';
import type { ResearchHypothesis } from '../../kernel/types/research-types';
import type { HypothesisStatus } from '../../kernel/types/research-types';

interface HypothesisCardProps {
    hypothesis: ResearchHypothesis;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onStatusChange: (id: string, status: HypothesisStatus) => void;
    onDelete: (id: string) => void;
    onStartDebate: (hypothesis: ResearchHypothesis) => void;
    onAddEvidence: (id: string, text: string) => void;
    onRemoveEvidence: (id: string, idx: number) => void;
}

const statusBtnStyle = (status: HypothesisStatus): React.CSSProperties => ({
    padding: '0.3rem 0.6rem',
    borderRadius: 5,
    border: `1px solid ${STATUS_CONFIG[status].color}40`,
    background: `${STATUS_CONFIG[status].color}12`,
    color: STATUS_CONFIG[status].color,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.15s',
});

const nextIcon = (status: HypothesisStatus): React.ReactNode => {
    switch (status) {
        case 'active':
            return <Play size={11} />;
        case 'debating':
            return <MessageCircle size={11} />;
        case 'accepted':
            return <ThumbsUp size={11} />;
        case 'rejected':
            return <ThumbsDown size={11} />;
        default:
            return null;
    }
};

const HypothesisCard: React.FC<HypothesisCardProps> = ({
    hypothesis,
    isExpanded,
    onToggleExpand,
    onStatusChange,
    onDelete,
    onStartDebate,
    onAddEvidence,
    onRemoveEvidence,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [editingEvidence, setEditingEvidence] = useState(false);
    const [evidenceInput, setEvidenceInput] = useState('');

    const h = hypothesis;
    const cfg = CATEGORY_CONFIG[h.category];
    const stCfg = STATUS_CONFIG[h.status];

    const handleAddEvidence = () => {
        if (!evidenceInput.trim()) return;
        onAddEvidence(h.id, evidenceInput.trim());
        setEvidenceInput('');
        setEditingEvidence(false);
    };

    return (
        <div
            style={{
                marginBottom: '0.6rem',
                borderRadius: 10,
                border: `1px solid ${isExpanded ? `${stCfg.color}25` : 'rgba(255,255,255,0.04)'}`,
                background: isExpanded ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.015)',
                overflow: 'hidden',
                transition: 'all 0.15s',
            }}
        >
            {/* Header row */}
            <div
                style={{
                    padding: '0.6rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                }}
                onClick={onToggleExpand}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onToggleExpand();
                }}
                role="button"
                tabIndex={0}
            >
                {isExpanded ? (
                    <ChevronDown size={12} color="#64748b" />
                ) : (
                    <ChevronRight size={12} color="#64748b" />
                )}
                <span
                    style={{
                        color: cfg.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.4rem',
                        borderRadius: 4,
                        background: `${cfg.color}15`,
                    }}
                >
                    {cfg.icon}
                    {t(cfg.labelKey)}
                </span>
                <span
                    style={{
                        flex: 1,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--slate-200)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {h.title}
                </span>
                <span
                    style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 999,
                        fontWeight: 600,
                        background: `${stCfg.color}18`,
                        color: stCfg.color,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {t(stCfg.labelKey)}
                </span>
                <span
                    style={{
                        fontSize: '0.62rem',
                        color: 'var(--slate-600)',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    <Clock size={10} />
                    {formatDate(h.createdAt)}
                </span>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div
                    style={{
                        padding: '0 0.85rem 0.75rem 2.1rem',
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                        paddingTop: '0.6rem',
                    }}
                >
                    <p
                        style={{
                            margin: '0 0 0.6rem',
                            fontSize: '0.78rem',
                            color: 'var(--slate-400)',
                            lineHeight: 1.5,
                        }}
                    >
                        {h.description}
                    </p>

                    {/* Source + evidence */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            marginBottom: '0.6rem',
                            fontSize: '0.72rem',
                            color: 'var(--slate-500)',
                        }}
                    >
                        {h.sourceFile && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <ExternalLink size={11} />
                                <span
                                    onClick={() =>
                                        navigate(
                                            `/project-os?file=${encodeURIComponent(h.sourceFile!)}`,
                                        )
                                    }
                                    style={{
                                        color: '#60a5fa',
                                        fontFamily: 'monospace',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        borderBottom: '1px dashed rgba(96,165,250,0.3)',
                                    }}
                                >
                                    {h.sourceFile}
                                </span>
                            </div>
                        )}
                        {h.linkedDebateId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <MessageCircle size={11} color="#a855f7" />
                                <span style={{ color: '#a855f7' }}>Debate: {h.linkedDebateId}</span>
                            </div>
                        )}

                        {/* Evidence refs */}
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    marginBottom: 3,
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: 'var(--slate-500)',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    Evidence:
                                </span>
                                <button
                                    onClick={() => setEditingEvidence(!editingEvidence)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#60a5fa',
                                        cursor: 'pointer',
                                        fontSize: '0.68rem',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 3,
                                    }}
                                >
                                    <Edit3 size={10} /> {editingEvidence ? 'Done' : 'Edit'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {h.evidenceRefs.map((ref, i) => (
                                    <span
                                        key={ref}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            padding: '0.1rem 0.35rem',
                                            borderRadius: 3,
                                            background: 'rgba(59,130,246,0.08)',
                                            color: '#60a5fa',
                                            fontSize: '0.68rem',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {ref}
                                        {editingEvidence && (
                                            <button
                                                onClick={() => onRemoveEvidence(h.id, i)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--error)',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    fontSize: '0.65rem',
                                                }}
                                            >
                                                <X size={9} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {editingEvidence && (
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={evidenceInput}
                                            onChange={(e) => setEvidenceInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddEvidence();
                                            }}
                                            placeholder="Add ref..."
                                            style={{
                                                width: 120,
                                                padding: '0.1rem 0.35rem',
                                                borderRadius: 3,
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: 'var(--slate-200)',
                                                fontSize: '0.68rem',
                                                outline: 'none',
                                            }}
                                        />
                                        <button
                                            onClick={handleAddEvidence}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--success)',
                                                cursor: 'pointer',
                                                padding: 1,
                                            }}
                                        >
                                            <Plus size={10} />
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 5,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        {stCfg.nextStates.map((next) => (
                            <button
                                key={next}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(h.id, next);
                                }}
                                style={statusBtnStyle(next)}
                            >
                                {nextIcon(next)}
                                {t(STATUS_CONFIG[next].labelKey)}
                            </button>
                        ))}

                        {h.status === 'active' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartDebate(h);
                                }}
                                style={{
                                    ...statusBtnStyle('debating'),
                                    marginLeft: 4,
                                }}
                            >
                                <MessageCircle size={11} /> {t('hypothesis_generator.start_debate')}
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(h.id);
                            }}
                            style={{
                                marginLeft: 'auto',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 5,
                                border: 'none',
                                background: 'rgba(239,68,68,0.08)',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.68rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                            }}
                        >
                            <Trash2 size={11} /> {t('hypothesis_generator.delete')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HypothesisCard;
