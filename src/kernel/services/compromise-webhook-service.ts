import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import type {
    CompromiseSignal,
    WebhookSource,
    GitHubSecretAlert,
    SentryAlert,
} from '../contracts/compromise';

const LOGGER = rootLogger.child('CompromiseWebhook');

// H-11: Warn at startup if webhook secret is unconfigured
void import('./config-registry').then(({ CONFIG }) => {
    if (!CONFIG.security?.webhookSecret) {
        LOGGER.warn(
            'CompromiseWebhook',
            'Webhook secret not configured — compromise detection is DISABLED. Set CONFIG.security.webhookSecret to enable.',
        );
    }
});

export interface CompromiseWebhookServiceDeps {
    eventBus: { emit: (event: string, data?: unknown) => void };
    keyService: { compromiseByFingerprint: (keyIdOrLabel: string, source: string) => boolean };
}

export class CompromiseWebhookService {
    private deps: CompromiseWebhookServiceDeps;

    constructor(deps: CompromiseWebhookServiceDeps) {
        this.deps = deps;
    }

    handleGitHubPayload(payload: GitHubSecretAlert): boolean {
        if (!payload || payload.action === 'resolved') {
            LOGGER.warn('CompromiseWebhook', 'GitHub payload rejected', {
                action: payload?.action,
                reason: 'resolved_or_empty',
            });
            this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL_REJECTED, {
                source: 'github',
                reason: payload?.action === 'resolved' ? 'resolved' : 'empty',
            });
            return false;
        }

        const alertInfo = payload.alert;
        if (!alertInfo) {
            LOGGER.warn('CompromiseWebhook', 'GitHub payload rejected: missing alert info');
            this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL_REJECTED, {
                source: 'github',
                reason: 'missing_alert_info',
            });
            return false;
        }

        const secretType = alertInfo.secret_type_display || 'unknown';
        const repo = payload.repository?.full_name || 'unknown';
        const provider = this.inferProvider(secretType);

        this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL, {
            fingerprint: provider,
            source: `GitHub Secret Scanning (${repo}, ${secretType})`,
        });

        return true;
    }

    handleSentryPayload(payload: SentryAlert): boolean {
        if (!payload) {
            LOGGER.warn('CompromiseWebhook', 'Sentry payload rejected: empty');
            this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL_REJECTED, {
                source: 'sentry',
                reason: 'empty',
            });
            return false;
        }

        const ruleName = payload.triggered_rule || 'unknown';
        const culprit = payload.issue?.title || payload.issue?.culprit || 'unknown';

        this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL, {
            id: undefined,
            fingerprint: culprit,
            source: `Sentry Alert (${ruleName})`,
        });

        return true;
    }

    emitSignal(signal: CompromiseSignal): boolean {
        if (!signal.id && !signal.fingerprint) {
            LOGGER.warn('CompromiseWebhook', 'Signal rejected: missing id and fingerprint');
            this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL_REJECTED, {
                source: 'custom',
                reason: 'missing_id_and_fingerprint',
            });
            return false;
        }

        this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL, {
            id: signal.id,
            fingerprint: signal.fingerprint,
            source: signal.source,
        });

        return true;
    }

    async verifySignature(payload: string, signature: string): Promise<boolean> {
        const { CONFIG } = await import('./config-registry');
        const secret = CONFIG.security?.webhookSecret;
        if (!secret) return false; // Reject if no secret is configured (fail-closed)
        try {
            const enc = new TextEncoder();
            const key = await crypto.subtle.importKey(
                'raw',
                enc.encode(secret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['verify'],
            );
            if (!signature.startsWith('sha256='))
                throw new Error('Unsupported HMAC algorithm — expected sha256');
            const sigHex = signature.slice(7);
            if (!sigHex || !/^[0-9a-f]+$/i.test(sigHex) || sigHex.length !== 64)
                throw new Error('Invalid HMAC signature format');
            const sigBytes = new Uint8Array(
                sigHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
            );
            return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
        } catch (e) {
            LOGGER.warn('CompromiseWebhook', 'Signature verification error', { error: e });
            return false;
        }
    }

    async onWebhookRequest(
        source: WebhookSource,
        body: unknown,
        signature?: string,
        rawBody?: string,
    ): Promise<boolean> {
        const { CONFIG } = await import('./config-registry');
        const secret = CONFIG.security?.webhookSecret;

        // CRIT-K7: Fail-closed — require secret, signature, AND rawBody for every webhook
        if (!secret) {
            LOGGER.error(
                'CompromiseWebhook',
                'Webhook secret not configured — rejecting all webhooks',
            );
            this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL_REJECTED, {
                source,
                reason: 'no_secret_configured',
            });
            return false;
        }

        if (!signature || !rawBody) {
            LOGGER.warn(
                'CompromiseWebhook',
                'Missing signature or raw body when secret configured',
            );
            this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL_REJECTED, {
                source,
                reason: 'missing_signature_or_body',
            });
            return false;
        }

        const isValid = await this.verifySignature(rawBody, signature);
        if (!isValid) {
            LOGGER.warn('CompromiseWebhook', 'Invalid HMAC signature');
            this.deps.eventBus.emit(EVENTS.COMPROMISE_SIGNAL_REJECTED, {
                source,
                reason: 'invalid_signature',
            });
            return false;
        }

        switch (source) {
            case 'github':
                return this.handleGitHubPayload(body as GitHubSecretAlert);
            case 'sentry':
                return this.handleSentryPayload(body as SentryAlert);
            case 'custom':
                return this.emitSignal(body as CompromiseSignal);
            default:
                return false;
        }
    }

    private inferProvider(secretType: string): string {
        const lower = secretType.toLowerCase();
        if (lower.includes('openai')) return 'openai';
        if (lower.includes('openrouter')) return 'openrouter';
        if (lower.includes('anthropic')) return 'anthropic';
        if (lower.includes('gemini') || lower.includes('google')) return 'gemini';
        if (lower.includes('groq')) return 'groq';
        if (lower.includes('mistral')) return 'mistral';
        if (lower.includes('cohere')) return 'cohere';
        if (lower.includes('hugging')) return 'huggingface';
        if (lower.includes('cerebras')) return 'cerebras';
        if (lower.includes('cloudflare')) return 'cloudflare';
        return secretType.toLowerCase();
    }

    manuallyCompromise(keyIdOrLabel: string): boolean {
        return this.deps.keyService.compromiseByFingerprint(keyIdOrLabel, 'manual');
    }
}
