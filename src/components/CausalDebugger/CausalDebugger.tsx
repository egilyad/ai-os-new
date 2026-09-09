/**
 * Cognitive-aux / research panel (Experimental).
 * Causal debugger — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Search } from 'lucide-react';
import { textXxsMuted, detailGrid2, sectionHeaderDebug } from '../../styles/common';
import { eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('CausalDebugger');
import {
    causalTimelineService,
    causalScopeManager,
    temporalReplayService,
    truthConsistencyMonitor,
    kernel,
    keyStateStore,
} from '../../kernel/instances';
import type {
    CausalTraceEntry,
    CausalTrace,
    CausalScope,
} from '../../kernel/contracts/causal-debugger';
import type { TemporalTrace } from '../../kernel/contracts/temporal-replay';
import type { ConsistencyReport } from '../../kernel/contracts/truth-consistency';
import ConsistencyCheckSection from './ConsistencyCheckSection';
import TraceListPanel from './TraceListPanel';
import SnapshotPair from './SnapshotPair';
import TemporalReplaySection from './TemporalReplaySection';
import { INPUT_STYLE } from './causal-debugger-constants';

const CausalDebugger: React.FC = () => {
    const [traces, setTraces] = useState<CausalTraceEntry[]>([]);
    const [selectedCausalId, setSelectedCausalId] = useState<string | null>(null);
    const [selectedTrace, setSelectedTrace] = useState<CausalTrace | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [scopes, setScopes] = useState<CausalScope[]>([]);
    const [replayTrace, setReplayTrace] = useState<TemporalTrace | null>(null);
    const [replayFrame, setReplayFrame] = useState(0);
    const [replayLoading, setReplayLoading] = useState(false);
    const [consistencyReport, setConsistencyReport] = useState<ConsistencyReport | null>(null);

    const refresh = useCallback(() => {
        try {
            setTraces(causalTimelineService?.listTraces(100) ?? []);
            setScopes(causalScopeManager?.getAllScopes() ?? []);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        refresh();
        const unsub = eventBus.on(EVENTS.DECISION, refresh);
        return () => {
            unsub();
        };
    }, [refresh]);

    const handleSelect = useCallback((causalId: string) => {
        setSelectedCausalId(causalId);
        setReplayTrace(null);
        setReplayFrame(0);
        try {
            const trace = causalTimelineService?.getTrace(causalId);
            setSelectedTrace(trace ?? null);
        } catch {
            setSelectedTrace(null);
        }
    }, []);

    const runReplay = useCallback(() => {
        if (!selectedTrace) return;
        setReplayLoading(true);
        try {
            const result = temporalReplayService?.replay(selectedTrace.entry);
            setReplayTrace(result ?? null);
            setReplayFrame(0);
        } catch {
            setReplayTrace(null);
        }
        setReplayLoading(false);
    }, [selectedTrace]);

    const checkConsistency = useCallback(() => {
        try {
            const kState = kernel?.getState();
            const allStates = keyStateStore?.getAll();
            if (!kState || !allStates) {
                setConsistencyReport(null);
                return;
            }
            const keyMap: Record<string, unknown> = {};
            for (const s of allStates) {
                keyMap[s.id] = {
                    provider: s.provider,
                    latency: s.lastProbe.latency,
                    status: s.status,
                    rateLimited: s.flags.rateLimited,
                    healthErrors: s.health.consecutiveErrors,
                    authFailed: s.flags.authFailed,
                };
            }
            const report = truthConsistencyMonitor?.check(kState.providers, keyMap);
            setConsistencyReport(report ?? null);
            if (report && (report.status === 'DRIFT' || report.status === 'CRITICAL')) {
                LOGGER.warn(
                    'Consistency drift detected',
                    JSON.stringify({
                        status: report.status,
                        driftScore: report.driftScore,
                        mismatchCount: report.mismatches.length,
                        criticalCount: report.mismatches.filter((m) => m.severity === 'critical')
                            .length,
                    }),
                );
            }
        } catch (e) {
            setConsistencyReport(null);
            LOGGER.warn('Consistency check failed', String(e));
        }
    }, []);

    const filtered = traces.filter(
        (t) =>
            !searchTerm ||
            t.causalId.includes(searchTerm) ||
            t.requestIds.some((r) => r.includes(searchTerm)),
    );

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <GitBranch size={20} color="#a78bfa" />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                    Causal Debugger
                </span>
                <span style={textXxsMuted}>
                    {traces.length} traces · {scopes.length} scopes
                </span>
            </div>

            <div style={{ position: 'relative' }}>
                <Search
                    size={14}
                    style={{ position: 'absolute', left: 10, top: 10, color: 'var(--slate-500)' }}
                />
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by causalId or requestId..."
                    style={INPUT_STYLE}
                />
            </div>

            <ConsistencyCheckSection report={consistencyReport} onCheck={checkConsistency} />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: selectedTrace ? '1fr 2fr' : '1fr',
                    gap: 16,
                    flex: 1,
                    overflow: 'hidden',
                }}
            >
                <TraceListPanel
                    entries={filtered}
                    selectedId={selectedCausalId}
                    scopes={scopes}
                    onSelect={handleSelect}
                />

                {selectedTrace && (
                    <div
                        style={{
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                padding: 16,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 12,
                            }}
                        >
                            <div style={sectionHeaderDebug}>Decision</div>
                            <pre
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-300)',
                                    whiteSpace: 'pre-wrap',
                                    margin: 0,
                                    fontFamily: 'monospace',
                                }}
                            >
                                {JSON.stringify(selectedTrace.entry.decision, null, 2)}
                            </pre>
                        </div>

                        <div style={detailGrid2}>
                            <SnapshotPair
                                label="KeyState Before"
                                color="#f59e0b"
                                data={selectedTrace.entry.before.keyState.data}
                            />
                            <SnapshotPair
                                label="RouterState Before"
                                color="#3b82f6"
                                data={selectedTrace.entry.before.routerState.data}
                            />
                        </div>

                        <div style={detailGrid2}>
                            <SnapshotPair
                                label="KeyState After"
                                color="#22c55e"
                                data={selectedTrace.entry.after.keyState.data}
                            />
                            <SnapshotPair
                                label="RouterState After"
                                color="#a78bfa"
                                data={selectedTrace.entry.after.routerState.data}
                            />
                        </div>

                        {selectedTrace.scope && (
                            <div
                                style={{
                                    padding: 16,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 12,
                                }}
                            >
                                <div style={sectionHeaderDebug}>Scope</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--slate-300)' }}>
                                    <div>
                                        <strong>causalId:</strong> {selectedTrace.scope.causalId}
                                    </div>
                                    <div>
                                        <strong>requestIds:</strong>{' '}
                                        {selectedTrace.scope.requestIds.join(', ')}
                                    </div>
                                    <div>
                                        <strong>providers:</strong>{' '}
                                        {selectedTrace.scope.providerIds.join(', ') || '(none)'}
                                    </div>
                                    <div>
                                        <strong>keys:</strong>{' '}
                                        {selectedTrace.scope.keyIds.join(', ') || '(none)'}
                                    </div>
                                    <div>
                                        <strong>started:</strong>{' '}
                                        {new Date(selectedTrace.scope.startedAt).toISOString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        <TemporalReplaySection
                            replayTrace={replayTrace}
                            replayFrame={replayFrame}
                            replayLoading={replayLoading}
                            onRun={runReplay}
                            onClear={() => {
                                setReplayTrace(null);
                            }}
                            onFrameChange={setReplayFrame}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CausalDebugger;
