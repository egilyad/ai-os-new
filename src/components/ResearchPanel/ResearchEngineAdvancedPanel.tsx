/**
 * Cognitive-aux / research panel (Experimental).
 * Advanced research engine surface — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVisibilityInterval } from '../../utils/visibility-interval';
import {
    Layers,
    GitBranch,
    Network,
    BookOpen,
    Shield,
    AlertTriangle,
    FileText,
    Quote,
    Users,
    Compass,
} from 'lucide-react';
import { researchEngine } from '../../kernel/instances';
import type { IResearchEngine, ResearchSession } from '../../kernel/contracts/research-engine';
import { StatusBadge } from './ResearchSharedComponents';
import { CitationGraphTab } from './CitationGraphTab';
import { KnowledgeGraphTab } from './KnowledgeGraphTab';
import { SystematicReviewTab } from './SystematicReviewTab';
import { FactCheckTab } from './FactCheckTab';
import { AnomaliesTab } from './AnomaliesTab';
import { SummaryTab } from './SummaryTab';
import { CitationsTab } from './CitationsTab';
import { PeerReviewTab } from './PeerReviewTab';
import { DiscoveryTab } from './DiscoveryTab';
import { ResearchReportTab } from './ResearchReportTab';

const TAB_ICONS: Record<string, React.ReactNode> = {
    citation: <GitBranch size={16} />,
    knowledge: <Network size={16} />,
    review: <BookOpen size={16} />,
    factcheck: <Shield size={16} />,
    anomalies: <AlertTriangle size={16} />,
    summary: <FileText size={16} />,
    citations: <Quote size={16} />,
    peer: <Users size={16} />,
    discovery: <Compass size={16} />,
    report: <Layers size={16} />,
};

const TABS = [
    { id: 'citation', label: 'Citation Graph', color: 'var(--accent)' },
    { id: 'knowledge', label: 'Knowledge Graph', color: 'var(--purple)' },
    { id: 'review', label: 'Systematic Review', color: 'var(--success)' },
    { id: 'factcheck', label: 'Fact-Check', color: 'var(--warning)' },
    { id: 'anomalies', label: 'Anomalies', color: 'var(--error)' },
    { id: 'summary', label: 'Summarize', color: '#06b6d4' },
    { id: 'citations', label: 'Cite', color: '#a855f7' },
    { id: 'peer', label: 'Peer Review', color: '#ec4899' },
    { id: 'discovery', label: 'Auto-Discovery', color: 'var(--success)' },
    { id: 'report', label: 'Report', color: '#f97316' },
];

export const ResearchEngineAdvancedPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState('citation');
    const [sessions, setSessions] = useState<ResearchSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const engineRef = useRef<IResearchEngine>(researchEngine);

    const refresh = useCallback(() => {
        setSessions(engineRef.current.getAllSessions());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);
    useVisibilityInterval(refresh, 3000);

    const selectedSession = sessions.find((s) => s.id === selectedSessionId);
    const allSourcesCount = selectedSession
        ? selectedSession.loops.reduce((s, l) => s + l.sources.length, 0)
        : 0;
    const allClaimsCount = selectedSession
        ? selectedSession.loops.reduce((s, l) => s + l.claims.length, 0)
        : 0;

    const renderTab = () => {
        if (!selectedSession && activeTab !== 'discovery') {
            return (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
                    <div style={{ opacity: 0.3, marginBottom: 8 }}>
                        <Layers size={40} />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select a Session</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                        Pick a research session from the sidebar to analyze
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'citation':
                return <CitationGraphTab engine={engineRef.current} session={selectedSession!} />;
            case 'knowledge':
                return <KnowledgeGraphTab engine={engineRef.current} session={selectedSession!} />;
            case 'review':
                return (
                    <SystematicReviewTab engine={engineRef.current} session={selectedSession!} />
                );
            case 'factcheck':
                return <FactCheckTab engine={engineRef.current} session={selectedSession!} />;
            case 'anomalies':
                return <AnomaliesTab engine={engineRef.current} session={selectedSession!} />;
            case 'summary':
                return <SummaryTab engine={engineRef.current} session={selectedSession!} />;
            case 'citations':
                return <CitationsTab engine={engineRef.current} session={selectedSession!} />;
            case 'peer':
                return <PeerReviewTab engine={engineRef.current} session={selectedSession!} />;
            case 'discovery':
                return <DiscoveryTab engine={engineRef.current} />;
            case 'report':
                return <ResearchReportTab engine={engineRef.current} session={selectedSession!} />;
            default:
                return null;
        }
    };

    return (
        <div
            style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            color: 'var(--slate-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Layers size={22} color="#8b5cf6" /> Research Engine — Advanced
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: 2 }}>
                        Citation Graph · Knowledge Graph · PRISMA · Fact-Check · Anomalies ·
                        Summarization · Citations · Peer Review · Auto-Discovery · Reports
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <select
                    value={selectedSessionId || ''}
                    onChange={(e) => setSelectedSessionId(e.target.value || null)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'var(--slate-900)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                        outline: 'none',
                    }}
                >
                    <option value="">— Select Research Session —</option>
                    {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.title} ({s.loops.length} loops,{' '}
                            {s.loops.reduce((sum, l) => sum + l.sources.length, 0)} sources)
                        </option>
                    ))}
                </select>
            </div>

            {selectedSession && (
                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: '1rem',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'rgba(139,92,246,0.05)',
                        border: '1px solid rgba(139,92,246,0.1)',
                        fontSize: '0.72rem',
                        color: 'var(--slate-400)',
                    }}
                >
                    <span>{selectedSession.loops.length} epistemic loops</span>
                    <span>{allSourcesCount} sources</span>
                    <span>{allClaimsCount} claims</span>
                    <span>{new Date(selectedSession.createdAt).toLocaleDateString()}</span>
                    <StatusBadge
                        label={selectedSession.status}
                        color={
                            selectedSession.status === 'complete'
                                ? '#22c55e'
                                : selectedSession.status === 'error'
                                  ? '#ef4444'
                                  : '#64748b'
                        }
                    />
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    gap: 4,
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    padding: '4px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            background: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                            color: activeTab === tab.id ? tab.color : 'var(--slate-500)',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            transition: 'all 0.15s',
                        }}
                    >
                        {TAB_ICONS[tab.id]}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>{renderTab()}</div>
        </div>
    );
};

export default ResearchEngineAdvancedPanel;
