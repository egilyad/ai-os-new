import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { promptLibraryService } from '../kernel/instances';
import { eventBus } from '../kernel/instances';
import { EVENTS } from '../kernel/events/event-names';
import { useTranslation } from '../i18n/useTranslation';
import { Search, Plus, X, Copy, MessageSquare, Trash2, Star, FileText } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { PromptTemplate } from '../kernel/contracts/prompt-library';

const CATEGORIES = ['all', 'engineering', 'security', 'strategy', 'research', 'general'] as const;
const CATEGORY_COLORS: Record<string, string> = {
    engineering: '#3b82f6',
    security: '#ef4444',
    strategy: '#f59e0b',
    research: '#a855f7',
    general: '#64748b',
};

const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.2s',
    border: '1px solid rgba(255,255,255,0.08)',
};

const PromptLibraryPanel: React.FC = () => {
    const { t } = useTranslation();
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formCategory, setFormCategory] = useState('general');
    const [formTags, setFormTags] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const focusTrapRef = useFocusTrap(showModal);

    const loadPrompts = useCallback(async () => {
        const all = await promptLibraryService.getAll();
        setPrompts(all);
    }, []);

    useEffect(() => {
        loadPrompts();
    }, [loadPrompts]);

    const filteredPrompts = useMemo(() => {
        let result = prompts;
        if (activeCategory !== 'all') {
            result = result.filter((p) => p.category === activeCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.content.toLowerCase().includes(q) ||
                    p.tags.some((t) => t.toLowerCase().includes(q)),
            );
        }
        return result;
    }, [prompts, activeCategory, searchQuery]);

    const handleCopy = async (prompt: PromptTemplate) => {
        try {
            await navigator.clipboard.writeText(prompt.content);
            setCopiedId(prompt.id);
            await promptLibraryService.incrementUsage(prompt.id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch {
            eventBus.emit(EVENTS.NOTIFICATION, { message: 'Failed to copy', type: 'error' });
        }
    };

    const handleUseInChat = async (prompt: PromptTemplate) => {
        await navigator.clipboard.writeText(prompt.content);
        setCopiedId(prompt.id);
        await promptLibraryService.incrementUsage(prompt.id);
        eventBus.emit(EVENTS.NOTIFICATION, { message: t('prompts.copied'), type: 'success' });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (prompt: PromptTemplate) => {
        if (prompt.isBuiltIn) return;
        await promptLibraryService.remove(prompt.id);
        await loadPrompts();
    };

    const openCreateModal = () => {
        setEditingPrompt(null);
        setFormTitle('');
        setFormContent(t('prompts.form_content'));
        setFormCategory('general');
        setFormTags('');
        setShowModal(true);
    };

    const openEditModal = (prompt: PromptTemplate) => {
        if (prompt.isBuiltIn) return;
        setEditingPrompt(prompt);
        setFormTitle(prompt.title);
        setFormContent(prompt.content);
        setFormCategory(prompt.category);
        setFormTags(prompt.tags.join(', '));
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formTitle.trim() || !formContent.trim()) return;
        const tags = formTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        if (editingPrompt) {
            await promptLibraryService.update(editingPrompt.id, {
                title: formTitle.trim(),
                content: formContent.trim(),
                category: formCategory,
                tags,
            });
        } else {
            await promptLibraryService.create({
                title: formTitle.trim(),
                content: formContent.trim(),
                category: formCategory,
                tags,
                variables: [],
            });
        }
        setShowModal(false);
        await loadPrompts();
    };

    return (
        <div
            style={{
                padding: '2rem',
                maxWidth: 1200,
                margin: '0 auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2
                        style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-200)' }}
                    >
                        {t('prompts.title')}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                        {t('prompts.subtitle')}
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                    }}
                >
                    <Plus size={16} /> {t('prompts.create')}
                </button>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 16,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                    />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('prompts.search_placeholder')}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 32px',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '4px 12px',
                                borderRadius: 16,
                                fontSize: '0.78rem',
                                background:
                                    activeCategory === cat
                                        ? CATEGORY_COLORS[cat] || '#64748b'
                                        : 'rgba(255,255,255,0.05)',
                                color: activeCategory === cat ? '#fff' : '#94a3b8',
                                border: `1px solid ${activeCategory === cat ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {t(`prompts.category_${cat}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 12,
                    alignContent: 'start',
                }}
            >
                {filteredPrompts.length === 0 && (
                    <div
                        style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '3rem',
                            color: 'var(--slate-500)',
                        }}
                    >
                        <FileText size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                        <p>{searchQuery ? t('prompts.empty_search') : t('prompts.empty')}</p>
                        {!searchQuery && (
                            <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                                {t('prompts.empty_desc')}
                            </p>
                        )}
                    </div>
                )}
                {filteredPrompts.map((prompt) => (
                    <div
                        key={prompt.id}
                        style={cardStyle}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background =
                                'rgba(255,255,255,0.08)';
                            (e.currentTarget as HTMLDivElement).style.transform =
                                'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background =
                                'rgba(255,255,255,0.05)';
                            (e.currentTarget as HTMLDivElement).style.transform = 'none';
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: 10,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        background: `${CATEGORY_COLORS[prompt.category] || '#64748b'}20`,
                                        color: CATEGORY_COLORS[prompt.category] || '#64748b',
                                    }}
                                >
                                    {t(`prompts.category_${prompt.category}`)}
                                </span>
                                {prompt.isBuiltIn && (
                                    <span
                                        style={{ fontSize: '0.7rem', color: 'var(--warning)' }}
                                        title={t('prompts.builtin_badge')}
                                    >
                                        <Star size={12} />
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUseInChat(prompt);
                                    }}
                                    style={{
                                        padding: 4,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--slate-500)',
                                        borderRadius: 4,
                                    }}
                                    title={t('prompts.use_in_chat')}
                                >
                                    <MessageSquare size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(prompt);
                                    }}
                                    style={{
                                        padding: 4,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: copiedId === prompt.id ? '#22c55e' : '#64748b',
                                        borderRadius: 4,
                                    }}
                                    title="Copy"
                                >
                                    <Copy size={14} />
                                </button>
                                {!prompt.isBuiltIn && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(prompt);
                                        }}
                                        style={{
                                            padding: 4,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--slate-500)',
                                            borderRadius: 4,
                                        }}
                                        title={t('prompts.delete')}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div
                            onClick={() => !prompt.isBuiltIn && openEditModal(prompt)}
                            onKeyDown={(e) => {
                                if (!prompt.isBuiltIn && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    openEditModal(prompt);
                                }
                            }}
                            role="button"
                            tabIndex={prompt.isBuiltIn ? -1 : 0}
                            aria-disabled={prompt.isBuiltIn}
                            style={{ cursor: prompt.isBuiltIn ? 'default' : 'pointer' }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    color: 'var(--slate-200)',
                                    marginBottom: 6,
                                }}
                            >
                                {prompt.title}
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: '0.8rem',
                                    color: 'var(--slate-500)',
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {prompt.content}
                            </p>
                        </div>
                        {prompt.usageCount > 0 && (
                            <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--slate-600)' }}>
                                {t('prompts.usage_count', { count: prompt.usageCount })}
                            </div>
                        )}
                        {prompt.tags.length > 0 && (
                            <div
                                style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}
                            >
                                {prompt.tags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            padding: '1px 6px',
                                            borderRadius: 8,
                                            fontSize: '0.65rem',
                                            background: 'rgba(255,255,255,0.04)',
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {prompt.tags.length > 3 && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--slate-600)' }}>
                                        +{prompt.tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showModal && (
                <div
                    onClick={() => setShowModal(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div
                        ref={focusTrapRef}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 560,
                            maxWidth: '90vw',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            background: 'var(--slate-800)',
                            borderRadius: 16,
                            padding: 24,
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 20,
                            }}
                        >
                            <h3 style={{ margin: 0, color: 'var(--slate-200)', fontSize: '1.1rem' }}>
                                {editingPrompt ? t('prompts.edit') : t('prompts.create')}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: 4,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--slate-500)',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder={t('prompts.form_title')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                }}
                            />
                            <textarea
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                placeholder={t('prompts.form_content')}
                                rows={8}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    fontFamily: 'monospace',
                                    resize: 'vertical',
                                }}
                            />
                            <select
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                }}
                            >
                                {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
                                    <option key={cat} value={cat}>
                                        {t(`prompts.category_${cat}`)}
                                    </option>
                                ))}
                            </select>
                            <input
                                value={formTags}
                                onChange={(e) => setFormTags(e.target.value)}
                                placeholder={t('prompts.form_tags')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    justifyContent: 'flex-end',
                                    marginTop: 8,
                                }}
                            >
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-400)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    {t('prompts.cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('prompts.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptLibraryPanel;
