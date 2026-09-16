import { describe, it, expect, vi } from 'vitest';
import { GuardrailService } from './guardrail-service';

function svc() {
    return new GuardrailService({ emit: vi.fn() } as unknown as import('../../types/interfaces').IEventBus);
}

describe('GuardrailService violated() semantics (audit #1)', () => {
    it('contains:block blocks text WITH the pattern, allows clean text', async () => {
        const s = svc();
        await s.addRule({ name: 'NoSpam', kind: 'contains', pattern: 'spam', tripwire: 'block' });
        expect(await s.check('this has spam inside')).toEqual({ ok: false, hits: ['NoSpam'] });
        expect(await s.check('totally clean text')).toEqual({ ok: true, hits: [] });
    });

    it('regex:block matches on pattern hit only', async () => {
        const s = svc();
        await s.addRule({ name: 'NoKeys', kind: 'regex', pattern: 'sk-[a-z0-9]+', tripwire: 'block' });
        expect((await s.check('key sk-abc123 here')).ok).toBe(false);
        expect((await s.check('no keys here')).ok).toBe(true);
    });

    it('minLength blocks short text, maxLength blocks long text', async () => {
        const s = svc();
        await s.addRule({ name: 'Min10', kind: 'minLength', value: 10, tripwire: 'block' });
        await s.addRule({ name: 'Max5', kind: 'maxLength', value: 5, tripwire: 'block' });
        expect((await s.check('123')).hits).toEqual(['Min10']);
        expect((await s.check('12345678901')).hits).toEqual(['Max5']);
        expect((await s.check('1234567')).hits).toEqual(['Min10', 'Max5']);
    });

    it('flag tripwire records hits without blocking', async () => {
        const s = svc();
        await s.addRule({ name: 'Watch', kind: 'contains', pattern: 'x', tripwire: 'flag' });
        expect(await s.check('has x here')).toEqual({ ok: true, hits: ['Watch'] });
    });
});
