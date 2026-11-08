import type { IAdapterRegistry } from '../../contracts/provider-adapter';
import type { IKeyStateStore } from '../../contracts/key-state';
import type { KeyStore } from '../../contracts/storage/key-store';

export interface KeyServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    securityService: {
        initialize: (password: string, userId?: string) => Promise<boolean>;
        encrypt: (text: string) => Promise<string | null>;
        decrypt: (base64: string) => Promise<string | null>;
        isLocked: () => boolean;
        lock: () => void;
    };
    pricingService: {
        calculateCost: (model: string, inputTokens: number, outputTokens: number) => number;
    };
    keyStore: KeyStore;
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
        batchSetKv: (entries: Record<string, unknown>) => Promise<void>;
        db: {
            keyValue: {
                put: (obj: { id: string; value: unknown; createdAt: number }) => Promise<void>;
            };
        };
    };
    advisorService?: {
        getSuggestions(): Array<{ targetNodeId?: string }>;
    };
    providerAdapterRegistry?: IAdapterRegistry;
    keyStateStore?: IKeyStateStore;
}
