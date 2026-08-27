import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, X, Shuffle, Filter, Copy, Check, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { useTopicSuggester } from '../hooks/useTopicSuggester';
import type { TopicSuggestion } from '../kernel/utils/topic-suggestions';
import { textMutedXs, textSecondaryXs, textWhiteXs } from '../styles/common';

const DIFFICULTY_COLORS: Record<TopicSuggestion['difficulty'], string> = {
    beginner: '#10b981',
    intermediate: '#f59e0b',
    advanced: '#ef4444',
};

const CATEGORY_LABELS: Record<
    TopicSuggestion['category'],
    { en: string; ru: string; color: string }
> = {
    ethics: { en: 'Ethics', ru: 'Этика', color: '#a855f7' },
    technology: { en: 'Tech', ru: 'Технологии', color: 'var(--accent)' },
    society: { en: 'Society', ru: 'Общество', color: 'var(--success)' },
    science: { en: 'Science', ru: 'Наука', color: '#06b6d4' },
    philosophy: { en: 'Philosophy', ru: 'Философия', color: 'var(--purple)' },
    politics: { en: 'Politics', ru: 'Политика', color: 'var(--error)' },
    creative: { en: 'Creative', ru: 'Творчество', color: 'var(--warning)' },
    business: { en: 'Business', ru: 'Бизнес', color: '#84cc16' },
};

const TopicSuggesterPanel: React.FC = () => {
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const {
        topics,
        refresh,
        exclude,
        reset,
        count,
        setCount,
        categories,
        selectedCategories,
        toggleCategory,
    } = useTopicSuggester(6);
    const [copied, setCopied] = useState<string | null>(null);
    const [custom, setCustom] = useState('');
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleCopy = useCallback((topic: string) => {
        navigator.clipboard
            ?.writeText(topic)
            .then(() => {
                setCopied(topic);
                setTimeout(() => {
                    if (isMountedRef.current) setCopied((prev) => (prev === topic ? null : prev));
                }, 1500);
            })
            .catch((e) => console.warn('[TopicSuggester] Clipboard copy failed:', e));
    }, []);

    const handleStartDebate = useCallback(
        (topic: string) => {
            navigate(`/debate?thesis=${encodeURIComponent(topic)}`);
        },
        [navigate],
    );

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
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
                    <Sparkles size={26} color="#a855f7" /> {t('topic_suggester.title')}
                </h2>
                <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                    {t('topic_suggester.subtitle')}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Shuffle size={14} color="#a855f7" />
                        <span
                            style={{
                                ...textSecondaryXs,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                            }}
                        >
                            {t('topic_suggester.count')}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[3, 5, 8, 12].map((n) => (
                            <button
                                key={n}
                                onClick={() => setCount(n)}
                                style={{
                                    padding: '0.3rem 0.7rem',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: count === n ? '#a855f7' : 'rgba(168,85,247,0.15)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                <div
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Filter size={14} color="#3b82f6" />
                        <span
                            style={{
                                ...textSecondaryXs,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                            }}
                        >
                            {t('topic_suggester.categories')}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {categories.map((cat) => {
                            const label = CATEGORY_LABELS[cat][lang];
                            const active = selectedCategories.includes(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => toggleCategory(cat)}
                                    style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: 10,
                                        border: `1px solid ${active ? CATEGORY_LABELS[cat].color : 'var(--border-default)'}`,
                                        background: active
                                            ? `${CATEGORY_LABELS[cat].color}30`
                                            : 'transparent',
                                        color: active ? CATEGORY_LABELS[cat].color : 'var(--slate-400)',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                    onClick={refresh}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        border: 'none',
                        background: '#a855f7',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                    }}
                >
                    <RefreshCw size={14} /> {t('topic_suggester.refresh')}
                </button>
                <button
                    onClick={reset}
                    style={{
                        padding: '0.5rem 0.8rem',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {t('topic_suggester.reset_filters')}
                </button>
                <span style={textMutedXs}>
                    {t('topic_suggester.shown', { count: topics.length })}
                </span>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {topics.map((t2) => {
                    const catMeta = CATEGORY_LABELS[t2.category];
                    return (
                        <motion.div
                            key={t2.topic}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(0,0,0,0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '0.1rem 0.5rem',
                                        borderRadius: 8,
                                        background: `${catMeta.color}25`,
                                        color: catMeta.color,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {catMeta[lang]}
                                </span>
                                <span
                                    style={{
                                        padding: '0.1rem 0.5rem',
                                        borderRadius: 8,
                                        background: `${DIFFICULTY_COLORS[t2.difficulty]}25`,
                                        color: DIFFICULTY_COLORS[t2.difficulty],
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {t2.difficulty}
                                </span>
                            </div>
                            <div style={{ ...textWhiteXs, fontSize: '0.95rem', lineHeight: 1.4 }}>
                                {t2.topic}
                            </div>
                            <div style={textMutedXs}>{t2.rationale}</div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
                                <button
                                    onClick={() => handleStartDebate(t2.topic)}
                                    style={{
                                        flex: 1,
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: '#a855f7',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                    }}
                                >
                                    <Send size={12} /> {t('topic_suggester.debate')}
                                </button>
                                <button
                                    onClick={() => handleCopy(t2.topic)}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'transparent',
                                        color: copied === t2.topic ? '#10b981' : '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                    }}
                                    title={t('topic_suggester.copy')}
                                >
                                    {copied === t2.topic ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                                <button
                                    onClick={() => exclude(t2.topic)}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        background: 'transparent',
                                        color: '#fca5a5',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                    }}
                                    title={t('topic_suggester.exclude')}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {topics.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                    <p>{t('topic_suggester.empty')}</p>
                    <button
                        onClick={reset}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--slate-200)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                        }}
                    >
                        {t('topic_suggester.reset_filters')}
                    </button>
                </div>
            )}

            <div
                style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    background: 'rgba(168,85,247,0.06)',
                    border: '1px solid rgba(168,85,247,0.2)',
                }}
            >
                <div
                    style={{
                        ...textSecondaryXs,
                        marginBottom: 4,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                    }}
                >
                    {t('topic_suggester.custom_label')}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <input
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        placeholder={t('topic_suggester.custom_placeholder')}
                        style={{
                            flex: 1,
                            padding: '0.4rem 0.6rem',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                        }}
                    />
                    <button
                        onClick={() => {
                            if (custom.trim()) handleStartDebate(custom.trim());
                        }}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--success)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Send size={12} /> {t('topic_suggester.debate')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopicSuggesterPanel;
