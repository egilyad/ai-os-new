/**
 * Readiness map §6: thin wrapper panels were untested. Add render smokes with
 * mocked heavy children so we verify the wrapper shell without pulling in the
 * full child dependency trees.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('./ProviderManager/OpenRouterKeyTable', () => ({
    default: () => <div data-testid="or-keys" />,
}));

vi.mock('./AgentsPanel/EloLeaderboard', () => ({
    EloLeaderboard: () => <div data-testid="elo" />,
}));

vi.mock('./PanelLoader', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

describe('wrapper panels — smoke render', () => {
    it('OpenRouterPanel renders its shell', async () => {
        const { default: OpenRouterPanel } = await import('./OpenRouterPanel');
        const { container, unmount } = render(<OpenRouterPanel />);
        expect(container.firstChild).not.toBeNull();
        expect(container.textContent).toContain('OpenRouter');
        unmount();
    });

    it('SocialLeaderboardPanel renders its shell', async () => {
        const { default: SocialLeaderboardPanel } = await import('./SocialLeaderboardPanel');
        const { container, unmount } = render(<SocialLeaderboardPanel />);
        expect(container.firstChild).not.toBeNull();
        expect(container.textContent).toContain('Leaderboard');
        unmount();
    });
});
