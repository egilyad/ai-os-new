import { Play, Loader2, Check, Plus } from 'lucide-react';
import type { TopologyType, TopologyNode, DebateTopology } from '../../kernel/instances';
import { TOPOLOGY_TYPES, TOPOLOGY_ROLES, ROLE_COLORS } from './debate-runtime-constants';
import { TopologyDiagram } from './TopologyDiagram';
import { flexColGap3, purpleBorderSection, textMutedWeight600Xs } from '../../styles/common';

interface CreateSessionFormProps {
    topic: string;
    setTopic: (v: string) => void;
    topologyType: TopologyType;
    setTopologyType: (v: TopologyType) => void;
    availableNodes: Array<{
        id: string;
        label: string;
        provider?: string;
        model?: string;
        prompt?: string;
    }>;
    selectedAgentIds: string[];
    setSelectedAgentIds: (fn: (prev: string[]) => string[]) => void;
    agentRoles: Record<string, string>;
    setAgentRoles: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
    creating: boolean;
    handleCreate: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

function buildPreviewTopology(
    availableNodes: CreateSessionFormProps['availableNodes'],
    selectedAgentIds: string[],
    agentRoles: Record<string, string>,
    topologyType: TopologyType,
): DebateTopology {
    const availableRoles = TOPOLOGY_ROLES[topologyType];
    const selected = availableNodes.filter((n) => selectedAgentIds.includes(n.id));
    const participants =
        selected.length > 0
            ? selected
            : [
                  { id: 'a', label: 'Agent A' },
                  { id: 'b', label: 'Agent B' },
              ];
    return {
        id: 'preview',
        type: topologyType,
        nodes: participants.map((n, i) => ({
            id: n.id,
            label: n.label,
            role: (agentRoles[n.id] ||
                availableRoles[i % availableRoles.length] ||
                'pro') as TopologyNode['role'],
        })),
        edges:
            topologyType === 'linear'
                ? participants.slice(0, -1).map((n, i) => ({
                      from: n.id,
                      to: participants[i + 1]!.id,
                      type: 'sequential' as const,
                  }))
                : topologyType === 'judge' && participants.length >= 2
                  ? participants
                        .filter((p) => (agentRoles[p.id] || 'pro') !== 'judge')
                        .map((p) => ({
                            from: p.id,
                            to:
                                participants.find(
                                    (q) =>
                                        (agentRoles[q.id] || '') === 'judge' ||
                                        q.id === participants[participants.length - 1]!.id,
                                )?.id || participants[participants.length - 1]!.id,
                            type: 'sequential' as const,
                        }))
                  : topologyType === 'red-blue'
                    ? [
                          {
                              from: participants[0]?.id || '',
                              to: participants[1]?.id || participants[0]?.id || '',
                              type: 'sequential' as const,
                          },
                      ]
                    : [],
    };
}

const CreateSessionForm: React.FC<CreateSessionFormProps> = ({
    topic,
    setTopic,
    topologyType,
    setTopologyType,
    availableNodes,
    selectedAgentIds,
    setSelectedAgentIds,
    agentRoles,
    setAgentRoles,
    creating,
    handleCreate,
    t,
}) => {
    const availableRoles = TOPOLOGY_ROLES[topologyType];

    const toggleAgent = (id: string) => {
        setSelectedAgentIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    return (
        <div style={purpleBorderSection}>
            <h3
                style={{
                    margin: '0 0 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--purple-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                <Plus size={16} /> {t('debate_runtime.new_session')}
            </h3>
            <div style={flexColGap3}>
                <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t('debate_runtime.topic_placeholder')}
                    aria-label={t('debate_runtime.topic_aria')}
                    style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid rgba(100,116,139,0.3)',
                        background: 'rgba(15,15,30,0.6)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                        outline: 'none',
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <select
                    value={topologyType}
                    onChange={(e) => setTopologyType(e.target.value as TopologyType)}
                    aria-label={t('debate_runtime.topology_aria')}
                    style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid rgba(100,116,139,0.3)',
                        background: 'rgba(15,15,30,0.6)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                        outline: 'none',
                    }}
                >
                    {TOPOLOGY_TYPES.map((tt) => (
                        <option key={tt} value={tt}>
                            {tt.replace('-', ' ')}
                        </option>
                    ))}
                </select>

                {availableNodes.length > 0 && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '0.3rem',
                            }}
                        >
                            <div style={textMutedWeight600Xs}>
                                {t('debate_runtime.select_agents', {
                                    selected: selectedAgentIds.length,
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    onClick={() =>
                                        setSelectedAgentIds(() => availableNodes.map((n) => n.id))
                                    }
                                    style={{
                                        fontSize: '0.65rem',
                                        padding: '0.15rem 0.5rem',
                                        color: 'var(--purple-muted)',
                                        border: '1px solid rgba(167,139,250,0.3)',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        background: 'transparent',
                                    }}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setSelectedAgentIds(() => [])}
                                    style={{
                                        fontSize: '0.65rem',
                                        padding: '0.15rem 0.5rem',
                                        color: 'var(--slate-400)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        background: 'transparent',
                                    }}
                                >
                                    None
                                </button>
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.3rem',
                                maxHeight: 160,
                                overflowY: 'auto',
                            }}
                        >
                            {availableNodes.map((node) => {
                                const sel = selectedAgentIds.includes(node.id);
                                return (
                                    <div
                                        key={node.id}
                                        onClick={() => toggleAgent(node.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.35rem 0.5rem',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            background: sel
                                                ? 'rgba(139,92,246,0.12)'
                                                : 'transparent',
                                            border: `1px solid ${sel ? 'rgba(139,92,246,0.3)' : 'rgba(100,116,139,0.15)'}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: 3,
                                                border: `1px solid ${sel ? '#a78bfa' : '#475569'}`,
                                                background: sel ? '#a78bfa' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {sel && <Check size={12} color="#fff" />}
                                        </div>
                                        <span style={{ color: 'var(--slate-200)', fontWeight: 500 }}>
                                            {node.label}
                                        </span>
                                        {node.provider && (
                                            <span style={{ color: 'var(--slate-500)', marginLeft: 'auto' }}>
                                                {node.provider}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {selectedAgentIds.length > 0 && (
                    <div>
                        <div style={textMutedWeight600Xs}>
                            {t('debate_runtime.role_assignment')}
                        </div>
                        {selectedAgentIds.map((id) => {
                            const node = availableNodes.find((n) => n.id === id);
                            return (
                                <div
                                    key={id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.3rem',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <span style={{ color: 'var(--slate-200)', minWidth: 80 }}>
                                        {node?.label || id}
                                    </span>
                                    <select
                                        value={agentRoles[id] || availableRoles[0] || 'pro'}
                                        onChange={(e) =>
                                            setAgentRoles((prev) => ({
                                                ...prev,
                                                [id]: e.target.value,
                                            }))
                                        }
                                        style={{
                                            padding: '0.25rem 0.4rem',
                                            borderRadius: 4,
                                            border: '1px solid rgba(100,116,139,0.3)',
                                            background: 'rgba(15,15,30,0.6)',
                                            color: 'var(--slate-200)',
                                            fontSize: '0.7rem',
                                            outline: 'none',
                                        }}
                                    >
                                        {availableRoles.map((r) => (
                                            <option
                                                key={r}
                                                value={r}
                                                style={{ color: ROLE_COLORS[r] || '#e2e8f0' }}
                                            >
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    onClick={handleCreate}
                    disabled={creating || !topic.trim() || selectedAgentIds.length < 2}
                    style={{
                        padding: '0.6rem',
                        borderRadius: 8,
                        border: 'none',
                        cursor: creating || selectedAgentIds.length < 2 ? 'not-allowed' : 'pointer',
                        background:
                            creating || selectedAgentIds.length < 2
                                ? 'rgba(139,92,246,0.3)'
                                : 'rgba(139,92,246,0.6)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                    }}
                >
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    {t('debate_runtime.create_session')}
                </button>
            </div>
            <TopologyDiagram
                topology={buildPreviewTopology(
                    availableNodes,
                    selectedAgentIds,
                    agentRoles,
                    topologyType,
                )}
            />
        </div>
    );
};

export default CreateSessionForm;
