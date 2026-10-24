import type { TWikiPage, TWikiLink } from './types';

export interface WikiGraphSimilarity {
    signals: Record<string, number>;
    total: number;
}

export interface WikiCommunity {
    id: string;
    slugs: string[];
    cohesion: number;
}

export interface WikiGraphNode {
    id: string;
    label: string;
    [key: string]: unknown;
}

export interface WikiGraphEdge {
    id: string;
    source: string;
    target: string;
    [key: string]: unknown;
}

export interface IWikiGraphService {
    similarity(slugA: string, slugB: string): Promise<WikiGraphSimilarity>;
    detectCommunities(): Promise<WikiCommunity[]>;
    toFlowGraph(slugs?: string[]): Promise<{ nodes: WikiGraphNode[]; edges: WikiGraphEdge[] }>;
}

export type { TWikiPage, TWikiLink };
