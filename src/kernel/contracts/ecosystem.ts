import type { ILifecycle } from './lifecycle';

export type CreatureRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CreaturePersonality = 'brave' | 'shy' | 'lazy' | 'hyper' | 'curious' | 'guardian';
export type ThemeCategory =
    'aquatic' | 'terrestrial' | 'fantasy' | 'tech' | 'prehistoric' | 'cultural';
export type AchievementCategory =
    | 'first_steps'
    | 'provider_mastery'
    | 'debate_champion'
    | 'memory_keeper'
    | 'collector'
    | 'social'
    | 'streak'
    | 'hidden';

export interface Creature {
    id: string;
    name: string;
    emoji: string;
    description: string;
    rarity: CreatureRarity;
    personality: CreaturePersonality;
    color: string;
    unlockCondition: string;
    evolution?: string;
    hungerRate: number;
    energy: number;
    maxEnergy: number;
    isUnlocked: boolean;
}

export interface Theme {
    id: string;
    name: string;
    description: string;
    category: ThemeCategory;
    colors: string[];
    bgGradient: string[];
    creatures: string[];
    unlocksAt: number;
    isUnlocked: boolean;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    category: AchievementCategory;
    icon: string;
    condition: string;
    points: number;
    isUnlocked: boolean;
    unlockedAt?: number;
}

export interface EcosystemState {
    creatures: Creature[];
    themes: Theme[];
    achievements: Achievement[];
    totalFeedings: number;
    totalUnlocks: number;
    lastTick: number;
    happiness: number;
    population: number;
}

export interface IEcosystemEngine extends ILifecycle {
    getState(): EcosystemState;
    getCreatures(): Creature[];
    getThemes(): Theme[];
    getAchievements(): Achievement[];
    feedCreature(creatureId: string, amount: number): void;
    unlockTheme(themeId: string): boolean;
    tick(): void;
    checkAchievements(): Achievement[];
    reset(): void;
}
