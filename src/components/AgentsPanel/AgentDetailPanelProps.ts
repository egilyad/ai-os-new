import type { TabId, Agent } from './AgentsPanelContext';
import type { ApiKey } from '../../types/metrics';

export interface AgentDetailPanelProps {
    agent: Agent;
    activeTab: TabId;
    agentStats: Record<
        string,
        {
            calls: number;
            tokens: number;
            latency: number;
            errors?: number;
            avgTokensPerCall?: number;
            lastActive?: number;
        }
    >;
    availableRoles: { id: string; name: string }[];
    availableTools: { id: string; name: string; description?: string }[];
    keys: ApiKey[];
    onSetActiveTab: (tab: TabId) => void;
    onUpdateAgent: (agentId: string, updates: Record<string, unknown>) => void;
    onApplyRoleToAgent: (agentId: string, roleId: string) => void;
    onDuplicateAgent: (agentId: string) => void;
    onResetAgentStats: (agentId: string) => void;
    onToggleStatus: (agentId: string) => void;
    onClose: () => void;
    onDeleteRequest: (agent: { id: string; name: string }) => void;
    t: (key: string) => string;
}
