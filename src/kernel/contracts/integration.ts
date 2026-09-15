/**
 * Integration service contract — AGEMS port, Phase 10.
 */
import type { TelegramChat, TelegramMessage, TelegramConfig, N8NWorkflow, N8NConfig, MCPServer, IntegrationStatus } from '../types/integration-types';

export interface IIntegrationService {
    // Telegram
    configureTelegram(config: TelegramConfig): Promise<void>;
    getTelegramConfig(): Promise<TelegramConfig | null>;
    registerTelegramChat(input: { agentId: string; telegramChatId: string; channelId: string; username?: string; firstName?: string; lastName?: string }): Promise<TelegramChat>;
    approveTelegramChat(id: string): Promise<TelegramChat>;
    listTelegramChats(agentId?: string): Promise<TelegramChat[]>;
    deleteTelegramChat(id: string): Promise<void>;
    logTelegramMessage(input: { chatId: string; messageId: number; from: { id: number; username?: string; firstName?: string; lastName?: string }; text: string; direction: 'inbound' | 'outbound' }): Promise<TelegramMessage>;
    listTelegramMessages(chatId: string, limit?: number): Promise<TelegramMessage[]>;

    // N8N
    configureN8N(config: N8NConfig): Promise<void>;
    getN8NConfig(): Promise<N8NConfig | null>;
    registerN8NWorkflow(input: { name: string; description?: string; active: boolean; triggerNodes: N8NWorkflow['triggerNodes'] }): Promise<N8NWorkflow>;
    listN8NWorkflows(): Promise<N8NWorkflow[]>;
    deleteN8NWorkflow(id: string): Promise<void>;
    updateN8NWorkflow(id: string, updates: Partial<Pick<N8NWorkflow, 'active' | 'lastRunAt' | 'nextRunAt'>>): Promise<N8NWorkflow>;

    // MCP
    addMCPServer(input: { name: string; url: string; authorizationToken?: string; toolConfiguration: MCPServer['toolConfiguration'] }): Promise<MCPServer>;
    listMCPServers(): Promise<MCPServer[]>;
    updateMCPServer(id: string, updates: Partial<Pick<MCPServer, 'status' | 'lastPingAt' | 'toolConfiguration'>>): Promise<MCPServer>;
    deleteMCPServer(id: string): Promise<void>;

    // Status
    getStatus(): Promise<IntegrationStatus[]>;
}
