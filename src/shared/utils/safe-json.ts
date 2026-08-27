const REVIVER = (k: string, v: unknown) =>
    k === '__proto__' || k === 'constructor' || k === 'prototype' ? undefined : v;

export function safeJsonParse<T = unknown>(json: string): T | undefined;
export function safeJsonParse<T = unknown>(json: string, fallback: T): T;
export function safeJsonParse<T = unknown>(json: string, fallback?: T): T | undefined {
    try {
        return JSON.parse(json, REVIVER) as T;
    } catch {
        return fallback;
    }
}

export function safeClone<T>(obj: T): T {
    try {
        return structuredClone(obj);
    } catch {
        return JSON.parse(JSON.stringify(obj));
    }
}
