/**
 * Cognitive-aux / research panel (Experimental).
 * Counterfactual analysis — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import {
    causalTimelineService,
    counterfactualEngine,
    counterfactualExplanationService,
    counterfactualNarrativeService,
} from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import { CARD, RATE_PRESETS } from './counterfactual-constants';
import TraceSidebar from './TraceSidebar';
import ScoreComparison from './ScoreComparison';
import NarrativeSection from './NarrativeSection';
import CausalAttribution from './CausalAttribution';
import type { CausalTraceEntry } from '../../kernel/contracts/causal-debugger';
import type { CounterfactualResult } from '../../kernel/contracts/counterfactual';
import type { DecisionExplanation } from '../../kernel/contracts/counterfactual-explanation';
import type { NarrativeExplanation } from '../../kernel/contracts/counterfactual-narrative';

const CounterfactualPanel: React.FC = () => {
    const [traces, setTraces] = useState<CausalTraceEntry[]>([]);
    const [selectedTrace, setSelectedTrace] = useState<CausalTraceEntry | null>(null);
    const [result, setResult] = useState<CounterfactualResult | null>(null);
    const [activePreset, setActivePreset] = useState<number | null>(null);

    const explanation = useMemo<DecisionExplanation | null>(() => {
        if (!result) return null;
        try {
            return (
                counterfactualExplanationService?.explain(result.original, result.simulated) ?? null
            );
        } catch {
            return null;
        }
    }, [result]);

    const narrative = useMemo<NarrativeExplanation | null>(() => {
        if (!explanation) return null;
        try {
            return counterfactualNarrativeService?.generate(explanation) ?? null;
        } catch {
            return null;
        }
    }, [explanation]);

    const refresh = useCallback(() => {
        try {
            setTraces(causalTimelineService?.listTraces(50) ?? []);
        } catch {
            /* silent */
        }
    }, []);

    useEffect(() => {
        refresh();
        const unsub = eventBus.on(EVENTS.DECISION, refresh);
        return () => {
            unsub();
        };
    }, [refresh]);

    const runCounterfactual = useCallback((trace: CausalTraceEntry, presetIndex: number | null) => {
        setSelectedTrace(trace);
        setActivePreset(presetIndex);
        try {
            const overrides =
                presetIndex !== null ? RATE_PRESETS[presetIndex]! : { keys: {}, global: {} };
            setResult(
                (counterfactualEngine?.run({ baseTrace: trace, overrides, prompt: '' }) ??
                    null) as CounterfactualResult | null,
            );
        } catch {
            setResult(null);
        }
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                height: '100%',
                padding: 16,
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Zap size={20} color="#f59e0b" />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                    Counterfactual Router
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {traces.length} traces available
                </span>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr',
                    gap: 16,
                    flex: 1,
                    overflow: 'hidden',
                }}
            >
                <TraceSidebar
                    traces={traces}
                    selectedId={selectedTrace?.causalId ?? null}
                    activePreset={activePreset}
                    onRun={runCounterfactual}
                />

                <div
                    style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                    {!result && (
                        <div
                            style={{
                                ...CARD,
                                textAlign: 'center',
                                padding: 32,
                                color: 'var(--slate-500)',
                                fontSize: '0.8rem',
                            }}
                        >
                            Select a trace and optional override preset to run a counterfactual
                            simulation
                        </div>
                    )}

                    {result && (
                        <>
                            <div
                                style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16 }}
                            >
                                {result.switchProvider ? (
                                    <AlertTriangle size={20} color="#f59e0b" />
                                ) : (
                                    <CheckCircle2 size={20} color="#22c55e" />
                                )}
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-200)',
                                        }}
                                    >
                                        {result.switchProvider
                                            ? 'Provider Switch'
                                            : 'Same Provider'}
                                    </div>
                                    {result.switchReason && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                                            {result.switchReason}
                                        </div>
                                    )}
                                </div>
                                <div
                                    style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    {result.meta.durationMs.toFixed(1)}ms
                                </div>
                            </div>

                            <ScoreComparison result={result} />

                            <div style={CARD}>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-400)',
                                        marginBottom: 8,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    Overrides Applied
                                </div>
                                <pre
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-300)',
                                        whiteSpace: 'pre-wrap',
                                        margin: 0,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {JSON.stringify(result.meta.overridesApplied, null, 2)}
                                </pre>
                            </div>

                            {narrative && <NarrativeSection narrative={narrative} />}
                            {explanation && <CausalAttribution explanation={explanation} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CounterfactualPanel;
