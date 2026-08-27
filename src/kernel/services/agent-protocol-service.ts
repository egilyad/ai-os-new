import type {
    IAgentProtocolService,
    AgentRegistration,
    AgentProtocolMessage,
    AgentCapability,
} from '../contracts/agent-protocol';

const genId = () => crypto.randomUUID();

const MAX_AGENTS = 1000;
const MAX_MESSAGES = 10000;
const MAX_PAYLOAD_SIZE = 256 * 1024; // 256KB
const MAX_PAYLOAD_DEPTH = 8;

const DEFAULT_CAPABILITIES: AgentCapability[] = [
    {
        name: 'chat',
        version: '1.0.0',
        endpoint: '/api/agents/chat',
        description: 'Natural language conversation',
        enabled: true,
    },
    {
        name: 'memory',
        version: '1.1.0',
        endpoint: '/api/agents/memory',
        description: 'Persistent knowledge storage',
        enabled: true,
    },
    {
        name: 'tools',
        version: '1.0.0',
        endpoint: '/api/agents/tools',
        description: 'Tool execution and management',
        enabled: true,
    },
    {
        name: 'delegation',
        version: '0.9.0',
        endpoint: '/api/agents/delegate',
        description: 'Task delegation to other agents',
        enabled: true,
    },
    {
        name: 'reasoning',
        version: '2.0.0',
        endpoint: '/api/agents/reason',
        description: 'Multi-step logical reasoning',
        enabled: true,
    },
];

export class AgentProtocolService implements IAgentProtocolService {
    private _initialized = false;

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
    }

    destroy(): void {
        this.agents = [];
        this.messages = [];
        this._initialized = false;
    }

    private agents: AgentRegistration[] = [
        {
            agentId: 'analyst-1',
            agentName: 'Analyst',
            capabilities: DEFAULT_CAPABILITIES.map((c) => ({ ...c, enabled: true })),
            status: 'online',
            lastSeen: Date.now() - 60000,
            address: 'agent://analyst-1',
        },
        {
            agentId: 'debater-1',
            agentName: 'Debater',
            capabilities: DEFAULT_CAPABILITIES.map((c) => ({ ...c, enabled: true })),
            status: 'online',
            lastSeen: Date.now() - 120000,
            address: 'agent://debater-1',
        },
        {
            agentId: 'strategist-1',
            agentName: 'Strategist',
            capabilities: DEFAULT_CAPABILITIES.map((c) => ({ ...c, enabled: c.name !== 'tools' })),
            status: 'busy',
            lastSeen: Date.now() - 300000,
            address: 'agent://strategist-1',
        },
        {
            agentId: 'researcher-1',
            agentName: 'Researcher',
            capabilities: DEFAULT_CAPABILITIES,
            status: 'online',
            lastSeen: Date.now() - 5000,
            address: 'agent://researcher-1',
        },
    ];
    private messages: AgentProtocolMessage[] = [
        {
            id: genId(),
            type: 'request',
            sourceAgentId: 'analyst-1',
            targetAgentId: 'researcher-1',
            capability: 'memory',
            payload: { query: 'Find relevant papers on AI safety' },
            timestamp: Date.now() - 3600000,
            ttl: 30000,
            traceId: 'trace-001',
        },
        {
            id: genId(),
            type: 'response',
            sourceAgentId: 'researcher-1',
            targetAgentId: 'analyst-1',
            capability: 'memory',
            payload: { results: ['Paper 1: Alignment Research', 'Paper 2: Robustness'] },
            timestamp: Date.now() - 3590000,
            ttl: 30000,
            traceId: 'trace-001',
        },
        {
            id: genId(),
            type: 'broadcast',
            sourceAgentId: 'debater-1',
            capability: 'chat',
            payload: { message: 'New debate round starting' },
            timestamp: Date.now() - 1800000,
            ttl: 60000,
            traceId: 'trace-002',
        },
    ];

    getRegisteredAgents(): AgentRegistration[] {
        return [...this.agents];
    }

    registerAgent(agentId: string, name: string): AgentRegistration {
        const existing = this.agents.find((a) => a.agentId === agentId);
        if (existing) {
            existing.status = 'online';
            existing.lastSeen = Date.now();
            return { ...existing };
        }
        const agent: AgentRegistration = {
            agentId,
            agentName: name,
            capabilities: DEFAULT_CAPABILITIES.map((c) => ({ ...c })),
            status: 'online',
            lastSeen: Date.now(),
            address: `agent://${agentId}`,
        };
        if (this.agents.length >= MAX_AGENTS) {
            this.agents.shift();
        }
        this.agents.push(agent);
        return agent;
    }

    unregisterAgent(agentId: string): void {
        this.agents = this.agents.filter((a) => a.agentId !== agentId);
    }

    private validatePayload(payload: unknown): void {
        const raw = JSON.stringify(payload);
        if (raw.length > MAX_PAYLOAD_SIZE) {
            throw new Error(`Payload exceeds max size (${raw.length} > ${MAX_PAYLOAD_SIZE} bytes)`);
        }
        let depth = 0;
        const checkDepth = (val: unknown, d: number): void => {
            if (d > MAX_PAYLOAD_DEPTH)
                throw new Error(`Payload nesting exceeds max depth ${MAX_PAYLOAD_DEPTH}`);
            if (val && typeof val === 'object') {
                depth = Math.max(depth, d);
                for (const v of Object.values(val as Record<string, unknown>)) {
                    if (v && typeof v === 'object') checkDepth(v, d + 1);
                }
            }
        };
        checkDepth(payload, 0);
    }

    sendMessage(message: Omit<AgentProtocolMessage, 'id' | 'timestamp'>): AgentProtocolMessage {
        if (!message.sourceAgentId || typeof message.sourceAgentId !== 'string') {
            throw new Error('sourceAgentId is required and must be a string');
        }
        const src = this.agents.find((a) => a.agentId === message.sourceAgentId);
        if (!src) throw new Error(`Source agent ${message.sourceAgentId} not registered`);
        if (message.type !== 'broadcast' && message.targetAgentId) {
            if (typeof message.targetAgentId !== 'string') {
                throw new Error('targetAgentId must be a string');
            }
            const tgt = this.agents.find((a) => a.agentId === message.targetAgentId);
            if (!tgt) throw new Error(`Target agent ${message.targetAgentId} not registered`);
            if (
                message.capability &&
                !tgt.capabilities.find((c) => c.name === message.capability && c.enabled)
            ) {
                throw new Error(
                    `Target agent ${message.targetAgentId} does not support capability "${message.capability}"`,
                );
            }
        }
        if (message.payload !== undefined) {
            this.validatePayload(message.payload);
        }
        const msg: AgentProtocolMessage = { ...message, id: genId(), timestamp: Date.now() };
        if (this.messages.length >= MAX_MESSAGES) {
            this.messages.shift();
        }
        this.messages.push(msg);
        return msg;
    }

    getMessageHistory(agentId?: string): AgentProtocolMessage[] {
        return agentId
            ? this.messages.filter(
                  (m) => m.sourceAgentId === agentId || m.targetAgentId === agentId,
              )
            : [...this.messages];
    }

    getCapabilities(agentId: string): AgentCapability[] {
        const agent = this.agents.find((a) => a.agentId === agentId);
        return agent ? [...agent.capabilities] : [];
    }
}
