import type {
    IEcosystemEngine,
    EcosystemState,
    Creature,
    Achievement,
    Theme,
} from '../contracts/ecosystem';
import { CREATURES } from './creature-definitions';
import { ACHIEVEMENTS } from './achievement-definitions';
import { THEMES } from './theme-definitions';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('EcosystemEngine');
const STORAGE_KEY = 'superagents_ecosystem';

export class EcosystemEngine implements IEcosystemEngine {
    private creatures: Creature[] = [];
    private achievements: Achievement[] = [];
    private themes: Theme[] = [];
    private totalFeedings = 0;
    private totalUnlocks = 0;
    private lastTick = Date.now();
    private _initialized = false;

    constructor(
        private deps: {
            storage: {
                getItem: (key: string) => string | null;
                setItem: (key: string, value: string) => void;
            };
        },
    ) {}

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const saved = this.deps.storage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as {
                    creatures: Creature[];
                    achievements: Achievement[];
                    themes: Theme[];
                    totalFeedings: number;
                    totalUnlocks: number;
                };
                this.creatures = parsed.creatures;
                this.achievements = parsed.achievements;
                this.themes = parsed.themes;
                this.totalFeedings = parsed.totalFeedings ?? 0;
                this.totalUnlocks = parsed.totalUnlocks ?? 0;
            }
        } catch {
            LOGGER.warn('EcosystemEngine', 'Failed to load saved state');
        }

        if (this.creatures.length === 0) {
            this.creatures = CREATURES.map((c) => ({ ...c }));
            this.creatures[0]!.isUnlocked = true;
        }
        if (this.achievements.length === 0) this.achievements = ACHIEVEMENTS.map((a) => ({ ...a }));
        if (this.themes.length === 0) {
            this.themes = THEMES.map((t) => ({ ...t }));
            this.themes[0]!.isUnlocked = true;
        }

        LOGGER.info('EcosystemEngine', 'Aquarium ecosystem initialized', {
            creatures: this.creatures.length,
            achievements: this.achievements.length,
            themes: this.themes.length,
        });
    }

    async start(): Promise<void> {
        LOGGER.info('EcosystemEngine', 'Ecosystem started');
    }

    async destroy(): Promise<void> {
        this._initialized = false;
        this.persist();
    }

    getState(): EcosystemState {
        return {
            creatures: [...this.creatures],
            themes: [...this.themes],
            achievements: [...this.achievements],
            totalFeedings: this.totalFeedings,
            totalUnlocks: this.totalUnlocks,
            lastTick: this.lastTick,
            happiness: this.computeHappiness(),
            population: this.creatures.filter((c) => c.isUnlocked).length,
        };
    }

    getCreatures(): Creature[] {
        return [...this.creatures];
    }

    getThemes(): Theme[] {
        return [...this.themes];
    }

    getAchievements(): Achievement[] {
        return [...this.achievements];
    }

    feedCreature(creatureId: string, amount: number): void {
        const creature = this.creatures.find((c) => c.id === creatureId);
        if (!creature || !creature.isUnlocked) return;
        creature.energy = Math.min(creature.maxEnergy, creature.energy + amount);
        this.totalFeedings += amount;
        this.persist();
    }

    unlockTheme(themeId: string): boolean {
        const theme = this.themes.find((t) => t.id === themeId);
        if (!theme || theme.isUnlocked) return false;
        theme.isUnlocked = true;
        this.totalUnlocks++;
        for (const creatureId of theme.creatures) {
            const creature = this.creatures.find((c) => c.id === creatureId);
            if (creature && !creature.isUnlocked) {
                creature.isUnlocked = true;
            }
        }
        this.persist();
        return true;
    }

    tick(): void {
        const now = Date.now();
        const elapsed = (now - this.lastTick) / 1000;
        this.lastTick = now;

        for (const creature of this.creatures) {
            if (!creature.isUnlocked) continue;
            creature.energy = Math.max(0, creature.energy - creature.hungerRate * (elapsed / 60));
        }

        this.checkAchievements();
        this.persist();
    }

    checkAchievements(): Achievement[] {
        const newlyUnlocked: Achievement[] = [];

        for (const achievement of this.achievements) {
            if (achievement.isUnlocked) continue;
            if (this.evaluateCondition(achievement.condition)) {
                achievement.isUnlocked = true;
                achievement.unlockedAt = Date.now();
                newlyUnlocked.push(achievement);
            }
        }

        if (newlyUnlocked.length > 0) {
            this.totalUnlocks += newlyUnlocked.length;
            this.persist();
        }

        return newlyUnlocked;
    }

    reset(): void {
        this.creatures = CREATURES.map((c) => ({ ...c }));
        this.achievements = ACHIEVEMENTS.map((a) => ({ ...a }));
        this.themes = THEMES.map((t) => ({ ...t }));
        this.creatures[0]!.isUnlocked = true;
        this.themes[0]!.isUnlocked = true;
        this.totalFeedings = 0;
        this.totalUnlocks = 0;
        this.lastTick = Date.now();
        this.persist();
    }

    private evaluateCondition(condition: string): boolean {
        if (condition.startsWith('hidden_')) {
            return false;
        }

        const unlockedCreatures = this.creatures.filter((c) => c.isUnlocked).length;
        const unlockedThemes = this.themes.filter((t) => t.isUnlocked).length;
        const rareUnlocked = this.creatures.filter(
            (c) => c.isUnlocked && c.rarity === 'rare',
        ).length;
        const epicUnlocked = this.creatures.filter(
            (c) => c.isUnlocked && c.rarity === 'epic',
        ).length;
        const legendaryUnlocked = this.creatures.filter(
            (c) => c.isUnlocked && c.rarity === 'legendary',
        ).length;

        const checks: Record<string, () => boolean> = {
            'creatures_unlocked >= 5': () => unlockedCreatures >= 5,
            'creatures_unlocked >= 10': () => unlockedCreatures >= 10,
            'creatures_unlocked >= 20': () => unlockedCreatures >= 20,
            'creatures_unlocked >= 30': () => unlockedCreatures >= 30,
            'creatures_unlocked >= 52': () => unlockedCreatures >= 52,
            'rare_unlocked >= 5': () => rareUnlocked >= 5,
            'epic_unlocked >= 3': () => epicUnlocked >= 3,
            'legendary_unlocked >= 1': () => legendaryUnlocked >= 1,
            'legendary_unlocked >= 4': () => legendaryUnlocked >= 4,
            'themes_unlocked >= 5': () => unlockedThemes >= 5,
            'themes_unlocked >= 10': () => unlockedThemes >= 10,
            'themes_unlocked >= 15': () => unlockedThemes >= 15,
            'themes_unlocked >= 20': () => unlockedThemes >= 20,
            'themes_unlocked >= 25': () => unlockedThemes >= 25,
            'all_creatures_and_themes >= 1': () => unlockedCreatures >= 52 && unlockedThemes >= 25,
        };

        const check = checks[condition];
        if (check) return check();

        return false;
    }

    private computeHappiness(): number {
        const unlocked = this.creatures.filter((c) => c.isUnlocked);
        if (unlocked.length === 0) return 0;
        const avgEnergy = unlocked.reduce((s, c) => s + c.energy, 0) / unlocked.length;
        return Math.round((avgEnergy / 100) * 100);
    }

    private persist(): void {
        try {
            this.deps.storage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    creatures: this.creatures,
                    achievements: this.achievements,
                    themes: this.themes,
                    totalFeedings: this.totalFeedings,
                    totalUnlocks: this.totalUnlocks,
                }),
            );
        } catch {
            LOGGER.warn('EcosystemEngine', 'Persist failed');
        }
    }
}
