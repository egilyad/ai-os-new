import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, Sliders, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import {
    getAllSettings,
    setSetting,
    setAllSettings,
    resetAllSettings,
    getTechniques,
    qualityImpactCollector,
} from '../kernel/instances';
import type { QualityTechnique } from '../kernel/contracts/debate-quality-settings';
import type { TechniqueImpactMetrics } from '../kernel/contracts/quality-impact';

const CONFIDENCE_COLOR: Record<string, string> = {
    very_high: '#22c55e',
    high: '#86efac',
    medium: '#facc15',
    low: '#f97316',
    none: '#6b7280',
};

const formatPct = (v: number): string => {
    if (v === 0) return '0%';
    const abs = Math.abs(v);
    if (abs < 0.001) return '<0.1%';
    return `${(v * 100).toFixed(1)}%`;
};

const CATEGORY_ORDER: Array<{ key: QualityTechnique['category']; color: string }> = [
    { key: 'P0', color: 'var(--error)' },
    { key: 'P1', color: 'var(--warning)' },
    { key: 'P2', color: 'var(--accent)' },
];

const Toggle: React.FC<{
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}> = ({ checked, onChange, disabled }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className="quality-toggle"
            style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: checked ? '#10b981' : '#374151',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                opacity: disabled ? 0.4 : 1,
                flexShrink: 0,
            }}
        >
            <span
                style={{
                    position: 'absolute',
                    top: 2,
                    left: checked ? 20 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                }}
            />
        </button>
    );
};

const QualityCard: React.FC<{
    technique: QualityTechnique;
    enabled: boolean;
    onToggle: (id: string, v: boolean) => void;
    metrics?: TechniqueImpactMetrics;
}> = ({ technique, enabled, onToggle, metrics }) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                background: enabled ? 'rgba(16,185,129,0.06)' : 'rgba(55,65,81,0.15)',
                border: `1px solid ${enabled ? 'rgba(16,185,129,0.2)' : 'rgba(55,65,81,0.2)'}`,
                transition: 'all 0.2s',
                opacity: enabled ? 1 : 0.6,
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span
                        style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: 'var(--slate-200)',
                        }}
                    >
                        {technique.nameRu}
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            color: 'var(--slate-500)',
                            fontStyle: 'italic',
                        }}
                    >
                        {technique.name}
                    </span>
                </div>
                <p
                    style={{
                        margin: '0 0 6px 0',
                        fontSize: 12,
                        color: 'var(--slate-400)',
                        lineHeight: 1.4,
                    }}
                >
                    {technique.descriptionRu}
                </p>
                {metrics && metrics.totalSessions > 0 && (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: metrics.avgJudgeScoreDelta >= 0 ? '#22c55e' : '#ef4444',
                            }}
                        >
                            {metrics.avgJudgeScoreDelta >= 0 ? '+' : ''}
                            {formatPct(metrics.avgJudgeScoreDelta)}
                        </span>
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                background: `${CONFIDENCE_COLOR[metrics.confidence] ?? '#6b7280'}20`,
                                color: CONFIDENCE_COLOR[metrics.confidence] ?? '#6b7280',
                            }}
                        >
                            {metrics.confidence}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>
                            n={metrics.totalActivations}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--slate-600)' }}>
                            {metrics.sampleSizeOn}/{metrics.totalSessions}{' '}
                            {t('quality.sessions_label')}
                        </span>
                    </div>
                )}
                {(!metrics || metrics.totalSessions === 0) && (
                    <div style={{ fontSize: 10, color: 'var(--slate-600)', fontStyle: 'italic' }}>
                        {t('quality.no_impact_data')}
                    </div>
                )}
            </div>
            <Toggle checked={enabled} onChange={(v) => onToggle(technique.id, v)} />
        </div>
    );
};

export const DebateQualityPanel: React.FC = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState(() => getAllSettings());
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [impactMetrics, setImpactMetrics] = useState<Record<string, TechniqueImpactMetrics>>({});

    useEffect(() => {
        try {
            const all = qualityImpactCollector.getAllMetrics();
            const map: Record<string, TechniqueImpactMetrics> = {};
            for (const m of all) {
                map[m.techniqueId] = m;
            }
            setImpactMetrics(map);
        } catch {
            // collector not ready
        }
        const interval = setInterval(() => {
            try {
                const all = qualityImpactCollector.getAllMetrics();
                const map: Record<string, TechniqueImpactMetrics> = {};
                for (const m of all) {
                    map[m.techniqueId] = m;
                }
                setImpactMetrics(map);
            } catch {
                // collector not ready
            }
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = useCallback((id: string, value: boolean) => {
        setSetting(id, value);
        setSettings(getAllSettings());
    }, []);

    const handleToggleCategory = useCallback(
        (category: QualityTechnique['category'], value: boolean) => {
            const techniques = getTechniques().filter((t) => t.category === category);
            for (const tech of techniques) {
                setSetting(tech.id, value);
            }
            setSettings(getAllSettings());
        },
        [],
    );

    const handleResetAll = useCallback(() => {
        resetAllSettings();
        setSettings(getAllSettings());
    }, []);

    const handleEnableAll = useCallback(() => {
        const all: Record<string, boolean> = {};
        for (const t of getTechniques()) {
            all[t.id] = true;
        }
        setAllSettings(all);
        setSettings(getAllSettings());
    }, []);

    const handleDisableAll = useCallback(() => {
        const all: Record<string, boolean> = {};
        for (const t of getTechniques()) {
            all[t.id] = false;
        }
        setAllSettings(all);
        setSettings(getAllSettings());
    }, []);

    const techniques = getTechniques();

    const enabledCount = Object.values(settings).filter(Boolean).length;
    const totalCount = techniques.length;

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div
                className="glass-panel"
                style={{
                    padding: '20px 24px',
                    borderRadius: 16,
                    marginBottom: 20,
                    background: 'rgba(15,23,42,0.7)',
                    border: '1px solid rgba(148,163,184,0.1)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Sliders size={22} color="#a855f7" />
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--slate-200)' }}>
                        {t('quality.nav_title') || 'Качество дебатов'}
                    </h2>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--slate-400)' }}>
                    {t('quality.description') ||
                        'Включай и отключай 56 техник улучшения качества дебатов. P0 — базовые, P1 — продвинутые, P2 — экспериментальные.'}
                </p>

                {/* Stats + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--slate-400)' }}>
                        {enabledCount}/{totalCount} {t('quality.active') || 'активно'}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                        type="button"
                        onClick={handleEnableAll}
                        className="quality-btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(16,185,129,0.3)',
                            background: 'var(--success-tint)',
                            color: 'var(--success)',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        <Check size={14} /> {t('quality.enable_all') || 'Включить все'}
                    </button>
                    <button
                        type="button"
                        onClick={handleDisableAll}
                        className="quality-btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'var(--error-tint)',
                            color: 'var(--error)',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        <X size={14} /> {t('quality.disable_all') || 'Выключить все'}
                    </button>
                    <button
                        type="button"
                        onClick={handleResetAll}
                        className="quality-btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(148,163,184,0.3)',
                            background: 'rgba(148,163,184,0.1)',
                            color: 'var(--slate-400)',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        <RotateCcw size={14} /> {t('quality.reset') || 'Сброс'}
                    </button>
                </div>
            </div>

            {/* Category sections */}
            {CATEGORY_ORDER.map(({ key: category, color }) => {
                const items = techniques.filter((t) => t.category === category);
                const catEnabled = items.filter((t) => settings[t.id]).length;
                const isCollapsed = collapsed[category] ?? false;

                return (
                    <div
                        key={category}
                        className="glass-panel"
                        style={{
                            padding: 0,
                            borderRadius: 16,
                            marginBottom: 16,
                            overflow: 'hidden',
                            background: 'rgba(15,23,42,0.5)',
                            border: `1px solid ${color}20`,
                        }}
                    >
                        {/* Category header */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '14px 20px',
                                background: `${color}10`,
                                borderBottom: isCollapsed ? 'none' : `1px solid ${color}20`,
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}
                            onClick={() =>
                                setCollapsed((p) => ({
                                    ...p,
                                    [category]: !p[category],
                                }))
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setCollapsed((p) => ({
                                        ...p,
                                        [category]: !p[category],
                                    }));
                                }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-expanded={!isCollapsed}
                        >
                            {isCollapsed ? (
                                <ChevronRight size={18} color={color} />
                            ) : (
                                <ChevronDown size={18} color={color} />
                            )}
                            <span
                                style={{ fontWeight: 700, fontSize: 15, color: 'var(--slate-200)', flex: 1 }}
                            >
                                {t(`quality.category.${category}`)}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--slate-500)', marginRight: 12 }}>
                                {catEnabled}/{items.length}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleCategory(category, true);
                                    }}
                                    className="quality-btn-sm"
                                    style={{
                                        padding: '3px 10px',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: 'rgba(16,185,129,0.15)',
                                        color: 'var(--success)',
                                        fontSize: 11,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('quality.enable') || 'Вкл'}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleCategory(category, false);
                                    }}
                                    className="quality-btn-sm"
                                    style={{
                                        padding: '3px 10px',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: 'rgba(239,68,68,0.15)',
                                        color: 'var(--error)',
                                        fontSize: 11,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('quality.disable') || 'Выкл'}
                                </button>
                            </div>
                        </div>

                        {/* Technique cards */}
                        <AnimatePresence initial={false}>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div
                                        style={{
                                            padding: 16,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                        }}
                                    >
                                        {items.map((tech) => (
                                            <QualityCard
                                                key={tech.id}
                                                technique={tech}
                                                enabled={settings[tech.id] ?? tech.defaultEnabled}
                                                onToggle={handleToggle}
                                                metrics={impactMetrics[tech.id]}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {/* Info footer */}
            <div
                style={{
                    padding: '14px 20px',
                    borderRadius: 12,
                    background: 'rgba(168,85,247,0.06)',
                    border: '1px solid rgba(168,85,247,0.15)',
                    fontSize: 12,
                    color: 'var(--slate-400)',
                    textAlign: 'center',
                }}
            >
                {t('quality.footer_info') ||
                    'Настройки сохраняются автоматически и применяются к новым дебатам. Уже запущенные дебаты используют настройки на момент старта.'}
            </div>
        </div>
    );
};

export default DebateQualityPanel;
