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

    it('getByCategory фильтрует по категории', () => {
        const catalog = new BuilderNodeCatalog();
        const cognitive = catalog.getByCategory('cognitive');
        const core = catalog.getByCategory('core');
        expect(cognitive.length).toBeGreaterThanOrEqual(8);
        expect(core.length).toBe(4);
    });

    it('exposeCategory переключает всю категорию', () => {
        const catalog = new BuilderNodeCatalog();
        catalog.exposeCategory('cognitive', true);
        expect(catalog.get('crystal')?.exposed).toBe(true);
        expect(catalog.get('synthesis')?.exposed).toBe(true);
        // core не затронут
        expect(catalog.get('agent')?.exposed).toBe(true);
    });

    it('expose переключает доступность', () => {
        const catalog = new BuilderNodeCatalog();
        catalog.expose('crystal', true);
        expect(catalog.get('crystal')?.exposed).toBe(true);
    });
});
