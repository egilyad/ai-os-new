import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, Plus, RefreshCw, Trash2, Play } from 'lucide-react';
import { getAllSettings, setSetting } from '../kernel/instances';
import type { QualityTechnique } from '../kernel/contracts/debate-quality-settings';
import { useTranslation } from '../i18n/useTranslation';
import { useRealAgents } from '../hooks/useRealAgents';
import { schedulerService } from '../kernel/services/scheduler-service';
import type { Schedule, ScheduleFrequency } from '../kernel/services/scheduler-service';
import { eventBus } from '../kernel/events/event-bus';
import { EVENTS } from '../kernel/events/event-registry';

const TECHNIQUE_ID = 'scheduler';

const TECHNIQUE: QualityTechnique = {
    id: TECHNIQUE_ID,
    name: 'Scheduler',
    nameRu: 'Планировщик',
    description: 'Cron-based task scheduler — schedule agent debates, reports, and maintenance jobs',
    descriptionRu: 'Планировщик задач на основе cron — запуск дебатов, отчётов и задач обслуживания по расписанию',
    category: 'P1',
    defaultEnabled: true,
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            background: checked ? '#10b981' : '#374151',
            transition: 'background 0.2s',
            flexShrink: 0,
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

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [agentId, setAgentId] = useState('');
    const [frequency, setFrequency] = useState<ScheduleFrequency>('daily');
    const [cronExpression, setCronExpression] = useState('');
    const [taskPrompt, setTaskPrompt] = useState('');
    const [busy, setBusy] = useState(false);

    const handleToggle = useCallback(() => {
        const next = !enabled;
        setSetting(TECHNIQUE_ID, next);
        setSettingsState(getAllSettings());
    }, [enabled]);

    const load = useCallback(async () => {
        try {
            setError(null);
            if (schedulerService) {
                // Ensure service is initialized (loads from DB kv `schedules`)
                try { await schedulerService.init(); } catch {}
                setSchedules(schedulerService.getAll());
            } else {
                setSchedules([]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // Live updates via EventBus (additive, existing SchedulerService already emits)
        const unsubs: Array<() => void> = [];
        try {
            unsubs.push(eventBus.on(EVENTS.SCHEDULE_CREATED as never, () => void load()));
            unsubs.push(eventBus.on(EVENTS.SCHEDULE_UPDATED as never, () => void load()));
            unsubs.push(eventBus.on(EVENTS.SCHEDULE_DELETED as never, () => void load()));
            unsubs.push(eventBus.on(EVENTS.SCHEDULE_TRIGGERED as never, () => void load()));
        } catch {}
        return () => { for (const u of unsubs) try { u(); } catch {} };
    }, [load]);

    const handleCreate = useCallback(async () => {
        if (!name.trim() || !agentId) {
            setError(t('scheduler.validation.required'));
            return;
        }
        if (!schedulerService) {
            setError('SchedulerService unavailable');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const cron = frequency === 'custom' ? cronExpression.trim() : undefined;
            if (frequency === 'custom' && cron && !schedulerService.validateCron(cron)) {
                setError(t('scheduler.validation.cron'));
                setBusy(false);
                return;
            }
            await schedulerService.create({
                name: name.trim().slice(0, 80),
                agentId,
                agentName: agents.find(a => a.id === agentId)?.name,
                frequency,
                cronExpression: cron,
                taskParams: { prompt: taskPrompt.trim().slice(0, 1000) || `Scheduled task: ${name.trim()}` },
            });
            setName('');
            setTaskPrompt('');
            setCronExpression('');
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }, [name, agentId, frequency, cronExpression, taskPrompt, agents, load, t]);

    const handleToggleSchedule = useCallback(async (id: string, next: boolean) => {
        if (!schedulerService) return;
        await schedulerService.toggle(id, next);
        await load();
    }, [load]);

    const handleDelete = useCallback(async (id: string) => {
        if (!schedulerService) return;
        await schedulerService.delete(id);
        await load();
    }, [load]);

    const handleTrigger = useCallback(async (id: string) => {
        if (!schedulerService) return;
        setBusy(true);
        try {
            await schedulerService.trigger(id);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }, [load]);

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
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
                    <Toggle checked={enabled} onChange={handleToggle} />
                    <span style={{ fontSize: 13, color: enabled ? '#10b981' : '#64748b', fontWeight: 500 }}>
                        {enabled ? t('scheduler.active') : t('scheduler.disabled')}
                    </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                    {lang === 'ru' ? TECHNIQUE.descriptionRu : TECHNIQUE.description}
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
                    <Plus size={18} color="#60a5fa" />
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--slate-200)' }}>
                        {t('scheduler.create_title') ?? 'Create schedule'}
                    </h3>
                </div>
                {error && <div style={{ color: 'var(--error)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <input
                        placeholder={t('scheduler.namePlaceholder') ?? 'Schedule name'}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-200)' }}
                    />
                    <select
                        value={agentId}
                        onChange={e => setAgentId(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-200)' }}
                    >
                        <option value="">{t('scheduler.selectAgent') ?? 'Select agent'}</option>
                        {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
                        ))}
                    </select>
                    <select
                        value={frequency}
                        onChange={e => setFrequency(e.target.value as ScheduleFrequency)}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-200)' }}
                    >
                        <option value="hourly">hourly — 0 * * * *</option>
                        <option value="daily">daily — 0 9 * * *</option>
                        <option value="weekly">weekly — 0 9 * * 1</option>
                        <option value="monthly">monthly — 0 9 1 * *</option>
                        <option value="custom">custom</option>
                    </select>
                    <input
                        placeholder="cron (custom: 0 9 * * *)"
                        value={cronExpression}
                        onChange={e => setCronExpression(e.target.value)}
                        disabled={frequency !== 'custom'}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: frequency !== 'custom' ? 'rgba(15,23,42,0.3)' : 'rgba(15,23,42,0.6)', color: 'var(--slate-200)' }}
                    />
                </div>
                <textarea
                    placeholder={t('scheduler.taskPlaceholder') ?? 'Task prompt for agent'}
                    value={taskPrompt}
                    onChange={e => setTaskPrompt(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-200)', resize: 'vertical', marginBottom: 10 }}
                />
                <button
                    onClick={() => void handleCreate()}
                    disabled={busy || !name.trim() || !agentId}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: busy || !name.trim() || !agentId ? '#374151' : '#3b82f6', color: '#fff', fontWeight: 600, cursor: busy || !name.trim() || !agentId ? 'not-allowed' : 'pointer' }}
                >
                    {busy ? '...' : t('scheduler.create') ?? 'Create'}
                </button>
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
                        {t('scheduler.list_title') ?? 'Schedules'}
                    </h3>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: 'var(--success)', fontWeight: 500 }}>
                        {schedules.filter(s => s.enabled).length} / {schedules.length} {t('scheduler.active_count') ?? 'active'}
                    </span>
                    <button
                        onClick={() => void load()}
                        title="Refresh"
                        style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)' }}
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ color: 'var(--slate-500)', fontSize: 13, textAlign: 'center', padding: 16 }}>Loading…</div>
                ) : schedules.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 12 }}>
                        {t('scheduler.no_schedules')}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {schedules.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(59,130,246,0.12)' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                        {s.agentName ?? s.agentId} — {s.cronExpression} — {s.enabled ? 'enabled' : 'disabled'} — runs {s.runCount} — next {s.nextRun ? new Date(s.nextRun).toLocaleString() : '—'}
                                    </div>
                                    {s.taskParams?.prompt && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.taskParams.prompt}</div>}
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--slate-400)' }}>
                                    <input type="checkbox" checked={s.enabled} onChange={e => void handleToggleSchedule(s.id, e.target.checked)} />
                                    enabled
                                </label>
                                <button onClick={() => void handleTrigger(s.id)} disabled={busy} title="Trigger now" style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', cursor: 'pointer' }}>
                                    <Play size={12} />
                                </button>
                                <button onClick={() => void handleDelete(s.id)} title="Delete" style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.12)', color: '#f87171', cursor: 'pointer' }}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-300)', marginBottom: 8 }}>
                    {t('scheduler.available_agents')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {agents.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(59,130,246,0.12)' }}>
                            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--slate-200)' }}>{a.name}</span>
                            <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>id: {a.id}</span>
                            <span style={{ fontSize: 11, color: 'var(--slate-400)', marginLeft: 'auto' }}>{a.role}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SchedulerPanel;
