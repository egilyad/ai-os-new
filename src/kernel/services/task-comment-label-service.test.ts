import { getDexieDb } from './database-service';
import { taskCommentService } from './task-comment-service';
import { taskLabelService } from './task-label-service';
import { AgemsTaskService } from './agems-task-service';

const service = new AgemsTaskService();

describe('task-comment-service', () => {
    let taskId: string;

    beforeEach(async () => {
        await getDexieDb().taskComments.clear();
        const task = await service.create({ title: 'c', type: 'ONE_TIME', priority: 'MEDIUM' });
        taskId = task.id;
    });

    it('adds and lists comments', async () => {
        await taskCommentService.add(taskId, 'user', 'me', 'note');
        const rows = await taskCommentService.list(taskId);
        expect(rows).toHaveLength(1);
        expect(rows[0]?.content).toBe('note');
    });

    it('removes a comment', async () => {
        const c = await taskCommentService.add(taskId, 'user', 'me', 'note');
        await taskCommentService.remove(c.id as number);
        expect(await taskCommentService.list(taskId)).toHaveLength(0);
    });
});

describe('task-label-service', () => {
    let taskId: string;

    beforeEach(async () => {
        await getDexieDb().taskLabels.clear();
        await getDexieDb().labels.clear();
        const task = await service.create({ title: 'l', type: 'ONE_TIME', priority: 'MEDIUM' });
        taskId = task.id;
    });

    it('assigns and lists labels', async () => {
        const label = await taskLabelService.createLabel('bug', '#f00');
        await taskLabelService.assign(taskId, label.id as number);
        const labels = await taskLabelService.listForTask(taskId);
        expect(labels).toHaveLength(1);
        expect(labels[0]?.name).toBe('bug');
    });

    it('unassigns a label', async () => {
        const label = await taskLabelService.createLabel('bug', '#f00');
        await taskLabelService.assign(taskId, label.id as number);
        await taskLabelService.unassign(taskId, label.id as number);
        expect(await taskLabelService.listForTask(taskId)).toHaveLength(0);
    });

    it('is idempotent on duplicate assignment', async () => {
        const label = await taskLabelService.createLabel('bug', '#f00');
        await taskLabelService.assign(taskId, label.id as number);
        await taskLabelService.assign(taskId, label.id as number);
        expect(await taskLabelService.listForTask(taskId)).toHaveLength(1);
    });
});
