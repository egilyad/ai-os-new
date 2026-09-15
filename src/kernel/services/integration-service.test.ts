/**
 * IntegrationService tests — AGEMS port Phase 10.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntegrationService } from './integration-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function makeIntegrationDb() {
    const telegramChats = new Map<string, Record<string, unknown>>();
    const telegramMessages = new Map<string, Record<string, unknown>>();
    const n8nWorkflows = new Map<string, Record<string, unknown>>();
    const mcpServers = new Map<string, Record<string, unknown>>();
    return {
        telegramChats: {
            toArray: async () => Array.from(telegramChats.values()),
            put: async (v: Record<string, unknown>) => { telegramChats.set(v.id as string, v); return v.id as string; },
            delete: async (id: string) => { telegramChats.delete(id); },
        },
        telegramMessages: {
            toArray: async () => Array.from(telegramMessages.values()),
            put: async (v: Record<string, unknown>) => { telegramMessages.set(v.id as string, v); return v.id as string; },
        },
        n8nWorkflows: {
            toArray: async () => Array.from(n8nWorkflows.values()),
            put: async (v: Record<string, unknown>) => { n8nWorkflows.set(v.id as string, v); return v.id as string; },
            delete: async (id: string) => { n8nWorkflows.delete(id); },
        },
        mcpServers: {
            toArray: async () => Array.from(mcpServers.values()),
            put: async (v: Record<string, unknown>) => { mcpServers.set(v.id as string, v); return v.id as string; },
            delete: async (id: string) => { mcpServers.delete(id); },
        },
    };
}

describe('IntegrationService', () => {
    let db: ReturnType<typeof makeIntegrationDb>;
    let svc: IntegrationService;

    beforeEach(() => {
        db = makeIntegrationDb();
        svc = new IntegrationService(db);
    });

    describe('Telegram', () => {
        it('configures Telegram', async () => {
            await svc.configureTelegram({ botToken: 'tok123', enabled: true });
            const cfg = await svc.getTelegramConfig();
            expect(cfg?.botToken).toBe('tok123');
            expect(cfg?.enabled).toBe(true);
        });

        it('registers and lists chats', async () => {
            const chat = await svc.registerTelegramChat({
                agentId: 'agent-1',
                telegramChatId: '123456',
                channelId: 'ch-1',
                username: 'testuser',
            });
            expect(chat.id).toMatch(/^tg-chat-/);
            expect(chat.isApproved).toBe(false);

            const chats = await svc.listTelegramChats();
            expect(chats.length).toBe(1);
            expect(chats[0].agentId).toBe('agent-1');
        });

        it('filters chats by agent', async () => {
            await svc.registerTelegramChat({ agentId: 'agent-1', telegramChatId: '111', channelId: 'ch-1' });
            await svc.registerTelegramChat({ agentId: 'agent-2', telegramChatId: '222', channelId: 'ch-2' });

            const chats = await svc.listTelegramChats('agent-1');
            expect(chats.length).toBe(1);
            expect(chats[0].telegramChatId).toBe('111');
        });

        it('approves a chat', async () => {
            const chat = await svc.registerTelegramChat({ agentId: 'agent-1', telegramChatId: '123', channelId: 'ch-1' });
            const approved = await svc.approveTelegramChat(chat.id);
            expect(approved.isApproved).toBe(true);
        });

        it('logs and lists messages', async () => {
            const chat = await svc.registerTelegramChat({ agentId: 'agent-1', telegramChatId: '123', channelId: 'ch-1' });
            await svc.logTelegramMessage({ chatId: chat.id, messageId: 1, from: { id: 1, username: 'user' }, text: 'Hello', direction: 'inbound' });
            await svc.logTelegramMessage({ chatId: chat.id, messageId: 2, from: { id: 1, username: 'user' }, text: 'World', direction: 'inbound' });

            const msgs = await svc.listTelegramMessages(chat.id);
            expect(msgs.length).toBe(2);
            expect(msgs[0].text).toBe('Hello');
        });

        it('deletes a chat', async () => {
            const chat = await svc.registerTelegramChat({ agentId: 'agent-1', telegramChatId: '123', channelId: 'ch-1' });
            await svc.deleteTelegramChat(chat.id);
            expect(await svc.listTelegramChats()).toHaveLength(0);
        });
    });

    describe('N8N', () => {
        it('configures N8N', async () => {
            await svc.configureN8N({ baseUrl: 'http://localhost:5678', enabled: true });
            const cfg = await svc.getN8NConfig();
            expect(cfg?.baseUrl).toBe('http://localhost:5678');
        });

        it('registers and lists workflows', async () => {
            const wf = await svc.registerN8NWorkflow({
                name: 'Test Workflow',
                active: true,
                triggerNodes: [{ id: 'n1', type: 'cron', parameters: {} }],
            });
            expect(wf.id).toMatch(/^n8n-wf-/);
            expect(wf.active).toBe(true);

            const wfs = await svc.listN8NWorkflows();
            expect(wfs.length).toBe(1);
        });

        it('updates a workflow', async () => {
            const wf = await svc.registerN8NWorkflow({ name: 'WF', active: false, triggerNodes: [] });
            const updated = await svc.updateN8NWorkflow(wf.id, { active: true, lastRunAt: Date.now() });
            expect(updated.active).toBe(true);
            expect(updated.lastRunAt).toBeGreaterThan(0);
        });

        it('deletes a workflow', async () => {
            const wf = await svc.registerN8NWorkflow({ name: 'WF', active: false, triggerNodes: [] });
            await svc.deleteN8NWorkflow(wf.id);
            expect(await svc.listN8NWorkflows()).toHaveLength(0);
        });
    });

    describe('MCP', () => {
        it('adds and lists servers', async () => {
            const server = await svc.addMCPServer({
                name: 'Test Server',
                url: 'http://localhost:3000',
                toolConfiguration: { enabled: true },
            });
            expect(server.id).toMatch(/^mcp-/);
            expect(server.status).toBe('disconnected');

            const servers = await svc.listMCPServers();
            expect(servers.length).toBe(1);
        });

        it('updates a server', async () => {
            const server = await svc.addMCPServer({ name: 'S', url: 'http://x', toolConfiguration: { enabled: true } });
            const updated = await svc.updateMCPServer(server.id, { status: 'connected', lastPingAt: Date.now() });
            expect(updated.status).toBe('connected');
        });

        it('deletes a server', async () => {
            const server = await svc.addMCPServer({ name: 'S', url: 'http://x', toolConfiguration: { enabled: true } });
            await svc.deleteMCPServer(server.id);
            expect(await svc.listMCPServers()).toHaveLength(0);
        });
    });

    describe('status', () => {
        it('returns status for configured providers', async () => {
            await svc.configureTelegram({ botToken: 'tok', enabled: true });
            await svc.configureN8N({ baseUrl: 'http://x', enabled: false });
            await svc.addMCPServer({ name: 'M', url: 'http://y', toolConfiguration: { enabled: true } });

            const statuses = await svc.getStatus();
            expect(statuses.length).toBe(3);
            expect(statuses.find(s => s.provider === 'telegram')?.connected).toBe(true);
            expect(statuses.find(s => s.provider === 'n8n')?.connected).toBe(false);
            expect(statuses.find(s => s.provider === 'mcp')?.connected).toBe(false);
        });
    });
});
