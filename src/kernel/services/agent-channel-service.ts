/**
 * Agent-to-Agent Channel — AGEMS 0.5
 * Loop prevention: max 6 exchanges per pair per 10 minutes
 * Cross-channel context injection via last 5 messages
 */
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentChannel');
const MAX_EXCHANGES_PER_PAIR = 6;
const WINDOW_MS = 10 * 60 * 1000;

interface Exchange {
    pair: string; // "aId->bId" sorted
    timestamps: number[];
}

const exchanges: Exchange[] = [];

function pairKey(a: string, b: string): string {
    return [a, b].sort().join('->');
}

export function canExchange(aId: string, bId: string): boolean {
    const key = pairKey(aId, bId);
    const now = Date.now();
    const entry = exchanges.find((e) => e.pair === key);
    if (!entry) return true;
    // purge old
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < WINDOW_MS);
    return entry.timestamps.length < MAX_EXCHANGES_PER_PAIR;
}

export function recordExchange(aId: string, bId: string): void {
    const key = pairKey(aId, bId);
    let entry = exchanges.find((e) => e.pair === key);
    if (!entry) {
        entry = { pair: key, timestamps: [] };
        exchanges.push(entry);
    }
    entry.timestamps.push(Date.now());
}

export function getCrossChannelContext(agentId: string, allMessages: Array<{ channelId: string; text: string }>): string {
    // Inject last 5 messages from other channels
    return allMessages.slice(-5).map((m) => `[${m.channelId}]: ${m.text}`).join('\n');
}

export function sendAgentMessage(fromId: string, toId: string, text: string): { ok: boolean; reason?: string } {
    if (!canExchange(fromId, toId)) {
        LOGGER.warn('AgentChannel', 'loop prevention hit', { fromId, toId });
        return { ok: false, reason: `Max ${MAX_EXCHANGES_PER_PAIR} exchanges per pair per 10min` };
    }
    recordExchange(fromId, toId);
    LOGGER.info('AgentChannel', 'message', { fromId, toId, len: text.length });
    return { ok: true };
}
