/**
 * SuperAgents OS - Sandbox Worker
 *
 * Provides an isolated execution context for agent-generated scripts.
 * WebWorkers have no access to DOM, window, or localStorage.
 *
 * Code is executed by a meriyah-based AST interpreter (sandbox-interpreter.ts)
 * instead of `new Function()`/eval(), so it works under a strict CSP
 * (no unsafe-eval) and never hands control to the worker's native call stack.
 */

import { runSandboxCode } from './sandbox-interpreter';

/* ---------- Unhandled rejection handler ---------- */

self.onunhandledrejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    self.postMessage({
        error: `Unhandled rejection: ${event.reason?.message || String(event.reason)}`,
    });
};

/* ---------- Main handler ---------- */

self.onmessage = async (event: MessageEvent) => {
    const { code, data, timeout } = event.data;
    const EXEC_TIMEOUT = typeof timeout === 'number' && timeout > 0 ? timeout : 5000;

    const os = {
        executeTool: async (toolId: string, input: unknown) => {
            const requestId = crypto.randomUUID();
            return new Promise((resolve, reject) => {
                function handleToolResponse(e: MessageEvent) {
                    if (e.data.type === 'cap_response' && e.data.requestId === requestId) {
                        self.removeEventListener('message', handleToolResponse);
                        clearTimeout(toolTimeout);
                        if (e.data.error) {
                            reject(new Error(e.data.error));
                        } else {
                            resolve(e.data.result);
                        }
                    }
                }
                const toolTimeout = setTimeout(() => {
                    self.removeEventListener('message', handleToolResponse);
                    reject(new Error(`Tool execution timed out after 5000ms`));
                }, 5000);
                self.addEventListener('message', handleToolResponse);
                self.postMessage({
                    type: 'cap_request',
                    requestId,
                    method: 'executeTool',
                    params: { toolId, input },
                });
            });
        },
    };

    try {
        const execPromise = runSandboxCode(code, data, os);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
                () => reject(new Error(`Execution timed out after ${EXEC_TIMEOUT}ms`)),
                EXEC_TIMEOUT,
            );
        });

        const result = await Promise.race([execPromise, timeoutPromise]);
        self.postMessage({ result });
    } catch (e) {
        self.postMessage({ error: (e as Error).message });
    }
};
