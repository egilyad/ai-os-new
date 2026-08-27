import { X } from 'lucide-react';
import type {
    GraphAgentConfig,
    GraphEdge,
    GraphEdgeType,
} from '../../kernel/contracts/debate-strategy-dsl';
import { s } from './debate-strategy-styles';
import { AGENT_ROLES, EDGE_TYPES } from './debate-strategy-utils';

interface AgentEditorProps {
    agents: GraphAgentConfig[];
    onChange: (agents: GraphAgentConfig[]) => void;
}

export const AgentEditor: React.FC<AgentEditorProps> = ({ agents, onChange }) => (
    <div>
        <div style={s.fieldLabel}>Agents</div>
        {agents.map((a, i) => (
            <div key={a.nodeId} style={s.agentRow}>
                <input
                    value={a.nodeId}
                    onChange={(e) => {
                        const c = [...agents];
                        c[i] = { ...(c[i] as GraphAgentConfig), nodeId: e.target.value };
                        onChange(c);
                    }}
                    style={{ ...s.input, width: 60 }}
                    placeholder="ID"
                />
                <input
                    value={a.label || ''}
                    onChange={(e) => {
                        const c = [...agents];
                        c[i] = { ...(c[i] as GraphAgentConfig), label: e.target.value };
                        onChange(c);
                    }}
                    style={{ ...s.input, width: 70 }}
                    placeholder="Label"
                />
                <select
                    value={a.role}
                    onChange={(e) => {
                        const c = [...agents];
                        c[i] = {
                            ...(c[i] as GraphAgentConfig),
                            role: e.target.value as GraphAgentConfig['role'],
                        } as GraphAgentConfig;
                        onChange(c);
                    }}
                    style={{ ...s.select, width: 65, fontSize: 9 }}
                >
                    {AGENT_ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => onChange(agents.filter((_, j) => j !== i))}
                    style={s.iconBtn}
                    title="Remove"
                >
                    <X size={12} />
                </button>
            </div>
        ))}
        <button
            onClick={() =>
                onChange([
                    ...agents,
                    {
                        nodeId: `agent-${agents.length + 1}`,
                        role: 'neutral',
                        label: `Agent ${agents.length + 1}`,
                    },
                ])
            }
            style={s.addBtn}
        >
            + Add Agent
        </button>
    </div>
);

interface EdgeEditorProps {
    edges: GraphEdge[];
    agents: GraphAgentConfig[];
    onChange: (edges: GraphEdge[]) => void;
}

export const EdgeEditor: React.FC<EdgeEditorProps> = ({ edges, agents, onChange }) => (
    <div>
        <div style={s.fieldLabel}>Edges</div>
        {edges.map((e, i) => (
            <div key={`${e.from}-${e.to}`} style={s.agentRow}>
                <select
                    value={e.from}
                    onChange={(v) => {
                        const c = [...edges];
                        c[i] = { ...(c[i] as GraphEdge), from: v.target.value };
                        onChange(c);
                    }}
                    style={{ ...s.select, width: 60, fontSize: 9 }}
                >
                    {agents.map((a) => (
                        <option key={a.nodeId} value={a.nodeId}>
                            {a.nodeId}
                        </option>
                    ))}
                </select>
                <span style={{ color: 'var(--slate-500)', fontSize: 9 }}>→</span>
                <select
                    value={e.to}
                    onChange={(v) => {
                        const c = [...edges];
                        c[i] = { ...(c[i] as GraphEdge), to: v.target.value };
                        onChange(c);
                    }}
                    style={{ ...s.select, width: 60, fontSize: 9 }}
                >
                    {agents.map((a) => (
                        <option key={a.nodeId} value={a.nodeId}>
                            {a.nodeId}
                        </option>
                    ))}
                </select>
                <select
                    value={e.type}
                    onChange={(v) => {
                        const c = [...edges];
                        c[i] = { ...(c[i] as GraphEdge), type: v.target.value as GraphEdgeType };
                        onChange(c);
                    }}
                    style={{ ...s.select, width: 70, fontSize: 9 }}
                >
                    {EDGE_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
                <button onClick={() => onChange(edges.filter((_, j) => j !== i))} style={s.iconBtn}>
                    <X size={12} />
                </button>
            </div>
        ))}
        {agents.length >= 2 && (
            <button
                onClick={() =>
                    onChange([
                        ...edges,
                        { from: agents[0]!.nodeId, to: agents[1]!.nodeId, type: 'sequential' },
                    ])
                }
                style={s.addBtn}
            >
                + Add Edge
            </button>
        )}
    </div>
);
