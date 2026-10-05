import { AgemsTaskService } from './agems-task-service';
import { getDexieDb } from './database-service';
import { seedTasksDemo, DEMO_TASK_LABEL } from './tasks-demo-seed';

describe('tasks-demo-seed', () => {
    beforeEach(async () => {
        await getDexieDb().agemsTasks.clear();
    });

    afterEach(async () => {
        await getDexieDb().agemsTasks.clear();
    });

    it('seeds three tasks in three kanban states', async () => {
        const tasks = await seedTasksDemo(new AgemsTaskService());
        expect(tasks).toHaveLength(3);
        const statuses = new Set(tasks.map((t) => t.status));
        expect(statuses).toEqual(new Set(['COMPLETED', 'IN_PROGRESS', 'PENDING']));
        const assignees = new Set(tasks.map((t) => t.assigneeId));
        expect(assignees.size).toBe(3);
        for (const t of tasks) expect(t.labels).toContain(DEMO_TASK_LABEL);
    });

    it('is idempotent: repeated calls reuse tasks', async () => {
        const first = await seedTasksDemo(new AgemsTaskService());
        const second = await seedTasksDemo(new AgemsTaskService());
        expect(second.map((t) => t.id).sort()).toEqual(first.map((t) => t.id).sort());
        expect(await new AgemsTaskService().list()).toHaveLength(3);
    });
});
