import { describe, it, expect } from 'vitest';
import { redactPii, redactPiiValue } from './pii-redact';

describe('redactPii', () => {
    it('redacts email addresses', () => {
        expect(redactPii('contact me at user@example.com now')).toContain('[REDACTED:email]');
        expect(redactPii('user@example.com')).not.toContain('user@example.com');
    });

    it('redacts phone numbers', () => {
        expect(redactPii('call 123-456-7890')).toContain('[REDACTED:phone]');
        expect(redactPii('1-123-456-7890')).toContain('[REDACTED:phone]');
    });

    it('redacts credit cards and SSN', () => {
        expect(redactPii('4111 1111 1111 1111')).toContain('[REDACTED:credit_card]');
        expect(redactPii('SSN 123-45-6789')).toContain('[REDACTED:ssn]');
    });

    it('redacts API keys and bearer tokens', () => {
        expect(redactPii('sk-abcdefghijklmnop1234')).toContain('[REDACTED:api_key]');
        expect(redactPii('Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0')).toContain(
            '[REDACTED:bearer_token]',
        );
    });

    it('leaves clean text unchanged', () => {
        const clean = 'The quick brown fox jumps over the lazy dog';
        expect(redactPii(clean)).toBe(clean);
    });

    it('returns non-string input unchanged', () => {
        expect(redactPii('')).toBe('');
    });
});

describe('redactPiiValue', () => {
    it('redacts nested string values in objects/arrays', () => {
        const value = {
            name: 'test',
            contact: 'a@b.com',
            list: ['+7-123-456-7890', 'plain'],
        };
        const out = redactPiiValue(value) as typeof value;
        expect(out.contact).toContain('[REDACTED:email]');
        expect(out.list[0]).toContain('[REDACTED:phone]');
        expect(out.list[1]).toBe('plain');
        expect(out.name).toBe('test');
    });
});
