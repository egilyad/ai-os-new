import type { ILifecycle } from '../contracts/lifecycle';
import type { IEventBus } from '../types/interfaces';
import { BucketStorageAdapter } from './storage-adapter';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import type {
    IContributionService,
    ContributionGraph,
    ContributionDay,
} from '../contracts/contribution';

const STORAGE_KEY = 'contribution_service_data';
const LOGGER = rootLogger.child('ContributionService');

interface PersistedData {
    days: Record<string, number>;
}

export interface ContributionServiceDeps {
    eventBus: IEventBus;
}

export class ContributionService implements IContributionService, ILifecycle {
    private deps: ContributionServiceDeps;
    private days: Record<string, number> = {};
    private unsubs: Array<() => void> = [];
    private persistTimer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;
    private _initialized = false;

    constructor(deps: ContributionServiceDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const saved = await BucketStorageAdapter.UI.get<PersistedData>(STORAGE_KEY);
            if (saved?.days) this.days = saved.days;
        } catch (e) {
            LOGGER.warn('init', 'Failed to load persisted data', { error: String(e) });
        }

        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.STREAM_END, (_payload: unknown) => {
                const p = _payload as { status?: string };
                if (!p || p.status === 'done' || !p.status) {
                    this.recordContribution();
                }
            }),
            this.deps.eventBus.on(EVENTS.DEBATE_AGENT_RESPONDED, () => {
                this.recordContribution();
            }),
            this.deps.eventBus.on(EVENTS.KEY_HEALTH_CHECK_COMPLETED, () => {
                this.recordContribution();
            }),
        );
    }

    destroy(): void {
        this._initialized = false;
        this.destroyed = true;
        this.unsubs.forEach((fn) => fn());
        this.unsubs = [];
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
        BucketStorageAdapter.UI.set(STORAGE_KEY, { days: this.days }).catch((e: unknown) => {
            LOGGER.warn('ContributionService', 'Persist during destroy failed', { error: e });
        });
    }

    private recordContribution(): void {
        const today = new Date().toLocaleDateString('en-CA');
        this.days[today] = (this.days[today] || 0) + 1;
        this.schedulePersist();
    }

    private schedulePersist(): void {
        if (this.persistTimer) clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => {
            if (!this.destroyed) {
                BucketStorageAdapter.UI.set(STORAGE_KEY, { days: this.days }).catch(
                    (e: unknown) => {
                        LOGGER.warn('ContributionService', 'Persist during timer failed', {
                            error: e,
                        });
                    },
                );
            }
        }, 2000);
    }

    getGraph(): ContributionGraph {
        const now = new Date();
        const weeks: { days: ContributionDay[] }[] = [];
        let totalContributions = 0;

        for (let w = 0; w < 52; w++) {
            const days: ContributionDay[] = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(now);
                date.setDate(date.getDate() - (52 * 7 - w * 7 - d));
                const dateStr = date.toLocaleDateString('en-CA');
                const count = this.days[dateStr] || 0;
                totalContributions += count;
                let level: ContributionDay['level'] = 0;
                if (count > 8) level = 4;
                else if (count > 5) level = 3;
                else if (count > 3) level = 2;
                else if (count > 0) level = 1;
                days.push({ date: dateStr, count, level });
            }
            weeks.push({ days });
        }

        const streaks = this.computeStreaks();

        return {
            weeks,
            totalContributions,
            currentStreak: streaks.current,
            longestStreak: streaks.longest,
        };
    }

    getContributionsByDateRange(start: string, end: string): ContributionDay[] {
        const result: ContributionDay[] = [];
        const s = new Date(start);
        const e = new Date(end);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            const ds = d.toLocaleDateString('en-CA');
            const count = this.days[ds] || 0;
            let level: ContributionDay['level'] = 0;
            if (count > 8) level = 4;
            else if (count > 5) level = 3;
            else if (count > 3) level = 2;
            else if (count > 0) level = 1;
            result.push({ date: ds, count, level });
        }
        return result;
    }

    getStreak(): { current: number; longest: number } {
        return this.computeStreaks();
    }

    private computeStreaks(): { current: number; longest: number } {
        const activeDays = Object.keys(this.days)
            .filter((d) => this.days[d]! > 0)
            .sort()
            .reverse();

        if (activeDays.length === 0) return { current: 0, longest: 0 };

        let currentStreak = 0;
        const today = new Date().toLocaleDateString('en-CA');
        const checkDate = new Date(today);

        for (let i = 0; i < 365; i++) {
            const ds = checkDate.toLocaleDateString('en-CA');
            if (this.days[ds] && this.days[ds] > 0) {
                currentStreak++;
            } else if (i > 0) {
                break;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }

        let longestStreak = 0;
        let streak = 0;
        const asc = [...activeDays].reverse();
        for (let i = 0; i < asc.length; i++) {
            if (i === 0) {
                streak = 1;
            } else {
                const prev = new Date(asc[i - 1]!);
                const curr = new Date(asc[i]!);
                const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
                if (Math.abs(diffDays - 1) < 0.01) {
                    streak++;
                } else {
                    longestStreak = Math.max(longestStreak, streak);
                    streak = 1;
                }
            }
        }
        longestStreak = Math.max(longestStreak, streak);

        return { current: currentStreak, longest: longestStreak };
    }
}
