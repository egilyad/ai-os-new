import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Wallet, Database, Zap, ArrowRight, Lightbulb } from 'lucide-react';
import { budgetService } from '../../kernel/instances/services-extras';
import { memoryService } from '../../kernel/instances';
import { keyService } from '../../kernel/instances';
import { routerService } from '../../kernel/instances/services-core';

function safeCall<T>(fn: () => T, fallback: T): T {
    try {
        return fn();
    } catch {
        return fallback;
    }
}

const QUICK_LINKS: Array<{ id: string; label: string; emoji: string }> = [
    { id: 'debate', label: 'Дебаты', emoji: '🎯' },
    { id: 'memory-center', label: 'Memory Center', emoji: '🧠' },
    { id: 'knowledge', label: 'Знания', emoji: '📚' },
    { id: 'wiki', label: 'Wiki', emoji: '📖' },
    { id: 'graph-workbench', label: 'Graph Workbench', emoji: '🧰' },
];

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
    title,
    icon,
    children,
}) => (
    <div
        style={{
            padding: '1rem',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--slate-200)' }}>
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const Bar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
    const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
    return (
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
        </div>
    );
};

const ResearchCockpit: React.FC = () => {
    const navigate = useNavigate();
    const [hypothesis, setHypothesis] = useState('');

    const spend = safeCall(() => budgetService.getSpendSummary?.(), null);
    const memStats = safeCall(() => memoryService.getStats?.(), null);
    const keys = safeCall(() => keyService.getKeys?.(), []);
    const decisions = safeCall(() => routerService.getDecisionHistory?.(50), []);

    const globalSpent = spend?.global?.spent ?? 0;
    const globalBudget = spend?.global?.budget ?? 0;
    const globalPct = spend?.global?.pct ?? 0;
    const providers = (spend?.providers ?? []).slice(0, 5);

    const byType = memStats?.byType ?? {};
    const memTotal = memStats?.totalEntries ?? 0;
    const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);

    const activeKeys = keys.filter((k) => k.status === 'active').length;

    const ucbMap = new Map<string, { sum: number; count: number }>();
    decisions.forEach((d) => {
        (d.scores || []).forEach((s) => {
            const rec = ucbMap.get(s.provider) ?? { sum: 0, count: 0 };
            rec.sum += s.score;
            rec.count += 1;
            ucbMap.set(s.provider, rec);
        });
    });
    const ucbTop = [...ucbMap.entries()]
        .filter(([, r]) => r.count > 0)
        .map(([provider, r]) => ({ provider, mean: r.sum / r.count, count: r.count }))
        .sort((a, b) => b.mean - a.mean)
        .slice(0, 5);

    return (
        <div style={{ padding: '1rem 1.25rem', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Target size={20} color="#8b5cf6" />
                    Research Cockpit
                </h2>
                <p style={{ margin: '0.3rem 0 0', fontSize: 13, color: 'var(--slate-400)' }}>
                    Единая рабочая область для глубокого исследования: бюджет, источники, провайдеры и роутинг.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Lightbulb size={16} color="#f59e0b" />
                <input
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    placeholder="Сформулируй гипотезу или вопрос исследования…"
                    style={{
                        flex: 1,
                        padding: '0.65rem 0.9rem',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--slate-200)',
                        fontSize: 14,
                    }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                <Card title="Бюджет" icon={<Wallet size={16} color="#f97316" />}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--slate-300)' }}>
                        <span>Потрачено</span>
                        <b>${globalSpent.toFixed(2)}</b>
                    </div>
                    <Bar value={globalSpent} max={globalBudget || 1} color="#f97316" />
                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                        {globalBudget > 0 ? `${globalPct.toFixed(0)}% от $${globalBudget.toFixed(2)}` : 'бюджет не задан'}
                    </div>
                    {providers.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                            {providers.map((p) => (
                                <div key={p.provider} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--slate-400)' }}>
                                    <span>{p.provider}</span>
                                    <span>${p.spent.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Источники" icon={<Database size={16} color="#a78bfa" />}>
                    <div style={{ fontSize: 13, color: 'var(--slate-300)' }}>
                        Всего записей: <b>{memTotal}</b>
                    </div>
                    {typeEntries.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>Память пуста — добавь заметки или результаты исследований.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {typeEntries.map(([t, count]) => (
                                <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--slate-400)' }}>
                                    <span>{t}</span>
                                    <b>{count}</b>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Провайдеры" icon={<Zap size={16} color="#22d3ee" />}>
                    <div style={{ fontSize: 13, color: 'var(--slate-300)' }}>
                        Ключей: <b>{keys.length}</b> · активных: <b>{activeKeys}</b>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>Средний балл роутинга (UCB1):</div>
                    {ucbTop.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>Нет решений роутинга.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {ucbTop.map((p) => (
                                <div key={p.provider} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--slate-400)' }}>
                                    <span>{p.provider}</span>
                                    <b>{p.mean.toFixed(3)}</b>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '0.8rem', borderRadius: 12, border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.06)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-200)' }}>Углубиться:</span>
                {QUICK_LINKS.map((l) => (
                    <button
                        key={l.id}
                        onClick={() => navigate(`/${l.id}`)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.4rem 0.8rem',
                            borderRadius: 8,
                            border: '1px solid rgba(139,92,246,0.3)',
                            background: 'rgba(139,92,246,0.12)',
                            color: 'var(--slate-200)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                        }}
                    >
                        {l.emoji} {l.label} <ArrowRight size={12} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ResearchCockpit;
