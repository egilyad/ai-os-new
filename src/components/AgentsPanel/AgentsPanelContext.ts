import React, { createContext, useContext } from 'react';

export type TabId =
    | 'config'
    | 'capabilities'
    | 'infra'
    | 'observability'
    | 'permissions'
    | 'handoffs'
    | 'history'
    | 'identity';
export type ViewMode = 'grid' | 'list';
export type StatusFilter = 'all' | 'active' | 'paused' | 'error';

export interface Agent {
    id: string;
    name: string;
    role: string;
    roleId?: string;
    description: string;
    providerId: string;
    model: string;
    status: 'active' | 'paused' | 'error';
    temperature: number;
    tools: string[];
    skills: string[];
    systemPrompt: string;
    hilEnabled: boolean;
    vpcEnabled: boolean;
    stats: {
        calls: number;
        tokens: number;
        latency: number;
        errors?: number;
        avgTokensPerCall?: number;
        lastActive?: number;
    };
}

export interface UiAgentTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    config: {
        roleName: string;
        prompt: string;
        tools: string[];
        temperature: number;
    };
}

export interface AgentWithStats extends Agent {
    stats: Agent['stats'] & { avgTokensPerCall?: number };
}

export interface AgentsPanelContextValue {
    agents: Agent[];
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
    viewMode: ViewMode;
    searchQuery: string;
    statusFilter: StatusFilter;
    selectedAgent: Agent | null;
    activeTab: TabId;
    isLoading: boolean;
    error: string | null;
    resetAllArmed: boolean;
    filteredAgents: Agent[];
    availableRoles: { id: string; name: string }[];
    availableTools: { id: string; name: string; description?: string }[];
    keys: { status: string; provider: string; availableModels?: string[] }[];
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    modalRef: React.RefObject<HTMLDivElement | null>;
    onSetViewMode: (mode: ViewMode) => void;
    onSetSearchQuery: (q: string) => void;
    onSetStatusFilter: (f: StatusFilter) => void;
    onSetSelectedAgentId: (id: string | null) => void;
    onSetActiveTab: (tab: TabId) => void;
    onSetError: (err: string | null) => void;
    onNavigateBuilder: () => void;
    onDeployNewAgent: (template?: UiAgentTemplate) => void;
    onToggleStatus: (id: string) => void;
    onUpdateAgent: (agentId: string, updates: Record<string, unknown>) => void;
    onApplyRoleToAgent: (agentId: string, roleId: string) => void;
    onPauseAll: () => void;
    onResumeAll: () => void;
    onDuplicateAgent: (agentId: string) => void;
    onDeleteAgent: (agentId: string) => void;
    onResetAgentStats: (agentId: string) => void;
    onResetAllStats: () => void;
    onExportAgents: () => void;
    onImportAgents: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AgentsPanelContext = createContext<AgentsPanelContextValue | null>(null);

export function useAgentsPanel(): AgentsPanelContextValue {
    const ctx = useContext(AgentsPanelContext);
    if (!ctx) throw new Error('useAgentsPanel must be used within AgentsPanelProvider');
    return ctx;
}
