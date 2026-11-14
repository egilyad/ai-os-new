import { describe, expect, it, vi } from 'vitest';
import { AssistantPlannerService } from '../kernel/services/assistant/assistant-planner-service';

describe('smoke: AssistantPlannerService (M4)', () => {
    it('createPlan: явные шаги → draft со всеми queued', async () => {
        const svc = new AssistantPlannerService();
        const plan = await svc.createPlan('собрать отчёт', [
            { title: 'найти источники', actionId: 'wiki.research' },
            { title: 'написать выводы' },
        ]);
        expect(plan.status).toBe('draft');
        expect(plan.steps).toHaveLength(2);
        expect(plan.steps.every((s) => s.status === 'queued')).toBe(true);
    });

    it('run: исполняет шаги через runAction и завершается', async () => {
        const runAction = vi.fn(async () => ({ ok: true, detail: 'done' }));
        const svc = new AssistantPlannerService({ runAction });
        const plan = await svc.createPlan('goal', [{ title: 'a', actionId: 'x' }, { title: 'b' }]);
        const done = await svc.run(plan.id);
        expect(done?.status).toBe('completed');
        expect(runAction).toHaveBeenCalledTimes(1);
        expect(done?.steps[0]?.status).toBe('completed');
        expect(done?.steps[1]?.status).toBe('completed');
    });

    it('run: фейл шага помечает план failed', async () => {
        const runAction = vi.fn(async () => ({ ok: false, detail: 'boom' }));
        const svc = new AssistantPlannerService({ runAction });
        const plan = await svc.createPlan('goal', [{ title: 'a', actionId: 'x' }]);
        const done = await svc.run(plan.id);
        expect(done?.status).toBe('failed');
        expect(done?.steps[0]?.error).toBe('boom');
    });

    it('step: выполняет по одному шагу', async () => {
        const svc = new AssistantPlannerService();
        const plan = await svc.createPlan('goal', [{ title: 'a' }, { title: 'b' }]);
        const after = await svc.step(plan.id);
        expect(after?.steps[0]?.status).toBe('completed');
        expect(after?.steps[1]?.status).toBe('queued');
        expect(after?.status).toBe('running');
        const after2 = await svc.step(plan.id);
        expect(after2?.steps[1]?.status).toBe('completed');
        expect(after2?.status).toBe('completed');
    });

    it('pause: только для running-плана', async () => {
        const svc = new AssistantPlannerService();
        const plan = await svc.createPlan('goal', [{ title: 'a' }]);
        expect(svc.pause(plan.id)).toBe(false);
        await svc.run(plan.id);
        expect(svc.pause(plan.id)).toBe(false);
        const paused = await svc.createPlan('goal', [{ title: 'a' }]);
        paused.status = 'running';
        expect(svc.pause(paused.id)).toBe(true);
    });

    it('decompose: LLM-декомпозиция при отсутствии шагов', async () => {
        const llm = { chat: vi.fn(async () => ({ content: '["шаг 1","шаг 2"]' })) };
        const svc = new AssistantPlannerService({ llm });
        const plan = await svc.createPlan('goal');
        expect(llm.chat).toHaveBeenCalledTimes(1);
        expect(plan.steps.map((s) => s.title)).toEqual(['шаг 1', 'шаг 2']);
    });
});
