import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    INetLogoService,
    IMesaService,
    IBonsaiService,
    IChainlitService,
    IGradioService,
    IChartService,
    IGraphVizService,
    IMalmoService,
    IGymService,
} from '../contracts/rivals11';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase43 e2e chain (Q)', () => {
    it('world → model → sim → run → interface → chart → graph → mission → env', async () => {
        const netlogo = get<INetLogoService>('netLogoService');
        const worldId = await netlogo.createWorld(8, ['sheep']);
        await netlogo.seedTurtles(worldId, 'sheep', 4);
        expect((await netlogo.tick(worldId)).ticks).toBeGreaterThanOrEqual(0);

        const mesa = get<IMesaService>('mesaService');
        const modelId = await mesa.createModel('random');
        await mesa.addAgents(modelId, 10);
        expect(await mesa.step(modelId)).toBeDefined();

        const bonsai = get<IBonsaiService>('bonsaiService');
        await bonsai.registerSim('smoke', ['s0', 's1'], ['advance']);
        expect((await bonsai.defineLesson('smoke', 's0', 's1')).length).toBeGreaterThan(0);

        const chainlit = get<IChainlitService>('chainlitService');
        const runId = await chainlit.startRun('smoke');
        const stepId = await chainlit.startStep(runId, 'step1');
        await chainlit.endStep(stepId, 'ok');
        expect(await chainlit.tree(runId)).toBeDefined();

        const gradio = get<IGradioService>('gradioService');
        expect((await gradio.defineInterface({ name: 'smoke', inputs: ['text'], tool: 'json.get' })).length).toBeGreaterThan(0);

        const chart = get<IChartService>('chartService');
        expect((await chart.spec('line', [{ label: 'pop', values: [1, 2, 3] }])).kind).toBe('line');

        const graphviz = get<IGraphVizService>('graphVizService');
        expect((await graphviz.layout(['a', 'b'], [['a', 'b']], 'layered')).a).toBeDefined();

        const malmo = get<IMalmoService>('malmoService');
        const missionId = await malmo.createMission({ name: 'smoke', map: ['#####', '#0.G#', '#####'] });
        expect(await malmo.act(missionId, 'agent0', 'E')).toBeDefined();

        const gym = get<IGymService>('gymService');
        const inst = await gym.make('bandit');
        await gym.reset(inst, 1);
        expect(await gym.step(inst, '1')).toBeDefined();
    }, 60000);
});
