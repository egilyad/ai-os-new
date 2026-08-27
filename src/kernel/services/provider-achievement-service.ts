import { rootLogger } from './logger-service';
import type {
    ProviderAchievement,
    AchievementProgress,
    IProviderAchievementService,
} from '../contracts/provider-achievements';
import type { IDatabaseService } from '../types/interfaces';

const LOGGER = rootLogger.child('ProviderAchievement');

function defs(): ProviderAchievement[] {
    const all: ProviderAchievement[] = [];
    let id = 0;
    const nid = () => `pa-${++id}`;

    // ── GROQ (Sprinter — Speed) ──────────────────────────────────
    const g = (
        title: string,
        desc: string,
        icon: string,
        category: ProviderAchievement['category'],
        tier: ProviderAchievement['tier'],
        condition: (s: Record<string, number>) => boolean,
        progress?: (s: Record<string, number>) => { current: number; target: number },
    ) => {
        all.push({
            id: nid(),
            provider: 'groq',
            title,
            description: desc,
            icon,
            category,
            tier,
            condition,
            progress,
        });
    };
    g(
        'First Light',
        'First successful Groq request',
        'zap',
        'speed',
        'bronze',
        (s) => (s.requests ?? 0) >= 1,
        (s) => ({ current: Math.min(1, s.requests ?? 0), target: 1 }),
    );
    g(
        'Speed Demon',
        '50 requests with Groq',
        'zap',
        'speed',
        'bronze',
        (s) => (s.requests ?? 0) >= 50,
        (s) => ({ current: Math.min(50, s.requests ?? 0), target: 50 }),
    );
    g(
        'Blazing Fast',
        'Sub-100ms TTFT on Groq',
        'zap',
        'speed',
        'silver',
        (s) => (s.fastResponses ?? 0) >= 1,
        (s) => ({ current: Math.min(1, s.fastResponses ?? 0), target: 1 }),
    );
    g(
        'Speed Runner',
        '10 sub-100ms responses',
        'zap',
        'speed',
        'silver',
        (s) => (s.fastResponses ?? 0) >= 10,
        (s) => ({ current: Math.min(10, s.fastResponses ?? 0), target: 10 }),
    );
    g(
        'Need for Speed',
        '500 total Groq requests',
        'zap',
        'speed',
        'gold',
        (s) => (s.requests ?? 0) >= 500,
        (s) => ({ current: Math.min(500, s.requests ?? 0), target: 500 }),
    );
    g(
        'Sub-50 Club',
        'Response under 50ms',
        'zap',
        'speed',
        'gold',
        (s) => (s.sub50ms ?? 0) >= 1,
        (s) => ({ current: Math.min(1, s.sub50ms ?? 0), target: 1 }),
    );
    g(
        'Speed Streak',
        '5 requests under 150ms in a row',
        'zap',
        'speed',
        'silver',
        (s) => (s.speedStreak ?? 0) >= 5,
        (s) => ({ current: Math.min(5, s.speedStreak ?? 0), target: 5 }),
    );
    g(
        'Turbocharged',
        '1000 total Groq requests',
        'zap',
        'speed',
        'platinum',
        (s) => (s.requests ?? 0) >= 1000,
        (s) => ({ current: Math.min(1000, s.requests ?? 0), target: 1000 }),
    );
    g(
        'Concurrent Sprint',
        '5 concurrent Groq requests',
        'zap',
        'speed',
        'silver',
        (s) => (s.concurrentRequests ?? 0) >= 5,
        (s) => ({ current: Math.min(5, s.concurrentRequests ?? 0), target: 5 }),
    );
    g(
        'Peak Performance',
        'Reach 1000 TPM on Groq',
        'zap',
        'speed',
        'gold',
        (s) => (s.peakTPM ?? 0) >= 1000,
        (s) => ({ current: Math.min(1000, s.peakTPM ?? 0), target: 1000 }),
    );
    g(
        'Zero Latency',
        'Average TTFT under 80ms over 100 requests',
        'zap',
        'speed',
        'platinum',
        (s) => (s.avgTTFT ?? 999) <= 80 && (s.requests ?? 0) >= 100,
        (s) => ({ current: Math.min(100, s.requests ?? 0), target: 100 }),
    );
    g(
        'Speed Collector',
        'Use 3 different Groq models',
        'zap',
        'discovery',
        'bronze',
        (s) => (s.modelsUsed ?? 0) >= 3,
        (s) => ({ current: Math.min(3, s.modelsUsed ?? 0), target: 3 }),
    );
    g(
        'Groq Guru',
        'All Groq achievements unlocked',
        'zap',
        'mastery',
        'platinum',
        (s) => (s.groqAchievements ?? 0) >= 14,
        (s) => ({ current: Math.min(14, s.groqAchievements ?? 0), target: 14 }),
    );
    g(
        'First of Many',
        'Send first prompt using Groq',
        'zap',
        'discovery',
        'bronze',
        (s) => (s.requests ?? 0) >= 1,
        (s) => ({ current: Math.min(1, s.requests ?? 0), target: 1 }),
    );
    g(
        'Speed Veteran',
        'Groq used for 7 consecutive days',
        'zap',
        'mastery',
        'gold',
        (s) => (s.consecutiveDays ?? 0) >= 7,
        (s) => ({ current: Math.min(7, s.consecutiveDays ?? 0), target: 7 }),
    );

    // ── OPENROUTER (Phantom — Routing) ────────────────────────────
    const o = (
        title: string,
        desc: string,
        icon: string,
        category: ProviderAchievement['category'],
        tier: ProviderAchievement['tier'],
        condition: (s: Record<string, number>) => boolean,
        progress?: (s: Record<string, number>) => { current: number; target: number },
    ) => {
        all.push({
            id: nid(),
            provider: 'openrouter',
            title,
            description: desc,
            icon,
            category,
            tier,
            condition,
            progress,
        });
    };
    o(
        'First Route',
        'First successful OpenRouter request',
        'route',
        'routing',
        'bronze',
        (s) => (s.requests ?? 0) >= 1,
        (s) => ({ current: Math.min(1, s.requests ?? 0), target: 1 }),
    );
    o(
        'Pathfinder',
        'Route 100 requests via OpenRouter',
        'route',
        'routing',
        'bronze',
        (s) => (s.requests ?? 0) >= 100,
        (s) => ({ current: Math.min(100, s.requests ?? 0), target: 100 }),
    );
    o(
        'Model Hopper',
        'Use 5 different models via OpenRouter',
        'route',
        'discovery',
        'silver',
        (s) => (s.modelsUsed ?? 0) >= 5,
        (s) => ({ current: Math.min(5, s.modelsUsed ?? 0), target: 5 }),
    );
    o(
        'Fallback Master',
        'Automatic failover triggered 10 times',
        'route',
        'reliability',
        'silver',
        (s) => (s.failovers ?? 0) >= 10,
        (s) => ({ current: Math.min(10, s.failovers ?? 0), target: 10 }),
    );
    o(
        'Cost Saver',
        'Save $0.01 by choosing cheaper model',
        'route',
        'routing',
        'silver',
        (s) => (s.costSaved ?? 0) >= 0.01,
        (s) => ({ current: Math.min(0.01, s.costSaved ?? 0), target: 0.01 }),
    );
    o(
        'Smart Router',
        'Create 3 routing rules',
        'route',
        'routing',
        'gold',
        (s) => (s.routingRules ?? 0) >= 3,
        (s) => ({ current: Math.min(3, s.routingRules ?? 0), target: 3 }),
    );
    o(
        'Latency Optimizer',
        'Average latency under 500ms over 50 requests',
        'route',
        'routing',
        'gold',
        (s) => (s.avgLatency ?? 999) <= 500 && (s.requests ?? 0) >= 50,
        (s) => ({ current: Math.min(50, s.requests ?? 0), target: 50 }),
    );
    o(
        'Route Explorer',
        'Use 10 different models via OpenRouter',
        'route',
        'discovery',
        'gold',
        (s) => (s.modelsUsed ?? 0) >= 10,
        (s) => ({ current: Math.min(10, s.modelsUsed ?? 0), target: 10 }),
    );
    o(
        'Budget Watcher',
        'Set up 3 cost optimization rules',
        'route',
        'routing',
        'silver',
        (s) => (s.costRules ?? 0) >= 3,
        (s) => ({ current: Math.min(3, s.costRules ?? 0), target: 3 }),
    );
    o(
        'Failover Hero',
        'Successful failover 50 times',
        'route',
        'reliability',
        'gold',
        (s) => (s.failovers ?? 0) >= 50,
        (s) => ({ current: Math.min(50, s.failovers ?? 0), target: 50 }),
    );
    o(
        'Route Veteran',
        '1000 OpenRouter requests',
        'route',
        'routing',
        'platinum',
        (s) => (s.requests ?? 0) >= 1000,
        (s) => ({ current: Math.min(1000, s.requests ?? 0), target: 1000 }),
    );
    o(
        'A/B Tester',
        'Run 5 A/B tests with OpenRouter',
        'route',
        'discovery',
        'silver',
        (s) => (s.abTests ?? 0) >= 5,
        (s) => ({ current: Math.min(5, s.abTests ?? 0), target: 5 }),
    );
    o(
        'Phantom Fleet',
        'All 3 OpenRouter smart routes active',
        'route',
        'routing',
        'gold',
        (s) => (s.activeRoutes ?? 0) >= 3,
        (s) => ({ current: Math.min(3, s.activeRoutes ?? 0), target: 3 }),
    );
    o(
        'OpenRouter Guru',
        'All OpenRouter achievements unlocked',
        'route',
        'mastery',
        'platinum',
        (s) => (s.openrouterAchievements ?? 0) >= 14,
        (s) => ({ current: Math.min(14, s.openrouterAchievements ?? 0), target: 14 }),
    );
    o(
        'Cost Cutter',
        'Save $0.10 total via routing optimization',
        'route',
        'mastery',
        'platinum',
        (s) => (s.costSaved ?? 0) >= 0.1,
        (s) => ({ current: Math.min(0.1, s.costSaved ?? 0), target: 0.1 }),
    );

    // ── NVIDIA (Titan — Power) ────────────────────────────────────
    const n = (
        title: string,
        desc: string,
        icon: string,
        category: ProviderAchievement['category'],
        tier: ProviderAchievement['tier'],
        condition: (s: Record<string, number>) => boolean,
        progress?: (s: Record<string, number>) => { current: number; target: number },
    ) => {
        all.push({
            id: nid(),
            provider: 'nvidia',
            title,
            description: desc,
            icon,
            category,
            tier,
            condition,
            progress,
        });
    };
    n(
        'First Contact',
        'First successful NVIDIA request',
        'cpu',
        'power',
        'bronze',
        (s) => (s.requests ?? 0) >= 1,
        (s) => ({ current: Math.min(1, s.requests ?? 0), target: 1 }),
    );
    n(
        'GPU Powered',
        '100 NVIDIA requests',
        'cpu',
        'power',
        'bronze',
        (s) => (s.requests ?? 0) >= 100,
        (s) => ({ current: Math.min(100, s.requests ?? 0), target: 100 }),
    );
    n(
        'Big Iron',
        'Prompt with 10K+ tokens on NVIDIA',
        'cpu',
        'power',
        'silver',
        (s) => (s.largePrompts ?? 0) >= 1,
        (s) => ({ current: Math.min(1, s.largePrompts ?? 0), target: 1 }),
    );
    n(
        'Heavy Lifter',
        '10 large prompts (10K+ tokens)',
        'cpu',
        'power',
        'silver',
        (s) => (s.largePrompts ?? 0) >= 10,
        (s) => ({ current: Math.min(10, s.largePrompts ?? 0), target: 10 }),
    );
    n(
        'Enterprise Ready',
        'Enable 3 NVIDIA enterprise features',
        'cpu',
        'power',
        'gold',
        (s) => (s.enterpriseFeatures ?? 0) >= 3,
        (s) => ({ current: Math.min(3, s.enterpriseFeatures ?? 0), target: 3 }),
    );
    n(
        'Compliant',
        'All compliance checks passed',
        'cpu',
        'reliability',
        'silver',
        (s) => (s.compliancePassed ?? 0) >= 1,
        (s) => ({ current: Math.min(1, s.compliancePassed ?? 0), target: 1 }),
    );
    n(
        'NVIDIA Power User',
        '500 NVIDIA requests',
        'cpu',
        'power',
        'gold',
        (s) => (s.requests ?? 0) >= 500,
        (s) => ({ current: Math.min(500, s.requests ?? 0), target: 500 }),
    );
    n(
        'Global Reach',
        'Accessed NVIDIA from 3 regions',
        'cpu',
        'discovery',
        'gold',
        (s) => (s.regionsUsed ?? 0) >= 3,
        (s) => ({ current: Math.min(3, s.regionsUsed ?? 0), target: 3 }),
    );
    n(
        'SLA Champion',
        '99.9% uptime on NVIDIA',
        'cpu',
        'reliability',
        'platinum',
        (s) => (s.uptimePct ?? 0) >= 99.9,
        (s) => ({ current: Math.min(100, s.uptimePct ?? 0), target: 99.9 }),
    );
    n(
        'Cost Analyst',
        'Track 5 cost entries for NVIDIA',
        'cpu',
        'discovery',
        'silver',
        (s) => (s.costEntries ?? 0) >= 5,
        (s) => ({ current: Math.min(5, s.costEntries ?? 0), target: 5 }),
    );
    n(
        'Data Center',
        '1000 NVIDIA requests',
        'cpu',
        'power',
        'platinum',
        (s) => (s.requests ?? 0) >= 1000,
        (s) => ({ current: Math.min(1000, s.requests ?? 0), target: 1000 }),
    );
    n(
        'Model Collector',
        'Use 4 different NVIDIA models',
        'cpu',
        'discovery',
        'silver',
        (s) => (s.modelsUsed ?? 0) >= 4,
        (s) => ({ current: Math.min(4, s.modelsUsed ?? 0), target: 4 }),
    );
    n(
        "Titan's Core",
        'All NVIDIA enterprise features enabled',
        'cpu',
        'power',
        'gold',
        (s) => (s.enterpriseFeatures ?? 0) >= 6,
        (s) => ({ current: Math.min(6, s.enterpriseFeatures ?? 0), target: 6 }),
    );
    n(
        'NVIDIA Guru',
        'All NVIDIA achievements unlocked',
        'cpu',
        'mastery',
        'platinum',
        (s) => (s.nvidiaAchievements ?? 0) >= 14,
        (s) => ({ current: Math.min(14, s.nvidiaAchievements ?? 0), target: 14 }),
    );
    n(
        'Tensor Titan',
        'Send 100K tokens through NVIDIA in one day',
        'cpu',
        'mastery',
        'platinum',
        (s) => (s.dailyTokens ?? 0) >= 100000,
        (s) => ({ current: Math.min(100000, s.dailyTokens ?? 0), target: 100000 }),
    );

    return all;
}

const STORAGE_KEY = 'provider_achievements';

export class ProviderAchievementService implements IProviderAchievementService {
    private _all: ProviderAchievement[];
    private _awarded = new Set<string>();
    private _database: IDatabaseService | null = null;

    constructor(database?: IDatabaseService) {
        this._all = defs();
        this._database = database ?? null;
        this._load();
    }

    private async _load(): Promise<void> {
        if (!this._database) {
            LOGGER.warn('ProviderAchievement', 'No database injected — achievements not persisted');
            return;
        }
        try {
            const saved = await this._database.getKv<string[]>(STORAGE_KEY);
            if (saved) {
                saved.forEach((id: string) => this._awarded.add(id));
            }
        } catch {
            /* ignore */
        }
    }

    getAchievements(provider: string): ProviderAchievement[] {
        return this._all.filter((a) => a.provider === provider);
    }

    getAllAchievements(): ProviderAchievement[] {
        return [...this._all];
    }

    getProgress(provider: string, stats: Record<string, number>): AchievementProgress[] {
        return this.getAchievements(provider).map((a) => {
            const prog = a.progress?.(stats) ?? { current: a.condition(stats) ? 1 : 0, target: 1 };
            return {
                id: a.id,
                achieved: this._awarded.has(a.id) || a.condition(stats),
                current: prog.current,
                target: prog.target,
            };
        });
    }

    checkAndAward(provider: string, stats: Record<string, number>): string[] {
        const newAwards: string[] = [];
        for (const a of this.getAchievements(provider)) {
            if (!this._awarded.has(a.id) && a.condition(stats)) {
                this._awarded.add(a.id);
                newAwards.push(a.id);
            }
        }
        if (newAwards.length > 0) {
            this._persist();
        }
        return newAwards;
    }

    getAwardedIds(): string[] {
        return [...this._awarded];
    }

    reset(): void {
        this._awarded.clear();
        this._database
            ?.setKv(STORAGE_KEY, [])
            .catch((err) =>
                LOGGER.error('ProviderAchievement', 'Failed to persist reset', {}, err),
            );
    }

    private _persist(): void {
        if (!this._database) {
            LOGGER.warn('ProviderAchievement', 'No database injected — achievement not persisted');
            return;
        }
        this._database
            .setKv(STORAGE_KEY, [...this._awarded])
            .catch((err) =>
                LOGGER.error('ProviderAchievement', 'Failed to persist achievements', {}, err),
            );
    }
}
