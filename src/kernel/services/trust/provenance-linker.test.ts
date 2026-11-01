import { describe, expect, it } from 'vitest';
import { ProvenanceLinker } from './provenance-linker';

describe('ProvenanceLinker (cognitive provenance)', () => {
    it('link создаёт связь и get возвращает её', () => {
        const linker = new ProvenanceLinker();
        const link = linker.link(
            { kind: 'debate', id: 'd1' },
            { kind: 'crystal', id: 'c1' },
            'derived_from',
        );
        expect(link.relation).toBe('derived_from');
        expect(linker.get()).toHaveLength(1);
    });

    it('get фильтрует по kind', () => {
        const linker = new ProvenanceLinker();
        linker.link({ kind: 'debate', id: 'd1' }, { kind: 'crystal', id: 'c1' }, 'derived_from');
        linker.link({ kind: 'memory', id: 'm1' }, { kind: 'crystal', id: 'c1' }, 'evidenced_by');
        expect(linker.get({ kind: 'debate' })).toHaveLength(1);
        expect(linker.get({ kind: 'memory' })).toHaveLength(1);
        expect(linker.get({ kind: 'crystal' })).toHaveLength(2);
    });

    it('get фильтрует по id', () => {
        const linker = new ProvenanceLinker();
        linker.link({ kind: 'debate', id: 'd1' }, { kind: 'crystal', id: 'c1' }, 'derived_from');
        linker.link({ kind: 'debate', id: 'd2' }, { kind: 'crystal', id: 'c2' }, 'derived_from');
        expect(linker.get({ id: 'd1' })).toHaveLength(1);
        expect(linker.get({ id: 'c2' })).toHaveLength(1);
    });

    it('clear очищает', () => {
        const linker = new ProvenanceLinker();
        linker.link({ kind: 'debate', id: 'd' }, { kind: 'crystal', id: 'c' }, 'influenced');
        linker.clear();
        expect(linker.get()).toHaveLength(0);
    });
});
