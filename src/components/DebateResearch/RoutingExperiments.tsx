/**
 * Cognitive-aux / research panel (Experimental).
 * Model routing experiments — research-grade, not production surface (P1.21).
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Route, Play, Download, Loader2, Clock, Cpu } from 'lucide-react';
import { adapterRegistry, routingExperimentsService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('RoutingExperiments');
import type {
    RoutingExperimentResult,
    RoutingExperimentRun,
} from '../../kernel/contracts/routing-experiments';
import { STRATEGIES, MODELS, chipStyle, thStyle, tdStyle } from './routing-experiments-constants';
import ExperimentHistoryPanel from './ExperimentHistoryPanel';
import StrategyComparisonCard from './StrategyComparisonCard';
import ResultsTableSection from './ResultsTableSection';

const RoutingExperiments: React.FC = () => {
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['round-robin']);
    const [runsPerCell, setRunsPerCell] = useState(3);
    const [results, setResults] = useState<RoutingExperimentResult[]>([]);
    const [running, setRunning] = useState(false);
    const [sortCol, setSortCol] = useState('avgLatency');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [history, setHistory] = useState<RoutingExperimentRun[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [realMode, setRealMode] = useState(false);
    const [realProgress, setRealProgress] = useState('');

    const providers = useMemo(() => adapterRegistry.getAllProviders(), []);

    useEffect(() => {
        setSelectedProviders([providers[0] || 'Groq']);
        setSelectedModels([MODELS[0]!]);
    }, [providers]);

    useEffect(() => {
        routingExperimentsService
            .getHistory()
            .then(setHistory)
            .catch((e) => LOGGER.warn('RoutingExperiments', 'History load failed', { error: e }));
    }, []);

    const refreshHistory = useCallback(async () => {
        const runs = await routingExperimentsService.getHistory();
        setHistory(runs);
    }, []);

    const experimentConfig = useMemo(
        () => ({
            providers: selectedProviders,
            models: selectedModels,
            strategies: selectedStrategies,
            runsPerCell,
            realMode,
        }),
        [selectedProviders, selectedModels, selectedStrategies, runsPerCell, realMode],
    );

    const estimatedCost = useMemo(
        () => routingExperimentsService.estimateCost(experimentConfig),
        [experimentConfig],
    );
    const totalRuns = useMemo(
        () => routingExperimentsService.totalRuns(experimentConfig),
        [experimentConfig],
    );

    const toggleSelection = (item: string, list: string[], setter: (v: string[]) => void) => {
        setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
    };

    const runExperiment = useCallback(async () => {
        if (
            selectedProviders.length === 0 ||
            selectedModels.length === 0 ||
            selectedStrategies.length === 0
        )
            return;
        setRunning(true);
        setResults([]);
        try {
            const run = await routingExperimentsService.runExperiment(
                experimentConfig,
                setRealProgress,
            );
            setResults(run.results);
            await refreshHistory();
        } finally {
            setRunning(false);
            setRealProgress('');
        }
    }, [
        experimentConfig,
        refreshHistory,
        selectedProviders.length,
        selectedModels.length,
        selectedStrategies.length,
    ]);

    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => {
            const aVal = a[sortCol as keyof RoutingExperimentResult] as number;
            const bVal = b[sortCol as keyof RoutingExperimentResult] as number;
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [results, sortCol, sortDir]);

    const toggleSort = (col: string) => {
        if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortCol(col);
            setSortDir('asc');
        }
    };

    const exportJson = () => {
        const blob = new Blob(
            [
                JSON.stringify(
                    {
                        config: {
                            providers: selectedProviders,
                            models: selectedModels,
                            strategies: selectedStrategies,
                            runsPerCell,
                            realMode,
                        },
                        results,
                    },
                    null,
                    2,
                ),
            ],
            { type: 'application/json' },
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `routing-experiment-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const comparison = useMemo(
        () => (results.length > 0 ? routingExperimentsService.computeComparison(results) : []),
        [results],
    );

    const loadExperiment = (run: RoutingExperimentRun) => {
        setResults(run.results);
        setRealMode(run.realMode);
        setShowHistory(false);
    };

    const deleteExperiment = async (id: string) => {
        await routingExperimentsService.deleteRun(id);
        await refreshHistory();
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
                    <Route size={20} color="#f59e0b" />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        Routing Experiments
                    </span>
                    {history.length > 0 && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                            {history.length} saved
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'transparent',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <Clock size={12} /> History
                </button>
            </div>

            {showHistory && history.length > 0 && (
                <ExperimentHistoryPanel
                    history={history}
                    results={results}
                    onLoad={loadExperiment}
                    onDelete={deleteExperiment}
                    onClose={() => setShowHistory(false)}
                />
            )}

            <div
                style={{
                    padding: '0.75rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '0.75rem',
                        marginBottom: '0.6rem',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: 'var(--slate-500)',
                                marginBottom: '0.3rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Providers
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {providers.map((p) => (
                                <button
                                    key={p}
                                    onClick={() =>
                                        toggleSelection(p, selectedProviders, setSelectedProviders)
                                    }
                                    style={chipStyle(selectedProviders.includes(p), '#f59e0b')}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: 'var(--slate-500)',
                                marginBottom: '0.3rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Models
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {MODELS.map((m) => (
                                <button
                                    key={m}
                                    onClick={() =>
                                        toggleSelection(m, selectedModels, setSelectedModels)
                                    }
                                    style={chipStyle(selectedModels.includes(m), '#3b82f6')}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: 'var(--slate-500)',
                                marginBottom: '0.3rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Strategies
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {STRATEGIES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() =>
                                        toggleSelection(
                                            s,
                                            selectedStrategies,
                                            setSelectedStrategies,
                                        )
                                    }
                                    style={chipStyle(selectedStrategies.includes(s), '#10b981')}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Runs/cell:</span>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={runsPerCell}
                            onChange={(e) =>
                                setRunsPerCell(Math.max(1, Math.min(10, Number(e.target.value))))
                            }
                            style={{
                                width: 45,
                                padding: '0.25rem 0.4rem',
                                borderRadius: 5,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: 'var(--slate-200)',
                                fontSize: '0.75rem',
                                textAlign: 'center',
                            }}
                        />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                        {totalRuns} runs, ~${estimatedCost.toFixed(2)} est.
                    </span>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.7rem',
                            color: realMode ? '#a855f7' : '#64748b',
                            cursor: 'pointer',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={realMode}
                            onChange={(e) => setRealMode(e.target.checked)}
                            style={{ accentColor: '#a855f7' }}
                        />
                        <Cpu size={11} /> Real LLM
                    </label>
                    <button
                        onClick={runExperiment}
                        disabled={running || totalRuns === 0}
                        style={{
                            marginLeft: 'auto',
                            padding: '0.5rem 1.1rem',
                            borderRadius: 7,
                            border: 'none',
                            background: 'var(--warning)',
                            color: 'var(--slate-800)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        {running ? <Loader2 size={14} /> : <Play size={14} />}
                        {running ? realProgress || 'Running...' : 'Run'}
                    </button>
                </div>
            </div>

            <StrategyComparisonCard comparison={comparison} />

            <ResultsTableSection
                sortedResults={sortedResults}
                thStyle={thStyle}
                tdStyle={tdStyle}
                toggleSort={toggleSort}
                sortCol={sortCol}
                sortDir={sortDir}
                running={running}
            />

            {sortedResults.length > 0 && (
                <div
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        padding: '0.6rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <button
                        onClick={exportJson}
                        style={{
                            padding: '0.4rem 0.9rem',
                            borderRadius: 7,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <Download size={12} /> Export JSON
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoutingExperiments;
