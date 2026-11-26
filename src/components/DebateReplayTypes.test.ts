import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimelinePlayer, type TimelineEvent } from './DebateReplayTypes';

const events: TimelineEvent[] = [0, 1, 2].map((sequence) => ({
    sequence,
    event: `step-${sequence}`,
    data: null,
    timestamp: sequence,
    checksum: `c-${sequence}`,
}));

afterEach(() => {
    vi.useRealTimers();
});

describe('TimelinePlayer.stepBackward', () => {
    it('не продолжает автоматически проигрывание после шага назад', () => {
        vi.useFakeTimers();
        const player = new TimelinePlayer();
        const indexes: number[] = [];
        const statuses: string[] = [];
        player.onEvent((_event, index) => indexes.push(index));
        player.onStatusChange((status) => statuses.push(status));
        player.load(events);
        player.setStepMode('auto');
        player.play();
        vi.advanceTimersByTime(1000);
        expect(indexes.at(-1)).toBe(1);

        player.stepBackward();
        expect(indexes.at(-1)).toBe(0);
        expect(statuses.at(-1)).toBe('paused');

        vi.advanceTimersByTime(2000);
        expect(indexes.at(-1)).toBe(0);
        player.destroy();
    });
});
