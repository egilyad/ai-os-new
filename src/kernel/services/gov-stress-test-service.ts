import type {
    GovTestScenario,
    GovScenarioResult,
    GovStressReport,
    GovStressSummary,
    GovPolicyInput,
    GovViolationInput,
    IGovStressTestService,
} from '../contracts/gov-stress-test';

const SCENARIOS: GovTestScenario[] = [
    {
        name: 'Excessive latency',
        description: 'Provider responds in 8s (SLA: 2s)',
        category: 'SLA',
        slaMode: 'LOW_LATENCY',
        simulatedAction: 'Provider latency 8000ms',
    },
    {
        name: 'High cost per request',
        description: 'Single request costs $0.50 (budget: $0.10)',
        category: 'Cost',
        policyViolated: 'cost',
        simulatedAction: 'Select expensive model',
    },
    {
        name: 'Privacy data leak',
        description: 'Agent tries to include PII in message',
        category: 'Privacy',
        policyViolated: 'privacy',
        simulatedAction: 'Send email with SSN',
    },
    {
        name: 'Rate limit burst',
        description: '50 requests in 1 second (limit: 10/s)',
        category: 'Rate Limit',
        policyViolated: 'rate_limit',
        simulatedAction: 'Burst 50 requests',
    },
    {
        name: 'Unsafe content output',
        description: 'Model generates harmful code',
        category: 'Safety',
        policyViolated: 'safety',
        simulatedAction: 'Generate exploit script',
    },
    {
        name: 'Content policy violation',
        description: 'Message contains prohibited terms',
        category: 'Content',
        policyViolated: 'content',
        simulatedAction: 'Post restricted content',
    },
    {
        name: 'ECONOMY mode cost breach',
        description: 'Request routed to premium model in ECONOMY mode',
        category: 'SLA',
        slaMode: 'ECONOMY',
        simulatedAction: 'Route to GPT-4',
    },
    {
        name: 'Auth token expiration',
        description: 'Expired API key used for request',
        category: 'Security',
        simulatedAction: 'Use expired key',
    },
    {
        name: 'Tool permission escalation',
        description: 'Agent tries to access filesystem tool without permission',
        category: 'Security',
        simulatedAction: 'Call readFile without access',
    },
    {
        name: 'Cross-agent prompt injection',
        description: 'Malicious input embedded in agent context',
        category: 'Safety',
        simulatedAction: 'Inject "ignore previous instructions"',
    },
];

const MITIGATIONS: Record<string, string> = {
    'Excessive latency': 'Increase SLA timeout or switch provider',
    'High cost per request': 'Set cost cap or use ECONOMY mode routing',
    'Privacy data leak': 'Add PII detection middleware before agent output',
    'Rate limit burst': 'Implement client-side rate limiter with queue',
    'Unsafe content output': 'Enable content filter / safety guardrail',
    'Content policy violation': 'Add prohibited terms filter to input pipeline',
    'ECONOMY mode cost breach': 'Update SLA routing rules to enforce model tiers',
    'Auth token expiration': 'Add token refresh mechanism with pre-expiry check',
    'Tool permission escalation': 'Implement RBAC for tool execution permissions',
    'Cross-agent prompt injection': 'Add input sanitization and context boundary checks',
};

export interface GovStressTestServiceDeps {
    getPolicies: () => GovPolicyInput[];
    getViolations: (onlyActive?: boolean, limit?: number) => GovViolationInput[];
    getRoleCount?: () => number;
}

export class GovStressTestService implements IGovStressTestService {
    constructor(private deps: GovStressTestServiceDeps) {}

    getScenarios(): GovTestScenario[] {
        return [...SCENARIOS];
    }

    simulateScenario(
        scenario: GovTestScenario,
        policies: GovPolicyInput[],
        violations: GovViolationInput[],
    ): GovScenarioResult {
        const rules: string[] = [];
        const policyMap = new Map(policies.map((p) => [p.type, p]));
        let result: GovScenarioResult['result'] = 'pass';

        if (scenario.policyViolated === 'cost') {
            const p = policyMap.get('cost');
            rules.push(p ? `CostPolicy: max $${p.value}/request` : 'CostPolicy: max $0.10/request');
            result = 'block';
        } else if (scenario.policyViolated === 'privacy') {
            rules.push('PrivacyPolicy: PII must be masked');
            result = 'block';
        } else if (scenario.policyViolated === 'rate_limit') {
            const p = policyMap.get('rate_limit');
            rules.push(
                p ? `RateLimitPolicy: max ${p.value} req/s` : 'RateLimitPolicy: max 100 req/s',
            );
            result = 'warn';
        } else if (scenario.policyViolated === 'safety') {
            rules.push('SafetyPolicy: harmful content blocked');
            result = 'block';
        } else if (scenario.policyViolated === 'content') {
            rules.push('ContentPolicy: prohibited terms detected');
            result = 'warn';
        } else if (scenario.slaMode === 'LOW_LATENCY') {
            const p = policyMap.get('latency');
            rules.push(
                p
                    ? `SLAPolicy: LOW_LATENCY mode max ${p.value}ms`
                    : 'SLAPolicy: LOW_LATENCY mode max 2000ms',
            );
            result = 'block';
        } else if (scenario.slaMode === 'ECONOMY') {
            rules.push('SLAPolicy: ECONOMY mode — premium models blocked');
            result = 'warn';
        } else if (scenario.category === 'Security') {
            rules.push('SecurityPolicy: auth required', 'ToolPolicy: permission check');
            result = scenario.name.includes('expir') ? 'warn' : 'block';
        }

        const matchedViolations = violations.filter(
            (v) =>
                v.type === scenario.policyViolated ||
                v.type?.toLowerCase() === scenario.category.toLowerCase(),
        );
        if (matchedViolations.length > 0) {
            rules.push(`${matchedViolations.length} live violation(s) on record`);
        }

        return {
            scenario,
            result,
            violatedRules: rules,
            suggestedMitigation: MITIGATIONS[scenario.name] || 'Review policy configuration',
        };
    }

    runAllScenarios(): GovScenarioResult[] {
        const policies = this.deps.getPolicies();
        const violations = this.deps.getViolations(false, 20);
        return SCENARIOS.map((s) => this.simulateScenario(s, policies, violations));
    }

    summarize(results: GovScenarioResult[]): GovStressSummary {
        const passed = results.filter((r) => r.result === 'pass').length;
        const warned = results.filter((r) => r.result === 'warn').length;
        const blocked = results.filter((r) => r.result === 'block').length;
        return { passed, warned, blocked, total: results.length };
    }

    buildReport(results: GovScenarioResult[]): GovStressReport {
        const policies = this.deps.getPolicies();
        const violations = this.deps.getViolations(false, 20);
        return {
            timestamp: Date.now(),
            summary: this.summarize(results),
            results,
            livePolicyCount: policies.length,
            liveViolationCount: violations.length,
            roleCount: this.deps.getRoleCount?.() ?? 0,
        };
    }
}
