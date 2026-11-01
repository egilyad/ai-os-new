import { describe, expect, it } from 'vitest';
import { BuilderNodeCatalog } from './node-catalog';

describe('BuilderNodeCatalog', () => {
    it('содержит core-узлы exposed и cognitive-узлы скрытыми', () => {
        const catalog = new BuilderNodeCatalog();
        expect(catalog.get('agent')?.exposed).toBe(true);
        expect(catalog.get('tool')?.exposed).toBe(true);
        expect(catalog.get('crystal')?.exposed).toBe(false);
        expect(catalog.get('synthesis')?.exposed).toBe(false);
        expect(catalog.get('time-machine')?.exposed).toBe(false);
    });

    it('list возвращает все узлы', () => {
        const catalog = new BuilderNodeCatalog();
        expect(catalog.list().length).toBeGreaterThanOrEqual(12);
    });

    it('getExposed возвращает только доступные', () => {
        const catalog = new BuilderNodeCatalog();
        const exposed = catalog.getExposed();
        expect(exposed.every((n) => n.exposed)).toBe(true);
        expect(exposed.map((n) => n.kind)).toEqual(expect.arrayContaining(['agent', 'router', 'guardrail', 'tool']));
    });

    it('expose переключает доступность', () => {
        const catalog = new BuilderNodeCatalog();
        catalog.expose('crystal', true);
        expect(catalog.get('crystal')?.exposed).toBe(true);
    });
});
