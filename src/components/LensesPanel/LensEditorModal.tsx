import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Lens, LensCategory } from '../../kernel/types/lens-types';
import { CATEGORY_COLORS, LENS_CATEGORIES } from './LensSelector';

interface LensEditorModalProps {
    initial?: Lens;
    onClose: () => void;
    onSave: (lens: Lens) => void;
}

const DEFAULT_LENS: Lens = {
    id: '',
    name: '',
    description: '',
    category: 'analytical',
    transform: { kind: 'prompt-prefix', text: '' },
    applicability: { taskTypes: ['analysis'], domains: ['*'] },
    compositionRules: {
        stackable: true,
        maxStackSize: 5,
        orderMatters: true,
        allowedWith: '*',
    },
    conflictWith: [],
    priority: 1,
    metadata: { version: 1, author: 'user', tags: [], maturity: 'draft' },
};

const LensEditorModal: React.FC<LensEditorModalProps> = ({ initial, onClose, onSave }) => {
    const { t } = useTranslation();
    const [lens, setLens] = useState<Lens>(initial ? { ...initial } : { ...DEFAULT_LENS });
    const [tagsText, setTagsText] = useState<string>(lens.metadata.tags.join(', '));

    const handleSave = () => {
        const id = lens.id.trim();
        if (!id) return;
        const tags = tagsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        onSave({
            ...lens,
            id,
            metadata: { ...lens.metadata, tags },
            transform:
                lens.transform.kind === 'prompt-prefix'
                    ? { kind: 'prompt-prefix', text: lens.transform.text }
                    : lens.transform,
        });
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 520,
                    maxWidth: '90vw',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    background: 'var(--slate-800)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '1.25rem',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                    }}
                >
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {initial ? t('lenses.edit') : t('lenses.new')}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            padding: 4,
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={labelStyle}>
                        {t('lenses.form_id')}
                        <input
                            value={lens.id}
                            onChange={(e) => setLens({ ...lens, id: e.target.value })}
                            disabled={!!initial}
                            placeholder="lens:my-lens"
                            style={inputStyle}
                        />
                    </label>

                    <label style={labelStyle}>
                        {t('lenses.form_name')}
                        <input
                            value={lens.name}
                            onChange={(e) => setLens({ ...lens, name: e.target.value })}
                            style={inputStyle}
                        />
                    </label>

                    <label style={labelStyle}>
                        {t('lenses.form_description')}
                        <textarea
                            value={lens.description}
                            onChange={(e) => setLens({ ...lens, description: e.target.value })}
                            rows={2}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </label>

                    <label style={labelStyle}>
                        {t('lenses.form_category')}
                        <select
                            value={lens.category}
                            onChange={(e) =>
                                setLens({ ...lens, category: e.target.value as LensCategory })
                            }
                            style={inputStyle}
                        >
                            {LENS_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {t(`lenses.cat_${cat}`)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={labelStyle}>
                        {t('lenses.form_prefix')}
                        <textarea
                            value={
                                lens.transform.kind === 'prompt-prefix' ? lens.transform.text : ''
                            }
                            onChange={(e) =>
                                setLens({
                                    ...lens,
                                    transform: { kind: 'prompt-prefix', text: e.target.value },
                                })
                            }
                            rows={3}
                            placeholder={t('lenses.form_prefix_hint')}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </label>

                    <label style={labelStyle}>
                        {t('lenses.form_tags')}
                        <input
                            value={tagsText}
                            onChange={(e) => setTagsText(e.target.value)}
                            placeholder="tag1, tag2"
                            style={inputStyle}
                        />
                    </label>

                    <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                        <button
                            onClick={handleSave}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: 7,
                                border: 'none',
                                background: CATEGORY_COLORS[lens.category] ?? '#8b5cf6',
                                color: 'var(--slate-900)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                            }}
                        >
                            <Save size={13} /> {t('lenses.save')}
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 7,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent',
                                color: 'var(--slate-400)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                            }}
                        >
                            {t('lenses.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--slate-400)',
};

const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '0.45rem 0.6rem',
    color: 'var(--slate-200)',
    fontSize: '0.8rem',
    outline: 'none',
    fontFamily: 'inherit',
};

export default LensEditorModal;
