/**
 * Project memory types (roadmapp.md §P9).
 */

export type MemoryEntryType = 'decision' | 'context' | 'issue' | 'note' | 'lesson';

export interface ProjectMemoryEntry {
    id: string;
    projectId: string;
    type: MemoryEntryType;
    title: string;
    content: string;
    tags: string[];
    agentId?: string;
    relatedTaskId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface DecisionLogEntry extends ProjectMemoryEntry {
    type: 'decision';
    options: string[];
    chosen: string;
    rationale: string;
}

export interface KnownIssueEntry extends ProjectMemoryEntry {
    type: 'issue';
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in-progress' | 'resolved' | 'wontfix';
    workaround?: string;
}

export interface ProjectContext {
    projectId: string;
    summary: string;
    techStack: string[];
    goals: string[];
    constraints: string[];
    lastUpdated: number;
}
