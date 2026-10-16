import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../kernel/instances', () => ({
    researchEngine: {
        getAllSessions: vi.fn(() => []),
    },
    geminiResearchService: null,
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('GeminiResearchPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('says the service is unavailable instead of rendering dead tabs', async () => {
        const Panel = (await import('./GeminiResearchPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('Gemini Research service not available')).toBeDefined();
        expect(screen.getByText('Ensure Gemini API key is configured')).toBeDefined();
    });

    it('surfaces session-load failures through the error slot', async () => {
        const { researchEngine } = await import('../../kernel/instances');
        vi.mocked(researchEngine.getAllSessions).mockImplementationOnce(() => {
            throw new Error('store down');
        });
        const Panel = (await import('./GeminiResearchPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('Failed to load research sessions')).toBeDefined();
    });
});
