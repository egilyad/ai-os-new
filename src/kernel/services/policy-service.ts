import { genId } from '../../utils/gen-id';

export type PolicyType =
    'latency' | 'privacy' | 'cost' | 'safety' | 'rate_limit' | 'content' | 'custom';
export type PolicyAction = 'block' | 'warn' | 'log' | 'throttle' | 'mask';
export type PolicySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface PolicyViolation {
    id: string;
    policyId: string;
    nodeId: string;
    type: PolicyType;
    severity: PolicySeverity;
    detail: string;
    value?: number;
    threshold?: number;
    timestamp: number;
    resolved: boolean;
}

export interface PolicyStats {
    totalViolations: number;
    activeViolations: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    lastViolation: number | null;
}

export interface AgentPolicy {
    freeOnly: boolean;
    allowedModels: string[];
    deniedModels: string[];
    allowedProviders: string[];
    deniedProviders: string[];
}

export interface AgentPolicyCheck {
    allowed: boolean;
    reason?: string;
    blockedBy?: 'provider' | 'model' | 'free_only';
}

export interface SecurityPattern {
    id: string;
    pattern: string;
    replacement: string;
    label: string;
    type: 'pii' | 'toxic' | 'blocklist';
}

export interface ISPolicy {
    id: string;
    type: PolicyType;
    target_nodes: string[];
    value: number | string;
    action: PolicyAction;
    description?: string;
}

export interface PrivacyEnforcementResult {
    blocked: boolean;
    sanitized?: string;
}

export interface ContentSafetyResult {
    blocked: boolean;
    sanitized?: string;
}

import { EVENTS } from '../events/event-names';
import { CONFIG } from './config-registry';

import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('PolicyService');

const POLICIES_KEY = 'super_agents_policies';
const PATTERNS_KEY = 'super_agents_policy_patterns';
const AGENT_POLICIES_KEY = 'super_agents_agent_policies';
function getMaxViolations(): number {
    return CONFIG?.services?.policy?.maxViolations ?? 200;
}

export interface PolicyServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

export class PolicyService {
    protected activePolicies: ISPolicy[] = [];
    protected violations: PolicyViolation[] = [];
    protected agentPolicies: Record<string, AgentPolicy> = {};
    protected securityPatterns: SecurityPattern[] = [];
    private unsubs: Array<() => void> = [];
    private deps: PolicyServiceDeps;
    private _initialized = false;

    constructor(deps: PolicyServiceDeps) {
        this.deps = deps;
        this.activePolicies = [...this.initialPolicies];
    }

    // C-79 removed: admin token was only obfuscation, not real auth (single-user local-first app)
    private auditMutation(action: string, detail: string): void {
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Policy mutation: ${action} — ${detail}`,
            type: 'info',
        });
        LOGGER.info('PolicyService', `Policy mutation: ${action}`, { detail });
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.load();
        this.setupListeners();
    }

    destroy() {
        if (this.persistTimer) clearTimeout(this.persistTimer);
        this.unsubs.forEach((u) => u());
    }

    private initialPolicies: ISPolicy[] = [
        { id: 'p-latency-1', type: 'latency', target_nodes: ['all'], value: 2000, action: 'warn' },
        {
            id: 'p-privacy-1',
            type: 'privacy',
            target_nodes: ['all'],
            value: 'PII_REDACTION',
            action: 'block',
        },
        { id: 'p-cost-1', type: 'cost', target_nodes: ['all'], value: 0.05, action: 'warn' },
        {
            id: 'p-rate-limit-1',
            type: 'rate_limit',
            target_nodes: ['all'],
            value: 100,
            action: 'throttle',
        },
        {
            id: 'p-content-safety-1',
            type: 'content',
            target_nodes: ['all'],
            value: 'SAFETY_CHECK',
            action: 'mask',
        },
        {
            id: 'p-model-blacklist-1',
            type: 'custom',
            target_nodes: ['all'],
            value: 'BLOCKED_MODELS',
            action: 'block',
        },
    ];

    private defaultSecurityPatterns: SecurityPattern[] = [
        {
            id: 'pii-email',
            type: 'pii',
            label: 'email',
            pattern: '\\b[\\w.-]+@[\\w.-]+\\.\\w+\\b',
            replacement: '[EMAIL REDACTED]',
        },
        {
            id: 'pii-phone',
            type: 'pii',
            label: 'phone',
            pattern: '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
            replacement: '[PHONE REDACTED]',
        },
        {
            id: 'pii-ssn',
            type: 'pii',
            label: 'ssn',
            pattern: '\\b\\d{3}[-]?\\d{2}[-]?\\d{4}\\b',
            replacement: '[SSN REDACTED]',
        },
        {
            id: 'pii-cc',
            type: 'pii',
            label: 'credit_card',
            pattern: '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',
            replacement: '[CC REDACTED]',
        },
        {
            id: 'toxic-hate',
            type: 'toxic',
            label: 'toxic_content',
            pattern: '\\b(hate|racist|violent|explicit|nsfw)\\b',
            replacement: '[CONTENT MASKED]',
        },
        {
            id: 'blocklist-gpt4',
            type: 'blocklist',
            label: 'gpt-4',
            pattern: 'gpt-4',
            replacement: '',
        },
        {
            id: 'blocklist-opus',
            type: 'blocklist',
            label: 'claude-3-opus',
            pattern: 'claude-3-opus',
            replacement: '',
        },
        {
            id: 'blocklist-405b',
            type: 'blocklist',
            label: 'llama-3.1-405b',
            pattern: 'llama-3.1-405b',
            replacement: '',
        },
    ];

    private async load() {
        try {
            const saved =
                await this.deps.database.getKv<(ISPolicy | { id: string; type: PolicyType })[]>(
                    POLICIES_KEY,
                );
            if (saved && saved.length > 0) {
                this.activePolicies = saved.map((s) => ({
                    ...s,
                    value: (s as ISPolicy).value ?? 0,
                    action: (s as ISPolicy).action ?? 'warn',
                    target_nodes: (s as ISPolicy).target_nodes ?? ['all'],
                })) as ISPolicy[];
            }
            const savedPatterns = await this.deps.database.getKv<SecurityPattern[]>(PATTERNS_KEY);
            if (savedPatterns) this.securityPatterns = savedPatterns;
            else this.securityPatterns = [...this.defaultSecurityPatterns];
            const savedAgentPolicies =
                await this.deps.database.getKv<Record<string, AgentPolicy>>(AGENT_POLICIES_KEY);
            if (savedAgentPolicies) this.agentPolicies = savedAgentPolicies;
        } catch (e) {
            LOGGER.error('PolicyService', 'Failed to load policies', { error: e });
        }
    }

    private persistTimer: ReturnType<typeof setTimeout> | undefined;
    private persistPromise: Promise<void> | (() => Promise<void>) | undefined;

    protected async persist() {
        if (this.persistPromise) return this.persistPromise;
        this.persistTimer = setTimeout(() => {
            this.persistTimer = undefined;
            this.persistPromise = (async () => {
                try {
                    await Promise.all([
                        this.deps.database.setKv(POLICIES_KEY, this.activePolicies),
                        this.deps.database.setKv(PATTERNS_KEY, this.securityPatterns),
                        this.deps.database.setKv(AGENT_POLICIES_KEY, this.agentPolicies),
                    ]);
                } catch (e) {
                    LOGGER.error('PolicyService', 'Failed to persist', { error: e });
                } finally {
                    this.persistPromise = undefined;
                }
            })();
        }, 50);
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.onSafe<{ nodeId: string; duration?: number; output?: string }>(
                EVENTS.COGNITIVE_STEP_COMPLETED,
                (d) => {
                    this.checkLatency(d);
                    const privacyResult = this.enforcePrivacy(d);
                    if (privacyResult.blocked) {
                        LOGGER.warn(
                            'PolicyService',
                            `Privacy enforcement blocked output for node ${d.nodeId}`,
                            {
                                nodeId: d.nodeId,
                                sanitized: (privacyResult.sanitized ?? '').slice(0, 100),
                            },
                        );
                        (d as Record<string, unknown>).output = privacyResult.sanitized;
                    }
                },
            ),
        );
    }

    protected async recordViolation(data: Omit<PolicyViolation, 'id' | 'timestamp'>) {
        const violation: PolicyViolation = {
            ...data,
            id: genId('violation'),
            timestamp: Date.now(),
        };
        this.violations.push(violation);
        if (this.violations.length > getMaxViolations()) this.violations.shift();
        await this.persist();
        this.deps.eventBus.emitOnce(EVENTS.POLICY_VIOLATION, violation.id, violation);
    }

    private checkLatency(data: { nodeId: string; duration?: number }) {
        const policy = this.activePolicies.find((p) => p.type === 'latency');
        if (!policy || data.duration === undefined) return;
        const threshold = policy.value as number;
        if (threshold && data.duration > threshold) {
            this.recordViolation({
                policyId: policy.id,
                nodeId: data.nodeId,
                type: 'latency',
                severity: data.duration > threshold * 2 ? 'critical' : 'warning',
                detail: `Node ${data.nodeId} exceeded latency limit: ${data.duration}ms > ${threshold}ms`,
                value: data.duration,
                threshold,
                resolved: false,
            });
        }
    }

    // ── Migrated from legacy: enhanced privacy enforcement ────────────

    enforcePrivacy(data: { nodeId: string; output?: string }): PrivacyEnforcementResult {
        const policy = this.activePolicies.find((p) => p.type === 'privacy');
        if (!policy || policy.action !== 'block') return { blocked: false };
        const contentToCheck = typeof data === 'string' ? data : data?.output || '';
        const patterns = this.securityPatterns.filter((p) => p.type === 'pii');
        let sanitized = contentToCheck;
        let detected = false;
        for (const { pattern, replacement, label } of patterns) {
            let regex: RegExp;
            try {
                regex = new RegExp(pattern, 'gi');
            } catch {
                continue;
            }
            if (sanitized.match(regex)) {
                detected = true;
                sanitized = sanitized.replace(regex, replacement);
                this.recordViolation({
                    policyId: policy.id,
                    nodeId: data.nodeId,
                    type: 'privacy',
                    severity: 'error',
                    detail: `PII pattern detected: ${label}`,
                    resolved: false,
                });
            }
        }
        return detected ? { blocked: true, sanitized } : { blocked: false };
    }

    sanitizeOutput(nodeId: string, output: string): string {
        const result = this.enforcePrivacy({ nodeId, output });
        return result.blocked && result.sanitized ? result.sanitized : output;
    }

    // ── Public API ────────────────────────────────────────────────────

    getPolicies(): ISPolicy[] {
        return [...this.activePolicies];
    }

    getViolations(_onlyActive = false, limit?: number): PolicyViolation[] {
        let list = [...this.violations];
        if (_onlyActive) list = list.filter((v) => !v.resolved);
        if (limit) list = list.slice(0, limit);
        return list;
    }

    async addPolicy(policy: ISPolicy | Omit<ISPolicy, 'id'>) {
        this.auditMutation('addPolicy', JSON.stringify(policy).slice(0, 200));
        const newPolicy = {
            ...policy,
            id: (policy as ISPolicy).id || genId('policy'),
        } as ISPolicy;
        this.activePolicies.push(newPolicy);
        await this.persist();
    }

    async removePolicy(id: string) {
        this.auditMutation('removePolicy', id);
        this.activePolicies = this.activePolicies.filter((p) => p.id !== id);
        await this.persist();
    }

    async updatePolicy(id: string, updates: Partial<ISPolicy>) {
        this.auditMutation('updatePolicy', `${id}: ${JSON.stringify(updates).slice(0, 200)}`);
        this.activePolicies = this.activePolicies.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
        );
        await this.persist();
    }

    checkAgentPolicy(agentId: string, provider: string, model?: string): AgentPolicyCheck {
        const agentPolicy = this.agentPolicies[agentId];
        if (!agentPolicy) return { allowed: true };
        if (agentPolicy.deniedProviders.includes(provider)) {
            return {
                allowed: false,
                reason: `Provider ${provider} is denied for agent ${agentId}`,
                blockedBy: 'provider',
            };
        }
        if (
            agentPolicy.allowedProviders.length > 0 &&
            !agentPolicy.allowedProviders.includes(provider)
        ) {
            return {
                allowed: false,
                reason: `Provider ${provider} not in allowed list for agent ${agentId}`,
                blockedBy: 'provider',
            };
        }
        if (model) {
            if (agentPolicy.deniedModels.includes(model)) {
                return {
                    allowed: false,
                    reason: `Model ${model} is denied for agent ${agentId}`,
                    blockedBy: 'model',
                };
            }
            if (
                agentPolicy.allowedModels.length > 0 &&
                !agentPolicy.allowedModels.includes(model)
            ) {
                return {
                    allowed: false,
                    reason: `Model ${model} not in allowed list for agent ${agentId}`,
                    blockedBy: 'model',
                };
            }
        }
        const freeProviders = Object.keys(CONFIG.keys.freeTierLimits).map((p) => p.toLowerCase());
        if (agentPolicy.freeOnly && !freeProviders.includes(provider.toLowerCase())) {
            return {
                allowed: false,
                reason: `Agent ${agentId} restricted to free tier providers (${freeProviders.join(', ')})`,
                blockedBy: 'free_only',
            };
        }
        return { allowed: true };
    }

    async setAgentPolicy(agentId: string, policy: AgentPolicy) {
        this.auditMutation('setAgentPolicy', `${agentId}: freeOnly=${policy.freeOnly}`);
        this.agentPolicies[agentId] = policy;
        await this.persist();
    }

    getAgentPolicy(agentId: string): AgentPolicy {
        return (
            this.agentPolicies[agentId] || {
                freeOnly: false,
                allowedModels: [],
                deniedModels: [],
                allowedProviders: [],
                deniedProviders: [],
            }
        );
    }

    async removeAgentPolicy(agentId: string) {
        this.auditMutation('removeAgentPolicy', agentId);
        delete this.agentPolicies[agentId];
        await this.persist();
    }

    getAllAgentPolicies(): Record<string, AgentPolicy> {
        return { ...this.agentPolicies };
    }

    getSecurityPatterns(): SecurityPattern[] {
        return [...this.securityPatterns];
    }
    getPatterns(): SecurityPattern[] {
        return this.getSecurityPatterns();
    }

    async addSecurityPattern(pattern: SecurityPattern) {
        this.auditMutation('addSecurityPattern', `${pattern.type}: ${pattern.label}`);
        this.securityPatterns.push(pattern);
        await this.persist();
    }
    addPattern(pattern: SecurityPattern) {
        return this.addSecurityPattern(pattern);
    }

    async removeSecurityPattern(id: string) {
        this.auditMutation('removeSecurityPattern', id);
        this.securityPatterns = this.securityPatterns.filter((p) => p.id !== id);
        await this.persist();
    }

    getBlockedModels(): string[] {
        return this.securityPatterns.filter((p) => p.type === 'blocklist').map((p) => p.pattern);
    }

    addBlockedModel(model: string) {
        const exists = this.securityPatterns.some(
            (p) => p.type === 'blocklist' && p.pattern === model,
        );
        if (!exists)
            this.addSecurityPattern({
                id: `pattern-${Date.now()}`,
                type: 'blocklist',
                label: model,
                pattern: model,
                replacement: '',
            });
    }

    async removeBlockedModel(model: string) {
        this.auditMutation('removeBlockedModel', model);
        const idx = this.securityPatterns.findIndex(
            (p) => p.type === 'blocklist' && p.pattern === model,
        );
        if (idx >= 0) {
            this.securityPatterns.splice(idx, 1);
            await this.persist();
        }
    }

    getStats(): PolicyStats {
        const byType: Record<string, number> = {};
        const bySeverity: Record<string, number> = {};
        for (const v of this.violations) {
            byType[v.type] = (byType[v.type] || 0) + 1;
            bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
        }
        return {
            totalViolations: this.violations.length,
            activeViolations: this.violations.filter((v) => !v.resolved).length,
            byType,
            bySeverity,
            lastViolation: this.violations.length > 0 ? this.violations[0]!.timestamp : null,
        };
    }

    async resolveViolation(id: string) {
        this.auditMutation('resolveViolation', id);
        const v = this.violations.find((v) => v.id === id);
        if (v) {
            v.resolved = true;
            await this.persist();
        }
    }

    async clearViolations() {
        this.auditMutation('clearViolations', `${this.violations.length} entries cleared`);
        this.violations = [];
        await this.persist();
    }

    async setPatterns(patterns: SecurityPattern[]) {
        this.auditMutation('setPatterns', `${patterns.length} patterns`);
        this.securityPatterns.length = 0;
        this.securityPatterns.push(...patterns);
        await this.persist();
    }
}
