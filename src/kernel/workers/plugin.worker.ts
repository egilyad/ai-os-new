/**
 * SuperAgents OS - Plugin Worker
 *
 * Изолированная среда выполнения для логики плагинов (SPEC_06 §3).
 *
 * Код плагинного хендлера исполняется интерпретатором sandbox-interpreter
 * (meriyah-based AST interpreter), а не eval()/new Function() — работает под
 * строгим CSP и не отдаёт управление нативному стеку воркера. Воркер не имеет
 * доступа к DOM/window/localStorage, сеть доступна только через мост executeTool.
 */

import { runSandboxCode } from './sandbox-interpreter';

/* ---------- Unhandled rejection handler ---------- */

self.onunhandledrejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    self.postMessage({
        type: 'error',
        payload: {
            message: `Unhandled rejection: ${event.reason?.message || String(event.reason)}`,
        },
    });
};

/* ---------- Main handler ---------- */

self.onmessage = async (event: MessageEvent) => {
    const { requestId, type, payload } = event.data;
    if (type !== 'run') return;

    const { code, data } = payload ?? {};
    if (typeof code !== 'string') {
        self.postMessage({
            requestId,
            type: 'error',
            payload: { message: 'Plugin handler code must be a string' },
        });
        return;
    }

    const EXEC_TIMEOUT =
        typeof payload?.timeout === 'number' && payload.timeout > 0 ? payload.timeout : 5000;

    const os = {
        executeTool: async (toolId: string, input: unknown) => {
            const capRequestId = crypto.randomUUID();
            return new Promise((resolve, reject) => {
                function handleToolResponse(e: MessageEvent) {
                    if (e.data.type === 'cap_response' && e.data.requestId === capRequestId) {
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
                    reject(new Error('Tool execution timed out after 5000ms'));
                }, 5000);
                self.addEventListener('message', handleToolResponse);
                self.postMessage({
                    type: 'cap_request',
                    requestId: capRequestId,
                    method: 'executeTool',
                    params: { toolId, input },
                });
            });
        },
    };

    try {
        const execPromise = runSandboxCode(code, data, os);
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const timeoutPromise = new Promise((_, reject) => {
            timeout = setTimeout(
                () => reject(new Error(`Execution timed out after ${EXEC_TIMEOUT}ms`)),
                EXEC_TIMEOUT,
            );
        });

        try {
            const result = await Promise.race([execPromise, timeoutPromise]);
            self.postMessage({ requestId, type: 'result', payload: { result } });
        } finally {
            if (timeout !== undefined) clearTimeout(timeout);
        }
    } catch (e) {
        self.postMessage({
            requestId,
            type: 'error',
            payload: { message: (e as Error).message },
        });
    }
};
