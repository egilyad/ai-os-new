import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthSlaService } from './health-sla-service';
import type { HealthSlaServiceDeps } from './health-sla-service';

function makeDeps(overrides: Partial<HealthSlaServiceDeps> = {}): HealthSlaServiceDeps {
    return {
        providerTracker: {
            getMetrics: vi.fn().mockReturnValue({
                errors: 0,
                totalRequests: 100,
                avgLatency: 150,
                quotaRemaining: 90,
                quotaLimit: 100,
                reputation: 0.95,
                lastUsed: Date.now(),
            }),
            getHealthEvents: vi.fn().mockReturnValue([]),
            start: vi.fn(),
        },
        ...overrides,
    } as unknown as HealthSlaServiceDeps;
}

describe('HealthSlaService', () => {
    let svc: HealthSlaService;
    let deps: HealthSlaServiceDeps;

    beforeEach(() => {
        deps = makeDeps();
        svc = new HealthSlaService(deps);
    });

    describe('getProfiles', () => {
        it('should return 2 default profiles', () => {
            const profiles = svc.getProfiles();
            expect(profiles).toHaveLength(2);
            expect(profiles[0].name).toBe('Production Critical');
            expect(profiles[1].name).toBe('Best Effort');
        });

        it('should return a copy, not reference', () => {
            const profiles = svc.getProfiles();
            profiles.pop();
            expect(svc.getProfiles()).toHaveLength(2);
        });
    });

    describe('getProfile', () => {
        it('should return profile by id', () => {
            const profiles = svc.getProfiles();
            const p = svc.getProfile(profiles[0].id);
            expect(p).toBeDefined();
            expect(p!.name).toBe('Production Critical');
        });

        it('should return undefined for unknown id', () => {
            expect(svc.getProfile('nonexistent')).toBeUndefined();
        });
    });

    describe('createProfile', () => {
        it('should create a new profile', () => {
            const p = svc.createProfile('Test', 'desc');
            expect(p.name).toBe('Test');
            expect(p.description).toBe('desc');
            expect(p.rules).toHaveLength(0);
            expect(p.createdAt).toBeGreaterThan(0);
            expect(svc.getProfiles()).toHaveLength(3);
        });
    });

    describe('updateProfile', () => {
        it('should update profile fields', () => {
            const profiles = svc.getProfiles();
            const updated = svc.updateProfile(profiles[0].id, { name: 'Updated Name' });
            expect(updated.name).toBe('Updated Name');
            expect(svc.getProfile(profiles[0].id)!.name).toBe('Updated Name');
        });

        it('should throw for unknown profile', () => {
            expect(() => svc.updateProfile('bad-id', { name: 'x' })).toThrow(
                'Profile bad-id not found',
            );
        });
    });

    describe('deleteProfile', () => {
        it('should delete profile by id', () => {
            const p = svc.createProfile('Temp', 'temp');
            svc.deleteProfile(p.id);
            expect(svc.getProfile(p.id)).toBeUndefined();
        });
    });

    describe('addRule', () => {
        it('should add rule to profile', () => {
            const profiles = svc.getProfiles();
            const rule = svc.addRule(profiles[0].id, {
                name: 'Custom',
                metric: 'latency',
                operator: 'lt',
                threshold: 100,
                unit: 'ms',
                severity: 'info',
                enabled: true,
            });
            expect(rule.id).toBeTruthy();
            expect(rule.name).toBe('Custom');
            expect(svc.getProfile(profiles[0].id)!.rules.length).toBe(4);
        });

        it('should throw for unknown profile', () => {
            expect(() =>
                svc.addRule('bad', {
                    name: 'x',
                    metric: 'latency',
                    operator: 'lt',
                    threshold: 100,
                    unit: 'ms',
                    severity: 'info',
                    enabled: true,
                }),
            ).toThrow('Profile bad not found');
        });
    });

    describe('updateRule', () => {
        it('should update rule fields', () => {
            const profiles = svc.getProfiles();
            const rule = profiles[0].rules[0];
            svc.updateRule(profiles[0].id, rule.id, { threshold: 999 });
            expect(svc.getProfile(profiles[0].id)!.rules[0].threshold).toBe(999);
        });

        it('should throw for unknown profile', () => {
            expect(() => svc.updateRule('bad', 'rule', {})).toThrow('Profile bad not found');
        });

        it('should throw for unknown rule', () => {
            const profiles = svc.getProfiles();
            expect(() => svc.updateRule(profiles[0].id, 'bad-rule', {})).toThrow(
                'Rule bad-rule not found',
            );
        });
    });

    describe('removeRule', () => {
        it('should remove rule from profile', () => {
            const profiles = svc.getProfiles();
            const rule = profiles[0].rules[0];
            svc.removeRule(profiles[0].id, rule.id);
            expect(svc.getProfile(profiles[0].id)!.rules.length).toBe(2);
        });
    });

    describe('evaluateProfile', () => {
        it('should evaluate all enabled rules', () => {
            const profiles = svc.getProfiles();
            const results = svc.evaluateProfile(profiles[0].id);
            expect(results.length).toBe(3);
            results.forEach((r) => expect(r.ruleId).toBeTruthy());
        });

        it('should pass for good metrics (low latency, low errors, high uptime)', () => {
            deps = makeDeps({
                providerTracker: {
                    getMetrics: vi.fn().mockReturnValue({
                        errors: 1,
                        totalRequests: 1000,
                        avgLatency: 100,
                        quotaRemaining: 50,
                        quotaLimit: 100,
                        reputation: 0.99,
                        lastUsed: Date.now(),
                    }),
                } as unknown as HealthSlaServiceDeps['providerTracker'],
            });
            svc = new HealthSlaService(deps);
            const profiles = svc.getProfiles();
            const results = svc.evaluateProfile(profiles[0].id);
            const latencyRule = results[0];
            const uptimeRule = results[1];
            expect(latencyRule.passed).toBe(true);
            expect(uptimeRule.passed).toBe(true);
        });

        it('should fail for bad metrics (high latency, high errors)', () => {
            deps = makeDeps({
                providerTracker: {
                    getMetrics: vi.fn().mockReturnValue({
                        errors: 500,
                        totalRequests: 600,
                        avgLatency: 3000,
                        quotaRemaining: 10,
                        quotaLimit: 100,
                        reputation: 0.3,
                        lastUsed: Date.now(),
                    }),
                } as unknown as HealthSlaServiceDeps['providerTracker'],
            });
            svc = new HealthSlaService(deps);
            const profiles = svc.getProfiles();
            const results = svc.evaluateProfile(profiles[0].id);
            const latencyRule = results[0];
            expect(latencyRule.passed).toBe(false);
        });

        it('should throw for unknown profile', () => {
            expect(() => svc.evaluateProfile('bad-id')).toThrow('Profile bad-id not found');
        });

        it('should return false for rules when no data available', () => {
            deps = makeDeps({
                providerTracker: {
                    getMetrics: vi.fn().mockReturnValue({
                        errors: 0,
                        totalRequests: 0,
                        avgLatency: 0,
                        quotaRemaining: 0,
                        quotaLimit: 0,
                        reputation: 0,
                        lastUsed: 0,
                    }),
                } as unknown as HealthSlaServiceDeps['providerTracker'],
            });
            svc = new HealthSlaService(deps);
            const p = svc.createProfile('Test', 'desc');
            svc.addRule(p.id, {
                name: 'R',
                metric: 'latency',
                operator: 'lt',
                threshold: 100,
                unit: 'ms',
                severity: 'info',
                enabled: true,
            });
            svc.addRule(p.id, {
                name: 'R2',
                metric: 'error_rate',
                operator: 'lt',
                threshold: 1,
                unit: '%',
                severity: 'info',
                enabled: true,
            });
            const results = svc.evaluateProfile(p.id);
            results.forEach((r) => expect(r.passed).toBe(false));
        });
    });
});
