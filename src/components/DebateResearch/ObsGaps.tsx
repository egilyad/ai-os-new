/**
 * Cognitive-aux / research panel (Experimental).
 * Observability gaps scanner — research-grade, not production surface (P1.21).
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Play, Loader2, Download, Search, X, Lightbulb, FileText } from 'lucide-react';
import { workspaceService, obsGapsService } from '../../kernel/instances';
import type { ServiceObsInfo, DocEventCoverage } from '../../kernel/contracts/obs-gaps';
import CoverageStatCards from './CoverageStatCards';
import CoverageBars from './CoverageBars';
import ObsServiceRow from './ObsServiceRow';
import RecommendationsPanel from './RecommendationsPanel';

const SERVICE_COUNT = obsGapsService.getServiceCount();

const ObsGaps: React.FC = () => {
    const navigate = useNavigate();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [liveServices, setLiveServices] = useState<ServiceObsInfo[] | null>(null);
    const [wsAttached] = useState(() => {
        try {
            return workspaceService.isAttached();
        } catch {
            return false;
        }
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [docEvents, setDocEvents] = useState<DocEventCoverage[]>([]);
    const [eventsLoaded, setEventsLoaded] = useState(false);

    useEffect(() => {
        if (!wsAttached) return;
        (async () => {
            try {
                const content = await workspaceService.readFile('docs/events.md');
                const parsed = obsGapsService.parseEventsDocumentation(content);
                setDocEvents(
                    obsGapsService.crossReferenceEvents(
                        parsed,
                        obsGapsService.getStaticInventory(),
                    ),
                );
                setEventsLoaded(true);
            } catch {
                /* events.md unavailable */
            }
        })();
    }, [wsAttached]);

    const runScan = useCallback(async () => {
        setScanning(true);
        try {
            const readFile = wsAttached
                ? (path: string) => workspaceService.readFile(path)
                : undefined;
            const services = await obsGapsService.scanServices(readFile);
            setLiveServices(services);
            setDocEvents((prev) => {
                if (prev.length === 0) return prev;
                const rawEvents = prev.map(({ name, source }) => ({ name, source }));
                return obsGapsService.crossReferenceEvents(rawEvents, services);
            });
            setScanned(true);
        } finally {
            setScanning(false);
        }
    }, [wsAttached]);

    const services = liveServices ?? obsGapsService.getStaticInventory();
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return services;
        const q = searchQuery.toLowerCase();
        return services.filter((s) => s.name.toLowerCase().includes(q));
    }, [services, searchQuery]);

    const coverage = useMemo(() => obsGapsService.computeCoverage(services), [services]);

    const exportReport = () => {
        const rawEvents = docEvents.map(({ name, source }) => ({ name, source }));
        const report = obsGapsService.buildReport(services, rawEvents);
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `obs-gaps-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const recommendations = useMemo(
        () =>
            obsGapsService.buildReport(
                services,
                docEvents.map(({ name, source }) => ({ name, source })),
            ).recommendations,
        [services, docEvents],
    );

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
                    <Eye size={20} color="#06b6d4" />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        Observability Gaps
                    </span>
                    {wsAttached && scanned && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>Live scan</span>
                    )}
                </div>
                <button
                    onClick={() =>
                        navigate(
                            `/hypothesis-gen?source=${encodeURIComponent('docs/events.md')}&title=${encodeURIComponent('Observability gaps analysis')}`,
                        )
                    }
                    style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 6,
                        border: '1px solid rgba(139,92,246,0.2)',
                        background: 'rgba(139,92,246,0.08)',
                        color: '#a855f7',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    <Lightbulb size={11} /> Hypothesis
                </button>
            </div>

            <div
                style={{
                    padding: '0.75rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <button
                    onClick={runScan}
                    disabled={scanning}
                    style={{
                        padding: '0.5rem 1.1rem',
                        borderRadius: 7,
                        border: 'none',
                        background: '#06b6d4',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                    }}
                >
                    {scanning ? <Loader2 size={14} /> : <Play size={14} />}
                    {scanning ? 'Scanning...' : scanned ? 'Re-scan' : 'Scan'}
                </button>
                {scanned && (
                    <span style={{ fontSize: '0.7rem', color: wsAttached ? '#10b981' : '#f59e0b' }}>
                        {wsAttached ? 'Workspace analysis' : 'Static data'}
                    </span>
                )}
                <div style={{ flex: 1 }} />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 4,
                        padding: '2px 6px',
                    }}
                >
                    <Search size={10} color="#64748b" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter..."
                        style={{
                            width: 120,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--slate-200)',
                            fontSize: '0.68rem',
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
                            <X size={9} />
                        </button>
                    )}
                </div>
                {scanned && (
                    <button
                        onClick={exportReport}
                        style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 5,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.68rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                        }}
                    >
                        <Download size={11} /> Export
                    </button>
                )}
            </div>

            {!scanned && !scanning ? (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--slate-600)',
                        gap: 8,
                    }}
                >
                    <Eye size={40} opacity={0.25} />
                    <span style={{ fontSize: '0.9rem' }}>No scan results yet</span>
                    <span style={{ fontSize: '0.75rem' }}>
                        Run a scan to check observability coverage across {SERVICE_COUNT} services.
                    </span>
                </div>
            ) : scanning ? (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--slate-500)',
                        gap: 8,
                    }}
                >
                    <Loader2 size={18} /> <span>Scanning service files...</span>
                </div>
            ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
                    <CoverageStatCards
                        overall={coverage.overall}
                        gaps={coverage.gaps}
                        total={coverage.total}
                    />
                    <CoverageBars
                        eventScore={coverage.eventScore}
                        loggerScore={coverage.loggerScore}
                        healthScore={coverage.healthScore}
                        tracingScore={coverage.tracingScore}
                        lifecycleScore={coverage.lifecycleScore}
                        withEvents={coverage.withEvents}
                        withLogger={coverage.withLogger}
                        withHealth={coverage.withHealth}
                        withTracing={coverage.withTracing}
                        withLifecycle={coverage.withLifecycle}
                        total={coverage.total}
                    />

                    {eventsLoaded && docEvents.length > 0 && (
                        <div
                            style={{
                                marginBottom: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: 8,
                                background: 'rgba(59,130,246,0.05)',
                                border: '1px solid rgba(59,130,246,0.1)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    marginBottom: '0.35rem',
                                }}
                            >
                                <FileText size={12} color="#60a5fa" />
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: '#60a5fa',
                                    }}
                                >
                                    Events.md Cross-Reference
                                </span>
                                <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>
                                    {docEvents.length} documented events
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 3,
                                    flexWrap: 'wrap',
                                    maxHeight: 120,
                                    overflowY: 'auto',
                                }}
                            >
                                {docEvents.slice(0, 30).map((d) => (
                                    <span
                                        key={d.name}
                                        style={{
                                            fontSize: '0.6rem',
                                            padding: '0.1rem 0.35rem',
                                            borderRadius: 3,
                                            background: d.covered
                                                ? 'rgba(16,185,129,0.08)'
                                                : 'rgba(239,68,68,0.08)',
                                            color: d.covered ? '#34d399' : '#f87171',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {d.name}
                                    </span>
                                ))}
                                {docEvents.length > 30 && (
                                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                        +{docEvents.length - 30} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'var(--slate-400)',
                            marginBottom: '0.4rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Service Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {filtered.map((s) => (
                            <ObsServiceRow key={s.name} service={s} />
                        ))}
                    </div>

                    <RecommendationsPanel recommendations={recommendations} />
                </div>
            )}
        </div>
    );
};

export default ObsGaps;
