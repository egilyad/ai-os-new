import { getDexieDb } from './dexie-schema';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('Telegram');

export interface TelegramBridge {
    agentId: string;
    botToken: string;
    channelId?: string;
    allowedChatIds?: number[];
}

/**
 * Minimal Telegram per-agent bridge — stores botToken in Dexie agentMemory (type TELEGRAM)
 * and provides send/receive hooks via EventBus. Real polling/webhook to be added with
 * MTProto/Telethon-style sessionString (AGEMS telegramConfig).
 */
export class TelegramService {
    async setBot(agentId: string, cfg: { botToken: string; allowedChatIds?: number[]; channelId?: string }): Promise<void> {
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
                if (obj.kind === 'telegram' && obj.botToken) return obj;
            } catch {}
        }
        return null;
    }

    async bridgeMessage(agentId: string, text: string, chatId: number): Promise<void> {
        const bot = await this.getBot(agentId);
        if (!bot) throw new Error(`No bot for agent ${agentId}`);
        if (bot.allowedChatIds && !bot.allowedChatIds.includes(chatId)) throw new Error(`Chat ${chatId} not whitelisted`);
        // Stub: in prod would POST to https://api.telegram.org/bot${bot.botToken}/sendMessage
        LOGGER.info('Telegram', 'bridge send', { agentId, chatId, len: text.length });
    }
}

export const telegramService = new TelegramService();
