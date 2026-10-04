import { getDexieDb } from './database-service';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('Telegram');

export interface TelegramBridge {
    agentId: string;
    botToken: string;
    channelId?: string;
    allowedChatIds?: number[];
}

/**
 * Minimal Telegram per-agent bridge — stores botToken in Dexie agentMemory
 * and delivers via Bot API sendMessage.
 */

// C-3: BotFather tokens look like `123456:ABC-DEF...` (digits, colon, 35-char
// secret). Memory rows are attacker-writable, so shape-check on write AND on
// read; malformed rows are skipped, never used.
const BOT_TOKEN_RE = /^\d{5,}:[A-Za-z0-9_-]{20,}$/;

export function isValidBotToken(token: unknown): token is string {
    return typeof token === 'string' && BOT_TOKEN_RE.test(token.trim());
}
export class TelegramService {
    async setBot(agentId: string, cfg: { botToken: string; allowedChatIds?: number[]; channelId?: string }): Promise<void> {
        if (!isValidBotToken(cfg.botToken)) {
            throw new Error('Invalid Telegram bot token shape');
        }
        await getDexieDb().agentMemory.add({
            agentId,
            type: 'KNOWLEDGE',
            content: JSON.stringify({ kind: 'telegram', ...cfg }),
            createdAt: Date.now(),
        } as never);
        LOGGER.info('Telegram', 'bot set', { agentId });
    }

    async getBot(agentId: string): Promise<TelegramBridge | null> {
        const rows = (await getDexieDb().agentMemory.where('agentId').equals(agentId).toArray()) as Array<{ content: string }>;
        for (let i = rows.length - 1; i >= 0; i--) {
            try {
                const obj = JSON.parse(rows[i]!.content) as TelegramBridge & { kind?: string };
                if (obj.kind === 'telegram' && isValidBotToken(obj.botToken)) return obj;
            } catch { /* best-effort */ }
        }
        return null;
    }

    async bridgeMessage(agentId: string, text: string, chatId: number): Promise<void> {
        const bot = await this.getBot(agentId);
        if (!bot) throw new Error(`No bot for agent ${agentId}`);
        if (bot.allowedChatIds && !bot.allowedChatIds.includes(chatId)) throw new Error(`Chat ${chatId} not whitelisted`);
        // P-HIGH-6: real delivery (was a log-only stub). The token was
        // shape-validated on write and re-validated on read in getBot().
        const target = bot.channelId ?? String(chatId);
        let res: Response;
        try {
            res = await fetch(`https://api.telegram.org/bot${bot.botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: target, text: text.slice(0, 4096) }),
            });
        } catch (e) {
            throw new Error(`Telegram send failed: ${e instanceof Error ? e.message : String(e)}`, {
                cause: e,
            });
        }
        if (!res.ok) {
            throw new Error(`Telegram send failed: HTTP ${res.status}`);
        }
        LOGGER.info('Telegram', 'bridge send', { agentId, chatId, len: text.length });
    }
}

export const telegramService = new TelegramService();
