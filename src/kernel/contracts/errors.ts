export interface ProviderError {
    readonly type: 'provider';
    readonly provider: string;
    readonly message: string;
    readonly code?: string;
    readonly retryable?: boolean;
    readonly statusCode?: number;
}

export interface QuotaError {
    readonly type: 'quota';
    readonly provider: string;
    readonly limitType: 'tokens' | 'requests' | 'rate' | 'cost';
    readonly current: number;
    readonly limit: number;
    readonly resetAt?: number;
}

export interface MemoryError {
    readonly type: 'memory';
    readonly operation: string;
    readonly message: string;
}

export interface ToolError {
    readonly type: 'tool';
    readonly toolId: string;
    readonly message: string;
    readonly code?: string;
}

export interface RoutingError {
    readonly type: 'routing';
    readonly strategy: string;
    readonly message: string;
    readonly cause?: string;
}

export interface KernelError {
    readonly type: 'kernel';
    readonly source: string;
    readonly message: string;
    readonly code?: string;
}

export interface ConfigError {
    readonly type: 'config';
    readonly key: string;
    readonly message: string;
}

export type KernelErrorUnion =
    ProviderError | QuotaError | MemoryError | ToolError | RoutingError | KernelError | ConfigError;

export function isProviderError(e: KernelErrorUnion): e is ProviderError {
    return e.type === 'provider';
}

export function isQuotaError(e: KernelErrorUnion): e is QuotaError {
    return e.type === 'quota';
}

export function isMemoryError(e: KernelErrorUnion): e is MemoryError {
    return e.type === 'memory';
}

export function isToolError(e: KernelErrorUnion): e is ToolError {
    return e.type === 'tool';
}

export function isRoutingError(e: KernelErrorUnion): e is RoutingError {
    return e.type === 'routing';
}
