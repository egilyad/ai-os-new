import type { TWikiSource, TWikiLink, TWikiLogEntry, TWikiPageFrontmatter } from './types';

export interface IngestAnalyzeInput {
    source: TWikiSource;
    existingSlugs: string[];
    existingEntities: string[];
}

export interface IngestAnalyzeOutput {
    entities: Array<{ name: string; type: string; aliases?: string[] }>;
    concepts: Array<{ name: string; summary: string }>;
    arguments: Array<{ claim: string; evidence: string }>;
    crossLinks: Array<{ toSlug: string; reason: string }>;
    contradictions: Array<{ with: string; description: string }>;
    wikiStructureHint: { sections: string[]; suggestedPages: string[] };
}

export interface IngestGenerateInput {
    source: TWikiSource;
    analysis: IngestAnalyzeOutput;
    existingSlugs: string[];
    language: 'en' | 'ru' | 'mixed';
}

export interface IngestGenerateOutput {
    pages: Array<{ frontmatter: TWikiPageFrontmatter; body: string }>;
    links: Array<Omit<TWikiLink, 'id'>>;
    logEntry: Omit<TWikiLogEntry, 'id' | 'ts'>;
    lintFlags: Array<{ rule: string; payload: unknown }>;
}

export interface WikiIngestResult {
    pages: TWikiPage[];
    links: TWikiLink[];
    logEntry: TWikiLogEntry;
}

export interface WikiIngestProgress {
    sourceId: string;
    phase: 'analyze' | 'generate' | 'persist';
    pct: number;
}

export interface IWikiIngestService {
    ingest(source: TWikiSource): Promise<WikiIngestResult>;
    onProgress(cb: (e: WikiIngestProgress) => void): () => void;
    startQueueWorker(): Promise<void>;
    stopQueueWorker(): Promise<void>;
}
