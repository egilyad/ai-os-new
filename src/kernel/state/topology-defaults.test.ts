import { describe, it, expect } from 'vitest';
import { AuditorTopology } from './topology-defaults';
import { AGENT_PROFILES } from './agent-profiles';

describe('AuditorTopology agent identity', () => {
    const agentNodes = AuditorTopology.nodes.filter((n) => n.type === 'agent');

    it('has 58 specialized agents', () => {
        expect(agentNodes.length).toBe(58);
    });

    it('every profiled agent carries a complete curated identity', () => {
        for (const node of agentNodes) {
            // The 8 legacy `-ru` variants predate curated profiles and reuse
            // their base profile (e.g. agent-analyst-ru → agent-analyst);
            // everything else must match its profile exactly.
            const baseId = node.id.endsWith('-ru') ? node.id.slice(0, -3) : node.id;
            const profile = AGENT_PROFILES[node.id] ?? AGENT_PROFILES[baseId];
            expect(profile, `missing profile for ${node.id}`).toBeDefined();
            const cfg = node.config as Record<string, unknown>;
            if (AGENT_PROFILES[node.id]) {
                expect(cfg.displayName, `${node.id} displayName`).toBe(profile!.displayName);
                expect(cfg.firstName, `${node.id} firstName`).toBe(profile!.firstName);
                expect(cfg.lastName, `${node.id} lastName`).toBe(profile!.lastName);
                expect(cfg.baseRole, `${node.id} baseRole`).toBe(profile!.baseRole);
                expect(
                    (cfg.specializations as unknown[]).length,
                    `${node.id} specializations`,
                ).toBeGreaterThan(0);
                expect(cfg.provider, `${node.id} provider`).toBe(profile!.provider);
                expect(cfg.model, `${node.id} model`).toBe(profile!.model);
            }
            expect(cfg.displayName, `${node.id} displayName`).toBeTruthy();
            expect(Array.isArray(cfg.specializations), `${node.id} specializations`).toBe(true);
            expect(Array.isArray(cfg.lensIds), `${node.id} lensIds`).toBe(true);
            const avatar = cfg.avatar as { emoji?: string; color?: string };
            expect(avatar?.emoji, `${node.id} avatar.emoji`).toBeTruthy();
            expect(avatar?.color, `${node.id} avatar.color`).toBeTruthy();
        }
    });

    it('displayName combines first and last name', () => {
        const network = agentNodes.find((n) => n.id === 'agent-network')!;
        const cfg = network.config as Record<string, unknown>;
        expect(cfg.displayName).toBe(`${cfg.firstName} ${cfg.lastName}`);
        expect(cfg.baseRole).toBe('Network Engineer');
    });
});
