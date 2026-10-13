import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentTasksPanel from './AgentTasksPanel';
import { agemsApprovalService } from '../../kernel/services/agems-approval-service';
import type { ApprovalRequest } from '../../kernel/types/agems-approval';
import { browserUseService, computerUseLoopService } from '../../kernel/instances/services-extras';

vi.mock('../../kernel/instances/services-extras', () => ({
    browserUseService: { execute: vi.fn() },
    computerUseLoopService: { runApproved: vi.fn() },
}));

vi.mock('../../kernel/services/agems-approval-service', () => ({
    agemsApprovalService: {
        requestApproval: vi.fn(),
        resolve: vi.fn(),
    },
}));

// Локаль грузится асинхронно (первый paint — сырые ключи, потом ре-рендер
// с переводом): без мока селекторы по строкам гоняют. Фиксируем identity.
vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

const mockedApproval = vi.mocked(agemsApprovalService);
const mockedBrowser = vi.mocked(browserUseService);
const mockedLoop = vi.mocked(computerUseLoopService);

describe('AgentTasksPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedApproval.requestApproval.mockImplementation(
            async (input: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>) =>
                ({ id: 41, status: 'PENDING', ...input }) as never,
        );
        mockedApproval.resolve.mockImplementation(async () => undefined as never);
    });

    it('renders composer with both capabilities', () => {
        render(<AgentTasksPanel />);
        expect(screen.getByText('tasks.title')).toBeDefined();
        expect(screen.getByText('tasks.browser')).toBeDefined();
        expect(screen.getByText('tasks.computer')).toBeDefined();
        expect(screen.getByText('tasks.empty')).toBeDefined();
    });

    it('runs a browser task and shows output history', async () => {
        mockedBrowser.execute.mockImplementation(async () => ({ ok: true, via: 'sidecar', stdout: 'shot done' }) as never);
        render(<AgentTasksPanel />);
        fireEvent.change(screen.getByPlaceholderText('tasks.task_ph'), { target: { value: 'open https://example.com' } });
        fireEvent.click(screen.getByText('tasks.run'));
        await waitFor(() =>
            expect(mockedBrowser.execute).toHaveBeenCalledWith('open https://example.com', { maxSteps: 10 }),
        );
        expect(mockedApproval.requestApproval).toHaveBeenCalledWith(
            expect.objectContaining({ toolName: 'browser.act' }),
        );
        expect(mockedApproval.resolve).toHaveBeenCalledWith(41, 'APPROVED', undefined, 'ui:direct:tasks');
        await waitFor(() => expect(screen.getByText(/shot done/)).toBeDefined());
    });

    it('runs a computer loop with provider and shows turns', async () => {
        mockedLoop.runApproved.mockImplementation(
            async () => ({ stopReason: 'done', turns: 2, output: 'clicked', computerCalls: 1, lastScreenshot: 'shot64', maxTurnsApplied: 10 }) as never,
        );
        render(<AgentTasksPanel />);
        fireEvent.click(screen.getByText('tasks.computer'));
        fireEvent.change(screen.getByPlaceholderText('tasks.task_ph'), { target: { value: 'click the link' } });
        fireEvent.click(screen.getByText('tasks.run'));
        await waitFor(() => expect(mockedLoop.runApproved).toHaveBeenCalled());
        expect(mockedLoop.runApproved).toHaveBeenCalledWith(
            expect.objectContaining({ task: 'click the link', approvedRequestId: 41, provider: 'anthropic' }),
        );
        expect(mockedApproval.requestApproval).toHaveBeenCalledWith(
            expect.objectContaining({ toolName: 'computer.use', toolInput: { task: 'click the link', provider: 'anthropic' } }),
        );
        await waitFor(() => expect(screen.getByText(/clicked/)).toBeDefined());
        expect(screen.getAllByText(/turns 2/).length).toBeGreaterThan(0);
    });

    it('shows human summary + image instead of raw stdout blob', async () => {
        mockedBrowser.execute.mockImplementation(
            async () =>
                ({
                    ok: true,
                    via: 'sidecar',
                    stdout: JSON.stringify({ screenshot: 'iVBORw0K', finalState: {} }),
                    screenshot: 'iVBORw0K',
                    finalState: { mode: 'playwright-fallback', title: 'Example Domain', url: 'https://example.com' },
                }) as never,
        );
        render(<AgentTasksPanel />);
        fireEvent.change(screen.getByPlaceholderText('tasks.task_ph'), { target: { value: 'open example.com' } });
        fireEvent.click(screen.getByText('tasks.run'));
        await waitFor(() =>
            expect(
                screen.getByText('sidecar · playwright-fallback · Example Domain · https://example.com'),
            ).toBeDefined(),
        );
        const img = document.querySelector('img[src^="data:image/png;base64,iVBORw0K"]');
        expect(img).not.toBeNull();
    });

    it('surfaces executor errors in history', async () => {
        mockedBrowser.execute.mockImplementation(async () => {
            throw new Error('sidecar down');
        });
        render(<AgentTasksPanel />);
        fireEvent.change(screen.getByPlaceholderText('tasks.task_ph'), { target: { value: 'do it' } });
        fireEvent.click(screen.getByText('tasks.run'));
        await waitFor(() => expect(screen.getAllByText(/sidecar down/).length).toBeGreaterThan(0));
    });
});
