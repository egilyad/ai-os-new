/**
 * Context Builder Service — AGEMS port, Phase 11.4.
 * Collects recent messages from other channels for context injection.
 */
import { rootLogger } from './logger-service';

const log = rootLogger.child('ContextBuilderService');

export interface ChannelMessage {
    id: string;
    channelId: string;
    sender: string;
    content: string;
    timestamp: number;
}

export interface ContextWindow {
    channelId: string;
    messages: ChannelMessage[];
    tokenEstimate: number;
}

export class ContextBuilderService {
    private channelMessages = new Map<string, ChannelMessage[]>();
    private maxMessagesPerChannel = 20;
    private maxContextTokens = 2000;

    /**
     * Record a message from a channel.
     */
    recordMessage(channelId: string, message: Omit<ChannelMessage, 'id' | 'timestamp'>): void {
        const entry: ChannelMessage = {
            id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...message,
            timestamp: Date.now(),
        };
        const msgs = this.channelMessages.get(channelId) ?? [];
        msgs.push(entry);
        if (msgs.length > this.maxMessagesPerChannel) {
            msgs.splice(0, msgs.length - this.maxMessagesPerChannel);
        }
        this.channelMessages.set(channelId, msgs);
    }

    /**
     * Build context window from other channels.
     */
    buildContext(excludeChannelId: string, maxTokens?: number): ContextWindow[] {
        const maxToks = maxTokens ?? this.maxContextTokens;
        const windows: ContextWindow[] = [];
        let totalTokens = 0;

        for (const [channelId, messages] of this.channelMessages) {
            if (channelId === excludeChannelId) continue;
            if (totalTokens >= maxToks) break;

            // Take last N messages (most recent)
            const recent = messages.slice(-10);
            const tokenEst = this.estimateTokens(recent);

            if (totalTokens + tokenEst <= maxToks) {
                windows.push({ channelId, messages: recent, tokenEstimate: tokenEst });
                totalTokens += tokenEst;
            }
        }
        return windows;
    }

    /**
     * Format context windows into a string for LLM injection.
     */
    formatContext(windows: ContextWindow[]): string {
        if (windows.length === 0) return '';
        const parts: string[] = ['[Cross-channel context]'];
        for (const w of windows) {
            parts.push(`\n--- Channel: ${w.channelId} ---`);
            for (const msg of w.messages) {
                parts.push(`${msg.sender}: ${msg.content}`);
            }
        }
        return parts.join('\n');
    }

    /**
     * Get messages from a specific channel.
     */
    getChannelMessages(channelId: string): ChannelMessage[] {
        return this.channelMessages.get(channelId) ?? [];
    }

    /**
     * Clear messages from a channel.
     */
    clearChannel(channelId: string): void {
        this.channelMessages.delete(channelId);
    }

    /**
     * Clear all channels.
     */
    clearAll(): void {
        this.channelMessages.clear();
    }

    private estimateTokens(messages: ChannelMessage[]): number {
        // Rough estimate: ~4 chars per token
        return Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4);
    }
}
