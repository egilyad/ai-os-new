import { describe, expect, it } from 'vitest';
import { ProvenanceCollector } from './provenance-collector';
import { ProvenanceLinker } from './provenance-linker';

function makeEvents() {
    const reg: Record<string, Array<(d?: unknown) => void>> = {};
    return {
        on: (e: string, cb: (d?: unknown) => void) => {
            (reg[e] ??= []).push(cb);
            return () => {};
        },
        emit: (e: string, d?: unknown) => {
            (reg[e] ?? []).forEach((cb) => cb(d));
        },
    };
}

describe('ProvenanceCollector', () => {
    it('debate verdict → связь debate→knowledge', () => {
        const events = makeEvents();
        const linker = new ProvenanceLinker();
        const collector = new ProvenanceCollector(events as never, linker);
        collector.start();
        events.emit('debate:verdict:generated', { sessionId: 'd1', verdict: 'x' });
        const links = linker.get({ kind: 'debate' });
        expect(links).toHaveLength(1);
        expect(links[0].relation).toBe('derived_from');
    });

    it('crystal formed → связь knowledge→crystal', () => {
        const events = makeEvents();
        const linker = new ProvenanceLinker();
        const collector = new ProvenanceCollector(events as never, linker);
        collector.start();
        events.emit('knowledge:crystal:formed', { crystalId: 'c1', statement: 's' });
        const links = linker.get({ kind: 'crystal' });
        expect(links).toHaveLength(1);
        expect(links[0].relation).toBe('synthesized_into');
    });

    it('synthesis completed → связь synthesis→knowledge', () => {
        const events = makeEvents();
        const linker = new ProvenanceLinker();
        const collector = new ProvenanceCollector(events as never, linker);
        collector.start();
        events.emit('synthesis:completed', { synthesisId: 's1' });
        const links = linker.get({ kind: 'synthesis' });
        expect(links).toHaveLength(1);
    });

    it('memory claim → связь debate→memory', () => {
        const events = makeEvents();
        const linker = new ProvenanceLinker();
        const collector = new ProvenanceCollector(events as never, linker);
        collector.start();
        events.emit('debate:runtime:memory:claim', { sessionId: 'd1', memoryId: 'm1' });
        const links = linker.get({ kind: 'memory' });
        expect(links).toHaveLength(1);
        expect(links[0].relation).toBe('influenced');
    });

    it('destroy отписывает', () => {
        const events = makeEvents();
        const linker = new ProvenanceLinker();
        const collector = new ProvenanceCollector(events as never, linker);
        collector.start();
        collector.destroy();
        events.emit('debate:verdict:generated', { sessionId: 'd1' });
        expect(linker.get()).toHaveLength(0);
    });
});
