/**
 * Integration types — AGEMS port, Phase 10.
 */

// ── Telegram ──

export interface TelegramChat {
    id: string;
    agentId: string;
    telegramChatId: string;
    channelId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isApproved: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface TelegramMessage {
    id: string;
    chatId: string;
    messageId: number;
    from: { id: number; username?: string; firstName?: string; lastName?: string };
    text: string;
    timestamp: number;
    direction: 'inbound' | 'outbound';
}

export interface TelegramConfig {
    botToken: string;
    webhookUrl?: string;
    enabled: boolean;
}

// ── N8N ──

export interface N8NWorkflow {
    id: string;
    name: string;
    description?: string;
    active: boolean;
    triggerNodes: N8NTriggerNode[];
    lastRunAt?: number;
    nextRunAt?: number;
    createdAt: number;
}

export interface N8NTriggerNode {
    id: string;
    type: string;
    parameters: Record<string, unknown>;
}

export interface N8NConfig {
    baseUrl: string;
    apiKey?: string;
    enabled: boolean;
}

// ── MCP Server ──

export interface MCPServer {
    id: string;
    name: string;
    url: string;
    authorizationToken?: string;
    toolConfiguration: {
        enabled: boolean;
        allowedTools?: string[];
    };
    status: 'connected' | 'disconnected' | 'error';
    lastPingAt?: number;
    createdAt: number;
}

// ── Common ──

export type IntegrationProvider = 'telegram' | 'n8n' | 'mcp';

export interface IntegrationStatus {
    provider: IntegrationProvider;
    connected: boolean;
    lastError?: string;
    lastCheckedAt: number;
}
