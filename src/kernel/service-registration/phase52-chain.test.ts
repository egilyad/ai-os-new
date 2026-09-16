import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    ICodexService,
    IGeminiCliService,
    IKiloService,
    IInterpreterService,
    IMiniSweService,
    IHeliconeService,
    IPortkeyService,
    ILiteLlmService,
    ILangfuseService,
} from '../contracts/rivals20';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase52 e2e chain (Z)', () => {
    it('codex → geminicli → kilo → interpreter → miniswe → helicone → portkey → litellm → langfuse', async () => {
        const codex = get<ICodexService>('codexService');
        const diff = await codex.prompt('add retry to fetch');
        expect(diff.diff.length).toBeGreaterThan(0);

        const cli = get<IGeminiCliService>('geminiCliService');
        expect((await cli.chat('status')).length).toBeGreaterThan(0);

        const kilo = get<IKiloService>('kiloService');
        expect((await kilo.fanout('status')).length).toBeGreaterThan(0);

        const interp = get<IInterpreterService>('interpreterService');
        const ticket = await interp.exec('print(42)', 'python');
        expect(ticket).toContain('ticket');

        const swe = get<IMiniSweService>('miniSweService');
        const solved = await swe.solve('crash on start');
        expect(solved.patch).toContain('+');
        expect(solved.passed).toBe(true);

        const heli = get<IHeliconeService>('heliconeService');
        const hitsBefore = await heli.hits();
        await heli.log('e2e probe');
        expect(await heli.hits()).toBeGreaterThan(hitsBefore);

        const portkey = get<IPortkeyService>('portkeyService');
        await portkey.setRoute('e2e-model', 'primary-a', ['fb-b']);
        expect(await portkey.route('e2e-model')).toBe('primary-a');
        expect(await portkey.fallbacks('e2e-model')).toEqual(['fb-b']);

        const lite = get<ILiteLlmService>('liteLlmService');
        expect(await lite.proxy('m', 'hello')).toContain('[LiteLLM');

        const fuse = get<ILangfuseService>('langfuseService');
        await fuse.trace('e2e-ds', JSON.stringify({ text: 'probe', score: 1 }));
        expect(await fuse.eval('e2e-ds')).toBeCloseTo(1, 5);
    }, 60000);
});
