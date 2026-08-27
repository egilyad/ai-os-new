export interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
    days: ContributionDay[];
}

export interface ContributionGraph {
    weeks: ContributionWeek[];
    totalContributions: number;
    currentStreak: number;
    longestStreak: number;
}

export interface IContributionService {
    getGraph(): ContributionGraph;
    getContributionsByDateRange(start: string, end: string): ContributionDay[];
    getStreak(): { current: number; longest: number };
}
