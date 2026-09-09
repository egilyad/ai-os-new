import React, { memo } from 'react';
import { CornerDownRight, Edit3, Bookmark } from 'lucide-react';
import type { ChatEntry } from '../../stores/useChatStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import ResponseCard from './ResponseCard';
import { useTranslation } from '../../i18n/useTranslation';
import { formatTime } from './chat-panel-utils';

interface ChatHistoryEntryProps {
    entry: ChatEntry;
    entryIdx: number;
    isEditing: boolean;
    editText: string;
    isSplitView: boolean;
    displayMode: 'standard' | 'technical';
    onStartEdit: (id: string, text: string) => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onSetEditText: (text: string) => void;
    onFork?: (entryId: string) => void;
    onRegenerate?: (entryId: string) => void;
}

const ChatHistoryEntry: React.FC<ChatHistoryEntryProps> = memo(
    ({
        entry,
        entryIdx,
        isEditing,
        editText,
        isSplitView,
        displayMode,
        onStartEdit,
        onCancelEdit,
        onSaveEdit,
        onSetEditText,
        onFork,
        onRegenerate,
    }) => {
        const { t } = useTranslation();
        return entry.role === 'system' ? (
            <div
                key={entry.id}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        padding: '0.35rem 1rem',
                        borderRadius: 12,
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.15)',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        fontStyle: 'italic',
                    }}
                >
                    {entry.text}
                </div>
            </div>
        ) : (
            <div
                key={entry.id}
                style={{ marginBottom: '3rem', position: 'relative', flexShrink: 0 }}
            >
                {entry.parentId && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: '0.5rem',
                            padding: '0.3rem 0.75rem',
                            background: 'rgba(168,85,247,0.06)',
                            border: '1px solid rgba(168,85,247,0.12)',
                            borderRadius: 8,
                            fontSize: '0.7rem',
                            color: '#a855f7',
                            fontWeight: 600,
                        }}
                    >
                        <CornerDownRight size={12} aria-hidden="true" />
                        {t('chat.forked_from')}
                    </div>
                )}

                <div
                    style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '0.75rem',
                            maxWidth: '75%',
                        }}
                    >
                        {isEditing ? (
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                }}
                            >
                                <textarea
                                    value={editText}
                                    onChange={(e) => onSetEditText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            onSaveEdit();
                                        }
                                        if (e.key === 'Escape') onCancelEdit();
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(59,130,246,0.3)',
                                        borderRadius: 12,
                                        color: 'var(--text-main)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        resize: 'none',
                                        fontFamily: 'inherit',
                                        lineHeight: 1.6,
                                    }}
                                    autoFocus
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <button
                                        onClick={onCancelEdit}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: 8,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={onSaveEdit}
                                        className="btn-primary"
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: '1rem 1.5rem',
                                    background: 'var(--bg-panel)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '24px 24px 4px 24px',
                                    fontSize: '1rem',
                                    lineHeight: 1.6,
                                    color: 'var(--text-main)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                    position: 'relative',
                                    cursor: 'pointer',
                                }}
                                onClick={() => onStartEdit(entry.id, entry.text)}
                                title={t('chat.click_to_edit')}
                            >
                                <MarkdownRenderer content={entry.text} />
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        background: 'rgba(0,0,0,0.4)',
                                        padding: 3,
                                        borderRadius: 4,
                                    }}
                                    className="edit-message-hover"
                                >
                                    <Edit3 size={12} color="var(--text-muted)" />
                                </div>
                            </div>
                        )}
                        <span
                            style={{
                                fontSize: '0.6rem',
                                color: 'var(--text-muted)',
                                marginTop: 2,
                                opacity: 0.6,
                            }}
                        >
                            {formatTime(entry.timestamp, t)}
                        </span>

                        {entry.recalledMemories && entry.recalledMemories.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                {entry.recalledMemories.map((m, _idx) => (
                                    <div
                                        key={m.content}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.3rem 0.75rem',
                                            background: 'rgba(168,85,247,0.08)',
                                            border: '1px solid rgba(168,85,247,0.15)',
                                            borderRadius: 100,
                                            fontSize: '0.7rem',
                                            color: '#a855f7',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Bookmark size={10} aria-hidden="true" />
                                        <span>
                                            {t('chat.knowledge_recall_label').replace(
                                                '{0}',
                                                m.content.substring(0, 30),
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {entry.responses.length > 0 && entryIdx > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            left: -8,
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 1,
                        }}
                        aria-hidden="true"
                    />
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isSplitView ? '1fr 1fr' : '1fr',
                        gap: '1.5rem',
                        alignItems: 'start',
                    }}
                >
                    {entry.responses.map((res, j) => (
                        <ResponseCard
                            key={`${entry.id}-${res.id}-${j}`}
                            res={res}
                            entryId={entry.id}
                            onFork={onFork}
                            onRegenerate={onRegenerate}
                            displayMode={displayMode}
                        />
                    ))}
                </div>
            </div>
        );
    },
);

export default ChatHistoryEntry;
