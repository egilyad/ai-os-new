const API_KEY_PATTERNS = [
    /sk-or-v1-[a-zA-Z0-9]{20,}/,
    /sk-[a-zA-Z0-9]{20,}/,
    /AIza[0-9A-Za-z_-]{35,}/,
    /gsk_[a-zA-Z0-9]{30,}/,
    /nvapi-[a-zA-Z0-9_-]{30,}/,
    /hf_[a-zA-Z0-9]{30,}/,
    /pplx-[a-zA-Z0-9]{30,}/,
    /cf-[a-zA-Z0-9]{30,}/,
    /xai-[a-zA-Z0-9]{30,}/,
];

const SENSITIVE_KEY_RE = /^(key|token|secret|password|api_key|apiKey)$/i;

export function sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
        let result = obj;
        for (const pattern of API_KEY_PATTERNS) {
            result = result.replace(pattern, '[KEY REDACTED]');
        }
        return result;
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj instanceof Map) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of obj) {
            result[String(key)] = sanitizeObject(value);
        }
        return result;
    }
    if (obj instanceof Set) {
        return [...obj].map(sanitizeObject);
    }
    if (obj instanceof Date) {
        return obj.toISOString();
    }
    if (obj instanceof RegExp) {
        return obj;
    }
    if (typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (SENSITIVE_KEY_RE.test(key)) {
                result[key] = '[REDACTED]';
            } else {
                result[key] = sanitizeObject(value);
            }
        }
        return result;
    }
    return obj;
}

export function sanitizeError(text: string): string {
    return text.replace(
        /(sk-or-v1-[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z_-]{35,}|gsk_[a-zA-Z0-9]{30,}|nvapi-[a-zA-Z0-9_-]{30,}|hf_[a-zA-Z0-9]{30,}|pplx-[a-zA-Z0-9]{30,}|cf-[a-zA-Z0-9]{30,}|xai-[a-zA-Z0-9]{30,})/g,
        '[KEY REDACTED]',
    );
}

export function sanitizeApiKey(key: string): string {
    if (!key || key.length < 8) return '[INVALID]';
    return key.slice(0, 4) + '***' + key.slice(-4);
}

export function sanitizePromptVar(input: string): string {
    return input
        .replace(/<\|[^|]*\|>/g, '')
        .replace(/\bSYSTEM:\s*/gi, '')
        .replace(/\bASSISTANT:\s*/gi, '')
        .replace(/\bUSER:\s*/gi, '')
        .slice(0, 8000);
}
