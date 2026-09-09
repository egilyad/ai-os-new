/**
 * Cognitive-aux / research panel (Experimental).
 * Scheduler surface — research-grade, not production surface (P1.21).
 */
import React, { useState, useCallback } from 'react';
import { Calendar, Info, Clock, Plus, RefreshCw, ListTodo } from 'lucide-react';
import { getAllSettings, setSetting } from '../kernel/instances';
import type { QualityTechnique } from '../kernel/contracts/debate-quality-settings';
import { useTranslation } from '../i18n/useTranslation';
import { useRealAgents } from '../hooks/useRealAgents';

const TECHNIQUE_ID = 'scheduler';

const TECHNIQUE: QualityTechnique = {
    id: TECHNIQUE_ID,
    name: 'Scheduler',
    nameRu: 'Планировщик',
    description:
        'Cron-based task scheduler — schedule agent debates, reports, and maintenance jobs',
    descriptionRu:
        'Планировщик задач на основе cron — запуск дебатов, отчётов и задач обслуживания по расписанию',
    category: 'P1',
    defaultEnabled: true,
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
    checked,
    onChange,
    disabled,
}) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        title={disabled ? 'Preview — not connected' : undefined}
        onClick={() => !disabled && onChange(!checked)}
        style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            position: 'relative',
            background: checked ? '#10b981' : '#374151',
            transition: 'background 0.2s',
            flexShrink: 0,
            opacity: disabled ? 0.5 : 1,
        }}
    >
        <span
            style={{
                position: 'absolute',
                top: 2,
                left: checked ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
            }}
        />
    </button>
);

export const SchedulerPanel: React.FC = () => {
    const { t, lang } = useTranslation();
    const agents = useRealAgents();
    const [settings, setSettingsState] = useState(() => getAllSettings());
    const enabled = settings[TECHNIQUE_ID] ?? TECHNIQUE.defaultEnabled;

    const handleToggle = useCallback(() => {
        const next = !enabled;
        setSetting(TECHNIQUE_ID, next);
        setSettingsState(getAllSettings());
    }, [enabled]);

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                <Info size={16} /> Preview — not connected to SchedulerService. Toggles and schedules are demo data and do not create real schedules.
            </div>
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
                    <Calendar size={22} color="#3b82f6" />
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--slate-200)' }}>
                        {lang === 'ru' ? TECHNIQUE.nameRu : TECHNIQUE.name}
                    </h2>
                    <span
                        style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'rgba(59,130,246,0.15)',
                            color: 'var(--accent)',
                            fontWeight: 600,
                        }}
                    >
                        {TECHNIQUE.category}
                    </span>
                    <div style={{ flex: 1 }} />
                    <Toggle checked={enabled} onChange={handleToggle} disabled />
                    <span
                        style={{
                            fontSize: 13,
                            color: enabled ? '#10b981' : '#64748b',
                            fontWeight: 500,
                        }}
                    >
                        {enabled ? t('scheduler.active') : t('scheduler.disabled')} (Preview)
                    </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                    {lang === 'ru' ? TECHNIQUE.descriptionRu : TECHNIQUE.description}
                </p>
                <p
                    style={{
                        margin: '4px 0 0 0',
                        fontSize: 11,
                        color: 'var(--slate-500)',
                        fontStyle: 'italic',
                    }}
                >
                    {TECHNIQUE.description}
                </p>
            </div>

            <div
                className="glass-panel"
                style={{
                    padding: '20px 24px',
                    borderRadius: 16,
                    marginBottom: 20,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(59,130,246,0.15)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Info size={18} color="#60a5fa" />
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--slate-200)' }}>
                        {t('scheduler.how_it_works')}
                    </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    {[
                        {
                            icon: <Plus size={20} />,
                            title: t('scheduler.card.create_title'),
                            desc: t('scheduler.card.create_desc'),
                        },
                        {
                            icon: <RefreshCw size={20} />,
                            title: t('scheduler.card.engine_title'),
                            desc: t('scheduler.card.engine_desc'),
                        },
                        {
                            icon: <ListTodo size={20} />,
                            title: t('scheduler.card.manage_title'),
                            desc: t('scheduler.card.manage_desc'),
                        },
                    ].map((card, i) => (
                        <div
                            key={i}
                            style={{
                                padding: 16,
                                borderRadius: 12,
                                background: 'rgba(15,23,42,0.5)',
                                border: '1px solid rgba(59,130,246,0.1)',
                            }}
                        >
                            <div style={{ color: '#60a5fa', marginBottom: 8 }}>{card.icon}</div>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--slate-200)',
                                    marginBottom: 4,
                                }}
                            >
                                {card.title}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                                {card.desc}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div
                className="glass-panel"
                style={{
                    padding: '20px 24px',
                    borderRadius: 16,
                    marginBottom: 20,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(59,130,246,0.15)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Clock size={18} color="#60a5fa" />
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--slate-200)' }}>
                        {t('scheduler.demo_title')}
                    </h3>
                    <div style={{ flex: 1 }} />
                    <span
                        style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'rgba(34,197,94,0.15)',
                            color: 'var(--success)',
                            fontWeight: 500,
                        }}
                    >
                        0 {t('scheduler.active_count')}
                    </span>
                </div>

                <div
                    style={{
                        padding: 16,
                        textAlign: 'center',
                        color: 'var(--slate-500)',
                        fontSize: 13,
                        border: '1px dashed rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        marginBottom: 12,
                    }}
                >
                    {t('scheduler.no_schedules')}
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-300)', marginBottom: 8 }}>
                    {t('scheduler.available_agents')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {agents.map((a) => (
                        <div
                            key={a.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: 'rgba(15,23,42,0.4)',
                                border: '1px solid rgba(59,130,246,0.12)',
                            }}
                        >
                            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--slate-200)' }}>{a.name}</span>
                            <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>id: {a.id}</span>
                            <span style={{ fontSize: 11, color: 'var(--slate-400)', marginLeft: 'auto' }}>{a.role}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div
                style={{
                    padding: '14px 20px',
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    fontSize: 12,
                    color: 'var(--slate-400)',
                    textAlign: 'center',
                }}
            >
                {t('scheduler.footer')}
            </div>
        </div>
    );
};

export default SchedulerPanel;
