import { describe, it, expect } from 'vitest';
import { ActionParserService } from './action-parser-service';

describe('ActionParserService', () => {
    it('parses JSON actions', () => {
        const r = new ActionParserService().parse(
            '{"thought":"need data","action":"search","args":{"q":"x"}}',
        );
        expect(r?.action).toBe('search');
        expect(r?.args).toEqual({ q: 'x' });
        expect(r?.thought).toBe('need data');
    });

    it('parses Thought/Action text', () => {
        const r = new ActionParserService().parse('Thought: I should look it up\nAction: search');
        expect(r?.action).toBe('search');
        expect(r?.thought).toContain('look it up');
    });

    it('supports custom parsers and returns null on unknown format', () => {
        const svc = new ActionParserService();
        svc.register({
            id: 'custom',
            canParse: (t) => t.startsWith('@'),
            parse: (t) => ({ action: t.slice(1), args: {} }),
        });
        expect(svc.parse('@run')?.action).toBe('run');
        expect(svc.parse('nothing useful')).toBeNull();
        expect(svc.list()).toContain('custom');
    });
});
