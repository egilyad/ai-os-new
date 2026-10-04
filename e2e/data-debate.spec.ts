import { test, expect } from '@playwright/test';
import { boot, dismissWizard, idbPut } from './helpers';

// Debate/chat history data-flow: seeded Dexie rows must surface in the UI
// after reload (store hydration -> render). Conventions verified 2026-10:
// - debateSessions keyed by id, history lists phase='completed' rows;
// - sessions keyed by id, sidebar lists titles.

test.describe('AI-OS Data Debate History', () => {
    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('seeded completed debate renders in history', async ({ page }) => {
        const now = Date.now();
        const count = await idbPut(page, 'debateSessions', {
            id: 'e2e-debate-1',
            topic: 'E2E seeded debate topic',
            topologyType: 'roundtable',
            phase: 'completed',
            round: 3,
            totalTokens: 100,
            totalCost: 0,
            agentStates: '[]',
            arguments: '[]',
            topology: '{}',
            participants: '[]',
            memory: '{}',
            startedAt: now - 60000,
            updatedAt: now,
            createdAt: now - 60000,
        });
        expect(count).toBeGreaterThanOrEqual(1);

        await page.reload();
        await boot(page);
        await page.goto('/debate-history');
        await dismissWizard(page);
        await expect(page.getByText('E2E seeded debate topic').first()).toBeVisible({
            timeout: 30000,
        });
    });

    test('seeded chat session renders in sidebar', async ({ page }) => {
        const now = Date.now();
        await idbPut(page, 'sessions', {
            id: 'e2e-chat-1',
            title: 'E2E seeded chat',
            history: [
                {
                    id: 'e1',
                    role: 'user',
                    text: 'seeded hello',
                    responses: [],
                    timestamp: now,
                },
            ],
            createdAt: now,
            updatedAt: now,
        });

        await page.reload();
        await boot(page);
        await page.goto('/chat');
        await dismissWizard(page);
        await expect(page.getByText('E2E seeded chat').first()).toBeVisible({
            timeout: 30000,
        });
    });
});
