import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, GitCommit, Save, Link, Zap, FileText } from 'lucide-react';
import type { GraphNodeData, EdgeData } from './graph-utils';
import { getNodeColor } from './graph-utils';
import {
    flexBetweenStart,
    flexCenterGap3,
    flexGap2,
    flexColGap2,
    grid2,
    textSmBoldUppercase,
    textXsUppercaseBold,
    textSmWeight600FlexGap6,
    infoCardBorderVar,
    edgeRow,
} from '../../styles/common';

interface NodeDetailSidebarProps {
    selectedNode: GraphNodeData | null;
    editContent: string;
    isEditing: boolean;
    isSaving: boolean;
    edges: EdgeData[];
    onEditContentChange: (v: string) => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
    t: (key: string) => string;
}

const NodeDetailSidebar: React.FC<NodeDetailSidebarProps> = ({
    selectedNode,
    editContent,
    isEditing,
    isSaving,
    edges,
    onEditContentChange,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDelete,
    onClose,
    t,
}) => {
    const connectedEdges = edges.filter(
        (e) => e.source.id === selectedNode?.id || e.target.id === selectedNode?.id,
    );

    return (
        <AnimatePresence>
            {selectedNode && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: 'spring', damping: 25 }}
                    style={{
                        padding: '1.5rem',
                        borderRadius: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(15,23,42,0.8)',
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                    role="dialog"
                    aria-label="Node details"
                >
                    <div style={flexBetweenStart}>
                        <div style={flexCenterGap3}>
                            <div
                                style={{
                                    padding: '0.5rem',
                                    background: `${getNodeColor(selectedNode.type)}20`,
                                    borderRadius: 10,
                                    border: `1px solid ${getNodeColor(selectedNode.type)}40`,
                                }}
                            >
                                <GitCommit
                                    size={20}
                                    color={getNodeColor(selectedNode.type)}
                                    aria-hidden="true"
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: getNodeColor(selectedNode.type),
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    {selectedNode.type} NODE
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--slate-400)',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {selectedNode.id}
                                </div>
                            </div>
                        </div>
                        <div style={flexGap2}>
                            <button
                                onClick={onDelete}
                                style={{
                                    padding: '0.4rem',
                                    borderRadius: 8,
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    background: 'var(--error-tint)',
                                    color: '#fca5a5',
                                    cursor: 'pointer',
                                }}
                                aria-label={t('knowledge.delete_aria')}
                            >
                                <Trash2 size={14} aria-hidden="true" />
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '0.4rem',
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--slate-200)',
                                    cursor: 'pointer',
                                }}
                                aria-label={t('knowledge.close_details_aria')}
                            >
                                <X size={14} aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                        }}
                    >
                        <div>
                            <div style={textSmBoldUppercase}>{t('knowledge.semantic_content')}</div>
                            {isEditing ? (
                                <div style={flexColGap2}>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => onEditContentChange(e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: 100,
                                            padding: '0.75rem',
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid rgba(168,85,247,0.3)',
                                            borderRadius: 10,
                                            color: 'var(--slate-50)',
                                            fontSize: '0.85rem',
                                            lineHeight: 1.6,
                                            resize: 'vertical',
                                            outline: 'none',
                                            fontFamily:
                                                selectedNode.type === 'code'
                                                    ? 'monospace'
                                                    : 'inherit',
                                        }}
                                        aria-label={t('knowledge.edit_aria')}
                                    />
                                    <div style={flexGap2}>
                                        <button
                                            onClick={onSaveEdit}
                                            disabled={isSaving}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: 8,
                                                border: 'none',
                                                background: '#a855f7',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                            aria-label={t('knowledge.save_aria')}
                                        >
                                            <Save size={14} aria-hidden="true" />{' '}
                                            {isSaving ? t('knowledge.saving') : t('common.save')}
                                        </button>
                                        <button
                                            onClick={onCancelEdit}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: 8,
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'transparent',
                                                color: 'var(--slate-400)',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                            }}
                                            aria-label={t('knowledge.cancel_edit')}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '1rem',
                                        borderRadius: 10,
                                        border: '1px solid var(--border)',
                                        fontSize: '0.85rem',
                                        color: 'var(--slate-50)',
                                        lineHeight: 1.6,
                                        fontFamily:
                                            selectedNode.type === 'code' ? 'monospace' : 'inherit',
                                        cursor: 'pointer',
                                    }}
                                    onClick={onStartEdit}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={t('knowledge.click_edit_aria')}
                                >
                                    {selectedNode.fullContent || ''}
                                </div>
                            )}
                        </div>

                        <div style={grid2}>
                            <div style={infoCardBorderVar}>
                                <div style={textXsUppercaseBold}>{t('knowledge.source')}</div>
                                <div style={textSmWeight600FlexGap6}>
                                    <FileText size={14} aria-hidden="true" /> {selectedNode.source}
                                </div>
                            </div>
                            <div style={infoCardBorderVar}>
                                <div style={textXsUppercaseBold}>{t('knowledge.importance')}</div>
                                <div style={textSmWeight600FlexGap6}>
                                    <Zap size={14} color="#f59e0b" aria-hidden="true" />{' '}
                                    {Math.round(selectedNode.importance * 100)}%
                                </div>
                            </div>
                        </div>

                        <div>
                            <div style={textSmBoldUppercase}>Connected Edges</div>
                            <div style={flexColGap2}>
                                {connectedEdges.slice(0, 4).map((e) => {
                                    const other =
                                        e.source.id === selectedNode.id ? e.target : e.source;
                                    return (
                                        <div key={`${e.source.id}-${e.target.id}`} style={edgeRow}>
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    fontSize: '0.75rem',
                                                    color: 'var(--slate-300)',
                                                }}
                                            >
                                                <Link size={12} aria-hidden="true" />{' '}
                                                {other.label.substring(0, 15)}...
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    color: 'var(--accent)',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                STR {Math.round(e.strength * 100)}
                                            </span>
                                        </div>
                                    );
                                })}
                                {connectedEdges.length === 0 && (
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-500)',
                                            textAlign: 'center',
                                            padding: '0.5rem',
                                        }}
                                    >
                                        {t('knowledge.no_edges')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NodeDetailSidebar;
