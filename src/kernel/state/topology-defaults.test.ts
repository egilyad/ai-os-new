import { describe, it, expect } from 'vitest';
import { AuditorTopology } from './topology-defaults';
import { AGENT_PROFILES } from './agent-profiles';

describe('AuditorTopology agent identity', () => {
    const agentNodes = AuditorTopology.nodes.filter((n) => n.type === 'agent');

    it('has 25 specialized agents', () => {
        expect(agentNodes.length).toBe(25);
    });

    it('every profiled agent carries a complete curated identity', () => {
        for (const node of agentNodes) {
            const profile = AGENT_PROFILES[node.id];
            expect(profile, `missing profile for ${node.id}`).toBeDefined();
            const cfg = node.config as Record<string, unknown>;
            expect(cfg.displayName, `${node.id} displayName`).toBe(profile!.displayName);
            expect(cfg.firstName, `${node.id} firstName`).toBe(profile!.firstName);
            expect(cfg.lastName, `${node.id} lastName`).toBe(profile!.lastName);
            expect(cfg.baseRole, `${node.id} baseRole`).toBe(profile!.baseRole);
            expect(Array.isArray(cfg.specializations), `${node.id} specializations`).toBe(true);
            expect((cfg.specializations as unknown[]).length).toBeGreaterThan(0);
            expect(Array.isArray(cfg.lensIds), `${node.id} lensIds`).toBe(true);
            const avatar = cfg.avatar as { emoji?: string; color?: string };
            expect(avatar?.emoji, `${node.id} avatar.emoji`).toBeTruthy();
            expect(avatar?.color, `${node.id} avatar.color`).toBeTruthy();
            expect(cfg.provider, `${node.id} provider`).toBe(profile!.provider);
            expect(cfg.model, `${node.id} model`).toBe(profile!.model);
        }
    });

    it('displayName combines first and last name', () => {
        const network = agentNodes.find((n) => n.id === 'agent-network')!;
        const cfg = network.config as Record<string, unknown>;
        expect(cfg.displayName).toBe(`${cfg.firstName} ${cfg.lastName}`);
        expect(cfg.baseRole).toBe('Network Engineer');
    });
});
