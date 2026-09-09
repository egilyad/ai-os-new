import { LLMError } from '../core/errors';
import { FALLBACK_LOGGER } from '../../shared/utils/logger';
import { safeJsonParse } from '../../shared/utils/safe-json';

const LOGGER = FALLBACK_LOGGER.child('SSEParser');

export interface SSCOptions {
    idleTimeoutMs?: number;
    signal?: AbortSignal;
}

export async function parseSSEStream(
    response: Response,
    onChunk: (chunk: string) => void,
    extractor: (parsed: Record<string, unknown>) => string | undefined | null,
    onLine?: (parsed: Record<string, unknown>) => void,
    options?: SSCOptions,
): Promise<void> {
    const bodyReader = response.body?.getReader();
    if (!bodyReader) throw new LLMError('Response body is null', 'sse');

    const decoder = new TextDecoder();
    let buffer = '';
    let lastChunkTime = Date.now();
    const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // H-09: 10MB max buffer to prevent OOM
    const idleTimeout = options?.idleTimeoutMs ?? 0;

    const abortSignal = options?.signal;
    // G-03: Error the wrapper stream controller DIRECTLY on abort, synchronously,
    // so the outer reader.read() loop settles immediately. Previously we relied
    // solely on bodyReader.cancel() to propagate the abort — but a cancel() that
    // never settles (fetch body race) would leave the stream pending forever
    // (the 4-minute hang after the governor's OperationTimedOut).
    let streamController: ReadableStreamDefaultController<string> | undefined;
    // M10-04 (SSE): cancel() may throw during abort — expected, swallow it
    const onAbort = () => {
        bodyReader.cancel('aborted').catch(() => {});
        try {
            streamController?.error(new DOMException('Aborted', 'AbortError'));
        } catch {
            /* already errored */
        }
    };
    abortSignal?.addEventListener('abort', onAbort, { once: true });

    // SSE-01: dataAccumulator in closure scope (not local to pull()) so
    // multi-line SSE events that span across read boundaries are preserved.
    let dataAccumulator = '';

    const stream = new ReadableStream<string>({
        async pull(controller) {
            streamController = controller;
            if (abortSignal?.aborted) {
                controller.close();
                return;
            }

            // H-14: Idle timer tracks wall-clock time since last DATA, not last pull

            try {
                let readResult: ReadableStreamReadResult<Uint8Array>;

                if (idleTimeout > 0) {
                    // L9-02: Race read() against an abortable sleep so idle timeout fires
                    const idleTimer = new AbortController();
                    const timeoutId = setTimeout(
                        () => idleTimer.abort(),
                        Math.max(0, idleTimeout - (Date.now() - lastChunkTime)),
                    );

                    const timeoutPromise = new Promise<never>((_, reject) => {
                        idleTimer.signal.addEventListener(
                            'abort',
                            () => {
                                reject(new DOMException('SSE idle timeout', 'AbortError'));
                            },
                            { once: true },
                        );
                    });
                    timeoutPromise.catch(() => {}); // prevent unhandled rejection
                    try {
                        readResult = await Promise.race([bodyReader.read(), timeoutPromise]);
                    } finally {
                        clearTimeout(timeoutId);
                    }
                } else {
                    readResult = await bodyReader.read();
                }

                const { done, value } = readResult;
                if (done) {
                    if (dataAccumulator) {
                        try {
                            const parsed = safeJsonParse(dataAccumulator) as Record<
                                string,
                                unknown
                            >;
                            const chunk = extractor(parsed);
                            onLine?.(parsed);
                            if (chunk) controller.enqueue(chunk);
                        } catch (e) {
                            LOGGER.warn('SSEParser', 'Failed to parse end-of-stream accumulator', {
                                error: (e as Error).message,
                                preview: dataAccumulator.slice(0, 100),
                            });
                        }
                        dataAccumulator = '';
                    }
                    controller.close();
                    return;
                }

                lastChunkTime = Date.now();
                buffer += decoder.decode(value, { stream: true });

                // H-09: Prevent OOM from unbounded buffer growth (malformed response)
                if (buffer.length > MAX_BUFFER_SIZE) {
                    throw new LLMError(
                        `SSE buffer exceeded ${MAX_BUFFER_SIZE} bytes — possible malformed response`,
                        'sse',
                    );
                }

                // L9-17: Accumulate data lines across consecutive reads for multi-line fields
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || '';

                // Group consecutive data: lines into a single event
                for (const line of lines) {
                    if (line === '') {
                        if (dataAccumulator) {
                            try {
                                const parsed = safeJsonParse(dataAccumulator) as Record<
                                    string,
                                    unknown
                                >;
                                const chunk = extractor(parsed);
                                onLine?.(parsed);
                                if (chunk) controller.enqueue(chunk);
                            } catch (e) {
                                LOGGER.warn('SSEParser', 'Failed to parse empty-line accumulator', {
                                    error: (e as Error).message,
                                    preview: dataAccumulator.slice(0, 100),
                                });
                            }
                            dataAccumulator = '';
                        }
                        continue;
                    }
                    // L9-18: Skip non-data lines
                    if (!line.startsWith('data:')) continue;

                    const dataContent = line.slice(5).trim();
                    if (dataContent === '[DONE]') {
                        if (dataAccumulator) {
                            try {
                                const parsed = safeJsonParse(dataAccumulator) as Record<
                                    string,
                                    unknown
                                >;
                                const chunk = extractor(parsed);
                                onLine?.(parsed);
                                if (chunk) controller.enqueue(chunk);
                            } catch (e) {
                                LOGGER.warn('SSEParser', 'Failed to parse [DONE] accumulator', {
                                    error: (e as Error).message,
                                    preview: dataAccumulator.slice(0, 100),
                                });
                            }
                            dataAccumulator = '';
                        }
                        controller.close();
                        return;
                    }

                    // SSE-02: Per SSE spec, consecutive data: fields are joined with '\n'
                    if (dataAccumulator) {
                        dataAccumulator += '\n' + dataContent;
                    } else {
                        dataAccumulator = dataContent;
                    }
                }

                // C-01: Do NOT flush dataAccumulator here — it may be a partial multi-chunk event.
                // The accumulator should only be flushed at empty-line event boundaries (above)
                // or when the stream ends (done branch). Flushing here destroys SSE events
                // that cross read() boundaries.
            } catch (e) {
                // G-03: Error the wrapper stream FIRST and synchronously — do NOT
                // await bodyReader.cancel() before controller.error(). A cancel()
                // that never settles (fetch body race) would block controller.error
                // and leave the outer reader.read() loop pending forever (the 4-min
                // hang). Cancel is best-effort and fire-and-forget.
                try {
                    controller.error(e);
                } catch {
                    /* already errored */
                }
                if (e instanceof DOMException && e.name === 'AbortError') {
                    bodyReader.cancel('idle timeout').catch(() => {});
                }
            }
        },
        async cancel() {
            // M10-04 (SSE): cancel() expected to throw during abort — swallow it
            try {
                await Promise.race([
                    bodyReader.cancel(),
                    new Promise<void>((resolve) => setTimeout(resolve, 5000)),
                ]);
            } catch {
                /* cancel timeout — body reader may leak but won't block */
            }
            abortSignal?.removeEventListener('abort', onAbort);
        },
    });

    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                // MED-7: If stream ended because of abort (bodyReader.cancel from onAbort),
                // throw AbortError so the error propagates through streamMessage → chat()
                // and ChatService emits STREAM_END with status: 'cancelled'.
                if (abortSignal?.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }
                break;
            }
            if (value) onChunk(value);
        }
    } catch (e) {
        bodyReader.cancel().catch(() => {});
        throw e;
    } finally {
        reader.releaseLock();
        abortSignal?.removeEventListener('abort', onAbort);
    }
}
