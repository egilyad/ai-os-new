/**
 * Chat Summarization Service
 * Auto-generates rolling summaries for long conversations
 */

import { rootLogger } from './logger-service';
import { EVENTS } from '../events/event-names';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { sanitizePromptVar } from '../utils/sanitize';
import { BucketStorageAdapter } from './storage-adapter';

const LOGGER = rootLogger.child('ChatSummarizer');

const STORAGE_KEY = 'chat_summaries_v1';

export interface ChatSummary {
    sessionId: string;
    summary: string;
    keyPoints: string[];
    keyFacts: string[];
    decisions: string[];
    unresolved: string[];
    messageCount: number;
    createdAt: number;
}

export interface SummarizationConfig {
    triggerAfterMessages: number; // Default: 30
    maxSummaryLength: number; // Default: 500 chars
    minSummaryLength: number; // Default: 100 chars
    provider?: string;
    model?: string;
}

const DEFAULT_CONFIG: SummarizationConfig = {
    triggerAfterMessages: 30,
    maxSummaryLength: 500,
    minSummaryLength: 100,
};

export interface SummarizerMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

const MAX_SUMMARIES = 200;

export class ChatSummarizerService {
    private config: SummarizationConfig;
    private summaries: Map<string, ChatSummary> = new Map();
    private llmClient: ILLMClientService;
    private loaded = false;

    private _eventBus: IEventBus | null = null;

    constructor(
        llmClient: ILLMClientService,
        config: Partial<SummarizationConfig> = {},
        eventBus?: IEventBus,
    ) {
        this.llmClient = llmClient;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this._eventBus = eventBus ?? null;
    }

    async #ensureLoaded(): Promise<void> {
        if (this.loaded) return;
        const raw = await BucketStorageAdapter.UI.get<Record<string, ChatSummary>>(STORAGE_KEY);
        if (raw) {
            this.summaries = new Map(Object.entries(raw));
        }
        this.loaded = true;
    }

    async #persist(): Promise<void> {
        const obj: Record<string, ChatSummary> = {};
        for (const [k, v] of this.summaries) {
            obj[k] = v;
        }
        await BucketStorageAdapter.UI.set(STORAGE_KEY, obj);
    }

    /**
     * Check if summarization is needed
     */
    shouldSummarize(_sessionId: string, messageCount: number): boolean {
        return messageCount >= this.config.triggerAfterMessages;
    }

    /**
     * Generate summary for a chat session
     */
    async generateSummary(
        sessionId: string,
        messages: SummarizerMessage[],
    ): Promise<ChatSummary | null> {
        await this.#ensureLoaded();
        if (messages.length < this.config.triggerAfterMessages) {
            LOGGER.debug('ChatSummarizer', 'Not enough messages to summarize', {
                sessionId,
                count: messages.length,
            });
            return null;
        }

        try {
            // Build messages for summarization prompt
            const conversationText = messages
                .slice(-Math.min(messages.length, this.config.triggerAfterMessages + 10))
                .map((m) => `${m.role}: ${m.content}`)
                .join('\n\n');

            const safeConv = sanitizePromptVar(conversationText);
            const prompt = `Analyze this conversation and create a structured summary.

CONVERSATION:
${safeConv}

Provide a summary in this exact format:
SUMMARY: [2-3 paragraph summary of the conversation]
KEY_POINTS: [bullet points of main topics discussed]
DECISIONS: [any decisions made]
UNRESOLVED: [questions or topics that remain open]`;

            // Call LLM for summarization
            const response = await this.llmClient.sendMessage([{ role: 'user', content: prompt }], {
                provider: this.config.provider,
                model: this.config.model,
                temperature: 0.3,
                maxTokens: 1000,
            });

            const summaryText = response.content || '';

            // Parse the response
            const summary = this.parseSummaryResponse(sessionId, summaryText, messages.length);

            // Cache and persist the summary
            this.summaries.set(sessionId, summary);
            if (this.summaries.size > MAX_SUMMARIES) {
                const oldest = this.summaries.keys().next().value;
                if (oldest !== undefined) this.summaries.delete(oldest);
            }
            this.#persist().catch((e) =>
                LOGGER.error('ChatSummarizer', 'Persist failed', { sessionId, error: e }),
            );

            LOGGER.info('ChatSummarizer', 'Summary generated', {
                sessionId,
                keyPoints: summary.keyPoints.length,
                decisions: summary.decisions.length,
            });

            // Emit event
            this._eventBus?.emit(EVENTS.CHAT_SUMMARY_CREATED, {
                sessionId,
                messageCount: summary.messageCount,
                keyFactsCount: summary.keyPoints.length,
            });

            return summary;
        } catch (error) {
            LOGGER.error('ChatSummarizer', 'Failed to generate summary', { sessionId, error });
            return null;
        }
    }

    /**
     * Parse LLM response into structured summary
     */
    private parseSummaryResponse(
        sessionId: string,
        text: string,
        messageCount: number,
    ): ChatSummary {
        const lines = text
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

        let summary = '';
        const keyPoints: string[] = [];
        const decisions: string[] = [];
        const unresolved: string[] = [];

        let currentSection = 'summary';

        for (const line of lines) {
            const upperLine = line.toUpperCase();

            if (upperLine.startsWith('SUMMARY:')) {
                currentSection = 'summary';
                summary = line.substring(8).trim();
            } else if (upperLine.startsWith('KEY_POINTS:')) {
                currentSection = 'keyPoints';
            } else if (upperLine.startsWith('DECISIONS:')) {
                currentSection = 'decisions';
            } else if (upperLine.startsWith('UNRESOLVED:')) {
                currentSection = 'unresolved';
            } else if (line.startsWith('-') || line.startsWith('*')) {
                // Bullet point
                const content = line.substring(1).trim();

                switch (currentSection) {
                    case 'keyPoints':
                        keyPoints.push(content);
                        break;
                    case 'decisions':
                        decisions.push(content);
                        break;
                    case 'unresolved':
                        unresolved.push(content);
                        break;
                    case 'summary':
                        summary += ' ' + content;
                        break;
                }
            } else if (currentSection === 'summary' && summary) {
                summary += ' ' + line;
            }
        }

        // Trim summary length
        if (summary.length > this.config.maxSummaryLength) {
            summary = summary.substring(0, this.config.maxSummaryLength - 3) + '...';
        }

        return {
            sessionId,
            summary,
            keyPoints,
            keyFacts: keyPoints,
            decisions,
            unresolved,
            messageCount,
            createdAt: Date.now(),
        };
    }

    /**
     * Get cached summary for a session
     */
    async getSummary(sessionId: string): Promise<ChatSummary | undefined> {
        await this.#ensureLoaded();
        return this.summaries.get(sessionId);
    }

    async manualSummarize(
        sessionId: string,
        messages: SummarizerMessage[],
    ): Promise<ChatSummary | null> {
        return this.generateSummary(sessionId, messages);
    }

    async autoSummarize(
        sessionId: string,
        messages: SummarizerMessage[],
    ): Promise<ChatSummary | null> {
        if (!this.shouldSummarize(sessionId, messages.length)) {
            const existing = await this.getSummary(sessionId);
            return existing ?? null;
        }
        return this.generateSummary(sessionId, messages);
    }

    /**
     * Delete summary for a session
     */
    async deleteSummary(sessionId: string): Promise<void> {
        await this.#ensureLoaded();
        this.summaries.delete(sessionId);
        await this.#persist();
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<SummarizationConfig>): void {
        this.config = { ...this.config, ...config };
        LOGGER.info(
            'ChatSummarizer',
            'Configuration updated',
            this.config as unknown as Record<string, unknown>,
        );
    }

    /**
     * Get configuration
     */
    getConfig(): SummarizationConfig {
        return { ...this.config };
    }

    /**
     * Get all cached summaries
     */
    async getAllSummaries(): Promise<Map<string, ChatSummary>> {
        await this.#ensureLoaded();
        return new Map(this.summaries);
    }

    /**
     * Clear old summaries (older than 7 days)
     */
    async cleanup(maxAgeDays = 7): Promise<number> {
        await this.#ensureLoaded();
        const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
        let removed = 0;

        for (const [sessionId, summary] of this.summaries) {
            if (summary.createdAt < cutoff) {
                this.summaries.delete(sessionId);
                removed++;
            }
        }

        if (removed > 0) await this.#persist();

        LOGGER.info('ChatSummarizer', 'Cleaned up old summaries', { removed });
        return removed;
    }

    /**
     * Merge multiple summaries for very long conversations
     */
    async mergeSummaries(sessionId: string, summaries: ChatSummary[]): Promise<ChatSummary> {
        if (summaries.length === 0) {
            return {
                sessionId,
                summary: '',
                keyPoints: [],
                keyFacts: [],
                decisions: [],
                unresolved: [],
                messageCount: 0,
                createdAt: Date.now(),
            };
        }

        if (summaries.length === 1) {
            return summaries[0]!;
        }

        // Merge key points and decisions, deduplicate
        const allKeyPoints = [...new Set(summaries.flatMap((s) => s.keyPoints))];
        const allDecisions = [...new Set(summaries.flatMap((s) => s.decisions))];
        const allUnresolved = [...new Set(summaries.flatMap((s) => s.unresolved))];

        // Concatenate summaries
        const mergedSummary = summaries.map((s) => s.summary).join('\n\n');

        const merged: ChatSummary = {
            sessionId,
            summary: mergedSummary.substring(0, this.config.maxSummaryLength),
            keyPoints: allKeyPoints,
            keyFacts: allKeyPoints,
            decisions: allDecisions,
            unresolved: allUnresolved,
            messageCount: summaries.reduce((sum, s) => sum + s.messageCount, 0),
            createdAt: Date.now(),
        };

        this.summaries.set(sessionId, merged);
        return merged;
    }

    destroy(): void {
        this.summaries.clear();
        this.loaded = false;
    }
}
