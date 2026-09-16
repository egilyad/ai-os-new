import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IMetaKbService,
    IResearchOsService,
    IDeepResearch2Service,
    IDarwinService,
    IQyvariaService,
    IParliamentaryService,
    IPolicyDebateService,
    ISocraticService,
    IFishbowlService,
    IDelphiService,
} from '../contracts/rivals18';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase50 e2e chain (X)', () => {
    it('metakb → researchos → deep2 → darwin → qyvaria → parliament → policy → socratic → fishbowl → delphi', async () => {
        const metakb = get<IMetaKbService>('metaKbService');
        await metakb.put('chain-kb1', 'RAG: hybrid search');
        expect(await metakb.query('hybrid search')).toContain('RAG: hybrid search');

        const ros = get<IResearchOsService>('researchOsService');
        const folderId = await ros.createFolder('ChainAI');
        await ros.addFile(folderId, 'n1.md', 'text');
        expect((await ros.list(folderId)).length).toBeGreaterThan(0);

        const deep2 = get<IDeepResearch2Service>('deepResearch2Service');
        expect((await deep2.run('AI agents')).report.length).toBeGreaterThan(0);

        const darwin = get<IDarwinService>('darwinService');
        expect((await darwin.evolve('agent', 3)).best).toBeDefined();

        const qyvaria = get<IQyvariaService>('qyvariaService');
        await qyvaria.addNode('A', ['B']);
        await qyvaria.causal('A', 'B');
        expect(await qyvaria.query('A')).toContain('B');

        const parliament = get<IParliamentaryService>('parliamentaryService');
        expect((await parliament.run('UBI')).ranking.length).toBeGreaterThan(0);

        const policy = get<IPolicyDebateService>('policyDebateService');
        expect((await policy.run('UBI', 'basic income')).advantages.length).toBeGreaterThan(0);

        const socratic = get<ISocraticService>('socraticService2');
        expect(await socratic.discuss('ethics')).toContain('ethics');

        const fishbowl = get<IFishbowlService>('fishbowlService');
        await fishbowl.setBowl(['a', 'b', 'c']);
        expect(await fishbowl.rotate('dave')).toContain('dave');

        const delphi = get<IDelphiService>('delphiService');
        const round = await delphi.round({ alice: 5, bob: 6, carol: 5.5, dave: 10 });
        expect(typeof round.median).toBe('number');
        expect(round.consensus).toBe(false);
    }, 60000);
});
