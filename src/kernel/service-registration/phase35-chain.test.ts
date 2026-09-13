import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IReasoningService,
    ISessionStateService,
    IDatasetService,
    IFlowApiService,
    IDocStoreService,
    ITypedAgentService,
    ICodePlanService,
    IDialogueService,
    IBotRouterService,
    IPrototypeService,
} from '../contracts/rivals3';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase35 e2e chain (H)', () => {
    it('think → session → dataset → flowapi → docstore → typed → codeplan → dialogue → botroute → proto', async () => {
        const reasoning = get<IReasoningService>('reasoningService');
        expect((await reasoning.think('ping')).goal).toBeDefined();

        const session = get<ISessionStateService>('sessionStateService');
        await session.setState('session', 's1', 'k', { v: 1 });
        expect(await session.getState('session', 's1', 'k')).toBeDefined();

        const dataset = get<IDatasetService>('datasetService');
        expect(Array.isArray(await dataset.listDatasets())).toBe(true);

        const flowapi = get<IFlowApiService>('flowApiService');
        expect(Array.isArray(await flowapi.listTokens())).toBe(true);

        const docstore = get<IDocStoreService>('docStoreService');
        expect((await docstore.createStore('s1')).length).toBeGreaterThan(0);

        const typed = get<ITypedAgentService>('typedAgentService');
        expect(
            (await typed.defineAgent({ name: 't', system: 's', outputSchema: { type: 'object' } })).length,
        ).toBeGreaterThan(0);

        const codeplan = get<ICodePlanService>('codePlanService');
        expect((await codeplan.planAndRun('ping', 1)).answer).toBeDefined();

        const dialogue = get<IDialogueService>('dialogueService');
        expect(
            (await dialogue.createBot({ name: 'b', intents: [{ name: 'greet', examples: ['hi'] }] })).length,
        ).toBeGreaterThan(0);

        const botroute = get<IBotRouterService>('botRouterService');
        expect(['a', 'b']).toContain(await botroute.route(['a', 'b'], 'ctx'));

        const proto = get<IPrototypeService>('prototypeService');
        await proto.setSlot('k', 'v');
        expect(await proto.getSlot('k')).toBe('v');
    }, 60000);
});
