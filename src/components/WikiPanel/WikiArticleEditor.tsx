import React, { useState } from 'react';
import { WIKI_SECTIONS } from './wiki-articles';
import type { WikiArticle } from './wiki-types';

function slugify(title: string): string {
    return title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

interface Props {
    onSave: (article: WikiArticle) => void;
    onCancel: () => void;
    existingSlugs: Set<string>;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'inherit',
    fontSize: '0.85rem',
    boxSizing: 'border-box',
    outline: 'none',
};

export const WikiArticleEditor: React.FC<Props> = ({ onSave, onCancel, existingSlugs }) => {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [section, setSection] = useState(WIKI_SECTIONS[0]?.id ?? 'guide');
    const [tags, setTags] = useState('');
    const [body, setBody] = useState('');
    const [touched, setTouched] = useState(false);

    const autoSlug = slugify(title);
    const finalSlug = slug.trim() || autoSlug;
    const slugTaken = finalSlug.length > 0 && existingSlugs.has(finalSlug);
    const invalid = !title.trim() || !body.trim() || !finalSlug || slugTaken;

    const handleSubmit = () => {
        setTouched(true);
        if (invalid) return;
        onSave({
            slug: finalSlug,
            title: title.trim(),
            section,
            tags: tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            freshness: 'needs-check',
            sources: [],
            related: [],
            body: body.trim(),
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Создать статью</div>
            <div>
                <label style={labelStyle}>Название</label>
                <input
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        if (!slug.trim()) setSlug(slugify(e.target.value));
                    }}
                    placeholder="Название статьи"
                    style={inputStyle}
                />
            </div>
            <div>
                <label style={labelStyle}>Slug (адрес)</label>
                <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={autoSlug || 'my-article'}
                    style={{
                        ...inputStyle,
                        borderColor: slugTaken ? 'rgba(239,68,68,0.5)' : undefined,
                    }}
                />
                {touched && slugTaken && (
                    <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: 4 }}>
                        Такой slug уже существует
                    </div>
                )}
            </div>
            <div>
                <label style={labelStyle}>Раздел</label>
                <select value={section} onChange={(e) => setSection(e.target.value)} style={inputStyle}>
                    {WIKI_SECTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.title}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label style={labelStyle}>Теги (через запятую)</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="агенты, дебаты"
                    style={inputStyle} />
            </div>
            <div>
                <label style={labelStyle}>Содержимое (Markdown)</label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    placeholder="# Заголовок&#10;&#10;Текст статьи. Поддерживается Markdown и [[wikilink]].&#10;"
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }}
                />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={touched && invalid}
                    style={{
                        padding: '0.5rem 1.2rem',
                        borderRadius: 8,
                        border: 'none',
                        background: 'var(--accent)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        opacity: touched && invalid ? 0.5 : 1,
                    }}
                >
                    Сохранить статью
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: '0.5rem 1.2rem',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                    }}
                >
                    Отмена
                </button>
            </div>
        </div>
    );
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--slate-400)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.3rem',
};
