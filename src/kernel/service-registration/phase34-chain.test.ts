import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IReactService,
    ILoaderService,
    IRagService,
    IRuntimeService,
    ISweService,
    IAiderService,
    IModesService,
    IScopedMemService,
    IIntegrationsService,
    ICharacterService,
} from '../contracts/rivals2';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase34 e2e chain (G)', () => {
    it('react → rag → runtime → swe → aider → modes → smem → integration → character', async () => {
        const react = get<IReactService>('reactService');
        expect((await react.run('ping', 1)).answer).toBeDefined();

        const loader = get<ILoaderService>('loaderService');
        expect((await loader.split('a b c d e f', 10, 2)).length).toBeGreaterThan(0);

        const rag = get<IRagService>('ragService');
        expect((await rag.answer('ping', 0)).answer).toBeDefined();

        const rt = get<IRuntimeService>('runtimeService');
        expect((await rt.startRun('goal offline')).length).toBeGreaterThan(0);

        const swe = get<ISweService>('sweService');
        expect((await swe.buildPatch()).length).toBeGreaterThan(0);

        const aider = get<IAiderService>('aiderService');
        expect((await aider.testChecklist('api change')).length).toBeGreaterThan(0);

        const modes = get<IModesService>('modesService');
        await modes.init();
        expect((await modes.listModes()).length).toBeGreaterThan(0);

        const smem = get<IScopedMemService>('scopedMemService');
        expect(await smem.add('s', 'o1', 'hello')).toBeDefined();

        const integrations = get<IIntegrationsService>('integrationsService');
        expect(Array.isArray(await integrations.catalog())).toBe(true);

        const character = get<ICharacterService>('characterService');
        expect(Array.isArray(await character.listClients())).toBe(true);
    }, 60000);
});
