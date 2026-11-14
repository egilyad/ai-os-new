import { describe, expect, it } from 'vitest';
import { AttachmentService } from '../kernel/services/attachments/attachment-service';

describe('smoke: AttachmentService (sidecar visual evidence)', () => {
    it('register → list → get → detach', async () => {
        const svc = new AttachmentService();
        const att = await svc.register({
            sourceKind: 'wiki',
            sourceRef: 'some-page',
            caption: 'Скриншот схемы',
            mimeType: 'image/png',
            dataB64: 'iVBORw0KGgo=',
        });
        expect(att.id).toMatch(/^att-/);

        const list = await svc.list({ sourceRef: 'some-page' });
        expect(list).toHaveLength(1);
        expect(list[0]).toMatchObject({ caption: 'Скриншот схемы', mimeType: 'image/png' });

        const got = await svc.get(att.id);
        expect(got?.dataB64).toBe('iVBORw0KGgo=');

        expect(await svc.detach(att.id)).toBe(true);
        expect(await svc.get(att.id)).toBeUndefined();
        expect(await svc.detach(att.id)).toBe(false);
    });

    it('list фильтрует по sourceKind', async () => {
        const svc = new AttachmentService();
        await svc.register({
            sourceKind: 'wiki',
            sourceRef: 'p1',
            caption: 'a',
            mimeType: 'image/png',
            dataB64: 'x',
        });
        await svc.register({
            sourceKind: 'task',
            sourceRef: 't1',
            caption: 'b',
            mimeType: 'image/jpeg',
            dataB64: 'y',
        });
        const tasks = await svc.list({ sourceKind: 'task' });
        expect(tasks).toHaveLength(1);
        expect(tasks[0]?.caption).toBe('b');
    });
});
