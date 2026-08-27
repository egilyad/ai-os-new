import type { ChatMessage, ProviderResponse, SendMessageOptions } from '../types/llm-types';
import type { IAdapterRegistry } from '../contracts/provider-adapter';
import type { AdapterMessage } from '../contracts/provider-adapter';

export interface RaceCandidate {
    provider: string;
    model: string;
    keyId: string;
}

export interface RaceOptions {
    signal?: AbortSignal;
    adapterOptions?: SendMessageOptions;
    timeoutMs?: number;
    keyResolver?: (keyId: string) => string | undefined;
}

export interface FirstSuccessResult {
    candidate: RaceCandidate;
    response: ProviderResponse;
    winnerIndex: number;
}

export interface RaceResult {
    winner: RaceCandidate;
    response: ProviderResponse;
    latency: number;
    failures: Array<{ candidate: RaceCandidate; error: string }>;
    aborted: RaceCandidate[];
}

export class RaceExecutor {
    destroy(): void {
        /* no-op — all resources are method-scoped */
    }

    constructor(private adapterRegistry: IAdapterRegistry) {}

    async race(
        messages: ChatMessage[],
        candidates: RaceCandidate[],
        options?: RaceOptions,
    ): Promise<RaceResult> {
        const failures: RaceResult['failures'] = [];
        const aborted: RaceResult['aborted'] = [];
        const controllers = new Map<number, AbortController>();
        const timeout = options?.timeoutMs ?? 15000;
        const resolveKey = options?.keyResolver;

        const makeCall = async (
            c: RaceCandidate,
            idx: number,
        ): Promise<{ candidate: RaceCandidate; response: ProviderResponse }> => {
            const adapter = this.adapterRegistry.getAdapter(c.provider);
            if (!adapter) throw new Error(`No adapter for ${c.provider}`);

            const controller = new AbortController();
            controllers.set(idx, controller);

            let signalCleanup: (() => void) | undefined;
            const combinedSignal = options?.signal
                ? (() => {
                      const { signal, cleanup } = combineSignals(options.signal, controller.signal);
                      signalCleanup = cleanup;
                      return signal;
                  })()
                : controller.signal;

            const apiKey = resolveKey ? resolveKey(c.keyId) : undefined;
            if (!apiKey) throw new Error(`No API key resolved for keyId ${c.keyId}`);

            const start = Date.now();
            const adapterMessages: AdapterMessage[] = messages
                .filter((m) => m.role !== 'tool')
                .map((m) => ({
                    role: m.role as AdapterMessage['role'],
                    content: typeof m.content === 'string' ? m.content : String(m.content),
                }));
            try {
                const response = await adapter.sendMessage(
                    adapterMessages,
                    c.model,
                    apiKey,
                    combinedSignal,
                    options?.adapterOptions,
                );
                response.latency = Date.now() - start;
                return { candidate: c, response };
            } finally {
                signalCleanup?.();
            }
        };

        let timeoutId: ReturnType<typeof setTimeout> = null as unknown as ReturnType<
            typeof setTimeout
        >;
        let rejectTimeoutPromise: ((reason: unknown) => void) | undefined;
        const onParentAbort = () => {
            clearTimeout(timeoutId);
            controllers.forEach((c) => c.abort());
            rejectTimeoutPromise?.(new Error('Race aborted'));
        };
        const timeoutPromise = new Promise<never>((_, reject) => {
            rejectTimeoutPromise = reject;
            if (options?.signal?.aborted) {
                reject(new Error('Aborted'));
                return;
            }
            timeoutId = setTimeout(() => {
                controllers.forEach((c) => c.abort());
                clearTimeout(timeoutId);
                reject(new Error(`Race timed out after ${timeout}ms`));
            }, timeout);
            if (options?.signal) {
                options.signal.addEventListener('abort', onParentAbort, { once: true });
            }
        });

        const promises = candidates.map((c, i) => makeCall(c, i));
        let winnerIndex = -1;

        try {
            const result = await this.firstSuccess(
                promises,
                candidates,
                timeoutPromise,
                failures,
                controllers,
                aborted,
            );
            winnerIndex = result.winnerIndex;
            // MED-5: After firstSuccess, abort ALL remaining controllers EXCEPT the winner.
            // Losers were already aborted in firstSuccess, but this ensures cleanup
            // in case the abort propagation was deferred (e.g., if a loser's fetch
            // resolved just before the abort signal fired — the response body needs
            // to be cancelled by the adapter layer, not here).
            controllers.forEach((ctrl, ci) => {
                if (ci !== winnerIndex) ctrl.abort();
            });
            return {
                winner: result.candidate,
                response: result.response,
                latency: result.response.latency || 0,
                failures,
                aborted,
            };
        } finally {
            clearTimeout(timeoutId);
            // H-26: Remove the parent abort listener to prevent leak
            if (options?.signal) {
                options.signal.removeEventListener('abort', onParentAbort);
            }
            // In the timeout/no-winner path, abort ALL controllers
            if (winnerIndex === -1) {
                controllers.forEach((c) => c.abort());
            }
            controllers.clear();
        }
    }

    private async firstSuccess(
        promises: Promise<{ candidate: RaceCandidate; response: ProviderResponse }>[],
        candidates: RaceCandidate[],
        timeoutPromise: Promise<never>,
        failures: RaceResult['failures'],
        controllers: Map<number, AbortController>,
        aborted: RaceResult['aborted'],
    ): Promise<FirstSuccessResult> {
        const results: Array<{ candidate: RaceCandidate; response: ProviderResponse } | Error> =
            new Array(promises.length).fill(null);
        let winnerIdx = -1;
        let winnerFound = false;

        let winnerResolve!: (value: {
            candidate: RaceCandidate;
            response: ProviderResponse;
        }) => void;
        const winnerPromise = new Promise<{ candidate: RaceCandidate; response: ProviderResponse }>(
            (resolve) => {
                winnerResolve = resolve;
            },
        );

        promises.forEach((p, i) => {
            p.then(
                (v) => {
                    results[i] = v;
                    if (!winnerFound) {
                        winnerFound = true;
                        winnerIdx = i;
                        controllers.forEach((ctrl, ci) => {
                            if (ci !== i) ctrl.abort();
                        });
                        winnerResolve(v);
                    }
                },
                (err) => {
                    const error = err instanceof Error ? err : new Error(String(err));
                    results[i] = error;
                    if (winnerFound) {
                        aborted.push(candidates[i]!);
                    } else {
                        failures.push({ candidate: candidates[i]!, error: error.message });
                    }
                },
            );
        });

        try {
            await Promise.race([winnerPromise, timeoutPromise]);
        } catch {
            // Timeout or abort — scan for any already-resolved non-error result
        }

        if (winnerIdx >= 0) {
            return {
                ...(results[winnerIdx] as {
                    candidate: RaceCandidate;
                    response: ProviderResponse;
                }),
                winnerIndex: winnerIdx,
            };
        }

        // Timeout/winners-never-resolved path — scan for any non-error result
        for (let i = 0; i < promises.length; i++) {
            const r = results[i];
            if (r && !(r instanceof Error)) return { ...r, winnerIndex: i };
        }

        const last = failures[failures.length - 1];
        throw new Error(
            last
                ? `All race candidates failed. Last: ${last.candidate.provider} — ${last.error}`
                : 'All race candidates failed',
        );
    }
}

function combineSignals(
    s1: AbortSignal,
    s2: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
    if (
        typeof AbortSignal !== 'undefined' &&
        typeof (AbortSignal as unknown as { any?: unknown }).any === 'function'
    ) {
        try {
            const signal = (
                AbortSignal as unknown as { any: (signals: AbortSignal[]) => AbortSignal }
            ).any([s1, s2]);
            return { signal, cleanup: () => {} };
        } catch {
            /* fall through */
        }
    }
    if (s1.aborted) return { signal: AbortSignal.abort(s1.reason), cleanup: () => {} };
    if (s2.aborted) return { signal: AbortSignal.abort(s2.reason), cleanup: () => {} };
    const controller = new AbortController();
    const onAbort1 = () => controller.abort(s1.reason);
    const onAbort2 = () => controller.abort(s2.reason);
    s1.addEventListener('abort', onAbort1, { once: true });
    s2.addEventListener('abort', onAbort2, { once: true });
    return {
        signal: controller.signal,
        cleanup: () => {
            s1.removeEventListener('abort', onAbort1);
            s2.removeEventListener('abort', onAbort2);
        },
    };
}
