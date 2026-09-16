import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IMetabolicService,
    IMaestroService,
    ILocalTripleService,
    IChemistService,
    IAnalitikService,
    IRuslanService,
    IHeisenbergService,
    IAgencyRuService,
    IEvoLabService,
    IGigaStudioService,
} from '../contracts/rivals15';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase47 e2e chain (U)', () => {
    it('metabolic → maestro → localTriple → chemist → analitik → ruslan → heisenberg → agencyRu → evoLab → gigaStudio', async () => {
        const metabolic = get<IMetabolicService>('metabolicService');
        expect((await metabolic.tick('explore', 0.5)).dominant).toBe('explore');

        const maestro = get<IMaestroService>('maestroService');
        const ecoId = await maestro.createEcosystem('shop', ['smm', 'seo']);
        expect((await maestro.orchestrate(ecoId, 'sell')).length).toBeGreaterThan(0);

        const triple = get<ILocalTripleService>('localTripleService');
        expect((await triple.run('check price')).result).toBeDefined();

        const chemist = get<IChemistService>('chemistService');
        expect(await chemist.ask('epoxidation?')).toContain('offline');

        const analitik = get<IAnalitikService>('analitikService');
        expect(await analitik.intake('launch shop')).toContain('Proposal');

        const ruslan = get<IRuslanService>('ruslanService');
        expect(await ruslan.use('wb-price', 'check price')).toContain('offline');

        const heisenberg = get<IHeisenbergService>('heisenbergService');
        const cards = await heisenberg.seedBoard();
        expect(cards.length).toBe(8);

        const agency = get<IAgencyRuService>('agencyRuService');
        expect((await agency.catalog()).length).toBe(187);

        const evo = get<IEvoLabService>('evoLabService');
        const lab = await evo.runLab('wb-price-check');
        expect(lab.score).toBeGreaterThanOrEqual(0.6);
        expect(lab.score).toBeLessThanOrEqual(1);

        const giga = get<IGigaStudioService>('gigaStudioService');
        const app = await giga.generate('WB cabinet');
        expect(app.files).toContain('app/page.tsx');
    }, 60000);
});
