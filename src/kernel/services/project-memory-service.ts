/**
 * ProjectMemoryService — project memory, decision log, known issues (roadmapp.md §P9).
 */
import type {
    ProjectMemoryEntry,
    DecisionLogEntry,
    KnownIssueEntry,
    ProjectContext,
    MemoryEntryType,
} from '../types/project-memory-types';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ProjectMemoryService');

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

let memCounter = 0;

export class ProjectMemoryService implements IProjectMemoryService {
    private entries = new Map<string, ProjectMemoryEntry[]>();
    private decisions = new Map<string, DecisionLogEntry[]>();
    private issues = new Map<string, KnownIssueEntry[]>();
    private contexts = new Map<string, ProjectContext>();

    addEntry(projectId: string, entry: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): ProjectMemoryEntry {
        const full: ProjectMemoryEntry = {
            ...entry,
            id: `mem-${Date.now()}-${++memCounter}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const list = this.entries.get(projectId) || [];
        list.push(full);
        this.entries.set(projectId, list);
        LOGGER.info('addEntry', `Added ${entry.type} to project ${projectId}`);
        return full;
    }

    getEntries(projectId: string, type?: MemoryEntryType): ProjectMemoryEntry[] {
        const list = this.entries.get(projectId) || [];
        if (!type) return [...list];
        return list.filter((e) => e.type === type);
    }

    updateEntry(projectId: string, entryId: string, updates: Partial<ProjectMemoryEntry>): void {
        const list = this.entries.get(projectId) || [];
        const entry = list.find((e) => e.id === entryId);
        if (entry) {
            Object.assign(entry, updates, { updatedAt: Date.now() });
        }
    }

    deleteEntry(projectId: string, entryId: string): void {
        const list = this.entries.get(projectId) || [];
        this.entries.set(projectId, list.filter((e) => e.id !== entryId));
    }

    addDecision(projectId: string, decision: Omit<DecisionLogEntry, 'id' | 'createdAt' | 'updatedAt' | 'type'>): DecisionLogEntry {
        const entry: DecisionLogEntry = {
            ...decision,
            type: 'decision',
            id: `dec-${Date.now()}-${++memCounter}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const list = this.decisions.get(projectId) || [];
        list.push(entry);
        this.decisions.set(projectId, list);

        // Also add to general entries
        const existingDecisionEntries = this.entries.get(projectId);
        if (existingDecisionEntries) existingDecisionEntries.push(entry as ProjectMemoryEntry);
        else this.entries.set(projectId, [entry as ProjectMemoryEntry]);

        return entry;
    }

    getDecisions(projectId: string): DecisionLogEntry[] {
        return this.decisions.get(projectId) || [];
    }

    addIssue(projectId: string, issue: Omit<KnownIssueEntry, 'id' | 'createdAt' | 'updatedAt' | 'type'>): KnownIssueEntry {
        const entry: KnownIssueEntry = {
            ...issue,
            type: 'issue',
            id: `iss-${Date.now()}-${++memCounter}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const list = this.issues.get(projectId) || [];
        list.push(entry);
        this.issues.set(projectId, list);

        const existingIssueEntries = this.entries.get(projectId);
        if (existingIssueEntries) existingIssueEntries.push(entry as ProjectMemoryEntry);
        else this.entries.set(projectId, [entry as ProjectMemoryEntry]);

        return entry;
    }

    getIssues(projectId: string, status?: KnownIssueEntry['status']): KnownIssueEntry[] {
        const list = this.issues.get(projectId) || [];
        if (!status) return [...list];
        return list.filter((i) => i.status === status);
    }

    resolveIssue(projectId: string, issueId: string): void {
        const list = this.issues.get(projectId) || [];
        const issue = list.find((i) => i.id === issueId);
        if (issue) {
            issue.status = 'resolved';
            issue.updatedAt = Date.now();
        }
    }

    setContext(projectId: string, context: Omit<ProjectContext, 'lastUpdated'>): void {
        this.contexts.set(projectId, {
            ...context,
            lastUpdated: Date.now(),
        });
    }

    getContext(projectId: string): ProjectContext | undefined {
        return this.contexts.get(projectId);
    }

    searchEntries(projectId: string, query: string): ProjectMemoryEntry[] {
        const list = this.entries.get(projectId) || [];
        const q = query.toLowerCase();
        return list.filter(
            (e) =>
                e.title.toLowerCase().includes(q) ||
                e.content.toLowerCase().includes(q) ||
                e.tags.some((t) => t.toLowerCase().includes(q)),
        );
    }
}
