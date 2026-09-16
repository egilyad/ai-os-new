/**
 * Cognitive-aux / research panel (Experimental).
 * Governance stress-test harness — research-grade, not production surface (P1.21).
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Shield, Play, Loader2, Download, Search, X, Filter, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { govStressTestService } from '../../kernel/instances';
import type { GovScenarioResult } from '../../kernel/contracts/gov-stress-test';
import { CATEGORY_COLORS } from './gov-stress-constants';
import GovStatCards from './GovStatCards';
import GovSummaryBar from './GovSummaryBar';
import ScenarioResultCard from './ScenarioResultCard';

const SCENARIO_COUNT = govStressTestService.getScenarios().length;

const GovStressTest: React.FC = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState<GovScenarioResult[]>([]);
    const [running, setRunning] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const liveSnapshot = useMemo(() => govStressTestService.buildReport([]), []);

    const runAll = useCallback(() => {
        setRunning(true);
        setTimeout(() => {
            setResults(govStressTestService.runAllScenarios());
            setRunning(false);
        }, 800);
    }, []);

    const filtered = useMemo(() => {
        let list = results;
        if (categoryFilter !== 'all')
            list = list.filter((r) => r.scenario.category === categoryFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (r) =>
                    r.scenario.name.toLowerCase().includes(q) ||
                    r.scenario.description.toLowerCase().includes(q),
            );
        }
        return list;
    }, [results, categoryFilter, searchQuery]);

    const summary = useMemo(() => govStressTestService.summarize(results), [results]);
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const r of results)
            counts[r.scenario.category] = (counts[r.scenario.category] || 0) + 1;
        return counts;
    }, [results]);

    const exportReport = () => {
        const report = govStressTestService.buildReport(results);
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gov-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <div
                style={{
                    padding: '1.5rem 1.5rem 0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={20} color="#10b981" />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        Governance Stress Test
                    </span>
                </div>
                <button
                    onClick={() =>
                        navigate(
                            `/hypothesis-gen?source=${encodeURIComponent('src/kernel/services/policy-service.ts')}&title=${encodeURIComponent('Governance stress test results')}`,
                        )
                    }
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        border: '1px solid rgba(139,92,246,0.2)',
                        background: 'rgba(139,92,246,0.08)',
                        color: '#a855f7',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    <Lightbulb size={11} /> Hypothesis
                </button>
            </div>

            <GovStatCards
                livePolicyCount={liveSnapshot.livePolicyCount}
                liveViolationCount={liveSnapshot.liveViolationCount}
                roleCount={liveSnapshot.roleCount}
                scenarioCount={SCENARIO_COUNT}
            />

            <GovSummaryBar
                passed={summary.passed}
                warned={summary.warned}
                blocked={summary.blocked}
                total={summary.total}
            />

            <div
                style={{
                    padding: '0.5rem 1.25rem',
                    display: 'flex',
                    gap: 4,
                    flexWrap: 'wrap',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
            >
                <button
                    onClick={() => setCategoryFilter('all')}
                    style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 5,
                        border:
                            categoryFilter === 'all'
                                ? '1px solid rgba(255,255,255,0.15)'
                                : '1px solid transparent',
                        background:
                            categoryFilter === 'all' ? 'rgba(255,255,255,0.04)' : 'transparent',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <Filter size={10} /> All{' '}
                    {results.length > 0 && (
                        <span style={{ color: 'var(--slate-500)', fontSize: '0.6rem' }}>
                            ({results.length})
                        </span>
                    )}
                </button>
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
                    const count = categoryCounts[cat] || 0;
                    return (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
                            style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: 5,
                                border:
                                    categoryFilter === cat
                                        ? `1px solid ${color}40`
                                        : '1px solid transparent',
                                background: categoryFilter === cat ? `${color}12` : 'transparent',
                                color: categoryFilter === cat ? color : 'var(--slate-500)',
                                cursor: 'pointer',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            {cat}{' '}
                            {count > 0 && (
                                <span style={{ color, fontSize: '0.6rem' }}>({count})</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div
                style={{
                    padding: '0.5rem 1.25rem',
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
            >
                <button
                    onClick={runAll}
                    disabled={running}
                    style={{
                        padding: '0.45rem 1rem',
                        borderRadius: 7,
                        border: 'none',
                        background: 'var(--success)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                    }}
                >
                    {running ? <Loader2 size={14} /> : <Play size={14} />}
                    {running ? 'Running...' : 'Run Test Suite'}
                </button>
                {results.length > 0 && (
                    <button
                        onClick={exportReport}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Download size={12} /> Export
                    </button>
                )}
                <div style={{ flex: 1 }} />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 5,
                        padding: '3px 7px',
                    }}
                >
                    <Search size={11} color="#64748b" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        style={{
                            width: 130,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--slate-200)',
                            fontSize: '0.72rem',
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-500)',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 1.25rem' }}>
                {filtered.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: 'var(--slate-600)',
                            fontSize: '0.85rem',
                        }}
                    >
                        {running ? (
                            <>
                                <Loader2
                                    size={16}
                                    style={{ display: 'block', margin: '0 auto 8px' }}
                                />{' '}
                                Running scenarios...
                            </>
                        ) : (
                            'Run the test suite to see results.'
                        )}
                    </div>
                ) : (
                    filtered.map((r, i) => <ScenarioResultCard key={`result-${i}`} result={r} />)
                )}
            </div>
        </div>
    );
};

export default GovStressTest;
