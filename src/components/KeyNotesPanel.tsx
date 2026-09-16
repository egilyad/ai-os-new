import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StickyNote, Search, Tag, AlertTriangle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/useTranslation';
import { keyService } from '../kernel/instances';
import { errorContainer, dismissBtnRed } from '../styles/common';
import { useConfirm } from '../hooks/useConfirm';
import { KeySelectorSidebar } from './KeyNotesPanel/KeySelectorSidebar';
import { NoteInputForm } from './KeyNotesPanel/NoteInputForm';
import { NoteCard } from './KeyNotesPanel/NoteCard';
import { FilePreviewModal } from './KeyNotesPanel/FilePreviewModal';
import type { AttachedFile, EnhancedNote } from './KeyNotesPanel/key-notes-types';

const KeyNotesPanel: React.FC = () => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const [keys, setKeys] = useState<
        Array<{ id: string; provider: string; label: string; notes: EnhancedNote[] }>
    >([]);
    const [selectedKeyId, setSelectedKeyId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [newText, setNewText] = useState('');
    const [newTags, setNewTags] = useState('');
    const [attachments, setAttachments] = useState<AttachedFile[]>([]);
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);
    const isMountedRef = useRef(true);

    const loadNotes = useCallback(() => {
        try {
            const all = keyService.getKeys();
            const list = all.map((k) => ({
                id: k.id,
                provider: k.provider,
                label: k.label || k.provider,
                notes: ((k as { notes?: EnhancedNote[] }).notes ?? []) as EnhancedNote[],
            }));
            if (isMountedRef.current) {
                setKeys(list);
                if (!selectedKeyId && list.length > 0) setSelectedKeyId(list[0]!.id);
            }
        } catch (err) {
            if (isMountedRef.current) setError(String(err));
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, [selectedKeyId]);

    useEffect(() => {
        isMountedRef.current = true;
        loadNotes();
        return () => {
            isMountedRef.current = false;
        };
    }, [loadNotes]);

    const handleAddNote = useCallback(async () => {
        if (!selectedKeyId || !newText.trim()) return;
        setAdding(true);
        try {
            const tags = newTags
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            await keyService.addNote(selectedKeyId, newText.trim(), 'admin');
            const k = keyService.getKeys().find((x) => x.id === selectedKeyId);
            if (k && attachments.length > 0) {
                const notes = (k as { notes?: EnhancedNote[] }).notes ?? [];
                const last = notes[notes.length - 1];
                if (last) {
                    last.attachments = attachments;
                    if (tags.length > 0) last.tags = tags;
                    await keyService.updateKey(selectedKeyId, { notes: k.notes });
                }
            } else if (k && tags.length > 0) {
                const notes = (k as { notes?: EnhancedNote[] }).notes ?? [];
                const last = notes[notes.length - 1];
                if (last) {
                    last.tags = tags;
                    await keyService.updateKey(selectedKeyId, { notes: k.notes });
                }
            }
            setNewText('');
            setNewTags('');
            setAttachments([]);
            loadNotes();
        } catch (err) {
            if (isMountedRef.current) setError(String(err));
        } finally {
            if (isMountedRef.current) setAdding(false);
        }
    }, [selectedKeyId, newText, newTags, attachments, loadNotes]);

    const handleDeleteNote = useCallback(
        async (noteId: string) => {
            if (!selectedKeyId) return;
            if (
                !(await confirm({
                    title: 'Delete Note',
                    message: 'Delete this note?',
                    variant: 'danger',
                }))
            )
                return;
            try {
                const k = keyService.getKeys().find((x) => x.id === selectedKeyId);
                if (!k) return;
                const notes = ((k as { notes?: EnhancedNote[] }).notes ?? []).filter(
                    (n) => n.id !== noteId,
                );
                await keyService.updateKey(selectedKeyId, { notes });
                loadNotes();
            } catch (err) {
                if (isMountedRef.current) setError(String(err));
            }
        },
        [selectedKeyId, loadNotes, confirm],
    );

    const filteredNotes = (() => {
        if (!selectedKeyId) return [];
        const key = keys.find((k) => k.id === selectedKeyId);
        if (!key) return [];
        let list = key.notes.slice().sort((a, b) => b.timestamp - a.timestamp);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (n) =>
                    n.text.toLowerCase().includes(q) ||
                    n.tags?.some((tg) => tg.toLowerCase().includes(q)),
            );
        }
        if (activeTag) list = list.filter((n) => n.tags?.includes(activeTag));
        return list;
    })();

    const allTags = (() => {
        const set = new Set<string>();
        for (const k of keys) for (const n of k.notes) for (const tg of n.tags ?? []) set.add(tg);
        return Array.from(set).sort();
    })();

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--slate-400)',
                }}
            >
                <Loader2 size={20} className="animate-spin" />
            </div>
        );
    }

    if (keys.length === 0) {
        return (
            <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
                <h2
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        margin: '0 0 0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: 'var(--slate-50)',
                    }}
                >
                    <StickyNote size={26} color="#f59e0b" /> {t('key_notes.title')}
                </h2>
                <p style={{ color: 'var(--slate-400)' }}>{t('key_notes.no_keys')}</p>
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem',
                overflow: 'auto',
            }}
        >
            <div
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}
            >
                <h2
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        margin: '0 0 0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: 'var(--slate-50)',
                    }}
                >
                    <StickyNote size={26} color="#f59e0b" /> {t('key_notes.title')}
                </h2>
                <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                    {t('key_notes.subtitle')}
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={errorContainer}
                >
                    <AlertTriangle size={16} /> {error}
                    <button onClick={() => setError(null)} style={dismissBtnRed}>
                        <X size={18} />
                    </button>
                </motion.div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '240px 1fr',
                    gap: '1rem',
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <KeySelectorSidebar
                    keys={keys}
                    selectedKeyId={selectedKeyId}
                    onSelect={(id) => {
                        setSelectedKeyId(id);
                        setActiveTag(null);
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        minWidth: 0,
                    }}
                >
                    <NoteInputForm
                        text={newText}
                        tags={newTags}
                        attachments={attachments}
                        adding={adding}
                        onTextChange={setNewText}
                        onTagsChange={setNewTags}
                        onAttachmentsChange={setAttachments}
                        onAdd={handleAddNote}
                    />

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search
                                size={14}
                                style={{ position: 'absolute', left: 8, top: 8, color: 'var(--slate-400)' }}
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('key_notes.search_placeholder')}
                                style={{
                                    width: '100%',
                                    padding: '0.4rem 0.5rem 0.4rem 28px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.8rem',
                                }}
                            />
                        </div>
                        {activeTag && (
                            <button
                                onClick={() => setActiveTag(null)}
                                style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: 12,
                                    border: '1px solid #ef4444',
                                    background: 'var(--error-tint)',
                                    color: '#fca5a5',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                }}
                            >
                                ✕ {activeTag}
                            </button>
                        )}
                    </div>

                    {allTags.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <Tag size={12} color="#94a3b8" />
                            {allTags
                                .filter((tg) => tg !== activeTag)
                                .slice(0, 12)
                                .map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => setActiveTag(tag)}
                                        style={{
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: 10,
                                            border: '1px solid rgba(245,158,11,0.3)',
                                            background: 'rgba(245,158,11,0.05)',
                                            color: 'var(--warning)',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem',
                                        }}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                        </div>
                    )}

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            overflow: 'auto',
                            flex: 1,
                        }}
                    >
                        <AnimatePresence>
                            {filteredNotes.map((note) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onDelete={handleDeleteNote}
                                    onPreview={setPreviewFile}
                                />
                            ))}
                        </AnimatePresence>
                        {filteredNotes.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                                {t('key_notes.no_notes')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
            <ConfirmDialog />
        </div>
    );
};

export default KeyNotesPanel;
