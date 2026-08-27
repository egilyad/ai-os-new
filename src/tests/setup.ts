import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock Web Worker
class WorkerMock {
    url: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    constructor(stringUrl: string) {
        this.url = stringUrl;
    }
    postMessage(_msg: unknown) {
        // Simulate async response
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

// Mock crypto.randomUUID
const globalCrypto = globalThis as unknown as { crypto: { randomUUID: () => string } };
if (!globalCrypto.crypto.randomUUID) {
    globalCrypto.crypto.randomUUID = () => '1234-5678-9012-3456';
}

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();

// Initialize the unified runtime so that all resolved services are registered in the DI container
import { runtime } from '../kernel/runtime';
await runtime.start();

// Teardown after all tests to prevent leaked handles (intervals, listeners, workers)
import { afterAll } from 'vitest';
afterAll(async () => {
    await runtime.shutdown();
});
