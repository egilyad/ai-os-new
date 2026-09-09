/**
 * FrontierOpsService — Wave 13.38/13.39/13.41 (orgs + intent + multimodal).
 *
 * - Long-horizon orgs: charter + heartbeat ledger + dissolve (days/weeks of
 *   life expressed as an auditable ledger, no background daemons).
 * - Intent interface: keyword planner turning a high-level intent into an
 *   execution plan; `IGraphBuilder` delegate materializes it as a real graph.
 * - Multimodal registry: which agents handle vision/audio/video (first-class
 *   records; model wiring is a later integration point).
 */
import type { IEventBus } from '../../types/interfaces';
import type { FrontierRepository } from '../../dal/frontier-repository';
import type { IFrontierOpsService } from '../../contracts/frontier';
import type { IntentPlan, ModalCapability, OrgCharter } from '../../types/frontier-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('FrontierOps');

function now(): number {
    return Date.now();
}

export interface FrontierOpsDelegates {
    buildGraph?(mode: string, topic: string): Promise<string>;
}

const INTENT_RULES: Array<{ keywords: string[]; steps: Array<{ action: string; detail: string }> }> = [
    {
        keywords: ['исследу', 'research', 'изучи', 'обзор', 'анализ'],
        steps: [
            { action: 'crew', detail: 'research-team template' },
            { action: 'council', detail: 'debate-prep for findings' },
        ],
    },
    {
        keywords: ['код', 'code', 'баг', 'bug', 'фич', 'приложен', 'app'],
        steps: [
            { action: 'graph', detail: 'hierarchical mode' },
            { action: 'council', detail: 'code-review-council' },
        ],
    },
    {
        keywords: ['спор', 'debat', 'реши', 'decide', 'сравни', 'compare'],
        steps: [{ action: 'council', detail: 'full council run' }],
    },
    {
        keywords: ['текст', 'стать', 'write', 'пост', 'content'],
        steps: [{ action: 'crew', detail: 'content-forge template' }],
    },
    {
        keywords: ['план', 'plan', 'стратег', 'roadmap'],
        steps: [
            { action: 'forge', detail: 'forge team draft' },
            { action: 'graph', detail: 'sequential mode' },
        ],
    },
];

export class FrontierOpsService implements IFrontierOpsService {
    constructor(
        private repo: FrontierRepository,
        private events: IEventBus,
        private delegates: FrontierOpsDelegates = {},
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    // ── Orgs ──
    async charterOrg(name: string, mission: string, members: string[] = []): Promise<OrgCharter> {
        const t = now();
        const org: OrgCharter = {
            id: genId('org'),
            name,
            mission: mission.slice(0, 1000),
            members: [...members],
            ledger: [`Chartered: ${mission.slice(0, 200)}`],
            heartbeats: 0,
            status: 'active',
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putOrg(org);
        this.events.emit(EVENTS.EVAL_ORG, { orgId: org.id, action: 'chartered' });
        return org;
    }

    async heartbeat(orgId: string, note: string): Promise<OrgCharter> {
        const org = await this.require(orgId);
        if (org.status !== 'active') throw new Error(`Org ${orgId} is ${org.status}`);
        org.heartbeats += 1;
        org.ledger.push(`#${org.heartbeats}: ${note.slice(0, 300)}`);
        if (org.ledger.length > 1000) org.ledger.splice(0, org.ledger.length - 1000);
        org.updatedAt = now();
        await this.repo.putOrg(org);
        return org;
    }

    async dissolveOrg(orgId: string): Promise<OrgCharter> {
        const org = await this.require(orgId);
        org.status = 'dissolved';
        org.ledger.push('Dissolved.');
        org.updatedAt = now();
        await this.repo.putOrg(org);
        this.events.emit(EVENTS.EVAL_ORG, { orgId, action: 'dissolved' });
        return org;
    }

    async listOrgs(): Promise<OrgCharter[]> {
        return this.repo.listOrgs();
    }

    // ── Intent ──
    async planIntent(intent: string): Promise<IntentPlan> {
        const lower = intent.toLowerCase();
        const matched = INTENT_RULES.filter((r) => r.keywords.some((k) => lower.includes(k)));
        const steps =
            matched.length > 0
                ? matched.flatMap((m) => m.steps)
                : [{ action: 'graph', detail: 'sequential mode (default)' }];
        const plan: IntentPlan = {
            id: genId('intent'),
            intent: intent.slice(0, 500),
            steps: steps.map((s) => ({ ...s })),
            createdAt: now(),
        };
        await this.repo.putIntent(plan);
        // Materialize the first step as a real graph when a builder is wired.
        if (this.delegates.buildGraph && steps.length > 0) {
            try {
                const first = steps[0]!;
                await this.delegates.buildGraph(first.action, intent.slice(0, 200));
            } catch (e) {
                LOGGER.warn('intent graph materialization failed', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        this.events.emit(EVENTS.EVAL_INTENT, { intentId: plan.id, steps: steps.length });
        return plan;
    }

    // ── Multimodal ──
    async registerModal(input: {
        modality: ModalCapability['modality'];
        agentId: string;
        note?: string;
    }): Promise<ModalCapability> {
        const cap: ModalCapability = {
            id: genId('modal'),
            modality: input.modality,
            agentId: input.agentId,
            note: input.note?.slice(0, 300),
            createdAt: now(),
        };
        await this.repo.putModal(cap);
        return cap;
    }

    async listModals(): Promise<ModalCapability[]> {
        return this.repo.listModals();
    }

    private async require(id: string): Promise<OrgCharter> {
        const org = await this.repo.getOrg(id);
        if (!org) throw new Error(`Org not found: ${id}`);
        return org;
    }
}
