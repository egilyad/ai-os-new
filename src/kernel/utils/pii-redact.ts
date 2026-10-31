/**
 * pii-redact — deterministic PII masking for observability/telemetry text.
 *
 * Used at persistence boundaries (traces, logs) so raw user prompts and LLM
 * outputs never land in long-term storage unmasked. Patterns mirror the
 * built-in security patterns in PolicyService (`defaultSecurityPatterns`).
 */

interface RedactRule {
    name: string;
    re: RegExp;
}

const RULES: RedactRule[] = [
    { name: 'credit_card', re: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
    { name: 'phone', re: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
    { name: 'ssn', re: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g },
    { name: 'email', re: /\b[\w.-]+@[\w.-]+\.\w+\b/g },
    // Provider/cloud API keys and bearer tokens (never log these).
    { name: 'api_key', re: /\b(sk|sk-ant)-[A-Za-z0-9_-]{8,}\b/g },
    { name: 'google_api_key', re: /\bAIza[0-9A-Za-z_-]{20,}\b/g },
    { name: 'slack_token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
    { name: 'bearer_token', re: /\bBearer\s+[A-Za-z0-9._~+/-]{16,}\b/gi },
];

/**
 * Replace PII patterns in `text` with `[REDACTED:<name>]` markers.
 * Returns the original string unchanged when there is nothing to redact.
 */
export function redactPii(text: string): string {
    if (typeof text !== 'string' || text.length === 0) return text;
    let out = text;
    for (const rule of RULES) {
        out = out.replace(rule.re, `[REDACTED:${rule.name}]`);
    }
    return out;
}

/** Redact recursively over a JSON value in place (safe for plain objects). */
export function redactPiiValue(value: unknown): unknown {
    if (typeof value === 'string') return redactPii(value);
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) value[i] = redactPiiValue(value[i]);
        return value;
    }
    if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        for (const key of Object.keys(obj)) {
            obj[key] = redactPiiValue(obj[key]);
        }
        return obj;
    }
    return value;
}
