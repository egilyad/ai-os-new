import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IA2aSpecService,
    ICacheRegistryService,
    IDotpromptService,
    INotebookService,
    ILiveBridgeService,
    IVertexSearchService,
    IDeepResearchService,
    IQuotaGuardService,
    IStudioPackService,
    IAssistService,
} from '../contracts/rivals10';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase42 e2e chain (P)', () => {
    it('card → cache → dotprompt → notebook → live → vertex → brief → quota → pack → seed', async () => {
        const a2a = get<IA2aSpecService>('a2aSpecService');
        expect((await a2a.buildCard({ name: 'Smoke', capabilities: ['chat'] })).length).toBeGreaterThan(0);

        const cache = get<ICacheRegistryService>('cacheRegistryService');
        await cache.create('smoke', 'hello-world', 60000);
        expect(await cache.get('smoke')).toBeDefined();

        const dotprompt = get<IDotpromptService>('dotpromptService');
        await dotprompt.define({ name: 'smoke', template: 'Hi {{who}}', inputSchema: { who: 'string' } });
        expect(await dotprompt.render('smoke', { who: 'Al' })).toContain('Al');

        const notebook = get<INotebookService>('notebookService');
        expect((await notebook.createNotebook('smoke', [])).length).toBeGreaterThan(0);

        const live = get<ILiveBridgeService>('liveBridgeService');
        expect(await live.bargeIn('sess-smoke', 'hello')).toContain('Parked');

        const vertex = get<IVertexSearchService>('vertexSearchService');
        await vertex.boost('smoke-app', ['fast']);
        await vertex.bury('smoke-app', ['slow']);
        await vertex.bindDatastore('smoke-app', 'ds-smoke');
        // boost/bury/bind all resolve without a dataset (answer() needs one — covered by unit scope, not e2e).

        const deep = get<IDeepResearchService>('deepResearchService');
        expect((await deep.plan('smoke topic')).length).toBeGreaterThan(0);

        const quota = get<IQuotaGuardService>('quotaGuardService');
        expect((await quota.check('smoke-key')).ok).toBe(true);

        const pack = get<IStudioPackService>('studioPackService');
        expect(await pack.translate('hello', 'de', {})).toContain('de');

        const assist = get<IAssistService>('assistService');
        expect((await assist.smartReplies('hi, need help')).length).toBe(3);
    }, 60000);
});
