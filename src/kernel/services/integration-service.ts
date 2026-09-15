/**
 * Integration Service — AGEMS port, Phase 10.
 * Telegram chat bridging, N8N workflow triggers, MCP server management.
 */
import type { TelegramChat, TelegramMessage, TelegramConfig, N8NWorkflow, N8NConfig, MCPServer, IntegrationStatus } from '../types/integration-types';
import { rootLogger } from './logger-service';

const log = rootLogger.child('IntegrationService');

let counter = 0;

export class IntegrationService {
    private db: {
        telegramChats: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
        telegramMessages: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
        };
        n8nWorkflows: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
        mcpServers: {
            toArray(): Promise<Record<string, unknown>[]>;
            put(v: Record<string, unknown>): Promise<string>;
            delete(id: string): Promise<void>;
        };
    };

    private telegramConfig: TelegramConfig | null = null;
    private n8nConfig: N8NConfig | null = null;

    constructor(db: {
        telegramChats: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string>; delete(id: string): Promise<void> };
        telegramMessages: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string> };
        n8nWorkflows: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string>; delete(id: string): Promise<void> };
        mcpServers: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string>; delete(id: string): Promise<void> };
    }) {
        this.db = db;
    }

    private genId(prefix: string): string {
        return `${prefix}-${Date.now()}-${++counter}`;
    }

    // ── Telegram ──

    async configureTelegram(config: TelegramConfig): Promise<void> {
        this.telegramConfig = config;
        log.info('configureTelegram', `Bot configured: enabled=${config.enabled}`);
    }

    async getTelegramConfig(): Promise<TelegramConfig | null> {
        return this.telegramConfig;
    }

    async registerTelegramChat(input: {
        agentId: string;
        telegramChatId: string;
        channelId: string;
        username?: string;
        firstName?: string;
        lastName?: string;
    }): Promise<TelegramChat> {
        const chat: TelegramChat = {
            id: this.genId('tg-chat'),
            ...input,
            isApproved: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await this.db.telegramChats.put(chat as unknown as Record<string, unknown>);
        log.info('registerTelegramChat', `Chat registered: ${input.telegramChatId} for agent ${input.agentId}`);
        return chat;
    }

    async approveTelegramChat(id: string): Promise<TelegramChat> {
        const chats = await this.db.telegramChats.toArray() as unknown as TelegramChat[];
        const chat = chats.find(c => c.id === id);
        if (!chat) throw new Error(`Telegram chat not found: ${id}`);
        chat.isApproved = true;
        chat.updatedAt = Date.now();
        await this.db.telegramChats.put(chat as unknown as Record<string, unknown>);
        return chat;
    }

    async listTelegramChats(agentId?: string): Promise<TelegramChat[]> {
        const chats = await this.db.telegramChats.toArray() as unknown as TelegramChat[];
        return agentId ? chats.filter(c => c.agentId === agentId) : chats;
    }

    async deleteTelegramChat(id: string): Promise<void> {
        await this.db.telegramChats.delete(id);
    }

    async logTelegramMessage(input: {
        chatId: string;
        messageId: number;
        from: { id: number; username?: string; firstName?: string; lastName?: string };
        text: string;
        direction: 'inbound' | 'outbound';
    }): Promise<TelegramMessage> {
        const msg: TelegramMessage = {
            id: this.genId('tg-msg'),
            ...input,
            timestamp: Date.now(),
        };
        await this.db.telegramMessages.put(msg as unknown as Record<string, unknown>);
        return msg;
    }

    async listTelegramMessages(chatId: string, limit = 50): Promise<TelegramMessage[]> {
        const all = await this.db.telegramMessages.toArray() as unknown as TelegramMessage[];
        return all.filter(m => m.chatId === chatId).slice(-limit);
    }

    // ── N8N ──

    async configureN8N(config: N8NConfig): Promise<void> {
        this.n8nConfig = config;
        log.info('configureN8N', `N8N configured: enabled=${config.enabled}, url=${config.baseUrl}`);
    }

    async getN8NConfig(): Promise<N8NConfig | null> {
        return this.n8nConfig;
    }

    async registerN8NWorkflow(input: {
        name: string;
        description?: string;
        active: boolean;
        triggerNodes: N8NWorkflow['triggerNodes'];
    }): Promise<N8NWorkflow> {
        const workflow: N8NWorkflow = {
            id: this.genId('n8n-wf'),
            ...input,
            createdAt: Date.now(),
        };
        await this.db.n8nWorkflows.put(workflow as unknown as Record<string, unknown>);
        log.info('registerN8NWorkflow', `Workflow registered: ${input.name}`);
        return workflow;
    }

    async listN8NWorkflows(): Promise<N8NWorkflow[]> {
        return await this.db.n8nWorkflows.toArray() as unknown as N8NWorkflow[];
    }

    async deleteN8NWorkflow(id: string): Promise<void> {
        await this.db.n8nWorkflows.delete(id);
    }

    async updateN8NWorkflow(id: string, updates: Partial<Pick<N8NWorkflow, 'active' | 'lastRunAt' | 'nextRunAt'>>): Promise<N8NWorkflow> {
        const wfs = await this.db.n8nWorkflows.toArray() as unknown as N8NWorkflow[];
        const wf = wfs.find(w => w.id === id);
        if (!wf) throw new Error(`N8N workflow not found: ${id}`);
        Object.assign(wf, updates);
        await this.db.n8nWorkflows.put(wf as unknown as Record<string, unknown>);
        return wf;
    }

    // ── MCP ──

    async addMCPServer(input: {
        name: string;
        url: string;
        authorizationToken?: string;
        toolConfiguration: MCPServer['toolConfiguration'];
    }): Promise<MCPServer> {
        const server: MCPServer = {
            id: this.genId('mcp'),
            ...input,
            status: 'disconnected',
            createdAt: Date.now(),
        };
        await this.db.mcpServers.put(server as unknown as Record<string, unknown>);
        log.info('addMCPServer', `MCP server added: ${input.name}`);
        return server;
    }

    async listMCPServers(): Promise<MCPServer[]> {
        return await this.db.mcpServers.toArray() as unknown as MCPServer[];
    }

    async updateMCPServer(id: string, updates: Partial<Pick<MCPServer, 'status' | 'lastPingAt' | 'toolConfiguration'>>): Promise<MCPServer> {
        const servers = await this.db.mcpServers.toArray() as unknown as MCPServer[];
        const server = servers.find(s => s.id === id);
        if (!server) throw new Error(`MCP server not found: ${id}`);
        Object.assign(server, updates);
        await this.db.mcpServers.put(server as unknown as Record<string, unknown>);
        return server;
    }

    async deleteMCPServer(id: string): Promise<void> {
        await this.db.mcpServers.delete(id);
    }

    // ── Status ──

    async getStatus(): Promise<IntegrationStatus[]> {
        const now = Date.now();
        const statuses: IntegrationStatus[] = [];
        if (this.telegramConfig) {
            statuses.push({ provider: 'telegram', connected: this.telegramConfig.enabled, lastCheckedAt: now });
        }
        if (this.n8nConfig) {
            statuses.push({ provider: 'n8n', connected: this.n8nConfig.enabled, lastCheckedAt: now });
        }
        const mcpServers = await this.listMCPServers();
        if (mcpServers.length > 0) {
            statuses.push({ provider: 'mcp', connected: mcpServers.some(s => s.status === 'connected'), lastCheckedAt: now });
        }
        return statuses;
    }
}
