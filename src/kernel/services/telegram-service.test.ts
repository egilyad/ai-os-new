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
