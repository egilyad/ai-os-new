import type {
    PolicyRule,
    PolicyCondition,
    PolicyAction,
} from '../../kernel/services/debate-runtime/debate-policy-engine';

export function genId(): string {
    return `rule-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createDefaultCondition(): PolicyCondition {
    return { type: 'round_gt', value: 2 };
}

export function createDefaultAction(): PolicyAction {
    return { type: 'log', level: 'warn', message: 'Policy triggered' };
}

export function createEmptyRule(): PolicyRule {
    return {
        id: genId(),
        name: '',
        description: '',
        enabled: true,
        priority: 50,
        condition: createDefaultCondition(),
        actions: [createDefaultAction()],
    };
}

export function cloneRule(r: PolicyRule): PolicyRule {
    try {
        return structuredClone(r);
    } catch {
        return JSON.parse(JSON.stringify(r));
    }
}

export function conditionSummary(c: PolicyCondition): string {
    if (c.type === 'and' || c.type === 'or')
        return `${c.type.toUpperCase()} (${c.conditions.length} sub-conditions)`;
    if (c.type === 'not') return `NOT ${conditionSummary(c.condition)}`;
    if (c.type === 'phase_is') return `Phase = ${c.value}`;
    if (c.type === 'phase_in') return `Phase in [${c.values.join(', ')}]`;
    if (c.type === 'pressure_is') return `Pressure = ${c.value}`;
    if (c.type === 'policy_equals') return `${c.policyType} = ${c.value}`;
    if (c.type === 'agent_error_rate_gt') return `Error Rate > ${c.value}`;
    if (c.type === 'confidence_lt') return `Confidence < ${c.value}`;
    return `${c.type.replace(/_/g, ' ')} ${String('value' in c ? c.value : '')}`;
}

export function conditionCount(c: PolicyCondition): number {
    if (c.type === 'and' || c.type === 'or')
        return 1 + c.conditions.reduce((sum, sc) => sum + conditionCount(sc), 0);
    if (c.type === 'not') return 1 + conditionCount(c.condition);
    return 1;
}
