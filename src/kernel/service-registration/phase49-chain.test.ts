import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IRckService,
    ICogneeService,
    IMetanService,
    IConceptsService,
    ISecondBrainService,
    IStormService,
    IBlackboardService,
    IMetaControllerService,
    IDoloresService,
    IEpistemeService,
} from '../contracts/rivals17';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase49 e2e chain (W)', () => {
    it('rck → cognee → metan → concepts → secondbrain → storm → bb → metactrl → dolores → episteme', async () => {
        const rck = get<IRckService>('rckService');
        expect(await rck.bind('red', 'circle')).toContain('bind');

        const cognee = get<ICogneeService>('cogneeService');
        expect((await cognee.ingest('Quantum memory stores entangled states')).length).toBeGreaterThan(0);
        expect(Array.isArray(await cognee.recall('quantum memory'))).toBe(true);

        const metan = get<IMetanService>('metanService');
        expect((await metan.buildHierarchy('root-agent')).agents).toBe(4);

        const concepts = get<IConceptsService>('conceptsService');
        expect(await concepts.compose('light', 'memory')).toContain('×');

        const sb = get<ISecondBrainService>('secondBrainService');
        expect((await sb.run('summarize notes')).verifiedBy).toBeDefined();

        const storm = get<IStormService>('stormService2');
        expect(await storm.research('fusion')).toContain('STORM');

        const bb = get<IBlackboardService>('blackboardService2');
        await bb.post('physicist', 'E=mc2');
        expect(await bb.tick()).toContain('control loop');

        const metactrl = get<IMetaControllerService>('metaControllerService2');
        expect(await metactrl.pick('research fusion reactors')).toBe('storm');

        const dolores = get<IDoloresService>('doloresService2');
        await dolores.scaffold([{ do: 'measure' }]);
        expect((await dolores.trace()).length).toBeGreaterThan(0);

        const episteme = get<IEpistemeService>('epistemeService2');
        expect((await episteme.sync('done', 'done')).synced).toBe(true);
    }, 60000);
});
