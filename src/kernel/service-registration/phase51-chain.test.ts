import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IPiService,
    IZedService,
    IWarpService,
    IGptEngineerService,
    IGooseService,
    IContinueService,
    ITabbyService,
    IGptPilotService,
    IVoidService,
    ICrushService,
    ICodeWhaleService,
} from '../contracts/rivals19';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase51 e2e chain (Y)', () => {
    it('pi → zed → warp → gpe → goose → continue → tabby → pilot → void → crush → whale', async () => {
        const pi = get<IPiService>('piService');
        await pi.registerTool('chain-echo', 20);
        expect(await pi.dispatch('chain-echo', { msg: 'hi' })).toContain('chain-echo');

        const zed = get<IZedService>('zedService');
        const bufId = await zed.openBuffer('src/a.ts', 'const x=1');
        expect(await zed.editInline(bufId, 'rename x to y')).toContain('rename x to y');

        const warp = get<IWarpService>('warpService');
        expect((await warp.block('hello')).length).toBeGreaterThan(0);

        const gpe = get<IGptEngineerService>('gptEngineerService');
        expect((await gpe.run('todo app')).files.length).toBeGreaterThan(0);

        const goose = get<IGooseService>('gooseService');
        await goose.recipe('chain-deploy', ['build', 'push']);
        expect(await goose.runRecipe('chain-deploy')).toContain('chain-deploy');

        const cont = get<IContinueService>('continueService');
        expect((await cont.autocomplete('const x=')).length).toBeGreaterThan(0);

        const tabby = get<ITabbyService>('tabbyService');
        expect(await tabby.complete('function f(){')).toContain('Tabby');

        const pilot = get<IGptPilotService>('gptPilotService');
        const projectId = await pilot.launch('blog');
        expect(await pilot.status(projectId)).toContain('GptPilot');

        const voidSvc = get<IVoidService>('voidService');
        const sessionId = await voidSvc.session('main.ts');
        expect(await voidSvc.assist(sessionId, 'explain file')).toContain('Void');

        const crush = get<ICrushService>('crushService');
        expect(await crush.pretty('hi')).toContain('crush');

        const whale = get<ICodeWhaleService>('codeWhaleService');
        expect(await whale.cargoCheck()).toContain('cargo check');
    }, 60000);
});
