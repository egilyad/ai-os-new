import { describe, it, expect } from 'vitest';
import { resolveAgentIdentity } from './agent-identity';
import type { IAgentResolver, ResolvedAgent } from '../contracts/conversation/agent-resolver';
import type { ILensEngineService } from '../contracts/lens-engine';

const avatarGenerate = (id: string) => ({ emoji: '#', color: id });

describe('resolveAgentIdentity', () => {
    it('handles a legacy agent with only id/name/role/model (backward compat)', () => {
        const resolver: IAgentResolver = {
            resolveAgent: (id) =>
                ({
                    id,
                    name: 'Critic Bot',
                    role: 'Critical Auditor',
                    model: 'llama-3.3-70b-versatile',
                }) as ResolvedAgent,
        };
        const v = resolveAgentIdentity('a1', { resolver, avatarGenerate });
        expect(v.displayName).toBe('Critic Bot');
        expect(v.baseRole).toBe('Critical Auditor');
        expect(v.specializations).toEqual([]);
        expect(v.lensNames).toEqual([]);
        expect(v.model).toBe('llama-3.3-70b-versatile');
        expect(v.avatar.emoji).toBe('#');
    });

    it('exposes enriched identity (name split, baseRole, specialization, lens, provider, avatar)', () => {
        const lensEngine = {
            getLens: (id: string) => (id === 'lens:risk' ? { name: 'Risk' } : undefined),
        } as unknown as Pick<ILensEngineService, 'getLens'>;
        const resolver: IAgentResolver = {
            resolveAgent: (id) => ({
                id,
                name: 'Alex Petrov',
                role: 'Critical Auditor',
                displayName: 'Alex Petrov',
                firstName: 'Alex',
                lastName: 'Petrov',
                baseRole: 'Critical Auditor',
                specializations: ['Chemistry'],
                lensIds: ['lens:risk'],
                provider: 'groq',
                model: 'llama-3.3-70b-versatile',
                avatar: { emoji: '🧪', color: '#0f0' },
            }),
        };
        const v = resolveAgentIdentity('a2', { resolver, lensEngine, avatarGenerate });
        expect(v.firstName).toBe('Alex');
        expect(v.lastName).toBe('Petrov');
        expect(v.specializations).toEqual(['Chemistry']);
        expect(v.lensNames).toEqual(['Risk']);
        expect(v.provider).toBe('groq');
        expect(v.providerName).toBe('Groq');
        expect(v.avatar).toEqual({ emoji: '🧪', color: '#0f0' });
    });

    it('prefers an avatar URL override', () => {
        const resolver: IAgentResolver = {
            resolveAgent: (id) => ({
                id,
                name: 'X',
                role: 'Y',
                avatar: { url: 'http://img/x.png', emoji: '🤖', color: '#fff' },
            }),
        };
        const v = resolveAgentIdentity('a3', { resolver, avatarGenerate });
        expect(v.avatar.url).toBe('http://img/x.png');
    });

    it('degrades gracefully for an unknown id', () => {
        const resolver: IAgentResolver = { resolveAgent: () => null };
        const v = resolveAgentIdentity('ghost', { resolver, avatarGenerate });
        expect(v.displayName).toBe('Unknown Agent');
        expect(v.baseRole).toBe('');
        expect(v.avatar.emoji).toBe('#');
    });

    it('never throws when the resolver throws', () => {
        const resolver: IAgentResolver = {
            resolveAgent: () => {
                throw new Error('boom');
            },
        };
        const v = resolveAgentIdentity('x', { resolver, avatarGenerate });
        expect(v.displayName).toBe('Unknown Agent');
    });
});
