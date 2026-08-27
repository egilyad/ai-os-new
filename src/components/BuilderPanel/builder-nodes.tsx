import { Handle, Position, type Node, type Edge } from '@xyflow/react';
import { Bot, ShieldCheck, Cpu, Wrench, GitBranch, Blocks } from 'lucide-react';
import { genId } from '../../utils/gen-id';
import { nodeDetailRow } from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';
import type { ISTopology } from '../../kernel/contracts/topology';

export const generateId = () => genId();

interface NodeComponentProps {
    id?: string;
    data: { label: string; type: string; config?: Record<string, unknown> };
    selected: boolean;
    icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
    color: string;
    typeLabel: string;
    children?: React.ReactNode;
}

const BaseNode = ({
    data,
    selected,
    icon: Icon,
    color,
    typeLabel,
    children,
}: NodeComponentProps) => (
    <div
        style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: `1px solid ${selected ? color : `rgba(255,255,255,0.1)`}`,
            boxShadow: selected
                ? `0 0 0 2px rgba(${color === '#3b82f6' ? '59,130,246' : color === '#f59e0b' ? '245,158,11' : color === '#10b981' ? '16,185,129' : '100,116,139'},0.3), 0 10px 25px -5px rgba(0,0,0,0.5)`
                : '0 4px 15px -3px rgba(0,0,0,0.4)',
            borderRadius: '16px',
            padding: '0',
            minWidth: '240px',
            color: 'white',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: selected ? 'scale(1.02)' : 'scale(1)',
        }}
    >
        {data.type !== 'entry' && (
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: color, width: 12, height: 12, border: '2px solid #0f172a' }}
            />
        )}

        <div
            style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)`,
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
            }}
        >
            <div
                style={{
                    background: color,
                    borderRadius: '10px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 10px rgba(0,0,0,0.2)`,
                }}
            >
                <Icon size={18} color="white" strokeWidth={2.5} />
            </div>
            <div>
                <div
                    style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        marginBottom: '2px',
                    }}
                >
                    {data.label}
                </div>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-400)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    {typeLabel}
                </div>
            </div>
        </div>

        <div
            style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
            {children}
        </div>

        {data.type !== 'exit' && (
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: color, width: 12, height: 12, border: '2px solid #0f172a' }}
            />
        )}
    </div>
);

export const AgentNode = ({
    id,
    data,
    selected,
}: {
    id?: string;
    data: { label: string; type: string; config?: Record<string, unknown> };
    selected: boolean;
}) => {
    const { t: tt } = useTranslation();
    return (
        <BaseNode
            id={id}
            data={data}
            selected={selected}
            icon={Bot}
            color="#3b82f6"
            typeLabel={tt('builder.node.agent')}
        >
            <div style={nodeDetailRow}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Cpu size={12} /> Model Engine
                </span>
                <span
                    style={{
                        fontWeight: 600,
                        background: 'rgba(0,0,0,0.3)',
                        padding: '2px 6px',
                        borderRadius: 4,
                    }}
                >
                    {(data.config?.model as string) || 'Auto'}
                </span>
            </div>
            <div style={nodeDetailRow}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Wrench size={12} /> Capabilities
                </span>
                <span style={{ fontWeight: 600 }}>
                    {(data.config?.tools as unknown[])?.length || 0} active
                </span>
            </div>
        </BaseNode>
    );
};

export const RouterNode = ({
    id,
    data,
    selected,
}: {
    id?: string;
    data: { label: string; type: string; config?: Record<string, unknown> };
    selected: boolean;
}) => {
    const { t: tt } = useTranslation();
    return (
        <BaseNode
            id={id}
            data={data}
            selected={selected}
            icon={GitBranch}
            color="#f59e0b"
            typeLabel={tt('builder.node.router')}
        >
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>
                Analyzes input and dynamically routes execution to the optimal branch.
            </div>
        </BaseNode>
    );
};

export const GuardrailNode = ({
    id,
    data,
    selected,
}: {
    id?: string;
    data: { label: string; type: string; config?: Record<string, unknown> };
    selected: boolean;
}) => {
    const { t: tt } = useTranslation();
    return (
        <BaseNode
            id={id}
            data={data}
            selected={selected}
            icon={ShieldCheck}
            color="#10b981"
            typeLabel={tt('builder.node.guardrail')}
        >
            <div style={nodeDetailRow}>
                <span>Blocked Words</span>
                <span style={{ fontWeight: 600, color: '#fca5a5' }}>
                    {(data.config?.blockedKeywords as unknown[])?.length || 3} rules
                </span>
            </div>
        </BaseNode>
    );
};

export const ToolNode = ({
    id,
    data,
    selected,
}: {
    id?: string;
    data: { label: string; type: string; config?: Record<string, unknown> };
    selected: boolean;
}) => {
    const { t: tt } = useTranslation();
    return (
        <BaseNode
            id={id}
            data={data}
            selected={selected}
            icon={Blocks}
            color="#8b5cf6"
            typeLabel={tt('builder.node.tool')}
        >
            <div style={nodeDetailRow}>
                <span>Bound Capability</span>
                <span
                    style={{
                        fontWeight: 600,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: '100px',
                    }}
                >
                    {(data.config?.toolId as string) || 'None'}
                </span>
            </div>
        </BaseNode>
    );
};

export const mapDSLToNodes = (topology: ISTopology): Node[] => {
    return topology.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: { label: n.label, type: n.type, config: n.config },
        position: n.position || { x: 200 + Math.random() * 400, y: 200 + Math.random() * 400 },
    }));
};

export const mapDSLToEdges = (topology: ISTopology): Edge[] => {
    return topology.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        label: e.trigger === 'data_flow' ? undefined : e.trigger,
        animated: true,
        style: { stroke: 'var(--slate-500)', strokeWidth: 2 },
        labelStyle: { fill: 'var(--slate-400)', fontSize: 10, fontWeight: 700 },
        labelBgStyle: { fill: 'var(--slate-900)', stroke: 'var(--slate-800)' },
        labelBgPadding: [4, 4] as [number, number],
        labelBgBorderRadius: 4,
    }));
};
