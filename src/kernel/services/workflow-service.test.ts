import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowService } from './workflow-service';

describe('WorkflowService', () => {
    let svc: WorkflowService;

    beforeEach(async () => {
        svc = new WorkflowService();
        await svc.init();
    });

    afterEach(async () => {
        await svc.destroy();
    });

    async function createTestWf(title = 'Test WF'): Promise<string> {
        const wf = await svc.create({
            title,
            description: 'desc',
            steps: [
                {
                    label: 'Step 1',
                    provider: 'groq',
                    model: 'llama-3.1-8b-instant',
                    promptTemplate: '{{input}}',
                    maxOutputTokens: 100,
                    temperature: 0.5,
                },
            ],
        });
        return wf.id;
    }

    it('should start empty', async () => {
        const all = await svc.getAll();
        expect(all).toHaveLength(0);
    });

    it('should create workflow with generated id', async () => {
        const id = await createTestWf();
        expect(id).toBeTruthy();
        const wf = await svc.getById(id);
        expect(wf).toBeDefined();
        expect(wf!.title).toBe('Test WF');
    });

    it('should create with multiple steps', async () => {
        const wf = await svc.create({
            title: 'Multi',
            description: 'multi-step',
            steps: [
                {
                    label: 'A',
                    provider: 'groq',
                    model: 'm1',
                    promptTemplate: '{{input}}',
                    maxOutputTokens: 100,
                    temperature: 0.5,
                },
                {
                    label: 'B',
                    provider: 'openai',
                    model: 'm2',
                    promptTemplate: '{{steps.0.output}}',
                    maxOutputTokens: 200,
                    temperature: 0.7,
                },
            ],
        });
        expect(wf.steps).toHaveLength(2);
        expect(wf.steps[0].label).toBe('A');
        expect(wf.steps[1].label).toBe('B');
    });

    it('should update workflow', async () => {
        const id = await createTestWf();
        await svc.update(id, { title: 'Updated' });
        const wf = await svc.getById(id);
        expect(wf!.title).toBe('Updated');
        expect(wf!.description).toBe('desc');
    });

    it('should not update built-in workflows', async () => {
        await expect(svc.update('nonexistent-built-in', { title: 'x' })).resolves.toBeUndefined();
    });

    it('should remove workflow', async () => {
        const id = await createTestWf();
        await svc.remove(id);
        expect(await svc.getById(id)).toBeUndefined();
    });

    it('should increment usage', async () => {
        const id = await createTestWf();
        const wf = await svc.getById(id);
        expect(wf!.usageCount).toBe(0);
        await svc.incrementUsage(id);
        const updated = await svc.getById(id);
        expect(updated!.usageCount).toBe(1);
    });

    it('should get runs (empty initially)', async () => {
        const runs = await svc.getRuns();
        expect(runs).toHaveLength(0);
    });

    it('should cancel a specific run without error', () => {
        expect(() => svc.cancelRun('nonexistent')).not.toThrow();
    });

    it('should cancel all runs without error', () => {
        expect(() => svc.cancelRun()).not.toThrow();
    });
});
