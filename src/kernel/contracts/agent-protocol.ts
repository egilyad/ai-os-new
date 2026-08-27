export type ProtocolMessageType = 'request' | 'response' | 'broadcast' | 'error';
export type ProtocolCapability = 'chat' | 'memory' | 'tools' | 'delegation' | 'reasoning';

export interface AgentProtocolMessage {
    id: string;
    type: ProtocolMessageType;
    sourceAgentId: string;
    targetAgentId?: string;
    capability: ProtocolCapability;
    payload: unknown;
    timestamp: number;
    ttl: number;
    traceId: string;
}

export interface AgentCapability {
    name: ProtocolCapability;
    version: string;
    endpoint: string;
    description: string;
    enabled: boolean;
}

export interface AgentRegistration {
    agentId: string;
    agentName: string;
    capabilities: AgentCapability[];
    status: 'online' | 'offline' | 'busy';
    lastSeen: number;
    address: string;
}

export interface IAgentProtocolService {
    getRegisteredAgents(): AgentRegistration[];
    registerAgent(agentId: string, name: string): AgentRegistration;
    unregisterAgent(agentId: string): void;
    sendMessage(message: Omit<AgentProtocolMessage, 'id' | 'timestamp'>): AgentProtocolMessage;
    getMessageHistory(agentId?: string): AgentProtocolMessage[];
    getCapabilities(agentId: string): AgentCapability[];
}
