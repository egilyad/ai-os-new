/**
 * Project memory contract (roadmapp.md §P9).
 */
import type {
    ProjectMemoryEntry,
    DecisionLogEntry,
    KnownIssueEntry,
    ProjectContext,
    MemoryEntryType,
} from '../types/project-memory-types';

export interface IProjectMemoryService {
    addEntry(projectId: string, entry: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): ProjectMemoryEntry;
    getEntries(projectId: string, type?: MemoryEntryType): ProjectMemoryEntry[];
    updateEntry(projectId: string, entryId: string, updates: Partial<ProjectMemoryEntry>): void;
    deleteEntry(projectId: string, entryId: string): void;
    addDecision(projectId: string, decision: Omit<DecisionLogEntry, 'id' | 'createdAt' | 'updatedAt' | 'type'>): DecisionLogEntry;
    getDecisions(projectId: string): DecisionLogEntry[];
    addIssue(projectId: string, issue: Omit<KnownIssueEntry, 'id' | 'createdAt' | 'updatedAt' | 'type'>): KnownIssueEntry;
    getIssues(projectId: string, status?: KnownIssueEntry['status']): KnownIssueEntry[];
    resolveIssue(projectId: string, issueId: string): void;
    setContext(projectId: string, context: Omit<ProjectContext, 'lastUpdated'>): void;
    getContext(projectId: string): ProjectContext | undefined;
    searchEntries(projectId: string, query: string): ProjectMemoryEntry[];
}
