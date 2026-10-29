import { describe, it, expect } from 'vitest';
import { CheckpointedStateMachine } from './checkpoint-state-machine';
import type { CheckpointStore, StateMachineConfig } from './checkpoint-state-machine';

function memoryStore(initial?: unknown): CheckpointStore {
    let value: unknown = initial;
    return {
        load: async () => value,
        save: async (state) => {
            value = state;
        },
    };
}

const CONFIG: StateMachineConfig<'pending' | 'running' | 'done'> = {
    states: ['pending', 'running', 'done'],
    transitions: [
        { from: 'pending', to: 'running', on: 'start' },
        { from: 'running', to: 'done', on: 'finish' },
    ],
};

describe('CheckpointedStateMachine (P3-3)', () => {
    it('starts at the initial state and transitions', async () => {
        const m = new CheckpointedStateMachine(CONFIG, 'pending', memoryStore());
        await m.init();
        expect(m.state).toBe('pending');
        expect(m.can('start')).toBe(true);
        await m.transition('start');
        expect(m.state).toBe('running');
        await m.transition('finish');
        expect(m.state).toBe('done');
    });

    it('rejects invalid transitions', async () => {
        const m = new CheckpointedStateMachine(CONFIG, 'pending', memoryStore());
        await m.init();
        await expect(m.transition('finish')).rejects.toThrow(/Invalid transition/);
    });

    it('resumes from a persisted checkpoint', async () => {
        const store = memoryStore('running');
        const m = new CheckpointedStateMachine(CONFIG, 'pending', store);
        await m.init();
        expect(m.state).toBe('running');
    });

    it('ignores a corrupt checkpoint and uses initial state', async () => {
        const store = memoryStore(42);
        const m = new CheckpointedStateMachine(CONFIG, 'pending', store);
        await m.init();
        expect(m.state).toBe('pending');
    });
});
