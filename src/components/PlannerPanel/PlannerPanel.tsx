import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { plannerService } from '../../kernel/instances/services-extras';
import type { PlannerStrategy } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

const STRATEGIES: PlannerStrategy[] = ['sequential', 'function_calling', 'stepwise', 'plan_and_execute'];
const FILTER_NAMES = ['audit', 'policy', 'trim'];
const FILTER_STAGES = ['pre', 'post'];

export default function PlannerPanel() {
    const { t } = useTranslation();
    const [task, setTask] = useState('');
    const [strategy, setStrategy] = useState<PlannerStrategy>('function_calling');
    const [result, setResult] = useState<string | null>(null);
    const [steps, setSteps] = useState<string[]>([]);
    const [nextStep, setNextStep] = useState('');
    const [filters, setFilters] = useState<Array<{ stage: string; name: string }>>([]);
    const [filterStage, setFilterStage] = useState('pre');
    const [filterName, setFilterName] = useState('policy');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const fail = (e: unknown) => {
        console.error('[PlannerPanel]', e);
        setError(t('planner.error.generic'));
    };

    const reloadFilters = async () => {
        try {
            setFilters(await plannerService.listFilters());
        } catch (e) {
            fail(e);
        }
    };

    useEffect(() => {
        void reloadFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePlan = async () => {
        setError(null);
        setNotice(null);
        if (!task.trim()) {
            setNotice(t('planner.validation.task'));
            return;
        }
        setBusy(true);
        try {
            const out = await plannerService.plan(task.trim().slice(0, 2000), strategy);
            setResult(out);
            if (strategy === 'stepwise') setSteps([out]);
            else setSteps([]);
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const handleStep = async () => {
        setError(null);
        if (!nextStep.trim()) return;
        setBusy(true);
        try {
            const out = await plannerService.planStep(nextStep.trim().slice(0, 2000));
            setSteps((prev) => [...prev, out]);
            setNextStep('');
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const handleAddFilter = async () => {
        setError(null);
        setBusy(true);
        try {
            await plannerService.addFilter(filterStage as 'pre' | 'post', filterName);
            await reloadFilters();
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            {/* Sidebar — strategy & filters */}
            <div style={{ width: 320, minWidth: 320, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{t('planner.title')}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>{t('planner.subtitle')}</div>
                    {error && <div style={{ marginTop: 8, color: 'var(--error)', fontSize: 12 }}>{error}</div>}
                    {notice && <div style={{ marginTop: 8, color: '#f59e0b', fontSize: 12 }}>{notice}</div>}
                </div>

                <div style={{ padding: '14px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Strategy</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {STRATEGIES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStrategy(s)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        border: strategy === s ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                                        background: strategy === s ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                                        color: strategy === s ? '#60a5fa' : 'var(--slate-300)',
                                        fontSize: 12,
                                        fontWeight: strategy === s ? 700 : 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t(`planner.strategy.${s}`)}
                                    <span style={{ display: 'block', fontSize: 10, opacity: 0.6, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{t('planner.filters.heading')}</div>
                        {filters.length === 0 ? (
                            <div style={{ fontSize: 11, color: 'var(--slate-500)', padding: '8px 0', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8, textAlign: 'center' }}>{t('planner.filters.empty')}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {filters.map((f) => (
                                    <div key={`${f.stage}:${f.name}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <StatusBadge status={f.stage} label={f.stage} />
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'inherit', fontSize: 11 }}>
                                {FILTER_STAGES.map((s) => <option key={s} value={s}>{t(`planner.filter.stage.${s}`)}</option>)}
                            </select>
                            <select value={filterName} onChange={(e) => setFilterName(e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'inherit', fontSize: 11 }}>
                                {FILTER_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => void handleAddFilter()} style={{ marginTop: 8, width: '100%' }}>{t('planner.filter.add')}</Button>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{t('planner.plan.heading')}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            placeholder={t('planner.taskPlaceholder')}
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && task.trim()) void handlePlan(); }}
                            style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 13 }}
                        />
                        <Button variant="primary" size="sm" disabled={busy || !task.trim()} onClick={() => void handlePlan()}>{busy ? '…' : t('planner.plan.submit')}</Button>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--slate-500)', marginTop: 6 }}>{strategy} · {FILTER_STAGES.length} stages · press Enter to plan</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {result !== null && (
                        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', marginBottom: 8 }}>{t('planner.result.heading')}</div>
                            <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--slate-200)' }}>{result}</div>
                        </div>
                    )}

                    {strategy === 'stepwise' && (
                        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', marginBottom: 10 }}>{t('planner.steps.heading')} · {steps.length} steps</div>
                            {steps.length === 0 ? (
                                <div style={{ fontSize: 12, color: 'var(--slate-500)', textAlign: 'center', padding: 12 }}>No steps yet — plan first</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {steps.map((s, i) => (
                                        <div key={`${i}-${s.slice(0, 24)}`} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                                            <span style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <input placeholder={t('planner.nextStepPlaceholder')} value={nextStep} onChange={(e) => setNextStep(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nextStep.trim()) void handleStep(); }} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 12 }} />
                                <Button variant="secondary" size="sm" disabled={busy || !nextStep.trim()} onClick={() => void handleStep()}>{t('planner.step.submit')}</Button>
                            </div>
                        </div>
                    )}

                    {!result && steps.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-500)', flexDirection: 'column', gap: 8, padding: 24 }}>
                            <div style={{ fontSize: 32, opacity: 0.2 }}>🗺️</div>
                            <div style={{ fontSize: 12, textAlign: 'center', maxWidth: 360 }}>Enter a task above — planner will break it down using <b>{strategy}</b> strategy. Filters {filters.length ? `(${filters.map(f=>f.stage+':'+f.name).join(', ')})` : 'none'} will pre/post-process.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
