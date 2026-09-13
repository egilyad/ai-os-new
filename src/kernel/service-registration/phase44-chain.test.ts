import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IConstitutionalService,
    IVoyagerService,
    ISmallvilleService,
    IAlphaCodeService,
    IWorldModelService,
    INeuroSymbolicService,
    ISwarmService,
    IALifeService,
    ICuriosityService,
    IQuantumDeepService,
} from '../contracts/rivals12';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase44 e2e chain (R)', () => {
    it('constit → voyager → smallville → alphacode → world → neuro → swarm → alife → curiosity → quantum', async () => {
        const constit = get<IConstitutionalService>('constitutionalService');
        expect((await constit.critique('hello')).ok).toBe(true);

        const voyager = get<IVoyagerService>('voyagerService');
        expect((await voyager.proposeGoal('')).length).toBeGreaterThan(0);

        const smallville = get<ISmallvilleService>('smallvilleService');
        expect((await smallville.planDay('a1', '2026-01-01')).length).toBeGreaterThan(0);

        const alphacode = get<IAlphaCodeService>('alphaCodeService');
        expect((await alphacode.generate('sum fn', 2)).candidates.length).toBe(2);

        const world = get<IWorldModelService>('worldModelService');
        await world.record('s0', 'a0', 's1', 1);
        expect(await world.predict('s0', 'a0')).not.toBeNull();

        const neuro = get<INeuroSymbolicService>('neuroSymbolicService');
        expect(typeof (await neuro.query('P', 'e1'))).toBe('number');

        const swarm = get<ISwarmService>('swarmService');
        expect((await swarm.pso('test', 2)).best.length).toBe(2);

        const alife = get<IALifeService>('alifeService');
        await alife.seed('ACGT');
        expect((await alife.tick()).length).toBeGreaterThan(0);

        const curiosity = get<ICuriosityService>('curiosityService');
        expect(typeof (await curiosity.bonus('s0', 'a0'))).toBe('number');

        const quantum = get<IQuantumDeepService>('quantumDeepService');
        const quboId = await quantum.defineQubo(['x', 'y'], [['x', 'y', -1] as [string, string, number]]);
        const annealed = await quantum.anneal(quboId);
        expect(annealed.best).toBeDefined();
        expect(typeof annealed.energy).toBe('number');
    }, 60000);
});
