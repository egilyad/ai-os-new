import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PolicyService } from './policy-service';
import type { PolicyServiceDeps, ISPolicy, SecurityPattern, AgentPolicy } from './policy-service';

function createDeps(): PolicyServiceDeps {
    return {
        eventBus: {
            on: vi.fn().mockReturnValue(() => {}),
            onSafe: vi.fn().mockReturnValue(() => {}),
            emit: vi.fn(),
            emitOnce: vi.fn().mockReturnValue(true),
        },
        database: {
            getKv: vi.fn().mockResolvedValue(null),
            setKv: vi.fn().mockResolvedValue(undefined),
        },
    };
}

describe('PolicyService', () => {
    let deps: PolicyServiceDeps;

    beforeEach(() => {
        deps = createDeps();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function makeService(): PolicyService {
        const s = new PolicyService(deps);
        return s;
    }

    describe('constructor & defaults', () => {
        it('should create with 6 default policies', () => {
            const svc = makeService();
            expect(svc.getPolicies().length).toBe(6);
            svc.destroy();
        });

        it('should start with empty security patterns', () => {
            const svc = makeService();
            expect(svc.getSecurityPatterns().length).toBe(0);
            svc.destroy();
        });

        it('should return copy of policies', () => {
            const svc = makeService();
            const policies = svc.getPolicies();
            policies.push({} as ISPolicy);
            expect(svc.getPolicies().length).toBe(6);
            svc.destroy();
        });
    });

    describe('init', () => {
        it('should load policies from database', async () => {
            (deps.database.getKv as unknown) = vi.fn((key: string) => {
                if (key === 'super_agents_policies')
                    return Promise.resolve([
                        {
                            id: 'p-custom-1',
                            type: 'latency',
                            target_nodes: ['all'],
                            value: 5000,
                            action: 'warn',
                        },
                    ] as never);
                return Promise.resolve(null);
            });
            const svc = makeService();
            await svc.init();
            expect(svc.getPolicies().length).toBe(1);
            expect(svc.getPolicies()[0].id).toBe('p-custom-1');
            svc.destroy();
        });

        it('should load security patterns from database', async () => {
            const saved: SecurityPattern[] = [
                {
                    id: 'pii-custom',
                    type: 'pii',
                    label: 'custom',
                    pattern: 'test',
                    replacement: '[R]',
                },
            ];
            deps.database.getKv = vi.fn((key: string) => {
                if (key === 'super_agents_policy_patterns') return Promise.resolve(saved);
                return Promise.resolve(null);
            }) as never;
            const svc = makeService();
            await svc.init();
            expect(svc.getSecurityPatterns().length).toBe(1);
            expect(svc.getSecurityPatterns()[0].id).toBe('pii-custom');
            svc.destroy();
        });

        it('should use default security patterns when none saved', async () => {
            const svc = makeService();
            await svc.init();
            expect(svc.getSecurityPatterns().length).toBeGreaterThanOrEqual(8);
            svc.destroy();
        });

        it('should set up event listeners', async () => {
            const svc = makeService();
            await svc.init();
            expect(deps.eventBus.onSafe).toHaveBeenCalled();
            svc.destroy();
        });

        it('should be idempotent', async () => {
            const svc = makeService();
            await svc.init();
            const callCount = (deps.eventBus.onSafe as ReturnType<typeof vi.fn>).mock.calls.length;
            await svc.init();
            expect((deps.eventBus.onSafe as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
                callCount,
            );
            svc.destroy();
        });
    });

    describe('mutations', () => {
        it('should apply policy mutations without admin token', () => {
            const svc = new PolicyService(deps);
            svc.addPolicy({
                type: 'latency',
                target_nodes: ['all'],
                value: 100,
                action: 'warn',
            });
            expect(svc.getPolicies().some((p) => p.type === 'latency' && p.value === 100)).toBe(
                true,
            );
            svc.destroy();
        });

        it('should emit notification on mutation', () => {
            const svc = new PolicyService(deps);
            svc.addPolicy({ type: 'latency', target_nodes: ['all'], value: 100, action: 'warn' });
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                'system:notification',
                expect.objectContaining({ type: 'info' }),
            );
            svc.destroy();
        });
    });

    describe('policy CRUD', () => {
        it('should add a policy', () => {
            const svc = makeService();
            svc.addPolicy({
                type: 'latency',
                target_nodes: ['node-1'],
                value: 500,
                action: 'warn',
            });
            expect(svc.getPolicies().length).toBe(7);
            svc.destroy();
        });

        it('should remove a policy', () => {
            const svc = makeService();
            const id = svc.getPolicies()[0].id;
            svc.removePolicy(id);
            expect(svc.getPolicies().length).toBe(5);
            expect(svc.getPolicies().find((p) => p.id === id)).toBeUndefined();
            svc.destroy();
        });

        it('should update a policy', () => {
            const svc = makeService();
            const id = svc.getPolicies()[0].id;
            svc.updatePolicy(id, { value: 9999 });
            expect(svc.getPolicies().find((p) => p.id === id)?.value).toBe(9999);
            svc.destroy();
        });
    });

    describe('agent policies', () => {
        it('should set and get agent policy', () => {
            const svc = makeService();
            const policy: AgentPolicy = {
                freeOnly: true,
                allowedModels: [],
                deniedModels: [],
                allowedProviders: ['groq'],
                deniedProviders: [],
            };
            svc.setAgentPolicy('agent-1', policy);
            expect(svc.getAgentPolicy('agent-1')).toEqual(policy);
            svc.destroy();
        });

        it('should return default policy for unknown agent', () => {
            const svc = makeService();
            const p = svc.getAgentPolicy('unknown');
            expect(p.freeOnly).toBe(false);
            expect(p.allowedProviders).toEqual([]);
            svc.destroy();
        });

        it('should remove agent policy', () => {
            const svc = makeService();
            svc.setAgentPolicy('agent-1', {
                freeOnly: false,
                allowedModels: [],
                deniedModels: [],
                allowedProviders: [],
                deniedProviders: [],
            });
            svc.removeAgentPolicy('agent-1');
            expect(svc.getAgentPolicy('agent-1').freeOnly).toBe(false);
            svc.destroy();
        });

        it('should get all agent policies', () => {
            const svc = makeService();
            svc.setAgentPolicy('a1', {
                freeOnly: true,
                allowedModels: [],
                deniedModels: [],
                allowedProviders: ['groq'],
                deniedProviders: [],
            });
            svc.setAgentPolicy('a2', {
                freeOnly: false,
                allowedModels: ['gpt-4'],
                deniedModels: [],
                allowedProviders: [],
                deniedProviders: [],
            });
            const all = svc.getAllAgentPolicies();
            expect(Object.keys(all).length).toBe(2);
            expect(all['a1'].freeOnly).toBe(true);
            svc.destroy();
        });
    });

    describe('checkAgentPolicy', () => {
        it('should allow when no agent policy exists', () => {
            const svc = makeService();
            expect(svc.checkAgentPolicy('unknown', 'groq').allowed).toBe(true);
            svc.destroy();
        });

        it('should block denied provider', () => {
            const svc = makeService();
            svc.setAgentPolicy('agent-1', {
                freeOnly: false,
                allowedModels: [],
                deniedModels: [],
                allowedProviders: [],
                deniedProviders: ['groq'],
            });
            const r = svc.checkAgentPolicy('agent-1', 'groq');
            expect(r.allowed).toBe(false);
            expect(r.blockedBy).toBe('provider');
            svc.destroy();
        });

        it('should block provider not in allowed list', () => {
            const svc = makeService();
            svc.setAgentPolicy('agent-1', {
                freeOnly: false,
                allowedModels: [],
                deniedModels: [],
                allowedProviders: ['openrouter'],
                deniedProviders: [],
            });
            const r = svc.checkAgentPolicy('agent-1', 'groq');
            expect(r.allowed).toBe(false);
            svc.destroy();
        });

        it('should block denied model', () => {
            const svc = makeService();
            svc.setAgentPolicy('agent-1', {
                freeOnly: false,
                allowedModels: [],
                deniedModels: ['gpt-4'],
                allowedProviders: [],
                deniedProviders: [],
            });
            const r = svc.checkAgentPolicy('agent-1', 'groq', 'gpt-4');
            expect(r.allowed).toBe(false);
            expect(r.blockedBy).toBe('model');
            svc.destroy();
        });

        it('should block model not in allowed list', () => {
            const svc = makeService();
            svc.setAgentPolicy('agent-1', {
                freeOnly: false,
                allowedModels: ['llama-3'],
                deniedModels: [],
                allowedProviders: [],
                deniedProviders: [],
            });
            const r = svc.checkAgentPolicy('agent-1', 'groq', 'gpt-4');
            expect(r.allowed).toBe(false);
            svc.destroy();
        });

        it('should allow when policy permits provider and model', () => {
            const svc = makeService();
            svc.setAgentPolicy('agent-1', {
                freeOnly: false,
                allowedModels: [],
                deniedModels: [],
                allowedProviders: ['groq'],
                deniedProviders: [],
            });
            expect(svc.checkAgentPolicy('agent-1', 'groq', 'llama-3').allowed).toBe(true);
            svc.destroy();
        });
    });

    describe('security patterns', () => {
        it('should add a security pattern', () => {
            const svc = makeService();
            svc.addSecurityPattern({
                id: 'pii-test',
                type: 'pii',
                label: 'test',
                pattern: 'test',
                replacement: '[T]',
            });
            expect(svc.getSecurityPatterns().length).toBe(1);
            svc.destroy();
        });

        it('should remove a security pattern', () => {
            const svc = makeService();
            svc.addSecurityPattern({
                id: 'pii-x',
                type: 'pii',
                label: 'x',
                pattern: 'x',
                replacement: '[X]',
            });
            const id = svc.getSecurityPatterns()[0].id;
            svc.removeSecurityPattern(id);
            expect(svc.getSecurityPatterns().find((p) => p.id === id)).toBeUndefined();
            svc.destroy();
        });

        it('should alias addPattern', () => {
            const svc = makeService();
            svc.addPattern({
                id: 'pii-alias',
                type: 'pii',
                label: 'alias',
                pattern: 'x',
                replacement: '[X]',
            });
            expect(svc.getSecurityPatterns().some((p) => p.id === 'pii-alias')).toBe(true);
            svc.destroy();
        });

        it('should set patterns replacing all', () => {
            const svc = makeService();
            svc.addSecurityPattern({
                id: 'pii-old',
                type: 'pii',
                label: 'old',
                pattern: 'old',
                replacement: '[O]',
            });
            const newPatterns: SecurityPattern[] = [
                { id: 'pii-only', type: 'pii', label: 'only', pattern: 'only', replacement: '[O]' },
            ];
            svc.setPatterns(newPatterns);
            expect(svc.getSecurityPatterns().length).toBe(1);
            expect(svc.getSecurityPatterns()[0].id).toBe('pii-only');
            svc.destroy();
        });

        it('should manage blocked models', () => {
            const svc = makeService();
            svc.addBlockedModel('gpt-5');
            expect(svc.getBlockedModels()).toContain('gpt-5');
            svc.removeBlockedModel('gpt-5');
            expect(svc.getBlockedModels()).not.toContain('gpt-5');
            svc.destroy();
        });

        it('should not duplicate blocked models', () => {
            const svc = makeService();
            svc.addBlockedModel('gpt-5');
            svc.addBlockedModel('gpt-5');
            expect(svc.getBlockedModels().filter((m) => m === 'gpt-5').length).toBe(1);
            svc.destroy();
        });

        it('should get patterns via getPatterns alias', () => {
            const svc = makeService();
            svc.addSecurityPattern({
                id: 'pii-x',
                type: 'pii',
                label: 'x',
                pattern: 'x',
                replacement: '[X]',
            });
            expect(svc.getPatterns()).toEqual(svc.getSecurityPatterns());
            svc.destroy();
        });
    });

    describe('violations', () => {
        async function initSvc(): Promise<PolicyService> {
            const s = makeService();
            await s.init();
            return s;
        }

        it('should record violation via enforcePrivacy on PII detection', async () => {
            const svc = await initSvc();
            svc.enforcePrivacy({ nodeId: 'n1', output: 'Email: user@test.com' });
            expect(svc.getViolations().some((v) => v.type === 'privacy')).toBe(true);
            svc.destroy();
        });

        it('should get violations with active filter', async () => {
            const svc = await initSvc();
            svc.enforcePrivacy({ nodeId: 'n1', output: 'Email: u@t.com' });
            const all = svc.getViolations(false);
            expect(all.length).toBe(1);
            svc.resolveViolation(all[0].id);
            expect(svc.getViolations(true).length).toBe(0);
            svc.destroy();
        });

        it('should limit violations', async () => {
            const svc = await initSvc();
            svc.enforcePrivacy({ nodeId: 'n1', output: 'a@b.com' });
            svc.enforcePrivacy({ nodeId: 'n2', output: 'c@d.com' });
            svc.enforcePrivacy({ nodeId: 'n3', output: 'e@f.com' });
            expect(svc.getViolations(false, 2).length).toBe(2);
            svc.destroy();
        });

        it('should clear violations', async () => {
            const svc = await initSvc();
            svc.enforcePrivacy({ nodeId: 'n1', output: 'a@b.com' });
            expect(svc.getViolations().length).toBeGreaterThan(0);
            svc.clearViolations();
            expect(svc.getViolations().length).toBe(0);
            svc.destroy();
        });

        it('should return stats', async () => {
            const svc = await initSvc();
            svc.enforcePrivacy({ nodeId: 'n1', output: 'a@b.com' });
            const stats = svc.getStats();
            expect(stats.totalViolations).toBe(1);
            expect(stats.activeViolations).toBe(1);
            expect(stats.byType.privacy).toBe(1);
            expect(stats.lastViolation).toBeGreaterThan(0);
            svc.destroy();
        });
    });

    describe('enforcement', () => {
        let svc: PolicyService;
        beforeEach(async () => {
            svc = makeService();
            await svc.init();
        });
        afterEach(() => {
            svc.destroy();
        });

        describe('enforcePrivacy', () => {
            it('should detect email PII', () => {
                const r = svc.enforcePrivacy({ nodeId: 'n1', output: 'Contact test@example.com' });
                expect(r.blocked).toBe(true);
                expect(r.sanitized).toContain('[EMAIL REDACTED]');
            });

            it('should detect phone PII', () => {
                const r = svc.enforcePrivacy({ nodeId: 'n1', output: 'Call 555-123-4567' });
                expect(r.blocked).toBe(true);
                expect(r.sanitized).toContain('[PHONE REDACTED]');
            });

            it('should detect SSN PII', () => {
                const r = svc.enforcePrivacy({ nodeId: 'n1', output: 'SSN: 123-45-6789' });
                expect(r.blocked).toBe(true);
                expect(r.sanitized).toContain('[SSN REDACTED]');
            });

            it('should detect credit card PII', () => {
                const r = svc.enforcePrivacy({ nodeId: 'n1', output: 'Card: 4111-1111-1111-1111' });
                expect(r.blocked).toBe(true);
                expect(r.sanitized).toContain('[CC REDACTED]');
            });

            it('should not block clean output', () => {
                const r = svc.enforcePrivacy({ nodeId: 'n1', output: 'Normal message.' });
                expect(r.blocked).toBe(false);
            });
        });

        describe('sanitizeOutput', () => {
            it('should sanitize PII', () => {
                expect(svc.sanitizeOutput('n1', 'Email: u@t.com')).not.toContain('u@t.com');
            });

            it('should return clean output unchanged', () => {
                expect(svc.sanitizeOutput('n1', 'Clean')).toBe('Clean');
            });
        });
    });

    describe('persistence', () => {
        it('should call setKv after mutations', async () => {
            const svc = makeService();
            svc.addPolicy({ type: 'latency', target_nodes: ['all'], value: 100, action: 'warn' });
            await vi.waitFor(() => {
                expect(deps.database.setKv).toHaveBeenCalled();
            });
            svc.destroy();
        });
    });
});
