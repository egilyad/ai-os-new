import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Wallet, Database, Zap, ArrowRight, Lightbulb } from 'lucide-react';
import { budgetService, researchEngine } from '../../kernel/instances/services-extras';
import {
    memoryService,
    keyService,
    sessionManager,
    knowledgeGenerator,
} from '../../kernel/instances';
import { routerService } from '../../kernel/instances/services-core';
import CoverageLens from '../GraphWorkbenchPanel/CoverageLens';

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
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--slate-200)',
            }}
        >
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const Bar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
    const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
    return (
        <div
            style={{
                height: 6,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
            }}
        >
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
        </div>
    );
};

const ResearchCockpit: React.FC = () => {
    const navigate = useNavigate();
    const [hypothesis, setHypothesis] = useState('');
    const [launching, setLaunching] = useState(false);
    const [sessions, setSessions] = useState<
        Array<{ id: string; title: string; status: string; createdAt: number }>
    >([]);
    const [processes, setProcesses] = useState<
        Array<{ id: string; label: string; kind: string; status: string }>
    >([]);
    const [relatedHits, setRelatedHits] = useState<
        Array<{ content: string; type: string; score: number }>
    >([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sessionDetail, setSessionDetail] = useState<{
        status: string;
        sources: number;
        claims: number;
        findings: string[];
        questions: string[];
    } | null>(null);

    const handleLaunch = async () => {
        const q = hypothesis.trim();
        if (!q || launching) return;
        setLaunching(true);
        try {
            const id = await researchEngine.startSession(q.slice(0, 120), q);
            navigate(`/research-engine?session=${encodeURIComponent(id)}`);
        } catch {
            navigate('/research-engine');
        } finally {
            setLaunching(false);
            void refreshSessions();
        }
    };

    const refreshSessions = () => {
        const all = safeCall(() => researchEngine.getAllSessions?.(), []);
        const list = (Array.isArray(all) ? all : []).slice(0, 5).map((s) => ({
            id: String(s.id),
            title: String(s.title ?? s.initialQuestion ?? ''),
            status: String(s.status ?? ''),
            createdAt: Number(s.createdAt ?? 0),
        }));
        setSessions(list);
    };

    const refreshProcesses = async () => {
        const out: Array<{ id: string; label: string; kind: string; status: string }> = [];

        const research = safeCall(() => researchEngine.getAllSessions?.(), []);
        (Array.isArray(research) ? research : []).forEach((s) => {
            const st = String(s.status ?? '');
            if (st === 'complete' || st === 'error' || st === 'idle') return;
            out.push({
                id: `res:${s.id}`,
                label: String(s.title ?? s.initialQuestion ?? ''),
                kind: 'research',
                status: st,
            });
        });

        const debates = safeCall(() => sessionManager.getDebateHistory?.(), []);
        (Array.isArray(debates) ? debates : []).forEach((d) => {
            const st = String((d as { status?: unknown }).status ?? '');
            if (st === 'completed' || st === 'failed' || st === 'cancelled' || st === 'paused')
                return;
            out.push({
                id: `deb:${d.id}`,
                label: String(d.topic ?? ''),
                kind: 'debate',
                status: st,
            });
        });

        let jobs: Array<{ id?: unknown; topic?: unknown; status?: unknown }> = [];
        try {
            const active = await knowledgeGenerator.listActiveJobs?.();
            if (Array.isArray(active))
                jobs = active as Array<{ id?: unknown; topic?: unknown; status?: unknown }>;
        } catch {
            /* ignore */
        }
        jobs.forEach((j) => {
            out.push({
                id: `gen:${String(j.id)}`,
                label: String(j.topic ?? 'Генерация'),
                kind: 'generator',
                status: String(j.status ?? 'running'),
            });
        });

        setProcesses(out.slice(0, 12));
    };

    useEffect(() => {
        refreshSessions();
        void refreshProcesses();
        const timer = window.setInterval(() => {
            refreshSessions();
            void refreshProcesses();
        }, 5000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const q = hypothesis.trim();
        if (q.length < 8) {
            setRelatedHits([]);
            return;
        }
        const timer = window.setTimeout(() => {
            void (async () => {
                try {
                    const res = (await memoryService.search(q, 5)) as Array<{
                        entry: { content?: unknown; type?: unknown };
                        score: unknown;
                    }>;
                    setRelatedHits(
                        (Array.isArray(res) ? res : []).map((r) => ({
                            content: String(r.entry?.content ?? ''),
                            type: String(r.entry?.type ?? ''),
                            score: Number(r.score ?? 0),
                        })),
                    );
                } catch {
                    setRelatedHits([]);
                }
            })();
        }, 400);
        return () => window.clearTimeout(timer);
    }, [hypothesis]);

    const activeCount = processes.length;

    const toggleSession = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setSessionDetail(null);
            return;
        }
        const s = safeCall(() => researchEngine.getSession?.(id), undefined);
        const loops = Array.isArray((s as { loops?: unknown })?.loops)
            ? ((s as { loops?: unknown }).loops as Array<Record<string, unknown>>)
            : [];
        let sources = 0;
        let claims = 0;
        const findings: string[] = [];
        const questions: string[] = [];
        loops.forEach((l) => {
            const src = Array.isArray(l.sources) ? (l.sources as unknown[]).length : 0;
            const cl = Array.isArray(l.claims) ? (l.claims as unknown[]).length : 0;
            sources += src;
            claims += cl;
            const synth = l.synthesis as { keyFindings?: unknown; newQuestions?: unknown } | null;
            if (synth && Array.isArray(synth.keyFindings)) {
                (synth.keyFindings as unknown[]).forEach((f) => {
                    if (findings.length < 5 && typeof f === 'string') findings.push(f);
                });
            }
            if (synth && Array.isArray(synth.newQuestions)) {
                (synth.newQuestions as unknown[]).forEach((q) => {
                    if (questions.length < 4 && typeof q === 'string') questions.push(q);
                });
            }
        });
        setSessionDetail({
            status: String((s as { status?: unknown })?.status ?? ''),
            sources,
            claims,
            findings,
            questions,
        });
        setExpandedId(id);
    };

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
        <div
            style={{
                padding: '1rem 1.25rem',
                maxWidth: 1200,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
            }}
        >
            <div>
                <h2
                    style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Target size={20} color="#8b5cf6" />
                    Research Cockpit
                    {activeCount > 0 && (
                        <span
                            style={{
                                fontSize: 11,
                                color: '#34d399',
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: 'rgba(52,211,153,0.12)',
                                border: '1px solid rgba(52,211,153,0.3)',
                                fontWeight: 700,
                            }}
                        >
                            ● {activeCount} активно
                        </span>
                    )}
                </h2>
                <p style={{ margin: '0.3rem 0 0', fontSize: 13, color: 'var(--slate-400)' }}>
                    Единая рабочая область для глубокого исследования: запуск, бюджет, источники,
                    провайдеры и последние сессии.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Lightbulb size={16} color="#f59e0b" />
                <input
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleLaunch();
                    }}
                    placeholder="Сформулируй гипотезу или вопрос исследования…"
                    style={{
                        flex: 1,
                        minWidth: 220,
                        padding: '0.65rem 0.9rem',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--slate-200)',
                        fontSize: 14,
                    }}
                />
                <button
                    onClick={() => void handleLaunch()}
                    disabled={launching || !hypothesis.trim()}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0.65rem 1.1rem',
                        borderRadius: 10,
                        border: 'none',
                        background: launching
                            ? 'rgba(139,92,246,0.4)'
                            : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: launching || !hypothesis.trim() ? 'default' : 'pointer',
                        fontSize: 14,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {launching ? 'Запуск…' : '🔬 Запустить Deep Research'}
                </button>
            </div>

            {relatedHits.length > 0 && (
                <div
                    style={{
                        padding: '0.6rem 0.9rem',
                        borderRadius: 10,
                        border: '1px solid rgba(167,139,250,0.25)',
                        background: 'rgba(167,139,250,0.06)',
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--slate-300)',
                            marginBottom: 6,
                        }}
                    >
                        Уже есть в памяти по этой теме:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {relatedHits.map((h, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12,
                                    color: 'var(--slate-400)',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: 'var(--slate-500)',
                                        background: 'rgba(255,255,255,0.06)',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {h.type}
                                </span>
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {h.content}
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>
                                    {h.score.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 12,
                }}
            >
                <Card title="Бюджет" icon={<Wallet size={16} color="#f97316" />}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 13,
                            color: 'var(--slate-300)',
                        }}
                    >
                        <span>Потрачено</span>
                        <b>${globalSpent.toFixed(2)}</b>
                    </div>
                    <Bar value={globalSpent} max={globalBudget || 1} color="#f97316" />
                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                        {globalBudget > 0
                            ? `${globalPct.toFixed(0)}% от $${globalBudget.toFixed(2)}`
                            : 'бюджет не задан'}
                    </div>
                    {providers.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                marginTop: 4,
                            }}
                        >
                            {providers.map((p) => (
                                <div
                                    key={p.provider}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 12,
                                        color: 'var(--slate-400)',
                                    }}
                                >
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
                        <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                            Память пуста — добавь заметки или результаты исследований.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {typeEntries.map(([t, count]) => (
                                <div
                                    key={t}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 12,
                                        color: 'var(--slate-400)',
                                    }}
                                >
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
                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                        Средний балл роутинга (UCB1):
                    </div>
                    {ucbTop.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                            Нет решений роутинга.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {ucbTop.map((p) => (
                                <div
                                    key={p.provider}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 12,
                                        color: 'var(--slate-400)',
                                    }}
                                >
                                    <span>{p.provider}</span>
                                    <b>{p.mean.toFixed(3)}</b>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <div
                style={{
                    padding: '0.8rem 1rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(0,0,0,0.18)',
                }}
            >
                <div
                    style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--slate-200)',
                        marginBottom: 8,
                    }}
                >
                    Карта покрытия памяти (treemap)
                </div>
                <CoverageLens />
            </div>

            {processes.length > 0 && (
                <div
                    style={{
                        padding: '0.8rem 1rem',
                        borderRadius: 12,
                        border: '1px solid rgba(52,211,153,0.25)',
                        background: 'rgba(52,211,153,0.05)',
                    }}
                >
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--slate-200)',
                            marginBottom: 8,
                        }}
                    >
                        Активные процессы ({processes.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {processes.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    const target =
                                        p.kind === 'debate'
                                            ? '/debate-history'
                                            : p.kind === 'generator'
                                              ? '/knowledge-generator'
                                              : '/research-engine';
                                    navigate(target);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '0.45rem 0.7rem',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.02)',
                                    color: 'var(--slate-200)',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    textAlign: 'left',
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: '#34d399',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--slate-500)',
                                        minWidth: 70,
                                    }}
                                >
                                    {p.kind}
                                </span>
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {p.label}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--slate-500)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {p.status}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {sessions.length > 0 && (
                <div
                    style={{
                        padding: '0.8rem 1rem',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.18)',
                    }}
                >
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--slate-200)',
                            marginBottom: 8,
                        }}
                    >
                        Последние исследования
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sessions.map((s) => (
                            <div
                                key={s.id}
                                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                            >
                                <button
                                    onClick={() => toggleSession(s.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '0.45rem 0.7rem',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        background: 'rgba(255,255,255,0.02)',
                                        color: 'var(--slate-200)',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        textAlign: 'left',
                                    }}
                                >
                                    <span
                                        style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {s.title}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--slate-500)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {s.status}
                                    </span>
                                    <ArrowRight
                                        size={13}
                                        style={{
                                            transform:
                                                expandedId === s.id ? 'rotate(90deg)' : 'none',
                                        }}
                                    />
                                </button>
                                {expandedId === s.id && sessionDetail && (
                                    <div
                                        style={{
                                            padding: '0.6rem 0.8rem',
                                            borderRadius: 8,
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            fontSize: 12,
                                            color: 'var(--slate-300)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                            <span>
                                                статус: <b>{sessionDetail.status}</b>
                                            </span>
                                            <span>
                                                источников: <b>{sessionDetail.sources}</b>
                                            </span>
                                            <span>
                                                claims: <b>{sessionDetail.claims}</b>
                                            </span>
                                        </div>
                                        {sessionDetail.findings.length > 0 && (
                                            <div>
                                                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                                    Ключевые выводы
                                                </div>
                                                {sessionDetail.findings.map((f, i) => (
                                                    <div key={i} style={{ marginBottom: 2 }}>
                                                        • {f}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {sessionDetail.questions.length > 0 && (
                                            <div>
                                                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                                    Новые вопросы
                                                </div>
                                                {sessionDetail.questions.map((q, i) => (
                                                    <div key={i} style={{ marginBottom: 2 }}>
                                                        ? {q}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/research-engine?session=${encodeURIComponent(s.id)}`,
                                                )
                                            }
                                            style={{
                                                alignSelf: 'flex-start',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: 6,
                                                border: '1px solid rgba(139,92,246,0.3)',
                                                background: 'rgba(139,92,246,0.12)',
                                                color: 'var(--slate-200)',
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                fontWeight: 600,
                                            }}
                                        >
                                            Открыть полностью →
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    padding: '0.8rem',
                    borderRadius: 12,
                    border: '1px solid rgba(139,92,246,0.25)',
                    background: 'rgba(139,92,246,0.06)',
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-200)' }}>
                    Углубиться:
                </span>
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
