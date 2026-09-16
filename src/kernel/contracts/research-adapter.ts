import type { ResearchSource, SourceCategory, SourceType } from './research-engine';

export interface SourceAdapterConfig {
    apiKeys: Record<string, string>;
    enabledSources: SourceType[];
    rateLimits: Record<string, { maxPerMinute: number; maxPerDay: number }>;
}

export interface ISourceAdapter {
    readonly name: SourceType;
    readonly displayName: string;
    readonly category: SourceCategory;
    readonly description: string;
    readonly needsKey: boolean;
    readonly isRestricted: boolean;
    readonly baseUrl: string;

    search(
        query: string,
        config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]>;
}

export type SourceAdapterFactory = () => ISourceAdapter;
