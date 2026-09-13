import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    ISciAgentsService,
    ISparksService,
    IAiScientistService,
    ILatentService,
    IEightStageService,
    ICognitaeService,
    ICogTeamService,
    ISynService,
    IHelixService,
    IIdeatorService,
} from '../contracts/rivals16';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase48 e2e chain (V)', () => {
    it('sci → sparks → ai-sci → latent → eight → cognitae → cogteam → syn → helix → ideator', async () => {
        const sci = get<ISciAgentsService>('sciAgentsService');
        expect((await sci.hypothesize('dark matter')).length).toBeGreaterThan(0);

        const sparks = get<ISparksService>('sparksService');
        expect((await sparks.cycle('cold fusion works')).principle.length).toBeGreaterThan(0);

        const ais = get<IAiScientistService>('aiScientistService');
        await ais.queueIdea('solar sail optimization');
        expect((await ais.runNext()).paper.length).toBeGreaterThan(0);

        const latent = get<ILatentService>('latentService');
        await latent.post('agent-1', 'observation one');
        expect((await latent.synthesize()).length).toBeGreaterThan(0);

        const eight = get<IEightStageService>('eightStageService');
        expect((await eight.run('quantum memory')).length).toBe(8);

        const cognitae = get<ICognitaeService>('cognitaeService');
        expect((await cognitae.roles()).length).toBeGreaterThan(0);

        const cogteam = get<ICogTeamService>('cogTeamService');
        expect((await cogteam.run('design rover')).length).toBeGreaterThan(0);

        const syn = get<ISynService>('synService');
        expect((await syn.loop()).length).toBeGreaterThan(0);

        const helix = get<IHelixService>('helixService');
        expect((await helix.gaps()).length).toBeGreaterThan(0);

        const ideator = get<IIdeatorService>('ideatorService2');
        expect((await ideator.testDialogues('mars habitat')).best).toBeDefined();
    }, 60000);
});
