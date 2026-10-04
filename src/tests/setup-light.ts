import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

class WorkerMock {
    url: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    constructor(stringUrl: string) {
        this.url = stringUrl;
    }
    postMessage(_msg: unknown) {
        setTimeout(() => {
            if (this.onmessage) {
                this.onmessage({ data: { result: 'Mocked Worker Result' } } as MessageEvent);
            }
        }, 0);
    }
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
}

vi.stubGlobal('Worker', WorkerMock);

/**
 * T-M-1: configurable Worker mock for tests that need realistic shapes
 * (cap_request / error / typed results). The global mock above stays a
 * fixed-shape default so existing tests don't change behavior; override
 * per-test via `vi.stubGlobal('Worker', makeWorkerMock(handler))`.
 */
export function makeWorkerMock(
    handler: (msg: unknown) => unknown = () => ({ result: 'Mocked Worker Result' }),
): new (stringUrl: string) => Worker {
    return class ConfigurableWorkerMock {
        onmessage: ((event: MessageEvent) => void) | null = null;
        constructor(public url: string) {}
        postMessage = (msg: unknown) => {
            setTimeout(() => {
                this.onmessage?.({ data: handler(msg) } as MessageEvent);
            }, 0);
        };
        terminate() {}
        addEventListener() {}
        removeEventListener() {}
    } as unknown as new (stringUrl: string) => Worker;
}

const globalCrypto = globalThis as unknown as { crypto: { randomUUID: () => string } };
if (!globalCrypto.crypto.randomUUID) {
    globalCrypto.crypto.randomUUID = () => '1234-5678-9012-3456';
}

Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
