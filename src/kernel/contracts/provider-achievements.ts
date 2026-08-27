export interface ProviderAchievement {
    id: string;
    provider: 'groq' | 'openrouter' | 'nvidia';
    title: string;
    description: string;
    icon: string;
    category: 'speed' | 'reliability' | 'routing' | 'power' | 'discovery' | 'mastery';
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    condition: (stats: Record<string, number>) => boolean;
    progress?: (stats: Record<string, number>) => { current: number; target: number };
}

export interface AchievementProgress {
    id: string;
    achieved: boolean;
    achievedAt?: number;
    current: number;
    target: number;
}

export interface IProviderAchievementService {
    getAchievements(provider: string): ProviderAchievement[];
    getAllAchievements(): ProviderAchievement[];
    getProgress(provider: string, stats: Record<string, number>): AchievementProgress[];
    checkAndAward(provider: string, stats: Record<string, number>): string[];
    getAwardedIds(): string[];
    reset(): void;
}
