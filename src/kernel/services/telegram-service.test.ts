import { describe, it, expect, vi, beforeEach } from 'vitest';

type Row = { content: string };
const rows: Row[] = [];

vi.mock('./database-service', () => ({
    getDexieDb: () => ({
        agentMemory: {
            where: () => ({
                equals: async () => rows,
            }),
            add: async (row: Row) => {
                rows.push(row);
            },
        },
    }),
}));

import { telegramService, isValidBotToken } from './telegram-service';

const GOOD_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

describe('isValidBotToken (C-3)', () => {
    it('accepts BotFather-shaped tokens', () => {
        expect(isValidBotToken(GOOD_TOKEN)).toBe(true);
        expect(isValidBotToken('  ' + GOOD_TOKEN + '  ')).toBe(true);
    });

    it('rejects malformed tokens', () => {
        for (const bad of ['', 'not-a-token', 'abc:short', ':nokey', '123456:', 42, null, undefined, {}, []]) {
            expect(isValidBotToken(bad)).toBe(false);
        }
    });
});

describe('TelegramService bot storage (C-3)', () => {
    beforeEach(() => {
        rows.length = 0;
    });

    it('setBot refuses malformed tokens without writing memory', async () => {
        await expect(telegramService.setBot('a1', { botToken: 'evil' })).rejects.toThrow(
            /invalid telegram bot token/i,
        );
        expect(rows).toHaveLength(0);
    });

    it('setBot stores shaped tokens', async () => {
        await telegramService.setBot('a1', { botToken: GOOD_TOKEN });
        expect(rows).toHaveLength(1);
    });

    it('getBot skips poisoned rows and returns the newest valid one', async () => {
        rows.push({ content: JSON.stringify({ kind: 'telegram', botToken: GOOD_TOKEN }) });
        rows.push({ content: JSON.stringify({ kind: 'telegram', botToken: 'attacker-junk' }) });
        rows.push({ content: 'not json at all' });
        const bot = await telegramService.getBot('a1');
        expect(bot?.botToken).toBe(GOOD_TOKEN);
    });

    it('getBot returns null when only poisoned rows exist', async () => {
        rows.push({ content: JSON.stringify({ kind: 'telegram', botToken: 'junk' }) });
        await expect(telegramService.getBot('a1')).resolves.toBeNull();
    });
});

describe('TelegramService bridgeMessage (P-HIGH-6)', () => {
    beforeEach(() => {
        rows.length = 0;
        vi.unstubAllGlobals();
    });

    async function seedBot(overrides = {}) {
        rows.push({
            content: JSON.stringify({ kind: 'telegram', botToken: GOOD_TOKEN, ...overrides }),
        });
    }

    it('POSTs to Bot API with the configured token', async () => {
        await seedBot();
        const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
            ok: true,
            json: async () => ({ ok: true }),
        }));
        vi.stubGlobal('fetch', fetchMock);
        await telegramService.bridgeMessage('a1', 'hello', 42);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
            `https://api.telegram.org/bot${GOOD_TOKEN}/sendMessage`,
        );
        expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body))).toMatchObject({
            chat_id: '42',
            text: 'hello',
        });
    });

    it('throws on HTTP error and on network failure', async () => {
        await seedBot();
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })));
        await expect(telegramService.bridgeMessage('a1', 'hi', 1)).rejects.toThrow(/HTTP 401/);
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('down');
            }),
        );
        await expect(telegramService.bridgeMessage('a1', 'hi', 1)).rejects.toThrow(/send failed/);
    });

    it('throws without fetching when no bot or chat not whitelisted', async () => {
        const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
        vi.stubGlobal('fetch', fetchMock);
        await expect(telegramService.bridgeMessage('nobody', 'hi', 1)).rejects.toThrow(/no bot/i);
        await seedBot({ allowedChatIds: [7] });
        await expect(telegramService.bridgeMessage('a1', 'hi', 8)).rejects.toThrow(/whitelist/);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
