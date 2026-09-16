import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationWebhookService } from './notification-webhook-service';

function makeDeps() {
    const store: unknown[] = [];
    return {
        eventBus: {
            on: vi.fn(() => vi.fn()),
            emit: vi.fn(),
        },
        database: {
            getKv: vi.fn(async () => null),
            setKv: vi.fn(async (_id: string, value: unknown) => {
                store.push(value);
            }),
        },
    };
}

describe('NotificationWebhookService', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, type: 'default' } as Response);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('should create and list webhooks', async () => {
        const deps = makeDeps();
        const svc = new NotificationWebhookService(deps);
        const wh = await svc.addWebhook({
            provider: 'slack',
            name: 'Test Slack',
            webhookUrl: 'https://hooks.slack.com/test',
            enabled: true,
            events: ['system:notification'],
        });
        expect(wh.id).toMatch(/^wh-/);
        expect(wh.provider).toBe('slack');
        expect(svc.getWebhooks()).toHaveLength(1);
    });

    it('should remove a webhook', async () => {
        const deps = makeDeps();
        const svc = new NotificationWebhookService(deps);
        const wh = await svc.addWebhook({
            provider: 'telegram',
            name: 'Test',
            webhookUrl: 'https://t.me/test',
            enabled: true,
            events: ['system:notification'],
        });
        svc.removeWebhook(wh.id);
        expect(svc.getWebhooks()).toHaveLength(0);
    });

    it('should update a webhook', async () => {
        const deps = makeDeps();
        const svc = new NotificationWebhookService(deps);
        const wh = await svc.addWebhook({
            provider: 'discord',
            name: 'Test',
            webhookUrl: 'https://discord.com/test',
            enabled: true,
            events: ['system:notification'],
        });
        svc.updateWebhook(wh.id, { enabled: false, name: 'Updated' });
        const updated = svc.getWebhooks()[0];
        expect(updated.enabled).toBe(false);
        expect(updated.name).toBe('Updated');
    });

    it('should load webhooks from database on construction', async () => {
        const deps = makeDeps();
        const existing = [
            {
                id: 'wh-existing',
                provider: 'slack' as const,
                name: 'Existing',
                webhookUrl: 'https://hooks.slack.com/existing',
                enabled: true,
                events: ['system:notification' as const],
                createdAt: Date.now(),
            },
        ];
        deps.database.getKv = vi.fn().mockResolvedValue(existing);
        const svc = new NotificationWebhookService(deps);
        await svc.init();
        expect(svc.getWebhooks()).toHaveLength(1);
        expect(svc.getWebhooks()[0].id).toBe('wh-existing');
    });

    it('should test a webhook', async () => {
        const deps = makeDeps();
        const svc = new NotificationWebhookService(deps);
        const wh = await svc.addWebhook({
            provider: 'slack',
            name: 'Test',
            webhookUrl: 'https://hooks.slack.com/test',
            enabled: true,
            events: ['system:notification'],
        });
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
        const result = await svc.testWebhook(wh.id);
        expect(result.ok).toBe(true);
    });

    it('should return false for unknown webhook test', async () => {
        const svc = new NotificationWebhookService(makeDeps());
        const result = await svc.testWebhook('nonexistent');
        expect(result.ok).toBe(false);
    });

    it('should destroy and clean up listeners', async () => {
        const deps = makeDeps();
        const svc = new NotificationWebhookService(deps);
        await svc.init();
        svc.destroy();
        expect(svc.getWebhooks()).toEqual([]);
    });

    it('should subscribe to events on init', async () => {
        const deps = makeDeps();
        const svc = new NotificationWebhookService(deps);
        await svc.init();
        expect(deps.eventBus.on).toHaveBeenCalled();
        svc.destroy();
    });

    it('should persist on write operations', async () => {
        const deps = makeDeps();
        const svc = new NotificationWebhookService(deps);
        await svc.addWebhook({
            provider: 'slack',
            name: 'Test',
            webhookUrl: 'https://hooks.slack.com/test',
            enabled: true,
            events: ['system:notification'],
        });
        expect(deps.database.setKv).toHaveBeenCalled();
    });
});
