import { expect, test } from '@playwright/test';
import { boot, idbAll, idbGet, idbPut, stubOpenRouter, stubOpenRouterToolCall, STUB_MODEL } from './helpers';

/** Seed a working key so the assistant can actually call the model. */
async function seedKey(page: import('@playwright/test').Page) {
    await idbPut(page, 'apiKeys', {
        id: 'e2e-or-assistant',
        provider: 'OpenRouter',
        key: 'sk-or-e2e-test-key-assistant',
        label: 'e2e-assistant-key',
        status: 'active',
        availableModels: [STUB_MODEL],
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

/**
 * The assistant panel must work in the real app: it renders, it takes a
 * question, it streams an answer and it does not break when the runtime has
 * no API key configured.
 */
test.describe('assistant panel', () => {
    test('renders and accepts a question', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await boot(page);
        await page.goto('/assistant');

        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        // The suggestions are the entry points of the panel.
        await expect(page.getByRole('button', { name: /панель памяти/i }).first()).toBeVisible();

        // The user question reaches the assistant and the UI stays alive.
        const input = page.getByLabel('Вопрос помощнику');
        await expect(input).toBeVisible();
        await input.fill('где панель памяти?');
        await input.press('Enter');

        // The user question is echoed in the thread.
        await expect(page.getByText('где панель памяти?')).toBeVisible({ timeout: 30000 });

        // No uncaught exception in the page.
        expect(errors).toEqual([]);
    });

    test('the trust ledger is visible', async ({ page }) => {
        await boot(page);
        await page.goto('/assistant');

        // The ledger lists what the system can do and how far it is trusted.
        const trust = page.locator('.assistant-trust__badge').first();
        await expect(trust).toBeVisible({ timeout: 60000 });
        await expect(trust).toContainText(/verified|discovered|declared/);
    });

    test('a screenshot of the panel', async ({ page }) => {
        await boot(page);
        await seedKey(page);
        await stubOpenRouter(page);
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });
        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('где панель памяти и что её обслуживает?');
        // Enter submits the form; clicking the button is flaky while the
        // layout shifts under the streaming answer.
        await input.press('Enter');
        await expect(page.getByText(/-PATH-42/).first()).toBeVisible({ timeout: 90000 });
        await page.screenshot({ path: 'test-results/assistant-panel.png', fullPage: false });
    });

    test('the assistant actually acts: opens the panel it was asked for', async ({ page }) => {
        await boot(page);
        await seedKey(page);
        await stubOpenRouterToolCall(page, {
            tool: 'ui.openPanel',
            args: { panelId: 'agents', reason: 'e2e' },
            reply: 'Панель агентов открыта.',
        });
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('открой панель агентов');
        await input.press('Enter');

        // The tool call crossed the streaming adapter, the registry ran it and
        // the interface confirmed the navigation: the browser is on /agents.
        await page.waitForURL('**/agents', { timeout: 90000 });
    });

    test('a write action waits for the human, then reports what changed', async ({ page }) => {
        await boot(page);
        await seedKey(page);
        await stubOpenRouterToolCall(page, {
            tool: 'settings.update',
            args: { defaultMode: 'single' },
            reply: 'Режим по умолчанию теперь single.',
        });
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('поставь режим по умолчанию single');
        await input.press('Enter');

        // The guarded action does not run by itself: the global approval layer
        // asks the human first and names the tool it wants to use.
        await expect(page.getByText('Инструмент: settings.update')).toBeVisible({ timeout: 90000 });
        await page.getByRole('button', { name: 'Разрешить' }).click();

        // Only after approval the tool runs and the model continues the answer.
        // (The answer used to vanish: the cache replayed the empty tool-call
        // turn back into the loop, so the second round had no text and no calls.)
        await expect(page.getByText('Режим по умолчанию теперь single.')).toBeVisible({
            timeout: 90000,
        });
    });

    test('the assistant delegates a task and the task really lands on the board', async ({
        page,
    }) => {
        await boot(page);
        await seedKey(page);
        const title = 'Собрать отчёт по релизу';
        await stubOpenRouterToolCall(page, {
            tool: 'tasks.create',
            args: { title, agentId: 'assistant', priority: 'HIGH' },
            reply: 'Задача создана и назначена.',
        });
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('делегируй себе отчёт по релизу');
        await input.press('Enter');

        await expect(page.getByText('Инструмент: tasks.create')).toBeVisible({ timeout: 90000 });
        await page.getByRole('button', { name: 'Разрешить' }).click();
        await expect(page.getByText('Задача создана и назначена.')).toBeVisible({
            timeout: 90000,
        });

        // The reply alone is not proof: the row has to exist in the app's own
        // database, with the assignee and priority that were approved.
        const tasks = await idbAll<{ title: string; assigneeId?: string; priority?: string }>(
            page,
            'agemsTasks',
        );
        expect(tasks.some((t) => t.title === title)).toBe(true);
        const stored = tasks.find((t) => t.title === title);
        expect(stored?.assigneeId).toBe('assistant');
        expect(stored?.priority).toBe('HIGH');

        // And the human sees it where the work is managed, not only in the DB.
        await page.goto('/tasks');
        await expect(page.getByText(title).first()).toBeVisible({ timeout: 90000 });
    });

    test('a checkup runs the read capabilities without asking for approval', async ({ page }) => {
        await boot(page);
        await seedKey(page);
        await stubOpenRouterToolCall(page, {
            tool: 'system.checkup',
            args: {},
            reply: 'Проверка выполнена.',
        });
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('проверь, что всё работает');
        await input.press('Enter');

        // A read is not gated: no approval modal, the answer just continues.
        await expect(page.getByText('Проверка выполнена.')).toBeVisible({ timeout: 120000 });
        await expect(page.getByRole('button', { name: 'Разрешить' })).toHaveCount(0);
    });

    test('the assistant is a real agent in the topology', async ({ page }) => {
        await boot(page);
        await page.goto('/agents');

        // The assistant is not a side panel: it is a node of the topology and
        // the admin shows it as a built-in agent.
        const search = page.getByLabel('Search agents');
        await expect(search).toBeVisible({ timeout: 60000 });
        await search.fill('Project Assistant');
        await expect(page.getByText('Project Assistant').first()).toBeVisible({ timeout: 30000 });
        await expect(page.getByText('built-in').first()).toBeVisible({ timeout: 30000 });
        await page.screenshot({ path: 'test-results/assistant-agent.png', fullPage: false });
    });

    test('repeated mistakes become a proposal that still waits for the human', async ({
        page,
    }) => {
        await boot(page);
        await seedKey(page);

        // Two recorded mistakes about the same subsystem: the assistant writes
        // them itself, through the same approval gate as any other write.
        await stubOpenRouterToolCall(page, {
            tool: 'diary.write',
            args: {
                kind: 'mistake',
                text: 'Said the schedule was created without reading it back',
                tags: ['scheduler'],
            },
            reply: 'Записал первую ошибку.',
        });
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('Запиши мою ошибку с расписанием');
        await input.press('Enter');
        await expect(page.getByText('Инструмент: diary.write')).toBeVisible({ timeout: 90000 });
        await page.getByRole('button', { name: 'Разрешить' }).click();
        await expect(page.getByText('Записал первую ошибку.')).toBeVisible({ timeout: 90000 });

        // A second mistake with the same tag: only a repeat is evidence.
        await stubOpenRouterToolCall(page, {
            tool: 'diary.write',
            args: {
                kind: 'mistake',
                text: 'Missed a paused schedule',
                evidence: 'the list showed pausedAt set',
                tags: ['scheduler'],
            },
            reply: 'Записал вторую ошибку.',
        });
        await input.fill('Запиши ещё одну ошибку с расписанием');
        await input.press('Enter');
        await expect(page.getByText('Инструмент: diary.write')).toBeVisible({ timeout: 90000 });
        await page.getByRole('button', { name: 'Разрешить' }).click();
        await expect(page.getByText('Записал вторую ошибку.')).toBeVisible({ timeout: 90000 });

        await stubOpenRouterToolCall(page, {
            tool: 'system.improve',
            args: {},
            reply: 'Записал предложение в дневник.',
        });
        await input.fill('Сделай вывод из своих ошибок');
        await input.press('Enter');

        // The proposal is a write, so the human still decides.
        await expect(page.getByText('Инструмент: system.improve')).toBeVisible({
            timeout: 90000,
        });
        await page.getByRole('button', { name: 'Разрешить' }).click();
        await expect(page.getByText('Записал предложение в дневник.')).toBeVisible({
            timeout: 90000,
        });

        // Proof beyond the reply: the diary now holds the decision the assistant
        // proposed, tagged improvement+proposal, and the prompt was not touched.
        const journal = await idbAll<{
            id: string;
            value: Array<{ tags?: string[]; taskType?: string; taskDescription?: string }>;
        }>(page, 'keyValue');
        const rows = journal.find((kv) => kv.id === 'agent_journal_v1')?.value ?? [];
        const proposal = rows.find((r) => (r.tags ?? []).includes('proposal'));
        expect(proposal).toBeTruthy();
        expect(proposal?.tags).toContain('improvement');
        expect(proposal?.tags).toContain('scheduler');
        expect(proposal?.taskType).toBe('assistant.decision');
        expect(proposal?.taskDescription).toContain('re-check the result');
    });

    test('the assistant pauses a schedule it created', async ({ page }) => {
        await boot(page);
        await seedKey(page);

        const name = 'Ночной обзор системы';
        await stubOpenRouterToolCall(page, {
            tool: 'scheduler.create',
            args: { name, prompt: 'Проверь состояние системы', frequency: 'daily' },
            reply: 'Расписание создано.',
        });
        await page.reload();
        await boot(page);
        await page.goto('/assistant');
        await expect(page.getByRole('heading', { name: /помощник проекта/i })).toBeVisible({
            timeout: 60000,
        });

        const input = page.getByLabel('Вопрос помощнику');
        await input.fill('создай ежедневное расписание');
        await input.press('Enter');
        await expect(page.getByText('Инструмент: scheduler.create')).toBeVisible({
            timeout: 90000,
        });
        await page.getByRole('button', { name: 'Разрешить' }).click();
        await expect(page.getByText('Расписание создано.')).toBeVisible({ timeout: 90000 });

        // The id has to come from the app's own storage: the reply text is not
        // proof, and the assistant can only pause what really exists.
        interface ScheduleRow {
            id: string;
            name: string;
            enabled: boolean;
            cronExpression: string;
        }
        const schedules = (await idbGet<ScheduleRow[]>(page, 'keyValue', 'schedules')) ?? [];
        const created = schedules.find((s) => s.name === name);
        expect(created).toBeTruthy();
        expect(created?.enabled).toBe(true);

        await stubOpenRouterToolCall(page, {
            tool: 'scheduler.toggle',
            args: { id: created?.id, enabled: false },
            reply: 'Расписание на паузе.',
        });
        await input.fill('поставь это расписание на паузу');
        await input.press('Enter');
        await expect(page.getByText('Инструмент: scheduler.toggle')).toBeVisible({
            timeout: 90000,
        });
        await page.getByRole('button', { name: 'Разрешить' }).click();
        await expect(page.getByText('Расписание на паузе.')).toBeVisible({ timeout: 90000 });

        const after = (await idbGet<ScheduleRow[]>(page, 'keyValue', 'schedules')) ?? [];
        expect(after.find((s) => s.id === created?.id)?.enabled).toBe(false);

        // And the human sees the paused schedule where schedules live.
        await page.goto('/scheduler');
        await expect(page.getByText(name).first()).toBeVisible({ timeout: 90000 });
    });
});
