import React, { useState, useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import {
    agentService,
    workforceFederation,
    type AgentGroup,
    type GroupExecutionPattern,
} from '../../kernel/instances';

const PATTERNS: GroupExecutionPattern[] = [
    'parallel',
    'sequential',
    'consensus',
    'pipeline',
    'debate',
];

interface AgentGroupsSectionProps {
    agents: Array<{ id: string; name: string }>;
}

export const AgentGroupsSection: React.FC<AgentGroupsSectionProps> = ({ agents }) => {
    const { t } = useTranslation();
    const [agentGroups, setAgentGroups] = useState<AgentGroup[]>(() => agentService.getGroups());
    const [groupName, setGroupName] = useState('');
    const [groupPattern, setGroupPattern] = useState<GroupExecutionPattern>('parallel');
    const [groupAgentIds, setGroupAgentIds] = useState<string[]>([]);
    const [groupRunInput, setGroupRunInput] = useState('Analyze the current task.');
    const [groupRunResult, setGroupRunResult] = useState<string[] | null>(null);
    const [groupRunning, setGroupRunning] = useState(false);
    const [federationSource, setFederationSource] = useState('default');
    const [federationTarget, setFederationTarget] = useState('security');
    const [bridgeTick, setBridgeTick] = useState(0);
    const federationBridges = useMemo(() => {
        void bridgeTick;
        return workforceFederation.getBridges();
    }, [bridgeTick]);

    useEffect(() => {
        setAgentGroups(agentService.getGroups());
    }, [agents.length]);

    const handleCreateGroup = () => {
        if (!groupName.trim() || groupAgentIds.length < 2) return;
        agentService.createGroup(groupName.trim(), groupAgentIds, undefined, groupPattern);
        setAgentGroups(agentService.getGroups());
        setGroupName('');
        setGroupAgentIds([]);
    };

    const handleRunGroup = async (groupId: string) => {
        setGroupRunning(true);
        setGroupRunResult(null);
        try {
            const results = await agentService.executeGroup(groupId, groupRunInput);
            setGroupRunResult(results);
        } finally {
            setGroupRunning(false);
        }
    };

    return (
        <>
            <div
                className="agents-templates"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} color="#60a5fa" />
                    <span className="agents-templates-label">Agent Groups</span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        alignItems: 'center',
                    }}
                >
                    <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group name"
                        className="agents-search-input"
                        style={{ maxWidth: 140 }}
                    />
                    <select
                        value={groupPattern}
                        onChange={(e) => setGroupPattern(e.target.value as GroupExecutionPattern)}
                        className="agents-config-select"
                        style={{ maxWidth: 130 }}
                    >
                        {PATTERNS.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <select
                        multiple
                        value={groupAgentIds}
                        onChange={(e) =>
                            setGroupAgentIds(Array.from(e.target.selectedOptions, (o) => o.value))
                        }
                        className="agents-config-select"
                        style={{ minWidth: 160, minHeight: 56 }}
                        aria-label={t('agents.select_agents_label')}
                    >
                        {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleCreateGroup}
                        className="agents-action-btn btn-secondary"
                        disabled={!groupName.trim() || groupAgentIds.length < 2}
                    >
                        {t('agents.create_group')}
                    </button>
                </div>
                {agentGroups.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <input
                            value={groupRunInput}
                            onChange={(e) => setGroupRunInput(e.target.value)}
                            placeholder="Input for group run"
                            className="agents-search-input"
                        />
                        {agentGroups.map((g) => (
                            <div
                                key={g.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem',
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{g.name}</span>
                                <span style={{ color: 'var(--slate-500)' }}>
                                    ({g.executionPattern || 'parallel'}, {g.agentIds.length} agents)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRunGroup(g.id)}
                                    className="agents-action-btn btn-secondary"
                                    disabled={groupRunning}
                                >
                                    {groupRunning ? 'Running\u2026' : 'Run'}
                                </button>
                            </div>
                        ))}
                        {groupRunResult && (
                            <pre
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-400)',
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {groupRunResult.join('\n')}
                            </pre>
                        )}
                    </div>
                )}
            </div>

            <div
                className="agents-templates"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
            >
                <span className="agents-templates-label">Workforce Federation</span>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        alignItems: 'center',
                    }}
                >
                    <input
                        value={federationSource}
                        onChange={(e) => setFederationSource(e.target.value)}
                        placeholder="Source topology"
                        className="agents-search-input"
                        style={{ maxWidth: 120 }}
                    />
                    <span style={{ color: 'var(--slate-500)' }}>→</span>
                    <input
                        value={federationTarget}
                        onChange={(e) => setFederationTarget(e.target.value)}
                        placeholder="Target topology"
                        className="agents-search-input"
                        style={{ maxWidth: 120 }}
                    />
                    <button
                        type="button"
                        className="agents-action-btn btn-secondary"
                        onClick={() => {
                            workforceFederation.createBridge(
                                federationSource,
                                federationTarget,
                                'async',
                            );
                            setBridgeTick((n) => n + 1);
                        }}
                    >
                        Add bridge
                    </button>
                </div>
                {federationBridges.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                        {federationBridges.map((b) => (
                            <div key={b.id}>
                                {b.sourceTopology} → {b.targetTopology} ({b.policy})
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
