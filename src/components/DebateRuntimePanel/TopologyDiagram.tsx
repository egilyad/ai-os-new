import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { DebateTopology } from '../../kernel/instances';
import { ROLE_COLORS } from './debate-runtime-constants';
import { flexWrapGap2, flexWrapCenter, textSecondary } from '../../styles/common';

export function TopologyDiagram({ topology }: { topology: DebateTopology }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '0.5rem 0',
            }}
        >
            {topology.edges.length === 0 ? (
                <div style={flexWrapGap2}>
                    {topology.nodes.map((node) => (
                        <div
                            key={node.id}
                            style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 8,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: `${ROLE_COLORS[node.role] || '#64748b'}20`,
                                border: `1px solid ${ROLE_COLORS[node.role] || '#64748b'}40`,
                                color: ROLE_COLORS[node.role] || '#94a3b8',
                            }}
                        >
                            {node.label}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={flexWrapCenter}>
                    {topology.edges.map((edge) => {
                        const from = topology.nodes.find((n) => n.id === edge.from);
                        const to = topology.nodes.find((n) => n.id === edge.to);
                        return (
                            <React.Fragment key={`${edge.from}-${edge.to}`}>
                                <span
                                    style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: 6,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: `${ROLE_COLORS[from?.role || '']}20`,
                                        border: `1px solid ${ROLE_COLORS[from?.role || '']}40`,
                                        color: ROLE_COLORS[from?.role || ''] || '#94a3b8',
                                    }}
                                >
                                    {from?.label || edge.from}
                                </span>
                                <ArrowRight size={14} style={textSecondary} />
                                <span
                                    style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: 6,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: `${ROLE_COLORS[to?.role || '']}20`,
                                        border: `1px solid ${ROLE_COLORS[to?.role || '']}40`,
                                        color: ROLE_COLORS[to?.role || ''] || '#94a3b8',
                                    }}
                                >
                                    {to?.label || edge.to}
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
