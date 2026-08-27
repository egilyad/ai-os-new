import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { RouterDecision } from '../../kernel/instances';
import { STRATEGY_LABELS, scoreBreakdown } from './routing-utils';
import {
    emptyState,
    flexCenterSmGap,
    textMutedSm,
    textWhiteWeight700Sm,
} from '../../styles/common';

interface TreeNode {
    label: string;
    sub?: string;
    color: string;
    children?: TreeNode[];
}

function renderTree(nodes: TreeNode[], depth: number = 0): React.ReactNode {
    return nodes.map((node, i) => (
        <React.Fragment key={`${depth}-${i}`}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    position: 'relative',
                    paddingLeft: depth > 0 ? 60 : 0,
                }}
            >
                {depth > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 20,
                            top: 0,
                            bottom: '50%',
                            width: 24,
                            borderLeft: '2px solid rgba(255,255,255,0.08)',
                            borderBottom: '2px solid rgba(255,255,255,0.08)',
                            borderBottomLeftRadius: 8,
                        }}
                    />
                )}
                <div style={{ flex: 1, marginLeft: depth > 0 ? 44 : 0 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 12,
                            border: `1px solid ${node.color}30`,
                            background: `linear-gradient(135deg, ${node.color}10 0%, rgba(0,0,0,0.2) 100%)`,
                            marginBottom: '0.75rem',
                            minWidth: 280,
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: node.color,
                                flexShrink: 0,
                            }}
                        />
                        <div>
                            <div style={textWhiteWeight700Sm}>{node.label}</div>
                            {node.sub && (
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        marginTop: 2,
                                    }}
                                >
                                    {node.sub}
                                </div>
                            )}
                        </div>
                    </div>
                    {node.children && node.children.length > 0 && (
                        <div
                            style={{
                                borderLeft: '2px solid rgba(255,255,255,0.06)',
                                marginLeft: 16,
                                paddingLeft: 0,
                            }}
                        >
                            {renderTree(node.children, depth + 1)}
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    ));
}

interface Props {
    decisions: RouterDecision[];
}

function DecisionTreeTab({ decisions }: Props) {
    const { t } = useTranslation();

    return (
        <div>
            <div style={textMutedSm}>
                Visual decision flow — how each request is routed through the scoring pipeline
            </div>
            {decisions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {(() => {
                        const d = decisions[0]!;
                        const classification =
                            d.promptLength > 2000
                                ? 'Long'
                                : d.promptLength > 500
                                  ? 'Medium'
                                  : 'Short';
                        const treeNodes: TreeNode[] = [
                            {
                                label: 'Incoming Request',
                                sub: `${d.promptLength} chars`,
                                color: 'var(--purple)',
                                children: [
                                    {
                                        label: `Classified: ${classification}`,
                                        sub: 'Prompt length threshold',
                                        color: 'var(--accent)',
                                        children: [
                                            {
                                                label: `Strategy: ${STRATEGY_LABELS[d.strategy] || d.strategy}`,
                                                sub: 'Selected based on classification & context',
                                                color: 'var(--warning)',
                                                children: [
                                                    {
                                                        label: `Weights: TTFT ${(d.weights.ttft * 100).toFixed(0)}% / TPS ${(d.weights.tps * 100).toFixed(0)}% / Reliability ${(d.weights.reliability * 100).toFixed(0)}%`,
                                                        sub: 'Balanced for request type',
                                                        color: 'var(--success)',
                                                        children: d.scores.slice(0, 3).map((s) => {
                                                            const breakdown = scoreBreakdown(s);
                                                            return {
                                                                label: `${s.provider} — score: ${s.score.toFixed(3)}`,
                                                                sub: `TTFT ${(breakdown.ttft * 100).toFixed(0)}% · TPS ${(breakdown.tps * 100).toFixed(0)}% · Reliability ${(breakdown.reliability * 100).toFixed(0)}% · Cost ${breakdown.cost.toFixed(4)}`,
                                                                color:
                                                                    s.provider === d.selected
                                                                        ? '#10b981'
                                                                        : '#64748b',
                                                                children:
                                                                    s.provider === d.selected
                                                                        ? [
                                                                              {
                                                                                  label: `SELECTED — ${d.selected}`,
                                                                                  sub: d.secondBest
                                                                                      ? `Fallback: ${d.secondBest}`
                                                                                      : 'Primary route',
                                                                                  color: 'var(--success)',
                                                                                  children: [],
                                                                              },
                                                                          ]
                                                                        : [],
                                                            };
                                                        }),
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ];
                        return renderTree(treeNodes);
                    })()}
                </div>
            ) : (
                <div style={emptyState}>{t('routing.history.empty')}</div>
            )}
            {/* Legend */}
            <div
                className="glass-panel"
                style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '0.5rem' }}>
                    Legend
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.7rem' }}>
                    <span style={flexCenterSmGap}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--purple)',
                            }}
                        />{' '}
                        Input
                    </span>
                    <span style={flexCenterSmGap}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--accent)',
                            }}
                        />{' '}
                        Classification
                    </span>
                    <span style={flexCenterSmGap}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--warning)',
                            }}
                        />{' '}
                        Strategy
                    </span>
                    <span style={flexCenterSmGap}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--success)',
                            }}
                        />{' '}
                        Weights / Scoring
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DecisionTreeTab;
