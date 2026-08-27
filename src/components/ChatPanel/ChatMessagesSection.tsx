import React, { useCallback, useEffect, useRef } from 'react';
import { BrainCircuit, X } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ChatHistoryEntry from './ChatHistoryEntry';
import { useTranslation } from '../../i18n/useTranslation';
import { useActiveSessionHistory } from '../../stores/useChatStore';
import type { ChatResponse } from '../../types/chat';

interface Props {
    editingEntryId: string | null;
    editingText: string;
    isSplitView: boolean;
    displayMode: 'standard' | 'technical';
    onStartEdit: (id: string, text: string) => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onSetEditText: (text: string) => void;
    onFork: (entryId: string) => void;
    onRegenerate: (entryId: string) => void;
    searchWithinResults: number[];
    searchWithinIndex: number;
    messagesContainerRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    showModelConfig: string | null;
    onToggleModelConfig: (id: string | null) => void;
}

const ChatMessagesSection: React.FC<Props> = ({
    editingEntryId,
    editingText,
    isSplitView,
    displayMode,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onSetEditText,
    onFork,
    onRegenerate,
    searchWithinResults,
    searchWithinIndex,
    messagesContainerRef,
    onScroll,
    messagesEndRef,
    showModelConfig,
    onToggleModelConfig,
}) => {
    const { t } = useTranslation();
    const userScrolledUpRef = useRef(false);
    const historyEntries = useActiveSessionHistory();

    const count = historyEntries?.length ?? 0;

    const virtualizer = useVirtualizer({
        count,
        getScrollElement: () => messagesContainerRef.current,
        estimateSize: () => 120,
        overscan: 5,
    });

    const items = virtualizer.getVirtualItems();

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        userScrolledUpRef.current = distFromBottom > 100;
        onScroll();
    }, [messagesContainerRef, onScroll]);

    const historyLen = count;
    const lastContentLen =
        historyEntries && historyEntries.length > 0
            ? (historyEntries[historyEntries.length - 1]!.responses?.reduce(
                  (sum, r) => sum + (r.content?.length ?? 0),
                  0,
              ) ?? 0)
            : 0;

    useEffect(() => {
        if (count === 0 || userScrolledUpRef.current) return;
        virtualizer.scrollToIndex(count - 1, { align: 'end' });
    }, [historyLen, lastContentLen, virtualizer, count]);

    return (
        <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}
        >
            {historyEntries && historyEntries.length > 0 ? (
                <div
                    id="chat-messages-container"
                    style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
                >
                    {items.map((virtualItem) => {
                        const entry = historyEntries[virtualItem.index]!;
                        const entryIdx = virtualItem.index;
                        const isEditing = editingEntryId === entry.id;
                        const isSearchMatch = searchWithinResults.includes(entryIdx);
                        const searchRef =
                            isSearchMatch &&
                            searchWithinIndex === searchWithinResults.indexOf(entryIdx)
                                ? 'chat-search-highlight'
                                : undefined;

                        return (
                            <div
                                key={virtualItem.key}
                                id={searchRef}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: virtualItem.size,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                <ChatHistoryEntry
                                    entry={entry}
                                    entryIdx={entryIdx}
                                    isEditing={isEditing}
                                    editText={editingText}
                                    isSplitView={isSplitView}
                                    displayMode={displayMode}
                                    onStartEdit={onStartEdit}
                                    onCancelEdit={onCancelEdit}
                                    onSaveEdit={onSaveEdit}
                                    onSetEditText={onSetEditText}
                                    onFork={onFork}
                                    onRegenerate={onRegenerate}
                                />
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: '1rem',
                        color: 'var(--text-muted)',
                    }}
                >
                    <BrainCircuit size={48} style={{ opacity: 0.3 }} aria-hidden="true" />
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {t('chat.empty_title')}
                    </div>
                    <div style={{ fontSize: '0.85rem', maxWidth: 400, textAlign: 'center' }}>
                        {t('chat.empty_desc')}
                    </div>
                </div>
            )}

            {showModelConfig && historyEntries && historyEntries.length > 0 && (
                <div
                    style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: 12,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <div
                        style={{
                            marginBottom: '0.75rem',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>{t('chat.model_config')}</span>
                        <button
                            onClick={() => onToggleModelConfig(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    {historyEntries.map((entry, idx) => (
                        <div
                            key={entry.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem 0',
                                borderBottom:
                                    idx < historyEntries.length - 1
                                        ? '1px solid rgba(255,255,255,0.05)'
                                        : 'none',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 200,
                                }}
                            >
                                {entry.text.substring(0, 60)}
                                {entry.text.length > 60 ? '...' : ''}
                            </span>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                {entry.responses.map((res: ChatResponse, j: number) => (
                                    <span
                                        key={res.provider + ':' + res.model + ':' + j}
                                        style={{
                                            fontSize: '0.7rem',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        {res.provider} / {res.model}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatMessagesSection;
