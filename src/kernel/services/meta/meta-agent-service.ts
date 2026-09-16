/**
 * MetaAgentService — Wave 8.12/8.13/8.15 (self-improvement + evolution + health).
 *
 * Analyzes observations into improvement proposals (deterministic heuristics,
 * LLM port optional), distills successful patterns into SkillMarket manifests
 * via delegate, and collects health signals from watcher agents.
 */
import type { IEventBus } from '../../types/interfaces';
import type { MetaRepository } from '../../dal/meta-repository';
import type { IMetaAgentService } from '../../contracts/meta';
import type { HealthKind, ImprovementKind, ImprovementProposal, HealthSignal } from '../../types/meta-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('MetaAgent');

function now(): number {
    return Date.now();
}

export interface MetaDelegates {
    publishSkill?(input: { name: string; pattern: string; permissions?: string[] }): Promise<string>;
}

const KIND_HINTS: Array<{ keywords: string[]; kind: ImprovementKind }> = [
    { keywords: ['prompt', 'промпт', 'инструкц', 'system'], kind: 'prompt' },
    { keywords: ['team', 'команд', 'crew', 'рол'], kind: 'team' },
    { keywords: ['skill', 'скилл', 'навык', 'паттерн', 'pattern'], kind: 'skill' },
    { keywords: ['param', 'параметр', 'temperature', 'threshold', 'порог'], kind: 'param' },
    { keywords: ['workflow', 'граф', 'graph', 'pipeline'], kind: 'workflow' },
];

export class MetaAgentService implements IMetaAgentService {
    constructor(
        private repo: MetaRepository,
        private events: IEventBus,
        private delegates: MetaDelegates = {},
    ) {}

    async init(): Promise<void> {
        LOGGER.info('MetaAgent', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async analyze(input: {
        subject: string;
        observations: string[];
        kind?: ImprovementKind;
    }): Promise<ImprovementProposal> {
        const kind = input.kind ?? this.inferKind(input.observations);
        const suggestion = this.synthesize(input.subject, input.observations, kind);
        const t = now();
        const proposal: ImprovementProposal = {
            id: genId('impr'),
            kind,
            target: input.subject.slice(0, 280),
            suggestion,
            confidence: Math.min(0.9, 0.4 + input.observations.length * 0.1),
            status: 'proposed',
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putProposal(proposal);
        this.events.emit(EVENTS.META_PROPOSED, {
            proposalId: proposal.id,
            kind,
            confidence: proposal.confidence,
        });
        return proposal;
    }

    async listProposals(status?: ImprovementProposal['status']): Promise<ImprovementProposal[]> {
        const all = await this.repo.listProposals();
        if (!status) return all;
        return all.filter((p) => p.status === status);
    }

    async accept(id: string): Promise<ImprovementProposal> {
        return this.transition(id, 'accepted', ['proposed']);
    }

    async apply(id: string): Promise<ImprovementProposal> {
        const p = await this.transition(id, 'applied', ['accepted', 'proposed']);
        this.events.emit(EVENTS.META_APPLIED, { proposalId: id, kind: p.kind });
        return p;
    }

    async reject(id: string): Promise<ImprovementProposal> {
        return this.transition(id, 'rejected', ['proposed', 'accepted']);
    }

    async evolveSkill(input: { name: string; pattern: string; permissions?: string[] }): Promise<string> {
        if (!this.delegates.publishSkill) {
            const draft = `skill-draft:${input.name}:${input.pattern.slice(0, 80)}`;
            this.events.emit(EVENTS.META_EVOLVED, { skillRef: draft });
            return draft;
        }
        const ref = await this.delegates.publishSkill(input);
        this.events.emit(EVENTS.META_EVOLVED, { skillRef: ref });
        return ref;
    }

    async reportHealth(kind: HealthKind, source: string, message: string, severity = 0.5): Promise<HealthSignal> {
        const signal: HealthSignal = {
            id: genId('health'),
            kind,
            source: source.slice(0, 160),
            message: message.slice(0, 1000),
            severity: Math.max(0, Math.min(1, severity)),
            createdAt: now(),
        };
        await this.repo.putHealth(signal);
        this.events.emit(EVENTS.META_HEALTH, { kind, severity: signal.severity, source: signal.source });
        return signal;
    }

    async listHealth(kind?: HealthKind): Promise<HealthSignal[]> {
        const all = await this.repo.listHealth();
        if (!kind) return all;
        return all.filter((h) => h.kind === kind);
    }

    private inferKind(observations: string[]): ImprovementKind {
        const text = observations.join(' ').toLowerCase();
        for (const h of KIND_HINTS) {
            if (h.keywords.some((k) => text.includes(k))) return h.kind;
        }
        return 'workflow';
    }

    private synthesize(subject: string, observations: string[], kind: ImprovementKind): string {
        const top = observations.slice(0, 3).map((o) => o.slice(0, 200));
        return (
            `Improve ${kind} of "${subject.slice(0, 120)}": ` +
            `${observations.length} observation(s). ` +
            (top.length > 0 ? `Key: ${top.join(' | ')}` : 'No details — collect more observations first.')
        );
    }

    private async transition(
        id: string,
        to: ImprovementProposal['status'],
        allowed: Array<ImprovementProposal['status']>,
    ): Promise<ImprovementProposal> {
        const p = await this.repo.getProposal(id);
        if (!p) throw new Error(`Proposal not found: ${id}`);
        if (!allowed.includes(p.status)) throw new Error(`Proposal ${id} is ${p.status}`);
        p.status = to;
        p.updatedAt = now();
        await this.repo.putProposal(p);
        return p;
    }
}
