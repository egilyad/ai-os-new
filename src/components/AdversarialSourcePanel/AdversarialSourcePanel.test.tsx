import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdversarialSourcePanel from './AdversarialSourcePanel';

function stubUnrelatedFetch() {
    return vi.stubGlobal(
        'fetch',
        async (_input: any) =>
            new Response(
                '<html><body>Completely unrelated content about cooking recipes, gardening tips and knitting patterns with no solar mention whatsoever here at all.</body></html>',
                { status: 200, headers: { 'Content-Type': 'text/html' } },
            ),
    );
}

describe('AdversarialSourcePanel', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders header', () => {
        render(<AdversarialSourcePanel />);
        expect(screen.getAllByText(/Adversarial Source/i).length).toBeGreaterThan(0);
    });
    it('shows verify button', () => {
        render(<AdversarialSourcePanel />);
        expect(screen.getByRole('button', { name: /Verify claims/i })).toBeTruthy();
    });
    it('verifies distorted source', async () => {
        stubUnrelatedFetch();
        render(<AdversarialSourcePanel />);
        const ta = screen.getByPlaceholderText(/Paste opponent text/i) as HTMLTextAreaElement;
        fireEvent.change(ta, {
            target: {
                value:
                    'Opponent claims: Solar study at https://example.com/solar-study proves 90% efficiency and solves seasonal variability completely. See https://nature.com/paper for confirmation that solar is flawless.',
            },
        });
        fireEvent.click(screen.getByRole('button', { name: /Verify claims/i }));
        await waitFor(() => expect(document.body.textContent).toContain('DISTORTED'), { timeout: 4000 });
        expect(document.body.textContent).toContain('SOURCE VERIFICATION');
    });
    it('no URLs → no distortion message', async () => {
        render(<AdversarialSourcePanel />);
        const ta = screen.getByPlaceholderText(/Paste opponent text/i) as HTMLTextAreaElement;
        fireEvent.change(ta, {
            target: { value: 'I think solar is good because sun is bright and we should use it more often without any citations.' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Verify claims/i }));
        await waitFor(() => expect(document.body.textContent).toContain('No distortion'), { timeout: 3000 });
    });
});
