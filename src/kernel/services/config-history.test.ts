import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigHistoryService } from './config-history';
import { CONFIG } from './config-registry';

describe('ConfigHistoryService', () => {
    let service: ConfigHistoryService;

    beforeEach(async () => {
        localStorage.removeItem('config_history_v1');
        service = new ConfigHistoryService();
        await service.init();
    });

    it('should seed initial version and register new commits', async () => {
        const history = service.getHistory();

        expect(history).toHaveLength(1);
        expect(history[0].author).toBe('System');
        expect(history[0].comment).toContain('Initial configuration seed');

        const nextConfig = JSON.parse(JSON.stringify(CONFIG));
        nextConfig.version = '1.0.1';
        nextConfig.llm.retry.maxRetries = 5;

        const commit1 = await service.commit(nextConfig, 'Alice', 'Change max retries to 5');
        expect(service.getHistory()).toHaveLength(2);
        expect(commit1.author).toBe('Alice');
        expect(commit1.configSnapshot.llm.retry.maxRetries).toBe(5);
    });

    it('should roll back live CONFIG values to historical snapshotted properties', async () => {
        const originalRetries = CONFIG.llm.retry.maxRetries;

        const modifiedConfig = JSON.parse(JSON.stringify(CONFIG));
        modifiedConfig.llm.retry.maxRetries = 99;

        await service.commit(modifiedConfig, 'Bob', 'Bump max retries up');

        // Mutate live config by mimicking the commit
        CONFIG.llm.retry.maxRetries = 99;

        // Rollback to seed (first entry)
        const seedId = service.getHistory()[0].id;
        await service.rollback(seedId, 'Admin');

        expect(CONFIG.llm.retry.maxRetries).toBe(originalRetries);
        const historyLen = service.getHistory().length;
        expect(historyLen).toBeGreaterThanOrEqual(3);
        const last = service.getHistory()[historyLen - 1];
        expect(last.comment).toContain('Rollback to version');
    });

    it('should generate accurate added, deleted, and updated diff items', async () => {
        const baseId = service.getHistory()[0].id;

        const modifiedConfig = JSON.parse(JSON.stringify(CONFIG));
        modifiedConfig.llm.retry.maxRetries = 77; // Updated
        modifiedConfig.llm.customNewSetting = 'added-value'; // Added
        delete modifiedConfig.webhooks; // Deleted

        const nextVer = await service.commit(
            modifiedConfig,
            'Charlie',
            'Modify config for diffing',
        );
        const diff = service.diff(baseId, nextVer.id);

        expect(diff.updated).toContainEqual(
            expect.objectContaining({
                path: 'llm.retry.maxRetries',
                oldValue: CONFIG.llm.retry.maxRetries,
                newValue: 77,
            }),
        );
        expect(diff.added).toContainEqual(
            expect.objectContaining({ path: 'llm.customNewSetting', value: 'added-value' }),
        );
        expect(diff.deleted).toContainEqual(expect.objectContaining({ path: 'webhooks' }));
    });
});
