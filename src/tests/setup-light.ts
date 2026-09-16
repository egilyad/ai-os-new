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

const globalCrypto = globalThis as unknown as { crypto: { randomUUID: () => string } };
if (!globalCrypto.crypto.randomUUID) {
    globalCrypto.crypto.randomUUID = () => '1234-5678-9012-3456';
}

Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
