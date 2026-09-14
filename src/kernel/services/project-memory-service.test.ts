/**
 * ProjectMemoryService tests — memory, decision log, known issues (roadmapp.md §P9).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectMemoryService } from './project-memory-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

describe('ProjectMemoryService', () => {
    let svc: ProjectMemoryService;

    beforeEach(() => {
        svc = new ProjectMemoryService();
    });

    describe('entries', () => {
        it('adds and retrieves entries', () => {
            svc.addEntry('p1', {
                type: 'note',
                title: 'Important note',
                content: 'Remember to test',
                tags: ['testing'],
            });
            const entries = svc.getEntries('p1');
            expect(entries).toHaveLength(1);
            expect(entries[0].title).toBe('Important note');
        });

        it('filters by type', () => {
            svc.addEntry('p1', { type: 'note', title: 'n1', content: 'c', tags: [] });
            svc.addEntry('p1', { type: 'lesson', title: 'l1', content: 'c', tags: [] });
            expect(svc.getEntries('p1', 'note')).toHaveLength(1);
            expect(svc.getEntries('p1', 'lesson')).toHaveLength(1);
        });

        it('updates entries', () => {
            const entry = svc.addEntry('p1', { type: 'note', title: 'old', content: 'c', tags: [] });
            svc.updateEntry('p1', entry.id, { title: 'new' });
            expect(svc.getEntries('p1')[0].title).toBe('new');
        });

        it('deletes entries', () => {
            const entry = svc.addEntry('p1', { type: 'note', title: 'n', content: 'c', tags: [] });
            svc.deleteEntry('p1', entry.id);
            expect(svc.getEntries('p1')).toHaveLength(0);
        });
    });

    describe('decisions', () => {
        it('adds and retrieves decisions', () => {
            svc.addDecision('p1', {
                title: 'Use React',
                content: 'Framework choice',
                tags: ['architecture'],
                options: ['React', 'Vue', 'Svelte'],
                chosen: 'React',
                rationale: 'Team expertise',
            });
            const decisions = svc.getDecisions('p1');
            expect(decisions).toHaveLength(1);
            expect(decisions[0].chosen).toBe('React');
            expect(decisions[0].options).toHaveLength(3);
        });
    });

    describe('issues', () => {
        it('adds and retrieves issues', () => {
            svc.addIssue('p1', {
                title: 'Memory leak',
                content: 'Heap grows on long runs',
                tags: ['performance'],
                severity: 'high',
                status: 'open',
            });
            const issues = svc.getIssues('p1');
            expect(issues).toHaveLength(1);
            expect(issues[0].severity).toBe('high');
        });

        it('resolves issues', () => {
            const issue = svc.addIssue('p1', {
                title: 'Bug',
                content: 'desc',
                tags: [],
                severity: 'medium',
                status: 'open',
            });
            svc.resolveIssue('p1', issue.id);
            expect(svc.getIssues('p1')[0].status).toBe('resolved');
        });

        it('filters by status', () => {
            svc.addIssue('p1', { title: 'a', content: '', tags: [], severity: 'low', status: 'open' });
            svc.addIssue('p1', { title: 'b', content: '', tags: [], severity: 'low', status: 'resolved' });
            expect(svc.getIssues('p1', 'open')).toHaveLength(1);
            expect(svc.getIssues('p1', 'resolved')).toHaveLength(1);
        });
    });

    describe('context', () => {
        it('sets and gets context', () => {
            svc.setContext('p1', {
                projectId: 'p1',
                summary: 'A web app for dogs',
                techStack: ['React', 'Node.js'],
                goals: ['Launch MVP'],
                constraints: ['Budget $5k'],
            });
            const ctx = svc.getContext('p1');
            expect(ctx).toBeDefined();
            expect(ctx!.techStack).toContain('React');
            expect(ctx!.lastUpdated).toBeGreaterThan(0);
        });
    });

    describe('searchEntries', () => {
        it('searches by title', () => {
            svc.addEntry('p1', { type: 'note', title: 'React patterns', content: 'c', tags: [] });
            svc.addEntry('p1', { type: 'note', title: 'Vue patterns', content: 'c', tags: [] });
            expect(svc.searchEntries('p1', 'React')).toHaveLength(1);
        });

        it('searches by tags', () => {
            svc.addEntry('p1', { type: 'note', title: 'n', content: 'c', tags: ['performance'] });
            expect(svc.searchEntries('p1', 'performance')).toHaveLength(1);
        });
    });
});
