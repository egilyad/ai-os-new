/**
 * ChannelPanel — Buzz-like agent channels.
 *
 * Left sidebar: channel list (filtered by type) + create.
 * Right: message stream with threading, reactions, edit/delete, typing indicators.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { channelService } from '../../kernel/instances/services-extras';
import { useChannelStore, ensureSubscribed, destroy } from '../../stores/channel-store';
import { Button, StatusBadge } from '../Common';
import type { ChannelMessage, TypingIndicator, AgentPresence } from '../../kernel/types/channel-types';

const PANEL: React.CSSProperties = { display: 'flex', height: '100%', gap: '0.5rem' };
const SIDEBAR: React.CSSProperties = { width: '240px', borderRight: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const SIDEBAR_HEADER: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const CHANNEL_LIST: React.CSSProperties = { flex: 1, overflow: 'auto', padding: '0.25rem' };
const CHANNEL_ITEM: React.CSSProperties = { padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', marginBottom: '2px' };
const CHANNEL_ITEM_ACTIVE: React.CSSProperties = { ...CHANNEL_ITEM, background: 'var(--surface-alt)' };
const MAIN: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const MESSAGES: React.CSSProperties = { flex: 1, overflow: 'auto', padding: '0.5rem' };
const MSG: React.CSSProperties = { marginBottom: '0.5rem', fontSize: '0.85rem', position: 'relative' };
const MSG_SYSTEM: React.CSSProperties = { ...MSG, color: 'var(--text-secondary)', fontStyle: 'italic' };
const MSG_DELETED: React.CSSProperties = { ...MSG, color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.5 };
const MSG_AUTHOR: React.CSSProperties = { fontWeight: 600, marginRight: '0.4rem' };
const MSG_TIME: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '0.4rem' };
const MSG_ACTIONS: React.CSSProperties = { position: 'absolute', top: '-8px', right: '0', display: 'none', gap: '0.2rem', background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '0.1rem 0.3rem', fontSize: '0.7rem' };
const MSG_HOVER: React.CSSProperties = {};
const THREAD_COUNT: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--accent)', cursor: 'pointer', marginTop: '0.2rem' };
const REACTION: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--border-default)', cursor: 'pointer', marginRight: '0.2rem', marginTop: '0.2rem' };
const REACTION_ACTIVE: React.CSSProperties = { ...REACTION, background: 'var(--accent-muted, #dbeafe)', borderColor: 'var(--accent)' };
const INPUT_BAR: React.CSSProperties = { display: 'flex', gap: '0.5rem', padding: '0.5rem', borderTop: '1px solid var(--border-default)' };
const INPUT: React.CSSProperties = { flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '0.85rem' };
const MEMBER_BADGE: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.4rem', borderRadius: '999px', fontSize: '0.7rem', background: 'var(--surface-alt)', marginRight: '0.3rem', marginBottom: '0.2rem' };
const MEMBERS_BAR: React.CSSProperties = { padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-default)', display: 'flex', flexWrap: 'wrap', gap: '0.2rem', alignItems: 'center' };
const TYPING_BAR: React.CSSProperties = { padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', minHeight: '1.2rem' };
const THREAD_PANEL: React.CSSProperties = { borderLeft: '1px solid var(--border-default)', width: '300px', padding: '0.5rem', overflow: 'auto' };
const REACTION_PICKER: React.CSSProperties = { position: 'absolute', bottom: '100%', right: 0, background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '0.3rem', display: 'flex', gap: '0.2rem', zIndex: 10 };
const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '🚀', '👀', '🔥', '✅'];

const ChannelPanel: React.FC = () => {
    const { t } = useTranslation();
    const { channels, order, selectedId, messages, loading, loadChannels, selectChannel, refresh } = useChannelStore();
    const [input, setInput] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [members, setMembers] = useState<Array<{ agentId: string; displayName: string; status: string; respondTo: string }>>([]);
    const [typing, setTyping] = useState<TypingIndicator[]>([]);
    const [presence, setPresence] = useState<AgentPresence[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'stream' | 'forum' | 'dm'>('stream');
    const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('public');
    const [reactionPickerMsg, setReactionPickerMsg] = useState<string | null>(null);
    const [viewThread, setViewThread] = useState<string | null>(null);
    const [threadMessages, setThreadMessages] = useState<ChannelMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ensureSubscribed();
        loadChannels();
        return () => { destroy(); };
    }, [loadChannels]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!selectedId) { setMembers([]); setTyping([]); setPresence([]); return; }
        const svc = channelService;
        svc.getMembers(selectedId).then(setMembers);
        svc.getPresence(selectedId).then(setPresence);
        const interval = setInterval(() => {
            svc.getTyping(selectedId).then(setTyping);
            svc.getPresence(selectedId).then(setPresence);
        }, 2000);
        return () => clearInterval(interval);
    }, [selectedId, messages]);

    const loadThread = useCallback(async (rootId: string) => {
        const svc = channelService;
        const thread = await svc.getThread(rootId);
        setThreadMessages(thread);
        setViewThread(rootId);
    }, []);

    const handleSend = useCallback(async () => {
        if (!input.trim() || !selectedId) return;
        const svc = channelService;
        const mentions = input.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [];
        await svc.sendMessage({
            channelId: selectedId,
            authorId: 'human',
            content: input.trim(),
            mentions: mentions.length > 0 ? mentions : undefined,
            replyTo: replyTo || undefined,
        });
        setInput('');
        setReplyTo(null);
        refresh();
    }, [input, selectedId, replyTo, refresh]);

    const handleEdit = useCallback(async (msgId: string) => {
        if (!editContent.trim()) return;
        const svc = channelService;
        await svc.editMessage(msgId, editContent, 'human');
        setEditId(null);
        setEditContent('');
        refresh();
    }, [editContent, refresh]);

    const handleDelete = useCallback(async (msgId: string) => {
        const svc = channelService;
        await svc.deleteMessage(msgId, 'human');
        refresh();
    }, [refresh]);

    const handleReaction = useCallback(async (msgId: string, emoji: string) => {
        const svc = channelService;
        await svc.addReaction(msgId, 'human', emoji);
        setReactionPickerMsg(null);
        refresh();
    }, [refresh]);

    const handleCreate = useCallback(async () => {
        if (!newName.trim()) return;
        const svc = channelService;
        await svc.createChannel({
            name: newName.trim(),
            type: newType,
            visibility: newVisibility,
        });
        setNewName('');
        setShowCreate(false);
        refresh();
    }, [newName, newType, newVisibility, refresh]);

    return (
        <div style={PANEL}>
            {/* Sidebar */}
            <div style={SIDEBAR}>
                <div style={SIDEBAR_HEADER}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t('channels.title')}</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowCreate(!showCreate)}>
                        {showCreate ? '✕' : '+'}
                    </Button>
                </div>

                {showCreate && (
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-default)' }}>
                        <input style={{ ...INPUT, width: '100%', marginBottom: '0.3rem' }} placeholder={t('channels.namePlaceholder')} value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
                        <select style={{ ...INPUT, width: '100%', marginBottom: '0.3rem' }} value={newType} onChange={(e) => setNewType(e.target.value as typeof newType)}>
                            <option value="stream">💬 Stream</option>
                            <option value="forum">📋 Forum</option>
                            <option value="dm">✉️ DM</option>
                        </select>
                        <select style={{ ...INPUT, width: '100%', marginBottom: '0.3rem' }} value={newVisibility} onChange={(e) => setNewVisibility(e.target.value as typeof newVisibility)}>
                            <option value="public">🌐 Public</option>
                            <option value="private">🔒 Private</option>
                        </select>
                        <Button variant="primary" size="sm" onClick={handleCreate} style={{ width: '100%' }}>{t('channels.create')}</Button>
                    </div>
                )}

                <div style={CHANNEL_LIST}>
                    {loading && <div style={{ padding: '0.5rem', opacity: 0.5 }}>{t('channels.loading')}</div>}
                    {!loading && order.length === 0 && <div style={{ padding: '0.5rem', opacity: 0.5 }}>{t('channels.empty')}</div>}
                    {order.map((id) => {
                        const ch = channels.get(id);
                        if (!ch) return null;
                        const active = id === selectedId;
                        return (
                            <div key={id} style={active ? CHANNEL_ITEM_ACTIVE : CHANNEL_ITEM} onClick={() => selectChannel(id)}>
                                <div style={{ fontWeight: active ? 600 : 400, fontSize: '0.85rem' }}>
                                    {ch.type === 'forum' ? '📋' : ch.type === 'dm' ? '✉️' : '#'} {ch.name}
                                    {ch.visibility === 'private' && ' 🔒'}
                                </div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                    {ch.memberCount} agent{ch.memberCount !== 1 ? 's' : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main area */}
            <div style={MAIN}>
                {selectedId ? (
                    <>
                        {/* Members bar */}
                        <div style={MEMBERS_BAR}>
                            {members.map((m) => (
                                <span key={m.agentId} style={MEMBER_BADGE}>
                                    <StatusBadge status={m.status === 'online' ? 'success' : m.status === 'busy' ? 'warning' : 'default'} label={m.displayName} />
                                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>({m.respondTo})</span>
                                </span>
                            ))}
                        </div>

                        {/* Messages */}
                        <div style={MESSAGES}>
                            {messages.map((msg) => (
                                <div key={msg.id} style={{ ...MSG, ...MSG_HOVER }}>
                                    {msg.kind === 'system' ? (
                                        <div style={MSG_SYSTEM}>{msg.content}</div>
                                    ) : msg.isDeleted ? (
                                        <div style={MSG_DELETED}>{t('channels.messageDeleted')}</div>
                                    ) : (
                                        <>
                                            {replyTo === msg.id && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '0.2rem' }}>
                                                    ↩ {t('channels.replyingTo')} {msg.authorId}: {msg.content.slice(0, 50)}...
                                                    <span style={{ cursor: 'pointer', marginLeft: '0.5rem' }} onClick={() => setReplyTo(null)}>✕</span>
                                                </div>
                                            )}
                                            <div>
                                                <span style={MSG_AUTHOR}>{msg.authorId}</span>
                                                <span style={MSG_TIME}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                                {msg.updatedAt && <span style={{ ...MSG_TIME, fontStyle: 'italic' }}> (edited)</span>}
                                            </div>
                                            <div>{msg.editedContent || msg.content}</div>

                                            {/* Reactions */}
                                            {msg.reactions.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                                                    {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([emoji, count]) => (
                                                        <span key={emoji} style={REACTION} onClick={() => handleReaction(msg.id, emoji)}>
                                                            {emoji} {count}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Thread link */}
                                            {msg.replyCount > 0 && (
                                                <div style={THREAD_COUNT} onClick={() => loadThread(msg.threadRootId || msg.id)}>
                                                    💬 {msg.replyCount} {t('channels.replies')}
                                                </div>
                                            )}

                                            {/* Hover actions */}
                                            <div className="msg-actions" style={MSG_ACTIONS}>
                                                <span style={{ cursor: 'pointer' }} onClick={() => setReplyTo(msg.id)}>↩</span>
                                                <span style={{ cursor: 'pointer' }} onClick={() => setReactionPickerMsg(reactionPickerMsg === msg.id ? null : msg.id)}>😊</span>
                                                {msg.authorId === 'human' && <span style={{ cursor: 'pointer' }} onClick={() => { setEditId(msg.id); setEditContent(msg.content); }}>✏️</span>}
                                                {msg.authorId === 'human' && <span style={{ cursor: 'pointer' }} onClick={() => handleDelete(msg.id)}>🗑️</span>}
                                            </div>

                                            {/* Reaction picker */}
                                            {reactionPickerMsg === msg.id && (
                                                <div style={REACTION_PICKER}>
                                                    {EMOJI_OPTIONS.map((emoji) => (
                                                        <span key={emoji} style={{ cursor: 'pointer', fontSize: '1rem' }} onClick={() => handleReaction(msg.id, emoji)}>{emoji}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Edit form */}
                                            {editId === msg.id && (
                                                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
                                                    <input style={{ ...INPUT, flex: 1 }} value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEdit(msg.id)} />
                                                    <Button variant="primary" size="sm" onClick={() => handleEdit(msg.id)}>✓</Button>
                                                    <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>✕</Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Typing indicator */}
                        <div style={TYPING_BAR}>
                            {typing.length > 0 && (
                                <span>{typing.map((t) => t.agentId).join(', ')} {t('channels.typing')}</span>
                            )}
                        </div>

                        {/* Reply indicator */}
                        {replyTo && (
                            <div style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-alt)', fontSize: '0.8rem', borderTop: '1px solid var(--border-default)' }}>
                                ↩ {t('channels.replyingTo')} {messages.find((m) => m.id === replyTo)?.authorId}
                                <span style={{ cursor: 'pointer', marginLeft: '0.5rem' }} onClick={() => setReplyTo(null)}>✕</span>
                            </div>
                        )}

                        {/* Input */}
                        <div style={INPUT_BAR}>
                            <input
                                style={INPUT}
                                placeholder={t('channels.inputPlaceholder')}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <Button variant="primary" size="sm" onClick={handleSend}>{t('channels.send')}</Button>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        {t('channels.selectChannel')}
                    </div>
                )}
            </div>

            {/* Thread panel */}
            {viewThread && (
                <div style={THREAD_PANEL}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('channels.thread')}</span>
                        <Button variant="ghost" size="sm" onClick={() => setViewThread(null)}>✕</Button>
                    </div>
                    {threadMessages.map((msg) => (
                        <div key={msg.id} style={{ ...MSG, fontSize: '0.8rem' }}>
                            <span style={MSG_AUTHOR}>{msg.authorId}</span>
                            <span style={MSG_TIME}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            <div>{msg.content}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChannelPanel;
