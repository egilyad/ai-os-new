/**
 * A2A-протокол (SPEC_09). Минимальный клиентский срез v1.0.
 *
 * - Agent Card: JSON-«визитка» агента (`/.well-known/agent-card.json`).
 * - Task: stateful единица работы (SUBMITTED → WORKING → COMPLETED/FAILED/...).
 * - Message/Part: контейнеры контента.
 *
 * Транспорт в браузере — через лёгкий прокси (auth-токены вне клиента).
 */

export interface AgentCardSecurityScheme {
    type: 'bearer' | 'oauth2' | 'apiKey';
    description?: string;
}

export interface AgentCard {
    name: string;
    description?: string;
    /** Базовый URL агента. */
    url: string;
    capabilities?: { streaming?: boolean; pushNotifications?: boolean };
    skills?: string[];
    securitySchemes?: AgentCardSecurityScheme[];
}

export interface A2APart {
    text?: string;
    url?: string;
    data?: unknown;
    mediaType?: string;
}

export interface A2AMessage {
    role: 'user' | 'agent';
    parts: A2APart[];
}

export type TaskStatus =
    | 'SUBMITTED'
    | 'WORKING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELED'
    | 'REJECTED';

export interface A2ATask {
    id: string;
    status: TaskStatus;
    messages?: A2AMessage[];
    artifacts?: unknown[];
    error?: string;
}

export interface SendMessageOptions {
    signal?: AbortSignal;
}

export interface IA2AClient {
    discover(cardUrl: string): Promise<AgentCard>;
    sendMessage(card: AgentCard, msg: A2AMessage, opts?: SendMessageOptions): Promise<A2ATask>;
    getTask(card: AgentCard, taskId: string, opts?: SendMessageOptions): Promise<A2ATask>;
    cancelTask(card: AgentCard, taskId: string, opts?: SendMessageOptions): Promise<A2ATask>;
}
