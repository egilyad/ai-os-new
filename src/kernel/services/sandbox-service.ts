import { CONFIG } from './config-registry';
import { rootLogger } from './logger-service';
import { isPrivateIP } from '../utils/network';
import { safeJsonParse } from '../../kernel/utils/safe-json';

const LOGGER = rootLogger.child('SandboxService');

export interface SandboxServiceDeps {
    toolService: {
        execute: (toolId: string, input: unknown) => Promise<unknown>;
    };
}

export class SandboxService {
    private deps: SandboxServiceDeps;
    private activeWorkers = new Set<Worker>();
    private readonly codeExecutionEnabled =
        import.meta.env.DEV || import.meta.env.VITE_SANDBOX_ENABLED === 'true';
    private proxyUrl = (() => {
        const env = import.meta.env.VITE_PROXY_URL;
        if (env) return env.includes('?url=') ? env : `${env}?url=`;
        // BLD-12: Fail explicitly in production instead of silently wrong fallback.
        // The /proxy/fetch fallback only works via Vite dev proxy, not in Docker.
        if (import.meta.env.PROD) {
            LOGGER.error(
                'SandboxService',
                'VITE_PROXY_URL is not set in production Docker. Sandbox fetch will fail.',
            );
        }
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const base = `${origin}/proxy/fetch`;
        return base.includes('?url=') ? base : `${base}?url=`;
    })();

    constructor(deps: SandboxServiceDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {}

    destroy() {
        for (const worker of this.activeWorkers) {
            worker.terminate();
        }
        this.activeWorkers.clear();
    }

    private isAllowedUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            // B10-74: Only allow HTTPS, reject HTTP and other protocols
            if (parsed.protocol !== 'https:') return false;
            const host = parsed.hostname;
            if (isPrivateIP(host)) return false;
            return true;
        } catch {
            return false;
        }
    }

    async fetchUrl(url: string, options?: { timeoutMs?: number }): Promise<string> {
        if (!this.isAllowedUrl(url)) throw new Error(`URL rejected: ${url.slice(0, 80)}`);
        const timeoutMs = options?.timeoutMs ?? CONFIG?.services?.sandbox?.fetchTimeoutMs ?? 10000;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) {
                res.body?.cancel()?.catch(() => {});
                throw new Error(`HTTP ${res.status}`);
            }
            return await res.text();
        } catch (e) {
            clearTimeout(timer);
            // B10-75: Proxy fallback also needs timeout protection
            LOGGER.warn('SandboxService', 'Direct fetch failed, trying proxy', { error: e });
            const proxyController = new AbortController();
            const proxyTimer = setTimeout(() => proxyController.abort(), timeoutMs);
            try {
                const proxyRes = await fetch(`${this.proxyUrl}${encodeURIComponent(url)}`, {
                    signal: proxyController.signal,
                });
                clearTimeout(proxyTimer);
                if (!proxyRes.ok) {
                    proxyRes.body?.cancel()?.catch(() => {});
                    throw new Error(`Proxy returned HTTP ${proxyRes.status}`, { cause: e });
                }
                const text = await proxyRes.text();
                try {
                    const err = safeJsonParse(text) as Record<string, unknown> | undefined;
                    if ((err as Record<string, unknown>)?.error)
                        throw new Error((err as Record<string, unknown>).error as string, {
                            cause: e,
                        });
                } catch {
                    if (import.meta.env.DEV) {
                        LOGGER.debug(
                            'SandboxService',
                            'Proxy response not JSON, returning raw text',
                        );
                    }
                }
                return text;
            } catch (proxyErr) {
                clearTimeout(proxyTimer);
                throw proxyErr;
            }
        }
    }

    async execute(
        code: string,
        data: unknown = {},
        timeoutMs: number = CONFIG?.services?.sandbox?.codeExecutionTimeoutMs ?? 5000,
        allowedTools: string[] = [],
    ): Promise<unknown> {
        if (!this.codeExecutionEnabled) {
            throw new Error(
                'Sandbox code execution is disabled in production because the worker runner is ' +
                    'intentionally gated by VITE_SANDBOX_ENABLED. Enable VITE_SANDBOX_ENABLED=true ' +
                    'to allow agent-generated scripts to run in the isolated worker.',
            );
        }

        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('../workers/sandbox.worker.ts', import.meta.url), {
                type: 'module',
            });
            this.activeWorkers.add(worker);

            const cleanup = () => {
                worker.terminate();
                this.activeWorkers.delete(worker);
            };

            let timeout = setTimeout(() => {
                cleanup();
                reject(new Error(`Execution timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            const resetTimeout = () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error(`Execution timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            };

            let toolExecutionCount = 0;
            const MAX_TOOL_EXECUTIONS = 10;

            worker.onmessage = async (event) => {
                if (event.data.type === 'cap_request') {
                    resetTimeout();
                    const { requestId, method, params } = event.data;

                    if (method === 'executeTool') {
                        if (!allowedTools.includes('*') && !allowedTools.includes(params.toolId)) {
                            worker.postMessage({
                                type: 'cap_response',
                                requestId,
                                error: `Tool execution denied: ${params.toolId} is not in allowedTools`,
                            });
                            return;
                        }

                        toolExecutionCount++;
                        if (toolExecutionCount > MAX_TOOL_EXECUTIONS) {
                            worker.postMessage({
                                type: 'cap_response',
                                requestId,
                                error: `Rate limit exceeded: Sandbox allows maximum ${MAX_TOOL_EXECUTIONS} tool calls`,
                            });
                            return;
                        }

                        try {
                            if (typeof params.toolId !== 'string') {
                                throw new Error('toolId must be a string');
                            }
                            const result = await this.deps.toolService.execute(
                                params.toolId,
                                params.input,
                            );
                            worker.postMessage({ type: 'cap_response', requestId, result });
                        } catch (error: unknown) {
                            worker.postMessage({
                                type: 'cap_response',
                                requestId,
                                error: error instanceof Error ? error.message : String(error),
                            });
                        }
                    }
                    return;
                }

                clearTimeout(timeout);
                cleanup();
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data.result);
                }
            };

            worker.onerror = (e: ErrorEvent) => {
                clearTimeout(timeout);
                cleanup();
                reject(new Error(e.message || 'Worker error'));
            };

            worker.postMessage({ code, data, timeout: timeoutMs });
        });
    }
}
