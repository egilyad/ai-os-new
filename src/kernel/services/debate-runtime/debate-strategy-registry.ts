import { safeJsonParse } from '../../../kernel/utils/safe-json';
import { BUILTIN_STRATEGIES } from './debate-strategy-definitions';
import type {
    StrategyDefinition,
    StrategyPrimitive,
    StrategyPrimitiveType,
    StrategyRegistryEntry,
    IStrategyRegistry,
    ValidationResult,
    ValidationError,
    Incompatibility,
    SequencePrimitive,
    DebateGraphPrimitive,
    CriticLoopPrimitive,
    VotingPrimitive,
    PeerReviewPrimitive,
} from '../../contracts/debate-strategy-dsl';

function validatePrimitive(primitive: StrategyPrimitive, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!primitive.id || typeof primitive.id !== 'string') {
        errors.push({
            path: `${path}.id`,
            message: 'Primitive must have a string id',
            code: 'MISSING_ID',
        });
    }

    switch (primitive.type) {
        case 'sequence': {
            const seq = primitive as SequencePrimitive;
            if (!Array.isArray(seq.steps) || seq.steps.length === 0) {
                errors.push({
                    path: `${path}.steps`,
                    message: 'Sequence must have at least one step',
                    code: 'EMPTY_SEQUENCE',
                });
            } else {
                seq.steps.forEach((step, i) => {
                    if (!step.stepId) {
                        errors.push({
                            path: `${path}.steps[${i}].stepId`,
                            message: 'Step must have a stepId',
                            code: 'MISSING_STEP_ID',
                        });
                    }
                    if (!step.primitive) {
                        errors.push({
                            path: `${path}.steps[${i}].primitive`,
                            message: 'Step must have a primitive',
                            code: 'MISSING_PRIMITIVE',
                        });
                    } else {
                        errors.push(
                            ...validatePrimitive(step.primitive, `${path}.steps[${i}].primitive`),
                        );
                    }
                });
            }
            break;
        }
        case 'debate_graph': {
            const graph = primitive as DebateGraphPrimitive;
            if (!Array.isArray(graph.agents) || graph.agents.length < 2) {
                errors.push({
                    path: `${path}.agents`,
                    message: 'Debate graph must have at least 2 agents',
                    code: 'INSUFFICIENT_AGENTS',
                });
            }
            if (!Array.isArray(graph.edges) || graph.edges.length === 0) {
                errors.push({
                    path: `${path}.edges`,
                    message: 'Debate graph must have at least 1 edge',
                    code: 'EMPTY_GRAPH',
                });
            } else {
                const agentIds = new Set(graph.agents?.map((a) => a.nodeId) ?? []);
                const edgeKeys = new Set<string>();
                graph.edges.forEach((edge, i) => {
                    if (!agentIds.has(edge.from)) {
                        errors.push({
                            path: `${path}.edges[${i}].from`,
                            message: `Unknown agent: ${edge.from}`,
                            code: 'UNKNOWN_AGENT',
                        });
                    }
                    if (!agentIds.has(edge.to)) {
                        errors.push({
                            path: `${path}.edges[${i}].to`,
                            message: `Unknown agent: ${edge.to}`,
                            code: 'UNKNOWN_AGENT',
                        });
                    }
                    if (edge.from === edge.to) {
                        errors.push({
                            path: `${path}.edges[${i}]`,
                            message: 'Self-loop edge',
                            code: 'SELF_LOOP',
                        });
                    }
                    const key = `${edge.from}->${edge.to}`;
                    if (edgeKeys.has(key)) {
                        errors.push({
                            path: `${path}.edges[${i}]`,
                            message: `Duplicate edge: ${key}`,
                            code: 'DUPLICATE_EDGE',
                        });
                    }
                    edgeKeys.add(key);
                });
            }
            if (graph.maxRounds !== undefined && graph.maxRounds < 1) {
                errors.push({
                    path: `${path}.maxRounds`,
                    message: 'maxRounds must be >= 1',
                    code: 'INVALID_ROUNDS',
                });
            }
            if (
                graph.convergenceThreshold !== undefined &&
                (graph.convergenceThreshold < 0 || graph.convergenceThreshold > 1)
            ) {
                errors.push({
                    path: `${path}.convergenceThreshold`,
                    message: 'convergenceThreshold must be 0-1',
                    code: 'INVALID_THRESHOLD',
                });
            }
            break;
        }
        case 'critic_loop': {
            const loop = primitive as CriticLoopPrimitive;
            if (!loop.proponent) {
                errors.push({
                    path: `${path}.proponent`,
                    message: 'Critic loop must have a proponent',
                    code: 'MISSING_PROPONENT',
                });
            }
            if (!loop.critic) {
                errors.push({
                    path: `${path}.critic`,
                    message: 'Critic loop must have a critic',
                    code: 'MISSING_CRITIC',
                });
            }
            if (loop.maxIterations < 1 || loop.maxIterations > 20) {
                errors.push({
                    path: `${path}.maxIterations`,
                    message: 'maxIterations must be 1-20',
                    code: 'INVALID_ITERATIONS',
                });
            }
            break;
        }
        case 'voting': {
            const vote = primitive as VotingPrimitive;
            if (!Array.isArray(vote.voters) || vote.voters.length < 2) {
                errors.push({
                    path: `${path}.voters`,
                    message: 'Voting must have at least 2 voters',
                    code: 'INSUFFICIENT_VOTERS',
                });
            }
            const validMechanisms = [
                'simple_majority',
                'supermajority',
                'unanimous',
                'ranked_choice',
                'weighted',
            ];
            if (!vote.mechanism || !validMechanisms.includes(vote.mechanism)) {
                errors.push({
                    path: `${path}.mechanism`,
                    message: `Invalid mechanism: ${vote.mechanism}`,
                    code: 'INVALID_MECHANISM',
                });
            }
            break;
        }
        case 'peer_review': {
            const pr = primitive as PeerReviewPrimitive;
            if (!Array.isArray(pr.authors) || pr.authors.length === 0) {
                errors.push({
                    path: `${path}.authors`,
                    message: 'Peer review must have at least 1 author',
                    code: 'MISSING_AUTHORS',
                });
            }
            if (!Array.isArray(pr.reviewers) || pr.reviewers.length === 0) {
                errors.push({
                    path: `${path}.reviewers`,
                    message: 'Peer review must have at least 1 reviewer',
                    code: 'MISSING_REVIEWERS',
                });
            }
            if (!Array.isArray(pr.criteria) || pr.criteria.length === 0) {
                errors.push({
                    path: `${path}.criteria`,
                    message: 'Peer review must have at least 1 criterion',
                    code: 'MISSING_CRITERIA',
                });
            }
            break;
        }
    }
    return errors;
}

function validateCompatibility(a: StrategyDefinition, b: StrategyDefinition): Incompatibility[] {
    const conflicts: Incompatibility[] = [];

    if (a.compatibility?.incompatibleWith?.includes(b.id)) {
        conflicts.push({
            primitiveA: a.id,
            primitiveB: b.id,
            reason: `${a.name} is explicitly incompatible with ${b.name}`,
            severity: 'error',
        });
    }
    if (b.compatibility?.incompatibleWith?.includes(a.id)) {
        conflicts.push({
            primitiveA: b.id,
            primitiveB: a.id,
            reason: `${b.name} is explicitly incompatible with ${a.name}`,
            severity: 'error',
        });
    }

    const getVotingPrimitives = (def: StrategyDefinition): VotingPrimitive[] => {
        const result: VotingPrimitive[] = [];
        const walk = (p: StrategyPrimitive) => {
            if (p.type === 'voting') result.push(p as VotingPrimitive);
            if (p.type === 'sequence')
                (p as SequencePrimitive).steps.forEach((s) => walk(s.primitive));
        };
        walk(def.root);
        return result;
    };

    const votesA = getVotingPrimitives(a);
    const votesB = getVotingPrimitives(b);
    if (votesA.length > 0 && votesB.length > 0) {
        conflicts.push({
            primitiveA: a.id,
            primitiveB: b.id,
            reason: 'Multiple voting mechanisms may produce conflicting results',
            severity: 'warning',
        });
    }

    return conflicts;
}

export class StrategyRegistry implements IStrategyRegistry {
    protected entries = new Map<string, StrategyRegistryEntry>();

    constructor() {
        for (const def of BUILTIN_STRATEGIES) {
            this.register(def, true);
        }
    }

    register(definition: StrategyDefinition, builtin = false): void {
        const existing = this.entries.get(definition.id);
        if (existing?.builtin) return;
        this.entries.set(definition.id, {
            definition,
            builtin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }

    unregister(id: string): boolean {
        const entry = this.entries.get(id);
        if (entry?.builtin) return false;
        return this.entries.delete(id);
    }

    get(id: string): StrategyDefinition | undefined {
        return this.entries.get(id)?.definition;
    }

    list(): StrategyRegistryEntry[] {
        return [...this.entries.values()];
    }

    search(query: string): StrategyRegistryEntry[] {
        const q = query.toLowerCase();
        return this.list().filter(
            (e) =>
                e.definition.name.toLowerCase().includes(q) ||
                e.definition.description.toLowerCase().includes(q) ||
                e.definition.tags?.some((t) => t.toLowerCase().includes(q)),
        );
    }

    validate(definition: StrategyDefinition): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        if (!definition.id)
            errors.push({ path: 'id', message: 'Strategy must have an id', code: 'MISSING_ID' });
        if (!definition.name)
            errors.push({
                path: 'name',
                message: 'Strategy must have a name',
                code: 'MISSING_NAME',
            });
        if (!definition.root)
            errors.push({
                path: 'root',
                message: 'Strategy must have a root primitive',
                code: 'MISSING_ROOT',
            });

        if (definition.root) {
            errors.push(...validatePrimitive(definition.root, 'root'));
        }

        const seen = new Set<string>();
        const checkCycle = (p: StrategyPrimitive): void => {
            if (seen.has(p.id)) {
                errors.push({
                    path: `root.${p.id}`,
                    message: `Cycle detected: ${p.id} appears twice`,
                    code: 'CYCLE_DETECTED',
                });
                return;
            }
            seen.add(p.id);
            if (p.type === 'sequence') {
                (p as SequencePrimitive).steps.forEach((s) => checkCycle(s.primitive));
            }
        };
        if (definition.root) checkCycle(definition.root);

        definition.parameters?.forEach((param, i) => {
            if (!param.name)
                errors.push({
                    path: `parameters[${i}].name`,
                    message: 'Parameter must have a name',
                    code: 'MISSING_PARAM_NAME',
                });
            if (
                param.type === 'number' &&
                param.min !== undefined &&
                param.max !== undefined &&
                param.min > param.max
            ) {
                errors.push({
                    path: `parameters[${i}]`,
                    message: 'min > max',
                    code: 'INVALID_RANGE',
                });
            }
        });

        return { valid: errors.length === 0, errors, warnings };
    }

    getCompatibleStrategies(id: string): StrategyDefinition[] {
        const def = this.get(id);
        if (!def) return [];
        return this.list()
            .map((e) => e.definition)
            .filter((other) => {
                if (other.id === id) return false;
                if (def.compatibility?.incompatibleWith?.includes(other.id)) return false;
                if (other.compatibility?.incompatibleWith?.includes(def.id)) return false;
                const conflicts = validateCompatibility(def, other);
                return conflicts.filter((c) => c.severity === 'error').length === 0;
            });
    }

    resolveConflicts(a: StrategyDefinition, b: StrategyDefinition): Incompatibility[] {
        return validateCompatibility(a, b);
    }

    exportJson(id: string): string | null {
        const def = this.get(id);
        if (!def) return null;
        return JSON.stringify(def, null, 2);
    }

    importJson(json: string): {
        success: boolean;
        definition?: StrategyDefinition;
        errors?: ValidationError[];
    } {
        try {
            const def = safeJsonParse(json) as StrategyDefinition;
            const validation = this.validate(def);
            if (!validation.valid) {
                return { success: false, errors: validation.errors };
            }
            this.register(def, false);
            return { success: true, definition: def };
        } catch {
            return {
                success: false,
                errors: [{ path: 'json', message: 'Invalid JSON', code: 'PARSE_ERROR' }],
            };
        }
    }

    listPrimitiveTypes(): StrategyPrimitiveType[] {
        return ['sequence', 'debate_graph', 'critic_loop', 'voting', 'peer_review'];
    }

    describePrimitive(type: StrategyPrimitiveType): string {
        const descriptions: Record<StrategyPrimitiveType, string> = {
            sequence: 'Run child primitives in order. Each step completes before the next begins.',
            debate_graph:
                'Multi-agent interaction with defined edges (sequential, challenge, refine, broadcast).',
            critic_loop:
                'Iterative refinement between a proponent and critic until convergence or max iterations.',
            voting: 'Collect votes from multiple agents using a tallying mechanism.',
            peer_review: 'Authors submit work, reviewers evaluate on criteria, revisions allowed.',
        };
        return descriptions[type];
    }

    destroy(): void {
        this.entries.clear();
    }
}
