import type { MemoryEntry } from '../../types/memory-types';

export type MemoryNodeType =
    | 'user'
    | 'fact'
    | 'observation'
    | 'note'
    | 'diary'
    | 'doc'
    | 'task'
    | 'skill'
    | 'entity'
    | 'tag'
    | 'knowledge';

export interface MemoryGraphNode {
    id: string;
    label: string;
    type: MemoryNodeType;
    /** Number of incident edges (computed after build). Used for node size. */
    degree: number;
    meta?: Record<string, unknown>;
}

export interface MemoryGraphEdge {
    id: string;
    source: string;
    target: string;
    kind: 'relation' | 'tag' | 'parent' | 'text';
    weight: number;
}

export interface MemoryGraphData {
    nodes: MemoryGraphNode[];
    edges: MemoryGraphEdge[];
}

export interface IMemoryGraphService {
    build(entries: MemoryEntry[]): MemoryGraphData;
}
