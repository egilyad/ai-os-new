import { describe, it, expect, beforeEach } from 'vitest';
import { BuilderAgentService } from './builder-agent-service';
import { createTestDb, type TestDb } from '../../dal/_test-harness';
import { WorkflowRepository } from '../../dal/workflow-repository';
import type { WorkflowManifest } from '../../types/builder-types';

function makeEventBus() {
    const events: Array<{ event: string; data: unknown }> = [];
    return {
        emit: (event: string, data: unknown) => {
            events.push({ event, data });
            return Promise.resolve();
        },
        events,
    };
}

describe('BuilderAgentService', () => {
    let testDb: TestDb;
    let service: BuilderAgentService;
    let repo: WorkflowRepository;
    let eventBus: ReturnType<typeof makeEventBus>;

    beforeEach(async () => {
        testDb = await createTestDb();
        await testDb.clearAll();
        repo = new WorkflowRepository(testDb.db);
        eventBus = makeEventBus();
        service = new BuilderAgentService({ repository: repo, eventBus: eventBus as never });
    });

    function makeManifest(overrides?: Partial<WorkflowManifest>): WorkflowManifest {
        return {
            workflow_id: 'test_1',
            title: 'Test Flow',
            description: 'desc',
            version: 1,
            status: 'draft',
            trigger: { kind: 'manual', source: 'test' },
            nodes: [
                { id: 'entry', type: 'agent', label: 'Entry', position: { x: 0, y: 0 } },
                { id: 'debate_1', type: 'debate', label: 'Debate', position: { x: 0, y: 150 } },
                { id: 'exit', type: 'agent', label: 'Exit', position: { x: 0, y: 300 } },
            ],
            edges: [
                { id: 'e1', from: 'entry', to: 'debate_1' },
                { id: 'e2', from: 'debate_1', to: 'exit' },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...overrides,
        };
    }

    describe('generate', () => {
        it('should generate a manifest from a prompt', async () => {
            const manifest = await service.generate({ prompt: 'Create a debate about AI safety' });
            expect(manifest).toBeDefined();
            expect(manifest.workflow_id).toMatch(/^wf_/);
            expect(manifest.status).toBe('draft');
            expect(manifest.nodes.length).toBeGreaterThanOrEqual(2);
            expect(manifest.edges.length).toBeGreaterThanOrEqual(1);
        });

        it('should include debate node for debate keywords', async () => {
            const manifest = await service.generate({ prompt: 'Run a debate on economics' });
            const types = manifest.nodes.map((n) => n.type);
            expect(types).toContain('debate');
        });

        it('should include junction node for junction keywords', async () => {
            const manifest = await service.generate({ prompt: 'Connect and link the analysis' });
            const types = manifest.nodes.map((n) => n.type);
            expect(types).toContain('junction');
        });

        it('should always have entry and exit nodes', async () => {
            const manifest = await service.generate({ prompt: 'simple task' });
            expect(manifest.nodes[0]?.id).toBe('entry');
            expect(manifest.nodes[manifest.nodes.length - 1]?.id).toBe('exit');
        });
    });

    describe('validate', () => {
        it('should validate a correct manifest', async () => {
            const result = await service.validate(makeManifest());
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should catch orphan edge from', async () => {
            const manifest = makeManifest({
                edges: [{ id: 'bad', from: 'nonexistent', to: 'exit' }],
            });
            const result = await service.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.code === 'EDGE_ORPHAN_FROM')).toBe(true);
        });

        it('should catch orphan edge to', async () => {
            const manifest = makeManifest({
                edges: [{ id: 'bad', from: 'entry', to: 'nonexistent' }],
            });
            const result = await service.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.code === 'EDGE_ORPHAN_TO')).toBe(true);
        });

        it('should catch cycle', async () => {
            const manifest = makeManifest({
                nodes: [
                    { id: 'a', type: 'agent', label: 'A', position: { x: 0, y: 0 } },
                    { id: 'b', type: 'agent', label: 'B', position: { x: 0, y: 100 } },
                ],
                edges: [
                    { id: 'e1', from: 'a', to: 'b' },
                    { id: 'e2', from: 'b', to: 'a' },
                ],
            });
            const result = await service.validate(manifest);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.code === 'CYCLE_DETECTED')).toBe(true);
        });

        it('should warn about gate without condition', async () => {
            const manifest = makeManifest({
                nodes: [
                    { id: 'entry', type: 'agent', label: 'Entry', position: { x: 0, y: 0 } },
                    { id: 'g1', type: 'gate', label: 'Gate', position: { x: 0, y: 100 } },
                    { id: 'exit', type: 'agent', label: 'Exit', position: { x: 0, y: 200 } },
                ],
                edges: [
                    { id: 'e1', from: 'entry', to: 'g1' },
                    { id: 'e2', from: 'g1', to: 'exit' },
                ],
            });
            const result = await service.validate(manifest);
            expect(result.valid).toBe(true);
            expect(result.warnings.some((w) => w.code === 'GATE_NO_CONDITION')).toBe(true);
        });

        it('should warn about orphan node', async () => {
            const manifest = makeManifest({
                nodes: [
                    { id: 'entry', type: 'agent', label: 'Entry', position: { x: 0, y: 0 } },
                    { id: 'orphan', type: 'debate', label: 'Orphan', position: { x: 0, y: 100 } },
                    { id: 'exit', type: 'agent', label: 'Exit', position: { x: 0, y: 200 } },
                ],
                edges: [{ id: 'e1', from: 'entry', to: 'exit' }],
            });
            const result = await service.validate(manifest);
            expect(result.warnings.some((w) => w.code === 'ORPHAN_NODE')).toBe(true);
        });
    });

    describe('compile', () => {
        it('should compile a manifest into a CompiledFlow', async () => {
            const flow = await service.compile(makeManifest());
            expect(flow).toBeDefined();
            expect(flow.flowId).toBe('test_1');
            expect(flow.steps.length).toBe(3);
            expect(flow.entryEvent).toBe('agent:invoke');
            expect(flow.exitEvent).toBe('agent:completed');
        });

        it('should map node types to handler events', async () => {
            const flow = await service.compile(makeManifest());
            const debateStep = flow.steps.find((s) => s.nodeType === 'debate');
            expect(debateStep?.handlerEvent).toBe('debate:start');
            expect(debateStep?.outputEvent).toBe('debate:verdict:generated');
        });
    });

    describe('saveManifest + listFlows + getFlow', () => {
        it('should save and retrieve a manifest', async () => {
            const manifest = makeManifest();
            await service.saveManifest(manifest);
            const flows = await service.listFlows();
            expect(flows.length).toBe(1);
            expect(flows[0]?.workflow_id).toBe('test_1');

            const retrieved = await service.getFlow('test_1');
            expect(retrieved?.workflow_id).toBe('test_1');
        });

        it('should return null for unknown flow', async () => {
            const result = await service.getFlow('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('deploy', () => {
        it('should deploy a workflow and emit event', async () => {
            const manifest = makeManifest();
            await service.saveManifest(manifest);
            await service.deploy('test_1');

            const record = await repo.get('test_1');
            expect(record?.status).toBe('deployed');
            expect(eventBus.events.length).toBe(1);
            expect(eventBus.events[0]?.event).toBe('builder:flow:deployed');
        });

        it('should throw if workflow not found', async () => {
            await expect(service.deploy('nonexistent')).rejects.toThrow('not found');
        });
    });

    describe('saveCompiled', () => {
        it('should save compiled flow and update status', async () => {
            const manifest = makeManifest();
            await service.saveManifest(manifest);
            const compiled = await service.compile(manifest);
            await service.saveCompiled(manifest, compiled);

            const record = await repo.get('test_1');
            expect(record?.status).toBe('compiled');
            expect(record?.compiledFlow).toBeDefined();
        });
    });
});
