import { genId } from '../../utils/gen-id';
import { CONFIG } from './config-registry';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import type { WebhookConfig, WebhookProvider, WebhookEventType } from '../contracts/webhook';
import { isPrivateIP } from '../utils/network';

async function hmacSha256(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

const LOGGER = rootLogger.child('NotificationWebhookService');

// Synchronous static URL validation — checks protocol + private IP
// without making a network request, avoiding DNS rebinding TOCTOU.
function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        if (isPrivateIP(parsed.hostname)) return false;
        return true;
    } catch {
        return false;
    }
}

export interface NotificationWebhookServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    deadLetterQueue?: {
        push: (entry: {
            event: string;
            payload: unknown;
            error: string;
            context?: Record<string, unknown>;
            retryCount: number;
        }) => Promise<void>;
    };
}

const WEBHOOKS_KEY = 'super_agents_webhooks';
const MAX_WEBHOOKS = 50;
function getMaxRetries(): number {
    return CONFIG.webhooks.maxRetries;
}
function getRetryDelayMs(): number {
    return CONFIG.webhooks.retryDelayMs;
}

function formatPayload(
    provider: WebhookProvider,
    event: string,
    data: unknown,
): Record<string, unknown> | null {
    const text = `[${event}] ${JSON.stringify(data, null, 2)}`;

    if (provider === 'slack') {
        const isBad =
            event.includes('error') || event.includes('quota') || event.includes('compromise');
        return {
            text,
            username: 'AI-OS Alert',
            icon_emoji: ':robot_face:',
            attachments: [
                {
                    color: isBad ? 'danger' : event.includes('warning') ? 'warning' : 'good',
                    text,
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        };
    }

    if (provider === 'telegram') {
        return {
            text: `\`\`\`\n${text}\n\`\`\``,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
        };
    }

    if (provider === 'discord') {
        const isBad =
            event.includes('error') || event.includes('quota') || event.includes('compromise');
        return {
            content:
                text.length > CONFIG.webhooks.discordContentMaxLength
                    ? text.slice(0, CONFIG.webhooks.discordContentMaxLength - 3) + '...'
                    : text,
            username: 'AI-OS Alert',
            avatar_url: '',
            embeds: [
                {
                    title: event,
                    description: text.slice(0, CONFIG.webhooks.discordEmbedDescMaxLength),
                    color: isBad ? 0xff4444 : event.includes('warning') ? 0xffaa00 : 0x44ff44,
                    timestamp: new Date().toISOString(),
                },
            ],
        };
    }

    return null;
}

export class NotificationWebhookService {
    private webhooks: WebhookConfig[] = [];
    private unsubs: Array<() => void> = [];
    private deps: NotificationWebhookServiceDeps;
    private _initialized = false;
    private retryTimers = new Set<ReturnType<typeof setTimeout>>();

    constructor(deps: NotificationWebhookServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.load();
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.setupListeners();
    }

    destroy() {
        for (const t of this.retryTimers) clearTimeout(t);
        this.retryTimers.clear();
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
    }

    private async load() {
        try {
            const saved = await this.deps.database.getKv<WebhookConfig[]>(WEBHOOKS_KEY);
            if (saved) this.webhooks = saved;
        } catch (e) {
            LOGGER.warn('NotificationWebhookService', 'Failed to load webhooks', { error: e });
        }
    }

    private async save() {
        try {
            await this.deps.database.setKv(WEBHOOKS_KEY, this.webhooks);
        } catch (e) {
            LOGGER.warn('NotificationWebhookService', 'Failed to save webhooks', { error: e });
        }
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.NOTIFICATION, (data) => {
                this.dispatch(EVENTS.NOTIFICATION, data);
            }),
            this.deps.eventBus.on(EVENTS.KEY_QUOTA_EXCEEDED, (data) => {
                this.dispatch(EVENTS.KEY_QUOTA_EXCEEDED, data);
            }),
            this.deps.eventBus.on(EVENTS.KEY_STATE_CHANGED, (data) => {
                this.dispatch(EVENTS.KEY_STATE_CHANGED, data);
            }),
            this.deps.eventBus.on(EVENTS.COMPROMISE_SIGNAL, (data) => {
                this.dispatch(EVENTS.COMPROMISE_SIGNAL, data);
            }),
            this.deps.eventBus.on(EVENTS.STREAM_ERROR, (data) => {
                this.dispatch(EVENTS.STREAM_ERROR, data);
            }),
            this.deps.eventBus.on(EVENTS.POLICY_VIOLATION, (data) => {
                this.dispatch(EVENTS.POLICY_VIOLATION, data);
            }),
        );
    }

    private async dispatch(event: WebhookEventType, data: unknown) {
        const targets = this.webhooks.filter((w) => w.enabled && w.events.includes(event));
        const results = await Promise.allSettled(
            targets.map((target) => this.sendWithRetry(target, event, data, 0)),
        );
        for (const r of results) {
            if (r.status === 'rejected') {
                LOGGER.warn('NotificationWebhookService', 'Dispatch error', { error: r.reason });
            }
        }
    }

    private async sendWithRetry(
        webhook: WebhookConfig,
        event: string,
        data: unknown,
        attempt: number,
    ): Promise<boolean> {
        try {
            if (!isValidUrl(webhook.webhookUrl)) {
                LOGGER.warn('NotificationWebhookService', 'Blocked SSRF attempt', {
                    webhookUrl: webhook.webhookUrl,
                });
                return false;
            }

            const payload = formatPayload(webhook.provider, event, data);
            if (!payload) return false;

            const body = JSON.stringify(payload);
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const signingSecret = CONFIG.security.webhookSecret;
            if (signingSecret) {
                headers['X-Signature-256'] = await hmacSha256(body, signingSecret);
            }
            const res = await fetch(webhook.webhookUrl, {
                method: 'POST',
                headers,
                body,
                signal: AbortSignal.timeout(CONFIG.webhooks.timeoutMs),
            });

            if (res.ok) {
                await res.body?.cancel();
                return true;
            }

            if (attempt < getMaxRetries() && res.status >= 500) {
                await res.body?.cancel();
                const jitter = Math.random() * 0.5 + 0.75;
                await new Promise<void>((resolve) => {
                    const t = setTimeout(
                        resolve,
                        getRetryDelayMs() * Math.pow(2, attempt) * jitter,
                    );
                    this.retryTimers.add(t);
                });
                return this.sendWithRetry(webhook, event, data, attempt + 1);
            }

            await res.body?.cancel();
            LOGGER.warn('NotificationWebhookService', 'HTTP error sending webhook', {
                webhookName: webhook.name,
                event,
                statusCode: res.status,
            });
            if (attempt >= getMaxRetries()) {
                this.deps.eventBus.emit(EVENTS.WEBHOOK_DELIVERY_FAILED, {
                    webhookId: webhook.id,
                    event,
                    attempt,
                    statusCode: res.status,
                    error: `HTTP ${res.status}`,
                });
                this.deps.deadLetterQueue
                    ?.push({
                        event,
                        payload: data,
                        error: `HTTP ${res.status}`,
                        context: { webhookId: webhook.id, webhookName: webhook.name },
                        retryCount: attempt,
                    })
                    .catch((err) =>
                        LOGGER.error('NotificationWebhookService', 'DLQ push failed (HTTP)', {
                            error: err,
                        }),
                    );
            }
            return false;
        } catch (e) {
            if (attempt < getMaxRetries()) {
                const jitter = Math.random() * 0.5 + 0.75;
                await new Promise<void>((resolve) => {
                    const t = setTimeout(
                        resolve,
                        getRetryDelayMs() * Math.pow(2, attempt) * jitter,
                    );
                    this.retryTimers.add(t);
                });
                return this.sendWithRetry(webhook, event, data, attempt + 1);
            }
            LOGGER.warn('NotificationWebhookService', 'Failed to send webhook after retries', {
                webhookName: webhook.name,
                attempts: getMaxRetries() + 1,
                error: e,
            });
            this.deps.eventBus.emit(EVENTS.WEBHOOK_DELIVERY_FAILED, {
                webhookId: webhook.id,
                event,
                attempt,
                statusCode: 0,
                error: String(e),
            });
            this.deps.deadLetterQueue
                ?.push({
                    event,
                    payload: data,
                    error: String(e),
                    context: { webhookId: webhook.id, webhookName: webhook.name },
                    retryCount: attempt,
                })
                .catch((err) =>
                    LOGGER.error('NotificationWebhookService', 'DLQ push failed (catch)', {
                        error: err,
                    }),
                );
            return false;
        }
    }

    getWebhooks(): WebhookConfig[] {
        return [...this.webhooks];
    }

    async addWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt'>) {
        if (!isValidUrl(config.webhookUrl))
            throw new Error(`Invalid webhook URL (blocked SSRF): ${config.webhookUrl}`);
        const webhook: WebhookConfig = {
            ...config,
            id: genId('wh'),
            createdAt: Date.now(),
        };
        this.webhooks.push(webhook);
        if (this.webhooks.length > MAX_WEBHOOKS) this.webhooks = this.webhooks.slice(-MAX_WEBHOOKS);
        await this.save();
        return webhook;
    }

    removeWebhook(id: string) {
        this.webhooks = this.webhooks.filter((w) => w.id !== id);
        this.save();
    }

    async updateWebhook(id: string, updates: Partial<WebhookConfig>) {
        if (updates.webhookUrl && !isValidUrl(updates.webhookUrl))
            throw new Error(`Invalid webhook URL (blocked SSRF): ${updates.webhookUrl}`);
        this.webhooks = this.webhooks.map((w) => (w.id === id ? { ...w, ...updates } : w));
        await this.save();
    }

    async testWebhook(id: string): Promise<{ ok: boolean; status?: number }> {
        const webhook = this.webhooks.find((w) => w.id === id);
        if (!webhook) return { ok: false };

        try {
            const payload = formatPayload(webhook.provider, 'system:notification', {
                message: 'Test notification from AI-OS',
                type: 'info',
                timestamp: new Date().toISOString(),
            });
            if (!payload) return { ok: false };

            const testBody = JSON.stringify(payload);
            const testHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
            const testSecret = CONFIG.security.webhookSecret;
            if (testSecret) {
                testHeaders['X-Signature-256'] = await hmacSha256(testBody, testSecret);
            }
            const res = await fetch(webhook.webhookUrl, {
                method: 'POST',
                headers: testHeaders,
                body: testBody,
                signal: AbortSignal.timeout(CONFIG.webhooks.timeoutMs),
            });

            const result = { ok: res.ok, status: res.status };
            await res.body?.cancel();
            return result;
        } catch (e) {
            LOGGER.warn('NotificationWebhookService', 'Test webhook failed', {
                webhookId: id,
                error: e,
            });
            return { ok: false };
        }
    }
}
