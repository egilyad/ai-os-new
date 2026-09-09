/**
 * ELO Rating System for Debate Agents
 * Persistent rating with K-factor and historical tracking
 */

import { rootLogger } from '../logger-service';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import type { ILocalStorageAdapter } from '../../contracts/storage-adapter';
import { LocalStorageAdapter } from '../storage/local-storage-adapter';
import { safeJsonParse } from '../../../kernel/utils/safe-json';

const LOGGER = rootLogger.child('EloRating');

export interface AgentEloProfile {
    agentId: string;
    agentName: string;
    rating: number; // Default: 1200
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    lastGame?: number;
    peakRating: number;
    ratingHistory: EloHistoryEntry[];
}

export interface EloHistoryEntry {
    timestamp: number;
    rating: number;
    change: number;
    opponent?: string;
    result?: 'win' | 'loss' | 'draw';
}

export interface AgentElo {
    agentId: string;
    agentName: string;
    elo: number;
    wins: number;
    losses: number;
    draws: number;
    matches: number;
    history: Array<{
        timestamp: number;
        elo: number;
        change: number;
        opponent?: string;
        result?: DebateResult;
    }>;
}

export interface EloConfig {
    initialRating: number; // Default: 1200
    kFactor: number; // Default: 32
    minKFactor: number; // For experienced players
    gamesForMinK: number; // After N games, use minK
    ratingFloor: number; // Default: 100
    ratingCeiling: number; // Default: 3000
}

const DEFAULT_ELO_CONFIG: EloConfig = {
    initialRating: 1200,
    kFactor: 32,
    minKFactor: 16,
    gamesForMinK: 100,
    ratingFloor: 100,
    ratingCeiling: 3000,
};

export type DebateResult = 'win' | 'loss' | 'draw';

const MAX_PROFILES = 500;

export class EloRatingService {
    private profiles: Map<string, AgentEloProfile> = new Map();
    private storage: ILocalStorageAdapter;
    private config: EloConfig;
    private _initialized = false;
    private readonly _eventBus: IEventBus | null;

    constructor(config: Partial<EloConfig> = {}, eventBus?: IEventBus) {
        this.storage = new LocalStorageAdapter();
        this.config = { ...DEFAULT_ELO_CONFIG, ...config };
        this._eventBus = eventBus ?? null;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        const saved = this.storage.getItem('elo-ratings:profiles');
        if (saved) {
            try {
                const parsed = safeJsonParse(saved) as AgentEloProfile[];
                for (const profile of parsed) {
                    this.profiles.set(profile.agentId, profile);
                }
            } catch (e) {
                LOGGER.error(
                    'EloRating',
                    'Failed to parse stored profiles',
                    e as Record<string, unknown>,
                );
            }
        }
        LOGGER.info('EloRating', `Initialized with ${this.profiles.size} agent profiles`);
    }

    getOrCreateProfile(agentId: string, agentName?: string): AgentEloProfile {
        let profile = this.profiles.get(agentId);

        if (!profile) {
            profile = {
                agentId,
                agentName: agentName || agentId,
                rating: this.config.initialRating,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                peakRating: this.config.initialRating,
                ratingHistory: [],
            };
            this.profiles.set(agentId, profile);
            if (this.profiles.size > MAX_PROFILES) {
                const oldest = this.profiles.keys().next().value;
                if (oldest !== undefined) this.profiles.delete(oldest);
            }
        } else if (agentName && profile.agentName !== agentName) {
            profile.agentName = agentName;
        }

        return profile;
    }

    getRating(agentId: string): number {
        return this.getOrCreateProfile(agentId).rating;
    }

    getProfile(agentId: string): AgentEloProfile | undefined {
        return this.profiles.get(agentId);
    }

    updateRatings(
        winnerId: string,
        loserId: string,
        result: DebateResult = 'win',
    ): { winnerChange: number; loserChange: number } {
        const winner = this.getOrCreateProfile(winnerId);
        const loser = this.getOrCreateProfile(loserId);

        const winnerExpected = this.expectedScore(winner.rating, loser.rating);
        const loserExpected = this.expectedScore(loser.rating, winner.rating);

        let winnerActual: number;
        let loserActual: number;

        switch (result) {
            case 'win':
                winnerActual = 1;
                loserActual = 0;
                break;
            case 'loss':
                winnerActual = 0;
                loserActual = 1;
                break;
            case 'draw':
                winnerActual = 0.5;
                loserActual = 0.5;
                break;
        }

        const winnerK = this.getKFactor(winner.gamesPlayed);
        const loserK = this.getKFactor(loser.gamesPlayed);

        const winnerChange = Math.round(winnerK * (winnerActual - winnerExpected));
        const loserChange = Math.round(loserK * (loserActual - loserExpected));

        winner.rating = this.clampRating(winner.rating + winnerChange);
        loser.rating = this.clampRating(loser.rating + loserChange);

        winner.gamesPlayed++;
        loser.gamesPlayed++;

        if (result === 'win') {
            winner.wins++;
            loser.losses++;
        } else if (result === 'loss') {
            winner.losses++;
            loser.wins++;
        } else {
            winner.draws++;
            loser.draws++;
        }

        if (winner.rating > winner.peakRating) winner.peakRating = winner.rating;
        if (loser.rating > loser.peakRating) loser.peakRating = loser.rating;

        const now = Date.now();
        winner.ratingHistory.push({
            timestamp: now,
            rating: winner.rating,
            change: winnerChange,
            opponent: loserId,
            result,
        });
        loser.ratingHistory.push({
            timestamp: now,
            rating: loser.rating,
            change: loserChange,
            opponent: winnerId,
            result: result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw',
        });

        if (winner.ratingHistory.length > 1000)
            winner.ratingHistory = winner.ratingHistory.slice(-500);
        if (loser.ratingHistory.length > 1000)
            loser.ratingHistory = loser.ratingHistory.slice(-500);

        winner.lastGame = now;
        loser.lastGame = now;

        this.save();

        this._eventBus?.emit(EVENTS.ELO_RATING_UPDATED, {
            agentId: winnerId,
            newRating: winner.rating,
            change: winnerChange,
        });
        this._eventBus?.emit(EVENTS.ELO_RATING_UPDATED, {
            agentId: loserId,
            newRating: loser.rating,
            change: loserChange,
        });

        LOGGER.info('EloRating', 'Ratings updated', {
            winner: { id: winnerId, rating: winner.rating, change: winnerChange },
            loser: { id: loserId, rating: loser.rating, change: loserChange },
        });

        return { winnerChange, loserChange };
    }

    private expectedScore(ratingA: number, ratingB: number): number {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }

    private getKFactor(gamesPlayed: number): number {
        if (gamesPlayed >= this.config.gamesForMinK) {
            return this.config.minKFactor;
        }
        return this.config.kFactor;
    }

    private clampRating(rating: number): number {
        return Math.max(this.config.ratingFloor, Math.min(this.config.ratingCeiling, rating));
    }

    getLeaderboard(limit = 10): AgentElo[] {
        return Array.from(this.profiles.values())
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
            .map((profile) => this.toAgentElo(profile));
    }

    getHistory(agentId: string): AgentElo['history'] {
        const profile = this.profiles.get(agentId);
        return profile ? this.toAgentElo(profile).history : [];
    }

    private toAgentElo(profile: AgentEloProfile): AgentElo {
        return {
            agentId: profile.agentId,
            agentName: profile.agentName,
            elo: profile.rating,
            wins: profile.wins,
            losses: profile.losses,
            draws: profile.draws,
            matches: profile.gamesPlayed,
            history: profile.ratingHistory.map((entry) => ({
                timestamp: entry.timestamp,
                elo: entry.rating,
                change: entry.change,
                opponent: entry.opponent,
                result: entry.result,
            })),
        };
    }

    getRecentChanges(
        limit = 20,
    ): Array<{ agentId: string; agentName: string; change: number; timestamp: number }> {
        const changes: Array<{
            agentId: string;
            agentName: string;
            change: number;
            timestamp: number;
        }> = [];

        for (const profile of this.profiles.values()) {
            for (const entry of profile.ratingHistory.slice(-5)) {
                changes.push({
                    agentId: profile.agentId,
                    agentName: profile.agentName,
                    change: entry.change,
                    timestamp: entry.timestamp,
                });
            }
        }

        return changes.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }

    getRatingTrajectory(agentId: string): { timestamp: number; rating: number }[] {
        const profile = this.profiles.get(agentId);
        if (!profile) return [];

        return profile.ratingHistory.map((entry) => ({
            timestamp: entry.timestamp,
            rating: entry.rating,
        }));
    }

    compare(
        agentIdA: string,
        agentIdB: string,
    ): {
        ratingDiff: number;
        expectedWinProbA: number;
        gamesA: number;
        gamesB: number;
        h2h?: { winsA: number; winsB: number; draws: number };
    } {
        const profileA = this.getOrCreateProfile(agentIdA);
        const profileB = this.getOrCreateProfile(agentIdB);

        const h2h = this.getHeadToHead(agentIdA, agentIdB);

        return {
            ratingDiff: profileA.rating - profileB.rating,
            expectedWinProbA: this.expectedScore(profileA.rating, profileB.rating),
            gamesA: profileA.gamesPlayed,
            gamesB: profileB.gamesPlayed,
            h2h,
        };
    }

    getHeadToHead(
        agentIdA: string,
        agentIdB: string,
    ): { winsA: number; winsB: number; draws: number } {
        const profileA = this.profiles.get(agentIdA);
        if (!profileA) return { winsA: 0, winsB: 0, draws: 0 };

        let winsA = 0;
        let winsB = 0;
        let draws = 0;

        for (const entry of profileA.ratingHistory) {
            if (entry.opponent === agentIdB) {
                if (entry.result === 'win') winsA++;
                else if (entry.result === 'loss') winsB++;
                else draws++;
            }
        }

        return { winsA, winsB, draws };
    }

    async reset(): Promise<void> {
        this.profiles.clear();
        this.save();
        LOGGER.info('EloRating', 'All ratings reset');
    }

    destroy(): void {
        this._initialized = false;
        this.profiles.clear();
    }

    private save(): void {
        this.storage.setItem(
            'elo-ratings:profiles',
            JSON.stringify(Array.from(this.profiles.values())),
        );
    }
}
