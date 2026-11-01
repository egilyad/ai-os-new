import { getDexieDb } from './database-service';
import { rootLogger } from './logger-service';
import { lazyService } from '../service-helper';
import type { IKeyVaultService } from '../contracts/key-vault';

const LOGGER = rootLogger.child('Telegram');

// SPEC_01: botToken хранится либо в открытом виде (legacy, vault не активен),
// либо как зашифрованный VaultPackage (через keyVault). При заблокированном
// vault зашифрованные токены не расшифровываются (fail-closed).
const vault = lazyService<IKeyVaultService>('keyVault');

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
    private async sealToken(token: string): Promise<{ encrypted: boolean; data: string }> {
        try {
            if (!vault.isLocked()) {
                const sealed = await vault.encryptKey(token);
                if (sealed) return { encrypted: true, data: sealed };
            }
        } catch {
            // vault не зарегистрирован/заблокирован — legacy plaintext
        }
        return { encrypted: false, data: token };
    }

    private async unsealToken(payload: { encrypted: boolean; data: string }): Promise<string | null> {
        if (payload.encrypted) {
            try {
                if (vault.isLocked()) return null;
                return await vault.decryptKey(payload.data);
            } catch {
                return null;
            }
        }
        return payload.data;
    }

    async setBot(agentId: string, cfg: { botToken: string; allowedChatIds?: number[]; channelId?: string }): Promise<void> {
        if (!isValidBotToken(cfg.botToken)) {
            throw new Error('Invalid Telegram bot token shape');
        }
        const tokenPayload = await this.sealToken(cfg.botToken);
        await getDexieDb().agentMemory.add({
            agentId,
            type: 'KNOWLEDGE',
            content: JSON.stringify({ kind: 'telegram', ...cfg, botToken: tokenPayload }),
            createdAt: Date.now(),
        } as never);
        LOGGER.info('Telegram', 'bot set', { agentId });
    }

    async getBot(agentId: string): Promise<TelegramBridge | null> {
        const rows = (await getDexieDb().agentMemory.where('agentId').equals(agentId).toArray()) as Array<{ content: string }>;
        for (let i = rows.length - 1; i >= 0; i--) {
            try {
                const obj = JSON.parse(rows[i]!.content) as TelegramBridge & { kind?: string; botToken?: unknown };
                if (obj.kind !== 'telegram') continue;
                if (typeof obj.botToken === 'object' && obj.botToken !== null) {
                    const unsealed = await this.unsealToken(obj.botToken as { encrypted: boolean; data: string });
                    if (unsealed && isValidBotToken(unsealed)) {
                        return { agentId, botToken: unsealed, channelId: obj.channelId, allowedChatIds: obj.allowedChatIds };
                    }
                    continue;
                }
                if (typeof obj.botToken === 'string' && isValidBotToken(obj.botToken)) return obj;
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
        // P-RES-1: bounded retry with backoff + timeout so a hung/transient
        // Telegram API doesn't leave the promise pending or drop the message.
        const url = `https://api.telegram.org/bot${bot.botToken}/sendMessage`;
        const body = JSON.stringify({ chat_id: target, text: text.slice(0, 4096) });
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    signal: AbortSignal.timeout(8000),
                });
                if (res.ok) {
                    LOGGER.info('Telegram', 'bridge send', { agentId, chatId, len: text.length });
                    return;
                }
                lastError = new Error(`Telegram send failed: HTTP ${res.status}`);
                if (res.status !== 429 && (res.status < 500 || res.status > 599)) break;
            } catch (e) {
                lastError = e;
                if (e instanceof DOMException && e.name === 'TimeoutError') break;
            }
            if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
            }
        }
        throw new Error(
            `Telegram send failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
            { cause: lastError },
        );
    }

    destroy(): void {
        // No long-lived timers/subscriptions; retry timeouts are request-scoped.
    }
}

export const telegramService = new TelegramService();
