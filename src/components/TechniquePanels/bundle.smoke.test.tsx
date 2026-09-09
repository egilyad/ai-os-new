import React from 'react';
import { describe, it, expect } from 'vitest';
import { TECHNIQUE_NAV_ITEMS } from './technique-panels-bundle';

describe('technique-panels-bundle', () => {
    it('every nav item has a valid React element icon (would white-screen otherwise)', () => {
        expect(TECHNIQUE_NAV_ITEMS.length).toBeGreaterThan(0);
        for (const item of TECHNIQUE_NAV_ITEMS) {
            expect(React.isValidElement(item.icon)).toBe(true);
        }
    });
});

