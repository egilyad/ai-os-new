/**
 * Cognitive-aux / research panel (Experimental).
 * Gemini-powered research — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Sparkles, Shield, AlertTriangle, FileText, Users } from 'lucide-react';
import type { ResearchSession } from '../../kernel/contracts/research-engine';
import {
    researchEngine,
    geminiResearchService as _geminiResearchService,
} from '../../kernel/instances';
import { usePolling } from '../Common/usePolling';
const geminiResearch = _geminiResearchService;
import { GeminiSearchTab } from './GeminiSearchTab';
import { GeminiFactCheckTab } from './GeminiFactCheckTab';
import { GeminiSummaryTab } from './GeminiSummaryTab';
import { GeminiAnomaliesTab } from './GeminiAnomaliesTab';
import { GeminiPeerReviewTab } from './GeminiPeerReviewTab';

type TabId = 'search' | 'analysis' | 'summary' | 'anomalies' | 'peer-review';

const TABS: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'search', label: 'Search', icon: <Search size={16} />, color: 'var(--accent)' },
    { id: 'analysis', label: 'Fact-Check', icon: <Shield size={16} />, color: 'var(--warning)' },
    { id: 'summary', label: 'Summary', icon: <FileText size={16} />, color: '#06b6d4' },
    { id: 'anomalies', label: 'Anomalies', icon: <AlertTriangle size={16} />, color: 'var(--error)' },
    { id: 'peer-review', label: 'Peer Review', icon: <Users size={16} />, color: '#ec4899' },
];

const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
};

const GeminiResearchPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('search');
    const [sessions, setSessions] = useState<ResearchSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (researchEngine) {
            setSessions(researchEngine.getAllSessions());
        }
    }, []);

    usePolling(() => {
        if (researchEngine) setSessions(researchEngine.getAllSessions());
    }, 15000);

    const renderTab = () => {
        if (!geminiResearch) {
            return (
                <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: 'var(--slate-500)' }}>
                    <Sparkles size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div>Gemini Research service not available</div>
                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                        Ensure Gemini API key is configured
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'search':
                return <GeminiSearchTab service={geminiResearch} />;
            case 'analysis':
                return (
                    <GeminiFactCheckTab service={geminiResearch} sessionId={selectedSessionId} />
                );
            case 'summary':
                return <GeminiSummaryTab service={geminiResearch} sessionId={selectedSessionId} />;
            case 'anomalies':
                return (
                    <GeminiAnomaliesTab service={geminiResearch} sessionId={selectedSessionId} />
                );
            case 'peer-review':
                return (
                    <GeminiPeerReviewTab service={geminiResearch} sessionId={selectedSessionId} />
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Sparkles size={24} style={{ color: 'var(--purple)' }} />
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                    Gemini Research
                </h2>
                <span
                    style={{
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#8b5cf620',
                        color: 'var(--purple)',
                        fontWeight: 600,
                    }}
                >
                    LLM-POWERED
                </span>
                {geminiResearch && !geminiResearch.isAvailable && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--warning)', marginLeft: 8 }}>
                        ⚠ No Gemini key configured
                    </span>
                )}
            </div>

            {error && (
                <div
                    style={{
                        ...cardStyle,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.08)',
                        color: 'var(--error)',
                        fontSize: '0.85rem',
                    }}
                >
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid',
                            borderColor:
                                activeTab === tab.id ? tab.color : 'var(--border-subtle)',
                            background: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                            color: activeTab === tab.id ? tab.color : 'var(--slate-400)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            transition: 'all 0.15s',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab !== 'search' && (
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--slate-500)',
                            display: 'block',
                            marginBottom: 6,
                        }}
                    >
                        Research Session
                    </label>
                    <select
                        value={selectedSessionId}
                        onChange={(e) => {
                            setSelectedSessionId(e.target.value);
                            setError(null);
                        }}
                        style={{
                            width: '100%',
                            maxWidth: 400,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                        }}
                    >
                        <option value="">Select a session...</option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title} ({s.loops.length} loops)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderTab()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GeminiResearchPanel;
