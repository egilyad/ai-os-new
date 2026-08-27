import { storageAdapter } from '../../kernel/instances';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyList } from '../../stores/useKeyStore';
import { useChatStore } from '../../stores/useChatStore';
import MessageSearchPanel from '../MessageSearchPanel';
import { useTranslation } from '../../i18n/useTranslation';
import ChatSidebar from './ChatSidebar';
import ChatInputArea from './ChatInputArea';
import ChatHeader from './ChatHeader';
import ChatSystemPromptSection from './ChatSystemPromptSection';
import ChatSearchBar from './ChatSearchBar';
import ChatMessagesSection from './ChatMessagesSection';
import ChatStatusToast from './ChatStatusToast';
import ChatExportOverlay from './ChatExportOverlay';

import { iconBtnMuted } from '../../styles/common';
import { DEFAULT_MODELS } from './chat-panel-utils';

const ChatPanel: React.FC = () => {
    const { activeKeys } = useKeyList();
    const activeKeysRef = useRef(activeKeys);
    useEffect(() => {
        activeKeysRef.current = activeKeys;
    }, [activeKeys]);
    const sendMessage = useChatStore((s) => s.sendMessage);
    const activeSessionId = useChatStore((s) => s.activeSessionId);
    const setActiveSessionId = useChatStore((s) => s.setActiveSessionId);
    const createSession = useChatStore((s) => s.createSession);
    const forkSession = useChatStore((s) => s.forkSession);
    const editEntry = useChatStore((s) => s.editEntry);
    const getSessionConfig = useChatStore((s) => s.getSessionConfig);
    const systemPrompt = useChatStore((s) => s.systemPrompt);
    const setSystemPrompt = useChatStore((s) => s.setSystemPrompt);
    const isSending = useChatStore((s) => s.activeRequestIds.size > 0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
        activeKeys.length > 0 ? [activeKeys[0]!.id] : [],
    );
    const lastAutoSelectRef = useRef<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>(
        () =>
            activeKeys[0]?.availableModels?.[0] ||
            DEFAULT_MODELS[activeKeys[0]?.provider || ''] ||
            '',
    );
    useEffect(() => {
        if (activeKeys.length === 0) return;
        const activeIds = new Set(activeKeys.map((k) => k.id));
        if (
            lastAutoSelectRef.current.length > 0 &&
            lastAutoSelectRef.current.some((id) => activeIds.has(id))
        ) {
            return;
        }
        lastAutoSelectRef.current = [activeKeys[0]!.id];
        if (selectedKeys.length > 0) return;
        setSelectedKeys(lastAutoSelectRef.current);
        const firstModel =
            activeKeys[0]?.availableModels?.[0] ||
            DEFAULT_MODELS[activeKeys[0]?.provider || ''] ||
            '';
        setSelectedModel(firstModel);
    }, [activeKeys]); // eslint-disable-line react-hooks/exhaustive-deps

    const { t } = useTranslation();
    const [showSidebar, setShowSidebar] = useState(true);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [displayMode, setDisplayMode] = useState<'standard' | 'technical'>('standard');
    const [isSplitView, setIsSplitView] = useState(
        () => storageAdapter.getItem('chat-split-view') === 'true',
    );
    const [showSearch, setShowSearch] = useState(false);
    const [showExportOverlay, setShowExportOverlay] = useState(false);
    const [systemPromptDraft, setSystemPromptDraft] = useState(systemPrompt);

    const autoExpandedGroupRef = useRef(false);
    const [showSystemPromptInput, setShowSystemPromptInput] = useState(false);
    const [showModelConfig, setShowModelConfig] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{
        text: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);
    const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        },
        [],
    );
    const sidebarWidth = 280;
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [showSearchWithinChat, setShowSearchWithinChat] = useState(false);
    const [searchWithinQuery, setSearchWithinQuery] = useState('');
    const [searchWithinResults, setSearchWithinResults] = useState<number[]>([]);
    const [searchWithinIndex, setSearchWithinIndex] = useState(0);

    const showStatus = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
        setStatusMessage({ text, type });
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => setStatusMessage(null), 3000);
    }, []);

    useEffect(() => {
        storageAdapter.setItem('chat-split-view', String(isSplitView));
    }, [isSplitView]);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const userScrolledUpRef = useRef(false);

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        userScrolledUpRef.current = distFromBottom > 100;
    }, []);

    const [selectedModelPerKey, setSelectedModelPerKey] = useState<Record<string, string>>({});

    const handleSend = useCallback(
        (text: string) => {
            sendMessage(
                selectedKeys.map((id) => ({
                    provider: 'auto',
                    model: selectedModelPerKey[id] || selectedModel,
                    keyId: id,
                })),
                text,
            );
        },
        [sendMessage, selectedKeys, selectedModel, selectedModelPerKey],
    );

    const handleStartEdit = useCallback((id: string, text: string) => {
        setEditingEntryId(id);
        setEditingText(text);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingEntryId(null);
        setEditingText('');
    }, []);

    const handleSaveEdit = useCallback(() => {
        if (editingEntryId && editingText.trim()) {
            editEntry(editingEntryId, editingText);
        }
        setEditingEntryId(null);
        setEditingText('');
    }, [editingEntryId, editingText, editEntry]);

    const activeSessionTitle = useChatStore(
        (s) => s.sessions.find((x) => x.id === s.activeSessionId)?.title ?? '',
    );
    const activeHistoryLen = useChatStore(
        (s) => s.sessions.find((x) => x.id === s.activeSessionId)?.history?.length ?? 0,
    );

    const handleFork = useCallback(
        (entryId: string) => {
            forkSession(entryId);
            showStatus(t('chat.forked'));
        },
        [forkSession, showStatus, t],
    );

    const handleRegenerate = useCallback(
        (entryId: string) => {
            const entry = useChatStore
                .getState()
                .sessions.find((s) => s.id === useChatStore.getState().activeSessionId)
                ?.history?.find((e) => e.id === entryId);
            const originalText = entry?.text || '';
            sendMessage(
                selectedKeys.map((id) => ({
                    provider: 'auto',
                    model: selectedModelPerKey[id] || selectedModel,
                    keyId: id,
                })),
                originalText,
            );
        },
        [sendMessage, selectedKeys, selectedModel, selectedModelPerKey],
    );

    const activeConfig = activeSessionId ? getSessionConfig() : undefined;
    const activeModel = activeConfig?.model || selectedModel;

    const handleNewChat = useCallback(async () => {
        try {
            const newId = await createSession();
            setActiveSessionId(newId);
            setEditingEntryId(null);
            setShowSidebar(true);
            autoExpandedGroupRef.current = true;
        } catch {
            // session creation failed — error logged by createSession
        }
    }, [createSession, setActiveSessionId]);

    const handleSidebarSessionClick = useCallback(
        (id: string) => {
            setActiveSessionId(id);
            setShowSidebar(false);
        },
        [setActiveSessionId],
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            const currentHistory = useChatStore
                .getState()
                .sessions.find((s) => s.id === useChatStore.getState().activeSessionId)?.history;
            if (!searchWithinQuery.trim() || !currentHistory || currentHistory.length === 0) {
                setSearchWithinResults([]);
                return;
            }
            const q = searchWithinQuery.toLowerCase();
            const indices: number[] = [];
            currentHistory.forEach((entry, idx) => {
                const textMatch = entry.text.toLowerCase().includes(q);
                const responseMatch = (entry.responses ?? []).some(
                    (r) => r.content && r.content.toLowerCase().includes(q),
                );
                if (textMatch || responseMatch) indices.push(idx);
            });
            setSearchWithinResults(indices);
            setSearchWithinIndex(0);
        }, 200);
        return () => clearTimeout(timer);
    }, [searchWithinQuery, activeHistoryLen]);

    return (
        <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
            <ChatSidebar
                showSidebar={showSidebar}
                sidebarWidth={sidebarWidth}
                sidebarRef={sidebarRef}
                onNewChat={handleNewChat}
                onSessionClick={handleSidebarSessionClick}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <ChatHeader
                    showSidebar={showSidebar}
                    onToggleSidebar={() => setShowSidebar(!showSidebar)}
                    activeSessionTitle={activeSessionTitle}
                    activeModel={activeModel}
                    onSearchClick={() => setShowSearch(true)}
                    onToggleSearchWithinChat={() => {
                        setShowSearchWithinChat(!showSearchWithinChat);
                        setSearchWithinQuery('');
                    }}
                    displayMode={displayMode}
                    onToggleDisplayMode={() =>
                        setDisplayMode((d) => (d === 'standard' ? 'technical' : 'standard'))
                    }
                    isSplitView={isSplitView}
                    onToggleSplitView={() => {
                        setIsSplitView(!isSplitView);
                        showStatus(
                            isSplitView
                                ? t('chat.split_view_disabled')
                                : t('chat.split_view_enabled'),
                            'info',
                        );
                    }}
                    showSystemPromptInput={showSystemPromptInput}
                    onToggleSystemPrompt={() => setShowSystemPromptInput(!showSystemPromptInput)}
                    onExportClick={() => setShowExportOverlay(true)}
                    t={t}
                />

                {showSystemPromptInput && (
                    <ChatSystemPromptSection
                        value={systemPromptDraft}
                        onChange={setSystemPromptDraft}
                        onSave={() => {
                            setSystemPrompt(systemPromptDraft);
                            showStatus(t('chat.system_prompt_saved'), 'success');
                        }}
                        onClear={() => {
                            setSystemPrompt('');
                            setSystemPromptDraft('');
                            showStatus(t('chat.system_prompt_cleared'), 'info');
                        }}
                        t={t}
                    />
                )}

                {showSearchWithinChat && (
                    <ChatSearchBar
                        value={searchWithinQuery}
                        onChange={setSearchWithinQuery}
                        resultCount={searchWithinResults.length}
                        currentIndex={searchWithinIndex}
                        onPrev={() => setSearchWithinIndex((i) => Math.max(0, i - 1))}
                        onNext={() =>
                            setSearchWithinIndex((i) =>
                                Math.min(searchWithinResults.length - 1, i + 1),
                            )
                        }
                        onClose={() => {
                            setSearchWithinQuery('');
                            setSearchWithinResults([]);
                        }}
                        t={t}
                    />
                )}

                <ChatMessagesSection
                    editingEntryId={editingEntryId}
                    editingText={editingText}
                    isSplitView={isSplitView}
                    displayMode={displayMode}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onSetEditText={setEditingText}
                    onFork={handleFork}
                    onRegenerate={handleRegenerate}
                    searchWithinResults={searchWithinResults}
                    searchWithinIndex={searchWithinIndex}
                    messagesContainerRef={messagesContainerRef}
                    onScroll={handleScroll}
                    messagesEndRef={messagesEndRef}
                    showModelConfig={showModelConfig}
                    onToggleModelConfig={setShowModelConfig}
                />

                <ChatInputArea
                    selectedKeys={selectedKeys}
                    selectedModel={selectedModel}
                    selectedModelPerKey={selectedModelPerKey}
                    onSend={handleSend}
                    isSending={isSending}
                    onError={(msg) => showStatus(msg, 'error')}
                    onKeysChange={setSelectedKeys}
                    onModelChange={setSelectedModel}
                    onSelectedModelsChange={setSelectedModelPerKey}
                />
            </div>

            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            overflow: 'hidden',
                            flexShrink: 0,
                            borderLeft: '1px solid var(--border)',
                            background: 'var(--bg-panel)',
                        }}
                    >
                        <div
                            style={{
                                width: 320,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                    {t('chat.message_search')}
                                </span>
                                <button
                                    onClick={() => setShowSearch(false)}
                                    style={iconBtnMuted}
                                    aria-label={t('common.close')}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto' }}>
                                <MessageSearchPanel />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ChatStatusToast message={statusMessage?.text ?? null} type={statusMessage?.type} />

            {showExportOverlay && (
                <ChatExportOverlay onClose={() => setShowExportOverlay(false)} t={t} />
            )}
        </div>
    );
};

export default ChatPanel;
