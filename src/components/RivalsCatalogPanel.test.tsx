/**
 * Readiness map §6: RivalsCatalogPanel was untested — add a minimal smoke
 * (render + non-empty + catalog data surfaces).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import RivalsCatalogPanel from './RivalsCatalogPanel';
import { RIVALS_CATALOG } from '../data/rivals-catalog';

describe('RivalsCatalogPanel — smoke', () => {
    it('renders without crashing', () => {
        const { container, unmount } = render(<RivalsCatalogPanel />);
        expect(container.firstChild).not.toBeNull();
        unmount();
    });

    it('surfaces catalog entries', () => {
        const { container } = render(<RivalsCatalogPanel />);
        const text = container.textContent ?? '';
        expect(text.length).toBeGreaterThan(0);
        // At least one group title is visible.
        expect(text).toContain(RIVALS_CATALOG[0]!.title);
    });
});
