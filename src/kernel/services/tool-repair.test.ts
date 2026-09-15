/**
 * ToolRepair tests — AGEMS port Phase 12.4.
 */
import { describe, it, expect } from 'vitest';
import { repairToolCall, ToolSchema } from './tool-repair';

describe('ToolRepair', () => {
    const schema: ToolSchema = {
        name: 'search',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query', required: true },
                limit: { type: 'number', description: 'Max results', default: 10 },
                exact: { type: 'boolean', default: false },
                mode: { type: 'string', enum: ['fast', 'deep', 'auto'] },
            },
            required: ['query'],
        },
    };

    it('returns no repair for valid call', () => {
        const r = repairToolCall({ name: 'search', input: { query: 'hello' } }, schema);
        expect(r.repaired).toBe(false);
        expect(r.fixes).toHaveLength(0);
    });

    it('adds default for missing required field', () => {
        const r = repairToolCall({ name: 'search', input: {} }, schema);
        expect(r.repaired).toBe(true);
        expect(r.call.input.query).toBe('');
        expect(r.fixes.some(f => f.includes('query'))).toBe(true);
    });

    it('adds default for optional field', () => {
        const r = repairToolCall({ name: 'search', input: { query: 'hi', limit: 20 } }, schema);
        expect(r.call.input.limit).toBe(20);
    });

    it('converts string to number', () => {
        const r = repairToolCall({ name: 'search', input: { query: 'hi', limit: '20' } }, schema);
        expect(r.call.input.limit).toBe(20);
    });

    it('converts string to boolean', () => {
        const r = repairToolCall({ name: 'search', input: { query: 'hi', exact: 'true' } }, schema);
        expect(r.call.input.exact).toBe(true);
    });

    it('fixes invalid enum value', () => {
        const r = repairToolCall({ name: 'search', input: { query: 'hi', mode: 'invalid' } }, schema);
        expect(r.call.input.mode).toBe('fast');
    });

    it('removes unknown fields', () => {
        const r = repairToolCall({ name: 'search', input: { query: 'hi', unknown: 'field' } }, schema);
        expect(r.call.input.unknown).toBeUndefined();
    });

    it('returns no repair without schema', () => {
        const r = repairToolCall({ name: 'search', input: { query: 'hi' } });
        expect(r.repaired).toBe(false);
    });
});
