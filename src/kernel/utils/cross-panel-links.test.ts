import { describe, it, expect } from 'vitest';
import { getCrossPanelLinks, type NavItemRef } from './cross-panel-links';

const ITEMS: NavItemRef[] = [
    { id: 'dashboard', label: 'Dashboard', sectionId: 'main' },
    { id: 'providers', label: 'Providers', sectionId: 'ops' },
    { id: 'pools', label: 'Pools', sectionId: 'ops' },
    { id: 'rotations', label: 'Rotations', sectionId: 'ops' },
    { id: 'budget', label: 'Budget', sectionId: 'ops' },
    { id: 'wiki', label: 'Wiki', sectionId: 'tools' },
    { id: 'chat', label: 'Chat', sectionId: 'tools' },
];

describe('getCrossPanelLinks (P2-7)', () => {
    it('returns curated related links first', () => {
        const links = getCrossPanelLinks('providers', ITEMS, {
            providers: ['pools', 'rotations'],
        });
        expect(links[0]).toMatchObject({ id: 'pools', reason: 'related' });
        expect(links[1]).toMatchObject({ id: 'rotations', reason: 'related' });
    });

    it('ignores unknown curated ids and fills with same-section siblings', () => {
        const links = getCrossPanelLinks('providers', ITEMS, {
            providers: ['nope', 'budget'],
        });
        expect(links[0]!.id).toBe('budget');
        expect(links[1]!.id).toBe('pools');
        expect(links[1]!.reason).toBe('section');
        expect(links.some((l) => l.id === 'rotations')).toBe(true);
    });

    it('respects the max limit and never includes the panel itself', () => {
        const links = getCrossPanelLinks('providers', ITEMS, { providers: ['pools', 'budget'] }, 2);
        expect(links).toHaveLength(2);
        expect(links.some((l) => l.id === 'providers')).toBe(false);
    });

    it('returns empty for unknown panels without curated links', () => {
        expect(getCrossPanelLinks('missing', ITEMS)).toEqual([]);
    });

    it('works without curated map', () => {
        const links = getCrossPanelLinks('budget', ITEMS);
        expect(links.map((l) => l.id)).toEqual(['providers', 'pools', 'rotations']);
    });
});
