import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IOpenClawService,
    IDshService,
    IManusService,
    IGensparkService,
} from '../contracts/rivals9';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase41 e2e chain (N)', () => {
    it('provider → soul → cron → plugin → trajectory → verify → schedule → fanout → sheets', async () => {
        const claw = get<IOpenClawService>('openClawService');
        expect(Array.isArray(await claw.listChannels())).toBe(true);

        const dsh = get<IDshService>('dshService');
        await dsh.registerPlugin('pdf', ['read']);
        expect((await dsh.listPlugins()).some((p) => p.name === 'pdf')).toBe(true);
        expect(Array.isArray(await dsh.trajectory('nope'))).toBe(true);
        expect((await dsh.spawnSubagent('summarize')).length).toBeGreaterThan(0);

        const manus = get<IManusService>('manusService');
        expect((await manus.schedule('night', '0 2 * * *', 'backup db')).length).toBeGreaterThan(0);

        const genspark = get<IGensparkService>('gensparkService');
        const fanout = await genspark.fanout('hi', ['p1']);
        expect(fanout.answers.length).toBeGreaterThan(0);
        expect(await genspark.sheets([{ a: 1, b: 'x' }])).toContain('a,b');
    }, 60000);
});
