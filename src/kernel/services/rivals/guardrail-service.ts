/**
 * GuardrailService — F.2 (Swarm-style tripwires, stateless).
 *
 * Named validators (contains/regex/minLength/maxLength) with tripwire
 * semantics: `block` stops the caller, `flag` records and continues.
 * In-memory registry (policy text, not data) + `guardrail:*` events.
 */
import type { IEventBus } from '../../types/interfaces';
import type { IGuardrailService } from '../../contracts/rivals';
import type { GuardrailRule } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Guardrail');

export class GuardrailService implements IGuardrailService {
    private rules = new Map<string, GuardrailRule>();

    constructor(private events: IEventBus) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        this.rules.clear();
    }

    async addRule(input: {
        name: string;
        kind: GuardrailRule['kind'];
        pattern?: string;
        value?: number;
        tripwire?: 'block' | 'flag';
    }): Promise<GuardrailRule> {
        if ((input.kind === 'contains' || input.kind === 'regex') && !input.pattern) {
            throw new Error(`${input.kind} rule needs a pattern`);
        }
        if ((input.kind === 'minLength' || input.kind === 'maxLength') && typeof input.value !== 'number') {
            throw new Error(`${input.kind} rule needs a numeric value`);
        }
        if (input.kind === 'regex') {
            try {
                new RegExp(input.pattern as string);
            } catch {
                throw new Error('Invalid regex pattern');
            }
        }
        const rule: GuardrailRule = {
            id: genId('guard'),
            name: input.name,
            kind: input.kind,
            pattern: input.pattern,
            value: input.value,
            tripwire: input.tripwire ?? 'block',
            createdAt: Date.now(),
        };
        this.rules.set(rule.id, rule);
        return rule;
    }

    async listRules(): Promise<GuardrailRule[]> {
        return [...this.rules.values()];
    }

    async removeRule(id: string): Promise<void> {
        this.rules.delete(id);
    }

    async check(text: string): Promise<{ ok: boolean; hits: string[] }> {
        const hits: string[] = [];
        let blocked = false;
        for (const rule of this.rules.values()) {
            if (this.violated(rule, text)) {
                hits.push(rule.name);
                this.events.emit(EVENTS.GUARDRAIL_HIT, { ruleId: rule.id, tripwire: rule.tripwire });
                if (rule.tripwire === 'block') blocked = true;
            }
        }
        return { ok: !blocked, hits };
    }

    private violated(rule: GuardrailRule, text: string): boolean {
        switch (rule.kind) {
            case 'contains':
                return !text.toLowerCase().includes((rule.pattern ?? '').toLowerCase());
            case 'regex':
                return !new RegExp(rule.pattern as string).test(text);
            case 'minLength':
                return text.length < (rule.value ?? 0);
            case 'maxLength':
                return text.length > (rule.value ?? Number.MAX_SAFE_INTEGER);
            default:
                return false;
        }
    }
}
