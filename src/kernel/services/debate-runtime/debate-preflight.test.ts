import { describe, it, expect } from 'vitest';
import { checkDebatePreflight } from './debate-preflight';

function depsWithProviders(providers: string[]) {
    return {
        keyService: {
            getActiveKeys: () => providers.map((provider, i) => ({ id: `k${i}`, provider })),
        },
    } as never;
}

const twoParticipants = [{ id: 'a' }, { id: 'b' }] as never[];

describe('checkDebatePreflight provider matching', () => {
    it('accepts display-case provider ids (keyService matches case-insensitively)', () => {
        expect(() =>
            checkDebatePreflight(depsWithProviders(['OpenRouter']), twoParticipants),
        ).not.toThrow();
    });

    it('still rejects when no debate-capable provider is active', () => {
        expect(() => checkDebatePreflight(depsWithProviders(['acme']), twoParticipants)).toThrow(
            /debate-capable/,
        );
    });
});
