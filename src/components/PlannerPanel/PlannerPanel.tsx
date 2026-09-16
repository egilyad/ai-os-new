import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { plannerService } from '../../kernel/instances/services-extras';
import type { PlannerStrategy } from '../../kernel/contracts/rivals';
import { Button } from '../../components/Common';

const STRATEGIES: PlannerStrategy[] = ['sequential', 'function_calling', 'stepwise', 'plan_and_execute'];
const FILTER_NAMES = ['audit', 'policy', 'trim'];
const FILTER_STAGES = ['pre', 'post'];

const inputStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '0.35rem',
    background: 'var(--bg-elevated)',
    color: 'inherit',
    border: '1px solid var(--border-subtle)',
    borderRadius: 6,
    padding: '0.3rem 0.5rem',
};

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
        <div style={{ padding: '0.75rem 1rem' }}>
            <h2 style={{ margin: 0 }}>{t('planner.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('planner.subtitle')}</p>
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {notice && <p style={{ opacity: 0.8 }}>{notice}</p>}

            <section aria-label={t('planner.plan.heading')}>
                <h3>{t('planner.plan.heading')}</h3>
                <input
                    aria-label={t('planner.task')}
                    placeholder={t('planner.taskPlaceholder')}
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <select
                        aria-label={t('planner.strategy')}
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value as PlannerStrategy)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 220 }}
                    >
                        {STRATEGIES.map((s) => (
                            <option key={s} value={s}>
                                {t(`planner.strategy.${s}`)}
                            </option>
                        ))}
                    </select>
                    <Button variant="primary" size="sm" disabled={busy} onClick={() => void handlePlan()}>
                        {t('planner.plan.submit')}
                    </Button>
                </div>
                {result !== null && (
                    <div>
                        <h4>{t('planner.result.heading')}</h4>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{result}</p>
                    </div>
                )}
                {strategy === 'stepwise' && steps.length > 0 && (
                    <div>
                        <h4>{t('planner.steps.heading')}</h4>
                        <ul>
                            {steps.map((s, i) => (
                                <li key={`${i}-${s.slice(0, 24)}`}>{s}</li>
                            ))}
                        </ul>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <input
                                aria-label={t('planner.nextStep')}
                                placeholder={t('planner.nextStepPlaceholder')}
                                value={nextStep}
                                onChange={(e) => setNextStep(e.target.value)}
                                style={{ ...inputStyle, marginBottom: 0 }}
                            />
                            <Button variant="secondary" size="sm" disabled={busy || !nextStep.trim()} onClick={() => void handleStep()}>
                                {t('planner.step.submit')}
                            </Button>
                        </div>
                    </div>
                )}
            </section>

            <section aria-label={t('planner.filters.heading')}>
                <h3>{t('planner.filters.heading')}</h3>
                {filters.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('planner.filters.empty')}</p>
                ) : (
                    <ul>
                        {filters.map((f) => (
                            <li key={`${f.stage}:${f.name}`}>
                                {f.stage} · {f.name}
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <select
                        aria-label={t('planner.filter.stage')}
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 130 }}
                    >
                        {FILTER_STAGES.map((s) => (
                            <option key={s} value={s}>
                                {t(`planner.filter.stage.${s}`)}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label={t('planner.filter.name')}
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 160 }}
                    >
                        {FILTER_NAMES.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void handleAddFilter()}>
                        {t('planner.filter.add')}
                    </Button>
                </div>
            </section>
        </div>
    );
}
