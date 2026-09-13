import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IForumPlusService,
    IDecisionService,
    IPolisService,
    IReflexionService,
    ITotService,
    ISelfConsistencyService,
    ISoarService,
    IAtomService,
    IMeterService,
    IErrorInboxService,
} from '../contracts/rivals7';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase40 e2e chain (M)', () => {
    it('poll → decision → polis → reflexion → tot → selfcon → soar → atom → meter → errinbox', async () => {
        const forum = get<IForumPlusService>('forumPlusService');
        const pollId = await forum.createPoll('t1', 'Best?', ['A', 'B']);
        await forum.votePoll(pollId, 'u1', 'A');
        expect(typeof (await forum.trustOf('u1'))).toBe('number');

        const decision = get<IDecisionService>('decisionService');
        const propId = await decision.propose('Adopt X', ['adopt', 'reject']);
        await decision.vote(propId, 'u1', 'agree');
        expect((await decision.outcome(propId)).quorum).toBeDefined();

        const polis = get<IPolisService>('polisService');
        const stmtId = await polis.addStatement('c1', 'Taxes should rise');
        await polis.vote('c1', stmtId, 'u1', 'agree');
        expect(await polis.clusters('c1')).toBeDefined();

        const reflexion = get<IReflexionService>('reflexionService');
        expect((await reflexion.run('Summarize cats', 1)).answer).toBeDefined();

        const tot = get<ITotService>('totService');
        expect((await tot.search('plan lunch', 2, 1, 1)).best).toBeDefined();

        const selfcon = get<ISelfConsistencyService>('selfConService');
        expect((await selfcon.sample('2+2=?', 1)).answer).toContain('echo');

        const soar = get<ISoarService>('soarService');
        await soar.setFact('door', 'open');
        await soar.addProduction({ name: 'open-door', when: { door: 'open' }, then: { room: 'enter' } });
        expect((await soar.cycle(1)).fired).toBeDefined();

        const atom = get<IAtomService>('atomService');
        await atom.addNode('Concept', 'cat');
        expect(await atom.deduce('cat')).toBeDefined();

        const meter = get<IMeterService>('meterService');
        await meter.inc('hits', 1);
        expect(await meter.series('hits')).toBeDefined();

        const errinbox = get<IErrorInboxService>('errInboxService');
        const fp = await errinbox.capture('TypeError: x is null', 'room#general');
        expect(fp.length).toBeGreaterThan(0);
    }, 60000);
});
