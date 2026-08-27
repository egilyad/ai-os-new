import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Plus, Sparkles, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { lensEngine } from '../../kernel/instances';
import type { Lens } from '../../kernel/types/lens-types';
import type { ValidationResult } from '../../kernel/contracts/lens-engine';
import LensSelector from './LensSelector';
import LensStackVisualizer from './LensStackVisualizer';
import LensEditorModal from './LensEditorModal';

const LensesPanel: React.FC = () => {
    const { t } = useTranslation();
    const [lenses, setLenses] = useState<Lens[]>([]);
    const [stack, setStack] = useState<string[]>([]);
    const [validation, setValidation] = useState<ValidationResult | undefined>();
    const [showEditor, setShowEditor] = useState(false);
    const [editingLens, setEditingLens] = useState<Lens | undefined>();
    const [suggestions, setSuggestions] = useState<{ lensId: string; confidence: number }[]>([]);

    const refresh = useCallback(() => {
        setLenses(lensEngine.listLenses());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const validate = useCallback((ids: string[]) => {
        const result = lensEngine.validateStack(ids);
        setValidation(result);
    }, []);

    const handleToggle = (lensId: string) => {
        const next = stack.includes(lensId)
            ? stack.filter((id) => id !== lensId)
            : [...stack, lensId];
        setStack(next);
        validate(next);
    };

    const handleRemove = (lensId: string) => {
        const next = stack.filter((id) => id !== lensId);
        setStack(next);
        validate(next);
    };

    const handleClear = () => {
        setStack([]);
        setValidation(undefined);
    };

    const handleSuggest = () => {
        const s = lensEngine.suggestLenses(
            {
                roleSystemPrompt: '',
                userPrompt: '',
            },
            {
                id: 'lens-suggester',
                name: 'Lens Suggester',
                systemPrompt: 'recommend lenses for general analysis',
                category: 'analytical',
                metadata: { tags: ['analysis', 'meta'] },
            },
        );
        setSuggestions(s.map((x) => ({ lensId: x.lensId, confidence: x.confidence })));
        const auto = s.slice(0, 3).map((x) => x.lensId);
        setStack((prev) => {
            const merged = [...prev];
            for (const id of auto) {
                if (!merged.includes(id)) merged.push(id);
            }
            return merged;
        });
        validate(stack.length > 0 ? [...stack, ...auto.filter((id) => !stack.includes(id))] : auto);
    };

    const stackLenses = useMemo(
        () => stack.map((id) => lenses.find((l) => l.id === id)).filter((l): l is Lens => !!l),
        [stack, lenses],
    );

    const handleSaveLens = (lens: Lens) => {
        lensEngine.addLens(lens);
        refresh();
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1rem 1.25rem 0.6rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={18} color="#8b5cf6" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {t('lenses.title')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {lenses.length} {t('lenses.total')}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={handleSuggest}
                        title={t('lenses.suggest')}
                        style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: 7,
                            border: 'none',
                            background: 'var(--purple)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <Sparkles size={13} /> {t('lenses.suggest')}
                    </button>
                    <button
                        onClick={() => {
                            setEditingLens(undefined);
                            setShowEditor(true);
                        }}
                        title={t('lenses.new')}
                        style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: 7,
                            border: 'none',
                            background: 'var(--success)',
                            color: '#022c22',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <Plus size={13} /> {t('lenses.new')}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left: lens library */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0.75rem 1rem',
                        borderRight: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: 'var(--slate-500)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {t('lenses.library')}
                    </div>
                    <LensSelector lenses={lenses} selectedIds={stack} onToggle={handleToggle} />
                </div>

                {/* Right: active stack */}
                <div
                    style={{
                        width: 340,
                        overflowY: 'auto',
                        padding: '0.75rem 1rem',
                        background: 'rgba(0,0,0,0.15)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                color: 'var(--slate-500)',
                            }}
                        >
                            {t('lenses.active_stack')}
                        </span>
                        {stack.length > 0 && (
                            <button
                                onClick={handleClear}
                                title={t('lenses.clear')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--slate-500)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: '0.7rem',
                                }}
                            >
                                <RotateCcw size={11} /> {t('lenses.clear')}
                            </button>
                        )}
                    </div>

                    <LensStackVisualizer
                        stack={stackLenses}
                        validation={validation}
                        onRemove={handleRemove}
                    />

                    {suggestions.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    color: 'var(--slate-500)',
                                    marginBottom: '0.4rem',
                                }}
                            >
                                {t('lenses.suggestions')}
                            </div>
                            {suggestions.map((s) => {
                                const lens = lenses.find((l) => l.id === s.lensId);
                                if (!lens) return null;
                                return (
                                    <div
                                        key={s.lensId}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.3rem 0.5rem',
                                            borderRadius: 5,
                                            background: 'rgba(0,0,0,0.2)',
                                            fontSize: '0.72rem',
                                            color: 'var(--slate-400)',
                                            marginBottom: 3,
                                        }}
                                    >
                                        <span>{lens.name}</span>
                                        <span style={{ color: 'var(--purple)' }}>
                                            {(s.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showEditor && (
                <LensEditorModal
                    initial={editingLens}
                    onClose={() => setShowEditor(false)}
                    onSave={handleSaveLens}
                />
            )}
        </div>
    );
};

export default LensesPanel;
