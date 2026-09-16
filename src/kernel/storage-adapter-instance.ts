import { LocalStorageAdapter } from './services/storage/local-storage-adapter';
import type { ILocalStorageAdapter } from './contracts/storage-adapter';

// SR-4: Browser-only singleton — lazy init via try/catch for SSR compatibility
let _instance: ILocalStorageAdapter | null = null;
function ensureInstance(): ILocalStorageAdapter {
    if (!_instance) {
        try {
            _instance = new LocalStorageAdapter();
        } catch {
            _instance = {} as ILocalStorageAdapter;
        }
    }
    return _instance;
}
export const BucketStorageAdapter: ILocalStorageAdapter = new Proxy(
    {} as unknown as ILocalStorageAdapter,
    {
        get(_, prop) {
            const inst = ensureInstance();
            if (typeof prop === 'string' && prop in inst) {
                const val = inst[prop as keyof ILocalStorageAdapter];
                return typeof val === 'function' ? val.bind(inst) : val;
            }
            return undefined;
        },
        set(_, prop, value) {
            const inst = ensureInstance();
            if (typeof prop === 'string') {
                (inst as unknown as Record<string, unknown>)[prop] = value;
            }
            return true;
        },
    },
);
