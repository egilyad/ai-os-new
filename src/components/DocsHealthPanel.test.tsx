import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DocsHealthPanel from './DocsHealthPanel';

vi.mock('../kernel/instances', () => ({
    consistencyChecker: {
        getLastReport: () => ({ total: 3, passed: 2, failed: 1 }),
        fetchDocs: vi.fn(),
        checkDocs: vi.fn(),
    },
    consistencyHealingPipeline: {
        getPlan: () => ({ totalTasks: 0, completedTasks: 0, failedTasks: 0 }),
        analyze: vi.fn(),
        executeAll: vi.fn(async () => []),
    },
    eventBus: { emit: vi.fn() },
    EVENTS: { NOTIFICATION: 'NOTIFICATION' },
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('DocsHealthPanel', () => {
    it('tolerates a legacy persisted report/plan without items/byCategory/tasks', () => {
        render(<DocsHealthPanel />);
        expect(screen.getByText('docs_health.total')).toBeDefined();
        expect(screen.getByText('docs_health.healing_plan')).toBeDefined();
        expect(screen.getByText('docs_health.by_category')).toBeDefined();
        expect(document.body.textContent).not.toContain('undefined');
        expect(document.body.textContent).not.toContain('NaN');
    });
});
