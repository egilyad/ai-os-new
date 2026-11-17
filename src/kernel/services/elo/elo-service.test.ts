import { describe, it, expect, beforeEach } from 'vitest';
import { EloRatingService } from './elo-service';

beforeEach(() => {
    localStorage.clear();
});

describe('EloRatingService profile creation (contract)', () => {
    it('creates a profile with defaults', () => {
        const elo = new EloRatingService();
        const p = elo.getOrCreateProfile('a');
        expect(p.rating).toBe(1200);
        expect(p.gamesPlayed).toBe(0);
        expect(p.peakRating).toBe(1200);
        expect(p.agentName).toBe('a');
    });

    it('uses provided name and keeps the existing name when known', () => {
        const elo = new EloRatingService();
        elo.getOrCreateProfile('a', 'Agent A');
        expect(elo.getOrCreateProfile('a').agentName).toBe('Agent A');
        elo.getOrCreateProfile('a', 'Renamed');
        expect(elo.getOrCreateProfile('a').agentName).toBe('Renamed');
    });

    it('getRating creates profile on demand', () => {
        const elo = new EloRatingService();
        expect(elo.getRating('x')).toBe(1200);
        expect(elo.getProfile('x')?.gamesPlayed).toBe(0);
    });
});

describe('EloRatingService updateRatings (contract)', () => {
    it('win gives the winner +16 and loser -16 at equal ratings', () => {
        const elo = new EloRatingService();
        const { winnerChange, loserChange } = elo.updateRatings('a', 'b', 'win');
        expect(winnerChange).toBe(16);
        expect(loserChange).toBe(-16);
        expect(elo.getRating('a')).toBe(1216);
        expect(elo.getRating('b')).toBe(1184);
        expect(elo.getProfile('a')!.wins).toBe(1);
        expect(elo.getProfile('b')!.losses).toBe(1);
    });

    it('draw yields zero change at equal ratings and increments both', () => {
        const elo = new EloRatingService();
        const { winnerChange, loserChange } = elo.updateRatings('a', 'b', 'draw');
        expect(winnerChange).toBe(0);
        expect(loserChange).toBe(0);
        expect(elo.getProfile('a')!.draws).toBe(1);
        expect(elo.getProfile('b')!.draws).toBe(1);
    });

    it('loss flips the outcome: winnerId loses, loserId wins', () => {
        const elo = new EloRatingService();
        elo.updateRatings('a', 'b', 'loss');
        expect(elo.getRating('a')).toBe(1184);
        expect(elo.getRating('b')).toBe(1216);
        expect(elo.getProfile('a')!.losses).toBe(1);
        expect(elo.getProfile('b')!.wins).toBe(1);
    });

    it('uses min K factor after gamesForMinK games', () => {
        const elo = new EloRatingService({ gamesForMinK: 3, minKFactor: 16 });
        for (let i = 0; i < 3; i++) {
            elo.updateRatings('a', 'b', 'win');
        }
        expect(elo.getProfile('a')!.gamesPlayed).toBe(3);
        const { expectedWinProbA } = elo.compare('a', 'b');
        const { winnerChange } = elo.updateRatings('a', 'b', 'win');
        expect(winnerChange).toBe(Math.round(16 * (1 - expectedWinProbA)));
    });

    it('throws on unknown result', () => {
        const elo = new EloRatingService();
        expect(() => elo.updateRatings('a', 'b', 'bogus' as never)).toThrow(/unknown result/);
    });

    it('tracks peak rating', () => {
        const elo = new EloRatingService();
        for (let i = 0; i < 20; i++) {
            elo.updateRatings('strong', 'weak', 'win');
        }
        expect(elo.getProfile('strong')!.peakRating).toBeGreaterThan(1200);
    });
});

describe('EloRatingService history (contract)', () => {
    it('records history entries with opponent and result', () => {
        const elo = new EloRatingService();
        elo.updateRatings('a', 'b', 'win');
        const hA = elo.getHistory('a');
        const hB = elo.getHistory('b');
        expect(hA).toHaveLength(1);
        expect(hA[0]!.result).toBe('win');
        expect(hA[0]!.opponent).toBe('b');
        expect(hA[0]!.change).toBe(16);
        expect(hB[0]!.result).toBe('loss');
        expect(hB[0]!.opponent).toBe('a');
    });

    it('head-to-head counts wins and draws', () => {
        const elo = new EloRatingService();
        elo.updateRatings('a', 'b', 'win');
        elo.updateRatings('a', 'b', 'win');
        elo.updateRatings('a', 'b', 'draw');
        expect(elo.getHeadToHead('a', 'b')).toEqual({ winsA: 2, winsB: 0, draws: 1 });
    });
});

describe('EloRatingService leaderboard (contract)', () => {
    it('sorts by rating descending and respects limit', () => {
        const elo = new EloRatingService();
        elo.updateRatings('a', 'b', 'win');
        const top = elo.getLeaderboard(1);
        expect(top).toHaveLength(1);
        expect(top[0]!.agentId).toBe('a');
        expect(top[0]!.elo).toBe(1216);
    });

    it('compare exposes expected win probability for equal ratings', () => {
        const elo = new EloRatingService();
        const cmp = elo.compare('a', 'b');
        expect(cmp.ratingDiff).toBe(0);
        expect(cmp.expectedWinProbA).toBeCloseTo(0.5, 6);
        expect(cmp.gamesA).toBe(0);
    });
});

describe('EloRatingService reset and destroy (contract)', () => {
    it('reset clears profiles and storage', async () => {
        const elo = new EloRatingService();
        elo.updateRatings('a', 'b', 'win');
        await elo.reset();
        expect(elo.getProfile('a')).toBeUndefined();
        expect(localStorage.getItem('elo-ratings:profiles')).toBe('[]');
    });

    it('destroy clears in-memory profiles; init restores persisted state', async () => {
        const elo = new EloRatingService();
        elo.updateRatings('a', 'b', 'win');
        elo.destroy();
        expect(elo.getProfile('a')).toBeUndefined();
        await elo.init();
        expect(elo.getProfile('a')?.rating).toBe(1216);
        expect(elo.getProfile('a')?.gamesPlayed).toBe(1);
    });
});
