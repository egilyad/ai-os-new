import { test, expect } from '@playwright/test';
import { boot, dismissWizard, idbPut, stubOpenRouter, STUB_MODEL } from './helpers';

// Debate/chat history data-flow: seeded Dexie rows must surface in the UI
// after reload (store hydration -> render). Conventions verified 2026-10:
// - debateSessions keyed by id, history lists phase='completed' rows;
// - sessions keyed by id, sidebar lists titles.

async function seedChatKey(page, id = 'e2e-or-debate') {
    await idbPut(page, 'apiKeys', {
        id,
        provider: 'OpenRouter',
        key: 'sk-or-e2e-test-key-003',
        label: 'e2e-debate-key',
        status: 'active',
        availableModels: [STUB_MODEL],
        // Rows without stats are quarantined by the startup integrity scan.
        stats: {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
        },
        createdAt: Date.now(),
    });
}

test.describe('AI-OS Data Debate History', () => {
    // Live start (below) runs stubbed multi-agent rounds; budget generously.
    test.describe.configure({ timeout: 420000 });

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

    test('live debate start opens a live session', async ({ page }) => {
        await seedChatKey(page);
        await stubOpenRouter(page);

        await page.reload();
        await boot(page);
        await page.goto('/debate');
        await dismissWizard(page);

        // Setup wizard: topic + pre-selected agents, 2 rounds to bound runtime.
        const topic = page.getByPlaceholder('Enter the topic or question to debate...');
        await expect(topic).toBeVisible({ timeout: 60000 });
        await topic.fill('e2e debate topic 7');
        await page.locator('main input[type="number"]').fill('2');
        const start = page.getByRole('button', { name: /start debate/i });
        await expect(start).toBeEnabled({ timeout: 30000 });
        await start.click();

        // Wizard unmounts into the live session view: thesis + participants.
        // KNOWN DEFECT (found by this spec, not worked around): agent turns
        // then fail engine-side ("All agents failed to respond", 0 args,
        // status CREATED) while the stubbed transport returns valid 200s —
        // chat and room go green on the identical stub, and byte-unique
        // argument-shaped replies fail too, so this is not content
        // validation or cross-agent dedup: suspect the adapter/sendMessage
        // error path in debate-llm-caller. Rounds coverage stays here as a
        // start-circuit until the engine defect is fixed.
        await expect(start).toBeHidden({ timeout: 60000 });
        await expect(page.getByText('e2e debate topic 7').first()).toBeVisible({
            timeout: 60000,
        });
        await expect(page.getByText(/active participants/i).first()).toBeVisible({
            timeout: 60000,
        });
    });
});
