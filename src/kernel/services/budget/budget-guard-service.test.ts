import { describe, it, expect } from 'vitest';
import { BudgetGuardService } from './budget-guard-service';

describe('BudgetGuardService', () => {
    it('blocks reservations once the USD cap is exceeded', () => {
        const svc = new BudgetGuardService();
        svc.configure({ maxUsd: 1 });
        expect(svc.reserve({ usd: 0.6 })).toBe(true);
        expect(svc.reserve({ usd: 0.6 })).toBe(false);
        expect(svc.state().spentUsd).toBeCloseTo(0.6);
    });

    it('blocks reservations once the token cap is exceeded', () => {
        const svc = new BudgetGuardService();
        svc.configure({ maxTokens: 100 });
        expect(svc.reserve({ tokens: 60 })).toBe(true);
        expect(svc.reserve({ tokens: 60 })).toBe(false);
        expect(svc.state().spentTokens).toBe(60);
    });

    it('reports exceeded and supports reset', async () => {
        const svc = new BudgetGuardService();
        svc.configure({ maxUsd: 1 });
        expect(svc.reserve({ usd: 1 })).toBe(true);
        expect(svc.state().exceeded).toBe(true);
        svc.reset();
        expect(svc.state().spentUsd).toBe(0);
        expect(svc.state().exceeded).toBe(false);
        await svc.destroy();
    });
});
