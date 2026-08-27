/**
 * Cognitive-aux / research panel (Experimental).
 * Prompt strategy audit — research-grade, not production surface (P1.21).
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertTriangle, Lightbulb, Search, X } from 'lucide-react';
import { promptAuditService } from '../../kernel/instances';
import { usePolling } from '../Common/usePolling';
import AuditStatCards from './AuditStatCards';
import TempDistribution from './TempDistribution';
import GroupDistribution from './GroupDistribution';
import StrategyDistribution from './StrategyDistribution';
import SuggestionsPanel from './SuggestionsPanel';
import AgentAuditCard from './AgentAuditCard';

const PromptAudit: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'temp' | 'words'>('name');
    const [groupFilter, setGroupFilter] = useState<string>('all');
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [report, setReport] = useState(() => promptAuditService.buildAuditReport());

    usePolling(() => setReport(promptAuditService.buildAuditReport()), 15000);

    const agents = report.agents;
    const collisions = report.collisions;

    const filtered = useMemo(() => {
        let list = agents;
        if (groupFilter !== 'all') list = list.filter((a) => a.group === groupFilter);
        if (search) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
        return [...list].sort((a, b) => {
            if (sortBy === 'temp') return b.temperature - a.temperature;
            if (sortBy === 'words') return b.wordCount - a.wordCount;
            return a.name.localeCompare(b.name);
        });
    }, [agents, search, sortBy, groupFilter]);

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
                    <BookOpen size={20} color="#3b82f6" />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        Prompt Audit
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>
                        {report.strategyCount} strategies
                    </span>
                </div>
            </div>

            <AuditStatCards
                agentsCount={agents.length}
                avgWords={report.avgWords}
                withToolsCount={report.withToolsCount}
                withKeyTerms={report.withKeyTermsCount}
                avgTemp={report.avgTemperature}
            />
            <TempDistribution agents={agents} />
            <GroupDistribution
                groupCounts={report.groupCounts}
                agentsCount={agents.length}
                groupFilter={groupFilter}
                onSetGroupFilter={setGroupFilter}
            />

            <div
                style={{
                    padding: '0.6rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
            >
                <div
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--slate-500)',
                        marginBottom: '0.35rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                    }}
                >
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-500)' }}>
                        Most Used Tools
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {Object.entries(
                        agents.reduce<Record<string, number>>((acc, a) => {
                            for (const t of a.tools) acc[t] = (acc[t] || 0) + 1;
                            return acc;
                        }, {}),
                    )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([tool, count]) => (
                            <span
                                key={tool}
                                style={{
                                    fontSize: '0.65rem',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: 3,
                                    background: 'rgba(16,185,129,0.12)',
                                    color: '#34d399',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {tool}{' '}
                                <span style={{ color: 'var(--slate-500)', fontSize: '0.6rem' }}>
                                    {count}x
                                </span>
                            </span>
                        ))}
                </div>
            </div>

            <StrategyDistribution
                strategyCounts={report.strategyCoverage}
                agentsCount={agents.length}
            />
            <SuggestionsPanel
                suggestions={report.suggestions}
                showSuggestions={showSuggestions}
                onToggle={() => setShowSuggestions((v) => !v)}
            />

            <div
                style={{
                    padding: '0.5rem 1.25rem',
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        padding: '4px 8px',
                    }}
                >
                    <Search size={12} color="#64748b" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter agents..."
                        style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--slate-200)',
                            fontSize: '0.75rem',
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
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
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    style={{
                        padding: '0.3rem 0.5rem',
                        borderRadius: 5,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'var(--slate-400)',
                        fontSize: '0.7rem',
                        outline: 'none',
                    }}
                >
                    <option value="name">Name</option>
                    <option value="temp">Temperature</option>
                    <option value="words">Length</option>
                </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 1.25rem' }}>
                {filtered.map((a) => (
                    <AgentAuditCard key={a.id} agent={a} />
                ))}
            </div>

            {collisions.length > 0 && (
                <div
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        padding: '0.6rem 1.25rem',
                        maxHeight: 150,
                        overflowY: 'auto',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'var(--warning)',
                            marginBottom: '0.3rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <AlertTriangle size={12} /> {collisions.length} similar pairs ({'>'}50%)
                        <button
                            onClick={() =>
                                navigate(
                                    `/hypothesis-gen?source=${encodeURIComponent('src/kernel/state/topology-defaults.ts')}&title=${encodeURIComponent('Prompt collisions: ' + collisions.length + ' similar pairs')}`,
                                )
                            }
                            style={{
                                marginLeft: 'auto',
                                background: 'var(--purple-tint)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                color: '#a855f7',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '0.6rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                            }}
                        >
                            <Lightbulb size={10} /> Hypothesis
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {collisions.map((c) => (
                            <span
                                key={`${c.a}-${c.b}`}
                                style={{
                                    fontSize: '0.65rem',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: 3,
                                    background: 'rgba(245,158,11,0.08)',
                                    color: '#d4a04a',
                                }}
                            >
                                {c.a} ↔ {c.b} ({c.similarity}%)
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptAudit;
