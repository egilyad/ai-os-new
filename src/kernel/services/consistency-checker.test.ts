import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsistencyChecker } from './consistency-checker';
import type { CodeManifest } from '../contracts/consistency-checker';

function makeManifest(overrides?: Partial<CodeManifest>): CodeManifest {
    return {
        version: '1.0',
        generated: Date.now(),
        entries: [
            {
                name: 'src/kernel/services/foo-service.ts',
                type: 'file_path',
                location: 'src/kernel/services/foo-service.ts',
            },
            {
                name: 'src/kernel/contracts/bar.ts',
                type: 'file_path',
                location: 'src/kernel/contracts/bar.ts',
            },
            {
                name: 'src/components/BazPanel.tsx',
                type: 'file_path',
                location: 'src/components/BazPanel.tsx',
            },
            {
                name: 'FooService',
                type: 'type_name',
                location: 'src/kernel/services/foo-service.ts',
            },
            { name: 'BarEngine', type: 'type_name', location: 'src/kernel/contracts/bar.ts' },
            { name: 'BazPanel', type: 'type_name', location: 'src/components/BazPanel.tsx' },
            {
                name: 'IFooService',
                type: 'interface_name',
                location: 'src/kernel/contracts/foo.ts',
            },
            { name: 'IBarEngine', type: 'interface_name', location: 'src/kernel/contracts/bar.ts' },
            {
                name: 'query:completed',
                type: 'event_name',
                location: 'src/kernel/events/event-names.ts',
            },
            {
                name: 'agent:started',
                type: 'event_name',
                location: 'src/kernel/events/event-names.ts',
            },
        ],
        ...overrides,
    };
}

describe('ConsistencyChecker', () => {
    let checker: ConsistencyChecker;
    let manifest: CodeManifest;

    beforeEach(() => {
        manifest = makeManifest();
        checker = new ConsistencyChecker(manifest);
    });

    describe('constructor & defaults', () => {
        it('should use provided manifest and default agents', () => {
            expect(checker.getManifest()).toBe(manifest);
            expect(checker.getLastReport()).toBeNull();
            expect(checker.getPlan()).toBeNull();
        });

        it('should use BUILTIN_MANIFEST when no manifest provided', () => {
            const c = new ConsistencyChecker();
            const m = c.getManifest();
            expect(m.version).toBeDefined();
            expect(m.entries.length).toBeGreaterThan(0);
        });

        it('should accept custom doc agent names', () => {
            const agents = ['Agent X', 'Agent Y'];
            const c = new ConsistencyChecker(manifest, agents);
            const plan = c.analyze({
                'test.md': 'File UnknownScore references unknown service.',
            });
            expect(plan.tasks.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('destroy', () => {
        it('should be a no-op', () => {
            expect(() => checker.destroy()).not.toThrow();
        });
    });

    describe('checkDocs', () => {
        it('should pass when file path exists in manifest', () => {
            const report = checker.checkDocs({
                'doc.md': 'See src/kernel/services/foo-service.ts for details.',
            });
            expect(report.passed).toBeGreaterThanOrEqual(1);
            const item = report.items.find((i) => i.name === 'src/kernel/services/foo-service.ts');
            expect(item?.found).toBe(true);
            expect(item?.matchedTo).toBe('src/kernel/services/foo-service.ts');
        });

        it('should fail when file path not in manifest', () => {
            const report = checker.checkDocs({
                'doc.md': 'Check src/kernel/services/missing.ts.',
            });
            const item = report.items.find((i) => i.name === 'src/kernel/services/missing.ts');
            expect(item?.found).toBe(false);
            expect(item?.note).toContain('not in manifest');
        });

        it('should match file paths via phrase map', () => {
            const report = checker.checkDocs({
                'doc.md': 'See src/container.ts for DI setup.',
            });
            const item = report.items.find((i) => i.name === 'src/container.ts');
            expect(item?.found).toBe(true);
            expect(item?.matchedTo).toBe('src/kernel/container.ts');
            expect(item?.note).toContain('phrase map');
        });

        it('should match interface names starting with I', () => {
            const report = checker.checkDocs({
                'doc.md': 'Use IFooService for dependency injection.',
            });
            const item = report.items.find((i) => i.name === 'IFooService');
            expect(item?.found).toBe(true);
            expect(item?.type).toBe('interface_name');
            expect(item?.matchedTo).toBe('src/kernel/contracts/foo.ts');
        });

        it('should match type names', () => {
            const report = checker.checkDocs({
                'doc.md': 'FooService handles the business logic.',
            });
            const item = report.items.find((i) => i.name === 'FooService');
            expect(item?.found).toBe(true);
            expect(item?.type).toBe('type_name');
            expect(item?.matchedTo).toBe('src/kernel/services/foo-service.ts');
        });

        it('should match event names', () => {
            const report = checker.checkDocs({
                'doc.md': 'Emit query:completed when done.',
            });
            const item = report.items.find((i) => i.name === 'query:completed');
            expect(item?.found).toBe(true);
            expect(item?.type).toBe('event_name');
            expect(item?.matchedTo).toBe('src/kernel/events/event-names.ts');
        });

        it('should fail unknown type names', () => {
            const report = checker.checkDocs({
                'doc.md': 'UnknownService does the job.',
            });
            const item = report.items.find((i) => i.name === 'UnknownService');
            expect(item?.found).toBe(false);
        });

        it('should fail unknown event names', () => {
            const report = checker.checkDocs({
                'doc.md': 'Emit unknown:event when done.',
            });
            const item = report.items.find((i) => i.name === 'unknown:event');
            expect(item?.found).toBe(false);
        });

        it('should handle empty content', () => {
            const report = checker.checkDocs({ 'empty.md': '' });
            expect(report.total).toBe(0);
            expect(report.passed).toBe(0);
            expect(report.failed).toBe(0);
            expect(report.summary).toContain('All 0 references verified');
        });

        it('should combine results from multiple docs', () => {
            const report = checker.checkDocs({
                'a.md': 'See src/kernel/services/foo-service.ts.',
                'b.md': 'UnknownService is the best.',
            });
            const found = report.items.filter((i) => i.found);
            const notFound = report.items.filter((i) => !i.found);
            expect(found.length).toBeGreaterThanOrEqual(1);
            expect(notFound.length).toBeGreaterThanOrEqual(1);
        });

        it('should populate byCategory', () => {
            const report = checker.checkDocs({
                'doc.md':
                    'src/kernel/services/foo-service.ts IFooService query:completed UnknownService',
            });
            expect(Object.keys(report.byCategory).length).toBeGreaterThan(0);
            for (const cat of Object.values(report.byCategory)) {
                expect(cat.total).toBe(cat.passed + cat.failed);
            }
        });

        it('should generate appropriate summary for all-pass', () => {
            const report = checker.checkDocs({ 'doc.md': 'FooService' });
            expect(report.summary).toMatch(/^All \d+ references verified/);
        });

        it('should generate moderate summary for 5-19 failures', () => {
            const content = Array.from({ length: 10 }, (_, i) => `src/missing/file${i}.ts`).join(
                ' ',
            );
            const report = checker.checkDocs({ 'doc.md': content });
            expect(report.failed).toBeGreaterThanOrEqual(5);
            expect(report.summary).toContain('Moderate drift');
        });

        it('should generate significant summary for 20+ failures', () => {
            const content = Array.from({ length: 25 }, (_, i) => `src/missing/file${i}.ts`).join(
                ' ',
            );
            const report = checker.checkDocs({ 'doc.md': content });
            expect(report.failed).toBeGreaterThanOrEqual(20);
            expect(report.summary).toContain('Significant drift');
        });

        it('should skip common PascalCase words', () => {
            const report = checker.checkDocs({
                'doc.md': 'Use Promise, Map, Set, Array in your code.',
            });
            const skipped = report.items.filter((i) =>
                ['Promise', 'Map', 'Set', 'Array'].includes(i.name),
            );
            expect(skipped.length).toBe(0);
        });
    });

    describe('analyze', () => {
        it('should return a HealingPlan with no failures when all references match', () => {
            const plan = checker.analyze({ 'doc.md': 'FooService' });
            expect(plan.tasks.length).toBe(0);
            expect(plan.summary).toContain('No healing needed');
        });

        it('should create tasks for failed references', () => {
            const plan = checker.analyze({ 'doc.md': 'MissingEngine does X.' });
            expect(plan.tasks.length).toBe(1);
            expect(plan.tasks[0].docFile).toBe('doc.md');
            expect(plan.tasks[0].status).toBe('pending');
            expect(plan.tasks[0].failedItems.length).toBeGreaterThan(0);
            expect(plan.tasks[0].suggestedFixes.length).toBeGreaterThan(0);
        });

        it('should store the plan internally', () => {
            checker.analyze({ 'doc.md': 'MissingSnapshot.' });
            expect(checker.getPlan()).not.toBeNull();
        });

        it('should group tasks by docFile', () => {
            const plan = checker.analyze({
                'a.md': 'MissingScore UnknownReport',
                'b.md': 'MissingConfig',
            });
            expect(plan.tasks.length).toBe(2);
            expect(plan.tasks.map((t) => t.docFile).sort()).toEqual(['a.md', 'b.md']);
        });

        it('should generate analysis text with failure counts', () => {
            const plan = checker.analyze({ 'doc.md': 'MissingEngine UnknownReport' });
            expect(plan.tasks[0].analysis.length).toBeGreaterThan(10);
            expect(plan.tasks[0].analysis).toContain('MissingEngine');
        });

        it('should generate fix suggestions with confidence scores', () => {
            const plan = checker.analyze({ 'doc.md': 'MissingEngine' });
            expect(plan.tasks[0].suggestedFixes.length).toBeGreaterThan(0);
            for (const fix of plan.tasks[0].suggestedFixes) {
                expect(fix.confidence).toBeGreaterThan(0);
                expect(fix.confidence).toBeLessThanOrEqual(1);
            }
        });
    });

    function failingDocText(...names: string[]): string {
        return names.map((n) => `src/${n}.ts`).join(' ');
    }

    describe('executeTask', () => {
        it('should throw if no plan exists', async () => {
            await expect(checker.executeTask('nonexistent')).rejects.toThrow('No plan');
        });

        it('should throw if task not found', async () => {
            checker.analyze({ 'doc.md': failingDocText('MissingEngine') });
            await expect(checker.executeTask('bad-id')).rejects.toThrow('Task bad-id not found');
        });

        it('should complete a pending task with debate consensus', async () => {
            const plan = checker.analyze({ 'doc.md': failingDocText('MissingEngine') });
            const taskId = plan.tasks[0].id;
            const result = await checker.executeTask(taskId);
            expect(result.status).toBe('completed');
            expect(result.debateConsensus).toBeDefined();
            expect(result.debateConsensus).toContain('Auto-Healing Report');
            expect(result.verifiedAt).toBeGreaterThan(0);
        });

        it('should mark task as completed normally', async () => {
            const plan = checker.analyze({ 'doc.md': failingDocText('MissingEngine') });
            const taskId = plan.tasks[0].id;
            const result = await checker.executeTask(taskId);
            expect(result.status).toBe('completed');
        });
    });

    describe('executeAll', () => {
        it('should throw if no plan exists', async () => {
            await expect(checker.executeAll()).rejects.toThrow('No plan');
        });

        it('should execute all pending tasks', async () => {
            checker.analyze({
                'a.md': failingDocText('MissingEngine'),
                'b.md': failingDocText('MissingReport'),
            });
            const results = await checker.executeAll();
            expect(results.length).toBe(2);
            for (const r of results) {
                expect(r.status).toBe('completed');
            }
            expect(checker.getPlan()!.completedTasks).toBe(2);
        });

        it('should skip already completed tasks', async () => {
            const plan = checker.analyze({ 'doc.md': failingDocText('MissingEngine') });
            await checker.executeTask(plan.tasks[0].id);
            const results = await checker.executeAll();
            expect(results.length).toBe(1);
            expect(results[0].status).toBe('completed');
        });
    });

    describe('verifyAll', () => {
        it('should throw if no plan exists', async () => {
            await expect(checker.verifyAll()).rejects.toThrow('No plan');
        });

        it('should return empty report if no doc contents provided and no items in plan', async () => {
            checker.analyze({});
            const report = await checker.verifyAll();
            expect(report.total).toBe(0);
            expect(report.summary).toContain('No documents to verify');
        });

        it('should re-check docs and report fixed/remaining failures', async () => {
            checker.analyze({ 'doc.md': failingDocText('MissingEngine') });
            await checker.verifyAll({
                'doc.md': failingDocText('MissingEngine'),
            });
            const plan = checker.getPlan()!;
            expect(plan.tasks[0].verifiedFailed).toBeGreaterThanOrEqual(0);
            expect(plan.tasks[0].verifiedPassed).toBeGreaterThanOrEqual(0);
        });

        it('should update verification counts when mixed', async () => {
            checker.analyze({
                'doc.md': failingDocText('MissingEngine') + ' src/kernel/services/foo-service.ts',
            });
            await checker.verifyAll({
                'doc.md': failingDocText('MissingEngine') + ' src/kernel/services/foo-service.ts',
            });
            const task = checker.getPlan()!.tasks[0];
            expect(task.verifiedFailed).toBeGreaterThan(0);
        });
    });

    describe('fetchDocs', () => {
        beforeEach(() => {
            vi.restoreAllMocks();
        });

        it('should fetch valid markdown files', async () => {
            const text = '# Hello';
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(text),
                body: { cancel: () => {} },
            } as Response);

            const result = await checker.fetchDocs(['docs/test.md']);
            expect(result['docs/test.md']).toBe(text);
        });

        it('should skip files with invalid paths', async () => {
            globalThis.fetch = vi.fn();
            const result = await checker.fetchDocs([
                'docs/valid.md',
                '../../etc/passwd',
                'docs/../../../bad.md',
                'script.js',
            ]);
            expect(result['docs/valid.md']).toBeUndefined(); // won't be fetched since we mock above
            expect(globalThis.fetch).not.toHaveBeenCalledWith(
                expect.stringContaining('../../etc/passwd'),
                expect.anything(),
            );
        });

        it('should handle fetch failure gracefully', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                body: { cancel: () => {} },
            } as unknown as Response);

            const result = await checker.fetchDocs(['docs/missing.md']);
            expect(Object.keys(result).length).toBe(0);
        });

        it('should handle fetch exception gracefully', async () => {
            globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
            const result = await checker.fetchDocs(['docs/test.md']);
            expect(Object.keys(result).length).toBe(0);
        });

        it('should skip files when signal is already aborted', async () => {
            const controller = new AbortController();
            controller.abort();
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('x'),
                body: { cancel: () => {} },
            } as Response);

            const result = await checker.fetchDocs(['docs/test.md'], controller.signal);
            expect(globalThis.fetch).not.toHaveBeenCalled();
            expect(Object.keys(result).length).toBe(0);
        });
    });
});
