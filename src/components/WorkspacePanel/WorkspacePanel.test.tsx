import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../kernel/instances', () => ({
    workspaceService: {
        isAttached: vi.fn(() => false),
        getWorkspaceName: vi.fn(() => null),
        listTree: vi.fn(() => Promise.resolve([])),
        attachDirectory: vi.fn(() => Promise.resolve()),
        detach: vi.fn(),
        readFile: vi.fn(() => Promise.resolve('content')),
        search: vi.fn(() => Promise.resolve([])),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('WorkspacePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('offers to attach when no workspace is attached', async () => {
        const Panel = (await import('./WorkspacePanel')).default;
        render(<Panel />);
        expect(await screen.findByText('Attach Folder')).toBeDefined();
        expect(screen.getByText('No workspace attached')).toBeDefined();
    });

    it('surfaces attach failures, but stays silent on picker cancel', async () => {
        const { workspaceService } = await import('../../kernel/instances');
        const abort = new Error('cancelled');
        abort.name = 'AbortError';
        vi.mocked(workspaceService.attachDirectory).mockRejectedValueOnce(abort);
        const Panel = (await import('./WorkspacePanel')).default;
        const { unmount } = render(<Panel />);
        fireEvent.click(await screen.findByText('Attach Folder'));
        await waitFor(() => expect(workspaceService.attachDirectory).toHaveBeenCalled());
        expect(screen.queryByRole('alert')).toBeNull();
        unmount();

        vi.mocked(workspaceService.attachDirectory).mockRejectedValueOnce(
            new Error('permission denied'),
        );
        render(<Panel />);
        fireEvent.click(await screen.findByText('Attach Folder'));
        expect(await screen.findByRole('alert')).toBeDefined();
        expect(screen.getByText('permission denied')).toBeDefined();
    });

    it('shows a search error instead of a fake empty result', async () => {
        const { workspaceService } = await import('../../kernel/instances');
        vi.mocked(workspaceService.isAttached).mockReturnValueOnce(true);
        vi.mocked(workspaceService.getWorkspaceName).mockReturnValueOnce('proj');
        vi.mocked(workspaceService.search).mockRejectedValueOnce(new Error('index corrupt'));
        const Panel = (await import('./WorkspacePanel')).default;
        render(<Panel />);
        await screen.findByText('proj');
        fireEvent.change(screen.getByPlaceholderText('Search files...'), {
            target: { value: 'zzz' },
        });
        expect(await screen.findByText('index corrupt')).toBeDefined();
        expect(screen.queryByText('No matching files')).toBeNull();
    });
});
