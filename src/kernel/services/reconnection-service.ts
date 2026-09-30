import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ReconnectionService');

export interface ReconnectionConfig {
    streamId: string;
    provider: string;
    model: string;
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    maxTotalRetryMs?: number;
    lastIndex: number;
    lastMessages: string[];
    onReconnect: (streamId: string, provider: string) => Promise<boolean>;
    onGiveUp: (streamId: string, provider: string) => void;
}

interface ReconnectionState {
    config: ReconnectionConfig;
    attempt: number;
    timer: ReturnType<typeof setTimeout> | null;
    destroyed: boolean;
    startedAt: number;
    // 4.8: set when an in-flight onReconnect settles — lets the success
    // path distinguish "giveUp already ran" from "cancelled".
    settled: boolean;
    // 4.8: set only by the 30s attempt-timeout giveUp (not by cancel()) —
    // only then may a late success re-register the stream.
    timedOut: boolean;
}

export class ReconnectionService {
    private streams = new Map<string, ReconnectionState>();

    register(config: ReconnectionConfig): void {
        const existing = this.streams.get(config.streamId);
        if (existing) {
            existing.destroyed = true;
            if (existing.timer) clearTimeout(existing.timer);
        }

        const state: ReconnectionState = {
            config,
            attempt: 0,
            timer: null,
            destroyed: false,
            startedAt: Date.now(),
            settled: false,
            timedOut: false,
        };
        this.streams.set(config.streamId, state);
        this.scheduleRetry(state);

        LOGGER.info(
            'ReconnectionService',
            `Registered reconnection for stream ${config.streamId}`,
            {
                provider: config.provider,
                maxRetries: config.maxRetries,
            },
        );
    }

    cancel(streamId: string): void {
        const state = this.streams.get(streamId);
        if (!state) return;
        state.destroyed = true;
        if (state.timer) clearTimeout(state.timer);
        this.streams.delete(streamId);
        LOGGER.info('ReconnectionService', `Cancelled reconnection for stream ${streamId}`);
    }

    cancelAll(): void {
        for (const [, state] of this.streams) {
            state.destroyed = true;
            if (state.timer) clearTimeout(state.timer);
        }
        this.streams.clear();
    }

    destroy(): void {
        this.cancelAll();
    }

    private scheduleRetry(state: ReconnectionState): void {
        if (state.destroyed) return;
        const elapsed = Date.now() - state.startedAt;
        const maxTotal = state.config.maxTotalRetryMs ?? 300000;
        if (elapsed > maxTotal) {
            LOGGER.warn(
                'ReconnectionService',
                `Total retry time (${elapsed}ms) exceeded max (${maxTotal}ms) for stream ${state.config.streamId}`,
            );
            state.config.onGiveUp(state.config.streamId, state.config.provider);
            this.streams.delete(state.config.streamId);
            return;
        }
        if (state.attempt >= state.config.maxRetries) {
            LOGGER.warn(
                'ReconnectionService',
                `Max retries (${state.config.maxRetries}) reached for stream ${state.config.streamId}`,
            );
            state.config.onGiveUp(state.config.streamId, state.config.provider);
            this.streams.delete(state.config.streamId);
            return;
        }

        const delay =
            Math.min(
                state.config.baseDelayMs * Math.pow(2, state.attempt),
                state.config.maxDelayMs,
            ) +
            Math.random() * 1000;

        state.attempt++;

        LOGGER.info(
            'ReconnectionService',
            `Scheduling retry ${state.attempt}/${state.config.maxRetries} for stream ${state.config.streamId} in ${Math.round(delay)}ms`,
        );

        state.timer = setTimeout(async () => {
            if (state.destroyed) return;
            const reconnectTimeout = setTimeout(() => {
                LOGGER.warn(
                    'ReconnectionService',
                    `onReconnect timed out for stream ${state.config.streamId}`,
                );
                // Check ownership BEFORE deleting — the delete would make the
                // subsequent ownership check always fail, silencing onGiveUp.
                if (this.streams.get(state.config.streamId) !== state) return;
                state.destroyed = true;
                state.timedOut = true;
                state.config.onGiveUp(state.config.streamId, state.config.provider);
                this.streams.delete(state.config.streamId);
            }, 30000);
            try {
                const success = await state.config.onReconnect(
                    state.config.streamId,
                    state.config.provider,
                );
                state.settled = true;
                clearTimeout(reconnectTimeout);
                if (state.destroyed) {
                    // 4.8: the 30s timeout already ran giveUp while this
                    // attempt was in flight — but the stream IS alive now.
                    // Dropping it orphans a live stream; re-register for
                    // tracking unless something newer took the slot. Cancelled
                    // states (timedOut === false) stay dead.
                    if (success && state.timedOut && this.streams.get(state.config.streamId) !== state) {
                        if (!this.streams.has(state.config.streamId)) {
                            state.destroyed = false;
                            state.settled = false;
                            state.timedOut = false;
                            state.startedAt = Date.now();
                            this.streams.set(state.config.streamId, state);
                            LOGGER.warn(
                                'ReconnectionService',
                                `late success after giveUp for stream ${state.config.streamId} — re-registered`,
                            );
                        } else {
                            LOGGER.warn(
                                'ReconnectionService',
                                `late success after giveUp for stream ${state.config.streamId} — newer state wins`,
                            );
                        }
                    }
                    return;
                }
                if (success) {
                    LOGGER.info(
                        'ReconnectionService',
                        `Reconnected stream ${state.config.streamId} on attempt ${state.attempt}`,
                    );
                    // C-25: only delete if this state is still the current one for this streamId
                    if (this.streams.get(state.config.streamId) === state) {
                        this.streams.delete(state.config.streamId);
                    }
                } else {
                    this.scheduleRetry(state);
                }
            } catch (e) {
                clearTimeout(reconnectTimeout);
                LOGGER.warn(
                    'ReconnectionService',
                    `Reconnect attempt ${state.attempt} failed for stream ${state.config.streamId}`,
                    { error: e },
                );
                this.scheduleRetry(state);
            }
        }, delay);
    }
}
