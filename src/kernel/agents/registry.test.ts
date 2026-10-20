import { describe, expect, it } from 'vitest';
import { AGENT_REGISTRY } from './registry';

const HARNESS_AGENT_IDS = [
    'agent-opencode',
    'agent-hermes',
    'agent-deepseek-harness',
    'agent-openclaw',
];

describe('AGENT_REGISTRY', () => {
    it('registers the harness agents ported from the reference frameworks', () => {
        for (const id of HARNESS_AGENT_IDS) {
            expect(AGENT_REGISTRY[id], id).toBeDefined();
        }
    });

    it('every harness agent carries a complete canonical identity', () => {
        for (const id of HARNESS_AGENT_IDS) {
            const def = AGENT_REGISTRY[id]!;
            expect(def.metadata.id).toBe(id);
            expect(def.metadata.name.length).toBeGreaterThan(0);
            expect(def.metadata.role.length).toBeGreaterThan(0);
            expect(def.metadata.description.length).toBeGreaterThan(0);
            expect(def.metadata.firstName?.length).toBeGreaterThan(0);
            expect(def.metadata.lastName?.length).toBeGreaterThan(0);
            expect(def.metadata.displayName).toBe(
                `${def.metadata.firstName} ${def.metadata.lastName}`,
            );
            expect(def.metadata.baseRole?.length).toBeGreaterThan(0);
            expect(def.metadata.avatar?.emoji).toBeTruthy();
            expect(def.metadata.avatar?.color).toBeTruthy();
            expect(def.metadata.specializations?.length).toBeGreaterThan(0);
            expect(def.persona.length).toBeGreaterThan(0);
        }
    });

    it('mirrors the identity into the node config', () => {
        for (const id of HARNESS_AGENT_IDS) {
            const def = AGENT_REGISTRY[id]!;
            const config = def.config!;
            expect(config.displayName).toBe(def.metadata.displayName);
            expect(config.baseRole).toBe(def.metadata.baseRole);
            expect(config.provider).toBe(def.metadata.provider);
            expect(config.model).toBe(def.metadata.model);
            expect(config.prompt).toBe(def.persona);
            // The orchestrator reads config.systemPrompt, the chat resolver reads
            // config.prompt — both must be filled for the agent to be usable.
            expect(config.systemPrompt).toBe(def.persona);
        }
    });

    it('every harness agent declares a permission mode and a tool profile', () => {
        for (const id of HARNESS_AGENT_IDS) {
            const config = AGENT_REGISTRY[id]!.config!;
            expect(typeof config.permissionMode).toBe('string');
            expect(typeof config.toolProfile).toBe('string');
            expect(Array.isArray(config.tools)).toBe(true);
            expect((config.tools as string[]).length).toBeGreaterThan(0);
        }
    });

    it('every registry id is unique and keys the map', () => {
        const ids = Object.values(AGENT_REGISTRY).map((d) => d.metadata.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) {
            expect(AGENT_REGISTRY[id]).toBeDefined();
        }
    });
});
