import { WorkflowService } from './workflow-service';
import { seedWorkflowsDemo, DEMO_WORKFLOW_TITLE } from './workflows-demo-seed';

const kv = new Map<string, unknown>();

vi.mock('../instances/core-references', () => ({
    database: {
        getKv: async (id: string) => kv.get(id) ?? null,
        setKv: async (id: string, value: unknown) => {
            kv.set(id, value);
        },
    },
}));

describe('workflows-demo-seed', () => {
    let service: WorkflowService;

    beforeEach(() => {
        kv.clear();
        service = new WorkflowService();
    });

    it('seeds a three-step workflow', async () => {
        const wf = await seedWorkflowsDemo(service);
        expect(wf.title).toBe(DEMO_WORKFLOW_TITLE);
        expect(wf.steps).toHaveLength(3);
        expect(wf.tags).toContain('демо');
    });

    it('is idempotent: repeated calls reuse the workflow', async () => {
        const first = await seedWorkflowsDemo(service);
        const second = await seedWorkflowsDemo(service);
        expect(second.id).toBe(first.id);
        expect(await service.getAll()).toHaveLength(1);
    });
});
