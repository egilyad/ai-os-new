import type {
    StrategyPrimitive,
    DebateGraphPrimitive,
    CriticLoopPrimitive,
    VotingPrimitive,
    PeerReviewPrimitive,
    VotingMechanism,
    GraphAgentConfig,
} from '../../kernel/contracts/debate-strategy-dsl';
import { s } from './debate-strategy-styles';
import {
    PRIMITIVE_META,
    REVIEW_CRITERIA_OPTIONS,
    VOTING_MECHANISMS,
    AGENT_ROLES,
} from './debate-strategy-utils';
import { AgentEditor, EdgeEditor } from './AgentEditor';

interface PrimitiveInspectorProps {
    primitive: StrategyPrimitive;
    onUpdate: (upd: StrategyPrimitive) => void;
}

export const PrimitiveInspector: React.FC<PrimitiveInspectorProps> = ({ primitive, onUpdate }) => {
    const meta = PRIMITIVE_META[primitive.type];
    return (
        <>
            <div style={s.inspectorTitle}>Inspector: {meta?.label ?? primitive.type}</div>
            <div>
                <div style={s.fieldLabel}>Label</div>
                <input
                    value={primitive.label || ''}
                    onChange={(e) => onUpdate({ ...primitive, label: e.target.value })}
                    style={s.input}
                    placeholder="Custom label"
                />
            </div>
            {primitive.type === 'debate_graph' && (
                <DebateGraphEditor
                    primitive={primitive as DebateGraphPrimitive}
                    onUpdate={onUpdate}
                />
            )}
            {primitive.type === 'critic_loop' && (
                <CriticLoopEditor
                    primitive={primitive as CriticLoopPrimitive}
                    onUpdate={onUpdate}
                />
            )}
            {primitive.type === 'voting' && (
                <VotingEditor primitive={primitive as VotingPrimitive} onUpdate={onUpdate} />
            )}
            {primitive.type === 'peer_review' && (
                <PeerReviewEditor
                    primitive={primitive as PeerReviewPrimitive}
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
};

function DebateGraphEditor({
    primitive: p,
    onUpdate,
}: {
    primitive: DebateGraphPrimitive;
    onUpdate: (u: StrategyPrimitive) => void;
}) {
    return (
        <>
            <AgentEditor agents={p.agents} onChange={(agents) => onUpdate({ ...p, agents })} />
            <EdgeEditor
                edges={p.edges}
                agents={p.agents}
                onChange={(edges) => onUpdate({ ...p, edges })}
            />
            <div>
                <div style={s.fieldLabel}>Max Rounds</div>
                <input
                    type="number"
                    min={1}
                    max={20}
                    value={p.maxRounds ?? 4}
                    onChange={(e) => onUpdate({ ...p, maxRounds: Number(e.target.value) })}
                    style={s.input}
                />
            </div>
            <div>
                <div style={s.fieldLabel}>Convergence Threshold</div>
                <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={p.convergenceThreshold ?? 0.85}
                    onChange={(e) =>
                        onUpdate({ ...p, convergenceThreshold: Number(e.target.value) })
                    }
                    style={s.input}
                />
            </div>
        </>
    );
}

function CriticLoopEditor({
    primitive: p,
    onUpdate,
}: {
    primitive: CriticLoopPrimitive;
    onUpdate: (u: StrategyPrimitive) => void;
}) {
    return (
        <>
            <div>
                <div style={s.fieldLabel}>Proponent</div>
                <input
                    value={p.proponent.label || ''}
                    onChange={(e) =>
                        onUpdate({ ...p, proponent: { ...p.proponent, label: e.target.value } })
                    }
                    style={s.input}
                    placeholder="Proponent label"
                />
                <select
                    value={p.proponent.role}
                    onChange={(e) =>
                        onUpdate({
                            ...p,
                            proponent: {
                                ...p.proponent,
                                role: e.target.value as GraphAgentConfig['role'],
                            },
                        })
                    }
                    style={{ ...s.select, marginTop: 2 }}
                >
                    {AGENT_ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <div style={s.fieldLabel}>Critic</div>
                <input
                    value={p.critic.label || ''}
                    onChange={(e) =>
                        onUpdate({ ...p, critic: { ...p.critic, label: e.target.value } })
                    }
                    style={s.input}
                    placeholder="Critic label"
                />
                <select
                    value={p.critic.role}
                    onChange={(e) =>
                        onUpdate({
                            ...p,
                            critic: {
                                ...p.critic,
                                role: e.target.value as GraphAgentConfig['role'],
                            },
                        })
                    }
                    style={{ ...s.select, marginTop: 2 }}
                >
                    {AGENT_ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <div style={s.fieldLabel}>Max Iterations</div>
                <input
                    type="number"
                    min={1}
                    max={20}
                    value={p.maxIterations}
                    onChange={(e) => onUpdate({ ...p, maxIterations: Number(e.target.value) })}
                    style={s.input}
                />
            </div>
            <div>
                <div style={s.fieldLabel}>Stop When</div>
                <select
                    value={p.stopWhen ?? 'agreement'}
                    onChange={(e) =>
                        onUpdate({
                            ...p,
                            stopWhen: e.target.value as CriticLoopPrimitive['stopWhen'],
                        })
                    }
                    style={s.select}
                >
                    <option value="agreement">Agreement</option>
                    <option value="max_iterations">Max iterations</option>
                    <option value="no_improvement">No improvement</option>
                </select>
            </div>
        </>
    );
}

function VotingEditor({
    primitive: p,
    onUpdate,
}: {
    primitive: VotingPrimitive;
    onUpdate: (u: StrategyPrimitive) => void;
}) {
    return (
        <>
            <AgentEditor
                agents={p.voters ?? []}
                onChange={(voters) => onUpdate({ ...p, voters })}
            />
            <div>
                <div style={s.fieldLabel}>Mechanism</div>
                <select
                    value={p.mechanism}
                    onChange={(e) =>
                        onUpdate({ ...p, mechanism: e.target.value as VotingMechanism })
                    }
                    style={s.select}
                >
                    {VOTING_MECHANISMS.map((m) => (
                        <option key={m} value={m}>
                            {m.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <div style={s.fieldLabel}>Quorum</div>
                <input
                    type="number"
                    min={1}
                    max={20}
                    value={p.quorum ?? 1}
                    onChange={(e) => onUpdate({ ...p, quorum: Number(e.target.value) })}
                    style={s.input}
                />
            </div>
            <div>
                <div style={s.fieldLabel}>Tie Breaker</div>
                <select
                    value={p.tieBreaker ?? 'judge'}
                    onChange={(e) =>
                        onUpdate({
                            ...p,
                            tieBreaker: e.target.value as VotingPrimitive['tieBreaker'],
                        })
                    }
                    style={s.select}
                >
                    <option value="judge">Judge</option>
                    <option value="random">Random</option>
                    <option value="skip">Skip</option>
                </select>
            </div>
        </>
    );
}

function PeerReviewEditor({
    primitive: p,
    onUpdate,
}: {
    primitive: PeerReviewPrimitive;
    onUpdate: (u: StrategyPrimitive) => void;
}) {
    return (
        <>
            <AgentEditor
                agents={p.authors ?? []}
                onChange={(authors) => onUpdate({ ...p, authors })}
            />
            <AgentEditor
                agents={p.reviewers}
                onChange={(reviewers) => onUpdate({ ...p, reviewers })}
            />
            <div>
                <div style={s.fieldLabel}>Criteria</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {REVIEW_CRITERIA_OPTIONS.map((c) => (
                        <label
                            key={c}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                fontSize: 9,
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={p.criteria.includes(c)}
                                onChange={() => {
                                    const next = p.criteria.includes(c)
                                        ? p.criteria.filter((x) => x !== c)
                                        : [...p.criteria, c];
                                    onUpdate({ ...p, criteria: next });
                                }}
                            />
                            {c}
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <div style={s.fieldLabel}>Revision Rounds</div>
                <input
                    type="number"
                    min={0}
                    max={10}
                    value={p.revisionRounds ?? 2}
                    onChange={(e) => onUpdate({ ...p, revisionRounds: Number(e.target.value) })}
                    style={s.input}
                />
            </div>
            <div>
                <div style={s.fieldLabel}>Pass Threshold</div>
                <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={p.passThreshold ?? 0.7}
                    onChange={(e) => onUpdate({ ...p, passThreshold: Number(e.target.value) })}
                    style={s.input}
                />
            </div>
        </>
    );
}
