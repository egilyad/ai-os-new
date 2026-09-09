/**
 * OntologyService — J.2 (Palantir-style typed objects, additive).
 *
 * Object types with declared fields, typed links, instances in DAL kv.
 * Actions execute ToolRunner tools with the instance as args, gated by
 * Governance (oversight flag forces require_hitl semantics → refused
 * unattended with a clear message instead of silent execution).
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IGovernanceService } from '../../contracts/trust';
import type { IOntologyService } from '../../contracts/rivals5';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Ontology');

interface OntoType {
    name: string;
    fields: string[];
    links: Array<{ relation: string; to: string }>;
}

interface OntoInstance {
    id: string;
    type: string;
    data: Record<string, unknown>;
}

export class OntologyService implements IOntologyService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private tools?: IToolRunnerService,
        private governance?: IGovernanceService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async defineType(name: string, fields: string[]): Promise<void> {
        const clean = name.slice(0, 80);
        const doc: OntoType = {
            name: clean,
            fields: fields.map((f) => f.slice(0, 80)).slice(0, 40),
            links: [],
        };
        await this.dal.kv.set(`onto-type/${clean}`, doc);
    }

    async linkTypes(from: string, relation: string, to: string): Promise<void> {
        const doc = await this.dal.kv.get<OntoType>(`onto-type/${from}`);
        if (!doc) throw new Error(`Object type not found: ${from}`);
        const target = await this.dal.kv.get<OntoType>(`onto-type/${to}`);
        if (!target) throw new Error(`Object type not found: ${to}`);
        doc.links.push({ relation: relation.slice(0, 80), to });
        await this.dal.kv.set(`onto-type/${from}`, doc);
    }

    async createInstance(type: string, data: Record<string, unknown>): Promise<string> {
        const def = await this.dal.kv.get<OntoType>(`onto-type/${type}`);
        if (!def) throw new Error(`Object type not found: ${type}`);
        const clean: Record<string, unknown> = {};
        for (const f of def.fields) {
            if (f in data) clean[f] = data[f];
        }
        const inst: OntoInstance = { id: genId('onto'), type, data: clean };
        await this.dal.kv.set(`onto-inst/${inst.id}`, inst);
        this.events.emit(EVENTS.ONTO_CREATED, { instanceId: inst.id, type });
        return inst.id;
    }

    async runAction(instanceId: string, tool: string, args: Record<string, unknown> = {}): Promise<string> {
        const inst = await this.dal.kv.get<OntoInstance>(`onto-inst/${instanceId}`);
        if (!inst) throw new Error(`Instance not found: ${instanceId}`);
        if (this.governance) {
            const verdict = await this.governance.evaluate({ action: 'tool:call', subject: `ontology:${inst.type}` });
            if (verdict.decision !== 'allow') {
                return `Oversight: action ${tool} on ${inst.type} ${verdict.decision} (rule ${verdict.ruleId ?? 'default'}) — needs a human.`;
            }
        }
        if (!this.tools) throw new Error('Tool runner unavailable');
        return this.tools.callTool(`ontology:${inst.type}`, tool, { instance: inst.data, ...args });
    }
}
