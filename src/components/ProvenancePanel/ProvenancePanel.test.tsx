import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProvenancePanel from './ProvenancePanel';

vi.mock('../../kernel/instances/services-extras', () => ({
    provenanceService: {
        trace: vi.fn(async () => ({ nodes: undefined, edges: undefined })),
    },
    graphVizService: {
        svg: vi.fn(() => '<svg></svg>'),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ProvenancePanel', () => {
    it('renders with a trace button', () => {
        render(<ProvenancePanel />);
        expect(screen.getByText('Trace')).toBeDefined();
    });

    it('tolerates a trace result missing nodes/edges', async () => {
        render(<ProvenancePanel />);
        fireEvent.click(screen.getByText('Trace'));
        await waitFor(() => expect(document.body.textContent).toContain('0 nodes'));
        expect(document.body.textContent).not.toContain('NaN');
    });
});
