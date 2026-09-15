/**
 * IntegrationsPanel tests — regression for "Panel crashed: Cannot convert
 * object to primitive value" (missing default export for React.lazy +
 * uncoerced Dexie record values used as React keys/children).
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

const { svc } = vi.hoisted(() => {
    const mk = () => vi.fn();
    return {
        svc: {
            getStatus: mk(),
            listTelegramChats: mk(),
            listN8NWorkflows: mk(),
            listMCPServers: mk(),
            getTelegramConfig: mk(),
            getN8NConfig: mk(),
        },
    };
});

vi.mock('../../kernel/instances/services-extras', () => ({
    integrationService: svc,
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key, lang: 'en' as const }),
}));

import { IntegrationsPanel } from './IntegrationsPanel';

beforeEach(() => {
    vi.clearAllMocks();
    svc.getStatus.mockResolvedValue([]);
    svc.listTelegramChats.mockResolvedValue([]);
    svc.listN8NWorkflows.mockResolvedValue([]);
    svc.listMCPServers.mockResolvedValue([]);
    svc.getTelegramConfig.mockResolvedValue(null);
    svc.getN8NConfig.mockResolvedValue(null);
});

describe('IntegrationsPanel', () => {
    it('exposes a default export for React.lazy', async () => {
        const mod = await import('./IntegrationsPanel');
        expect(mod.default).toBeDefined();
    });

    it('renders empty states without crashing', async () => {
        render(<IntegrationsPanel />);
        await waitFor(() => {
            expect(screen.getByText('integration.title')).toBeDefined();
        });
    });

    it('renders statuses, chats, workflows and servers across tabs', async () => {
        svc.getStatus.mockResolvedValue([
            { provider: 'telegram', connected: true, lastCheckedAt: 1 },
        ]);
        svc.listTelegramChats.mockResolvedValue([
            { id: 'c1', agentId: 'a1', telegramChatId: '123', channelId: 'ch', username: 'bob', isApproved: true, createdAt: 1, updatedAt: 1 },
        ]);
        svc.listN8NWorkflows.mockResolvedValue([
            { id: 'w1', name: 'wf1', active: true, triggerNodes: [], createdAt: 1 },
        ]);
        svc.listMCPServers.mockResolvedValue([
            { id: 'm1', name: 'srv', url: 'http://x', toolConfiguration: { enabled: true }, status: 'connected', createdAt: 1 },
        ]);
        render(<IntegrationsPanel />);
        await waitFor(() => {
            expect(screen.getByText('telegram')).toBeDefined();
        });
        fireEvent.click(screen.getByText('integration.telegram'));
        expect(screen.getByText('bob')).toBeDefined();
        fireEvent.click(screen.getByText('integration.n8n'));
        expect(screen.getByText('wf1')).toBeDefined();
        fireEvent.click(screen.getByText('integration.mcp'));
        expect(screen.getByText('srv')).toBeDefined();
    });

    it('does not crash on malformed records with object ids/values', async () => {
        const evil = Object.create(null);
        svc.listTelegramChats.mockResolvedValue([
            { id: evil, agentId: evil, telegramChatId: evil, channelId: 'ch', username: evil, isApproved: false, createdAt: 1, updatedAt: 1 },
        ]);
        svc.listN8NWorkflows.mockResolvedValue([
            { id: evil, name: evil, active: false, triggerNodes: [], createdAt: 1 },
        ]);
        svc.listMCPServers.mockResolvedValue([
            { id: evil, name: evil, url: evil, toolConfiguration: { enabled: true }, status: evil, createdAt: 1 },
        ]);
        render(<IntegrationsPanel />);
        await waitFor(() => {
            expect(screen.getByText('integration.title')).toBeDefined();
        });
        fireEvent.click(screen.getByText('integration.telegram'));
        fireEvent.click(screen.getByText('integration.n8n'));
        fireEvent.click(screen.getByText('integration.mcp'));
        // panel still alive — no ErrorBoundary, no throw
        expect(screen.getByText('integration.title')).toBeDefined();
    });
});
