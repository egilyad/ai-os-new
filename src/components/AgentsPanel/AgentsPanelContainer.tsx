import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { orchestrator } from '../../kernel/instances';
import { agentService, agentVersionService } from '../../kernel/instances';
import { toolService } from '../../kernel/instances';
import { roleService } from '../../kernel/instances';
import { useKeyStore } from '../../stores/useKeyStore';
import { eventBus, EVENTS } from '../../kernel/instances';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('AgentsPanel');
import AgentsPanelView from './AgentsPanelView';
import { AgentsPanelContext } from './AgentsPanelContext';
import type { Agent, UiAgentTemplate, TabId, ViewMode, StatusFilter } from './AgentsPanelContext';

const lifecycleToStatus = (state: string): Agent['status'] => {
    switch (state) {
        case 'ready':
        case 'busy':
        case 'idle':
        case 'initializing':
            return 'active';
        case 'paused':
        case 'terminated':
            return 'paused';
        case 'degraded':
        case 'errored':
            return 'error';
        default:
            return 'active';
    }
};

const getAgentStatus = (agentId: string): Agent['status'] => {
    try {
        const lifecycle = agentService.getLifecycleState(agentId);
        if (lifecycle) return lifecycleToStatus(lifecycle);
    } catch {
        // fall through to isNodeDisabled
    }
    return orchestrator.isNodeDisabled(agentId) ? 'paused' : 'active';
};

const getAgentsFromTopology = (): Agent[] => {
    const top = orchestrator.getActiveTopology();
    if (!top) return [];
    return top.nodes
        .filter((n) => n.type === 'agent' || n.type === 'router')
        .map((n) => {
            const identity = resolveAgentIdentity(n.id);
            const name =
                identity.displayName && identity.displayName !== n.id
                    ? identity.displayName
                    : n.label;
            const role =
                n.type === 'router'
                    ? 'Semantic Router'
                    : identity.baseRole || String(n.config.roleName ?? '') || 'Autonomous Agent';
            return {
                id: n.id,
                name,
                role,
                roleId: n.config.roleId ? String(n.config.roleId) : undefined,
                description: n.config.prompt || 'No specific description.',
                providerId: n.config.provider || 'Auto',
                model: n.config.model || 'auto',
                status: getAgentStatus(n.id),
                temperature: n.config.temperature ?? 0.7,
                tools: Array.isArray(n.config.tools) ? n.config.tools : [],
                skills: Array.isArray(n.config.skills) ? n.config.skills : [],
                systemPrompt: n.config.prompt || '',
                hilEnabled: Boolean(n.config.hilEnabled ?? false),
                vpcEnabled: Boolean(n.config.vpcEnabled ?? true),
                stats: { calls: 0, tokens: 0, latency: 0 },
            };
        });
};

const AgentsPanelContainer: React.FC = () => {
    const keys = useKeyStore((s) => s.keys);
    const availableTools = (() => {
        try {
            return toolService.getTools();
        } catch {
            return [];
        }
    })();
    const availableRoles = (() => {
        try {
            return roleService.getAllRoles();
        } catch {
            return [];
        }
    })();
    const [agents, setAgents] = useState<Agent[]>(getAgentsFromTopology);
    const [agentStats, setAgentStats] = useState<
        Record<string, { calls: number; tokens: number; latency: number }>
    >(() => {
        try {
            return agentService.getAllStats() ?? {};
        } catch {
            return {};
        }
    });

    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('config');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resetAllArmed, setResetAllArmed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const lastFocusedElementRef = useRef<HTMLElement | null>(null);
    const errorTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const containerIsMountedRef = useRef(true);
    const armTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setErrorWithTimeout = useCallback((msg: string) => {
        setError(msg);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => {
            if (containerIsMountedRef.current) setError(null);
        }, 5000);
    }, []);

    useEffect(() => {
        containerIsMountedRef.current = true;
        orchestrator.getActiveTopology();

        const unsubTopology = eventBus.on(EVENTS.SYSTEM_TOPOLOGY_MOUNTED, () => {
            setAgents(getAgentsFromTopology());
            setIsLoading(false);
        });
        const unsubStats = eventBus.on(EVENTS.COGNITIVE_STEP_COMPLETED, () => {
            const next = agentService.getAllStats();
            setAgentStats((prev) => {
                const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
                for (const k of keys) {
                    const a = prev[k];
                    const b = next[k];
                    if (
                        a?.calls !== b?.calls ||
                        a?.tokens !== b?.tokens ||
                        a?.latency !== b?.latency
                    ) {
                        return { ...next };
                    }
                }
                return prev;
            });
        });
        const timer = setTimeout(() => {
            if (containerIsMountedRef.current) setIsLoading(false);
        }, 3000);
        return () => {
            containerIsMountedRef.current = false;
            unsubTopology();
            unsubStats();
            clearTimeout(timer);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            if (armTimerRef.current) clearTimeout(armTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (selectedAgentId && modalRef.current) {
            lastFocusedElementRef.current = document.activeElement as HTMLElement;
            const firstFocusable = modalRef.current.querySelector<HTMLButtonElement>(
                'button, [tabindex]:not([tabindex="-1"])',
            );
            firstFocusable?.focus();
        } else if (!selectedAgentId && lastFocusedElementRef.current) {
            lastFocusedElementRef.current.focus();
            lastFocusedElementRef.current = null;
        }
    }, [selectedAgentId]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedAgentId) {
                setSelectedAgentId(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedAgentId]);

    const updateAgent = useCallback(
        (agentId: string, updates: Record<string, unknown>) => {
            try {
                const top = orchestrator.getActiveTopology();
                const node = top?.nodes.find((n) => n.id === agentId);
                if (node) {
                    void agentVersionService.saveVersion(
                        agentId,
                        { ...node.config, label: node.label },
                        'Before update',
                    );
                }
                agentService.updateAgent(agentId, updates);
                setAgents(getAgentsFromTopology());
                setError(null);
            } catch (e) {
                LOGGER.warn('AgentsPanel', 'Failed to update agent configuration', { error: e });
                setErrorWithTimeout('Failed to update agent configuration');
            }
        },
        [setErrorWithTimeout],
    );

    const applyRoleToAgent = useCallback(
        (agentId: string, roleId: string) => {
            const role = roleService.getRole(roleId);
            if (role) {
                updateAgent(agentId, {
                    roleId: role.id,
                    roleName: role.name,
                    prompt: role.systemPrompt,
                    tools: role.capabilities || [],
                    temperature: role.baseTemperature,
                });
            } else {
                updateAgent(agentId, { roleId: undefined, roleName: 'Custom Agent' });
            }
        },
        [updateAgent],
    );

    const deployNewAgent = useCallback(
        (template?: UiAgentTemplate) => {
            try {
                const name = template ? template.name + ' Agent' : 'New Autonomous Agent';
                const newId = agentService.spawnAgent(
                    name,
                    undefined,
                    template?.config as Record<string, unknown> | undefined,
                );
                if (!newId) {
                    LOGGER.warn(
                        'AgentsPanel',
                        'deployNewAgent: spawnAgent returned null — no active topology',
                    );
                    setErrorWithTimeout('Failed to spawn agent: no active topology');
                    return;
                }
                setAgents(getAgentsFromTopology());
                setSelectedAgentId(newId);
                setActiveTab('config');
                setError(null);
            } catch (e) {
                LOGGER.warn('AgentsPanel', 'Failed to deploy agent', { error: e });
                setErrorWithTimeout('Failed to deploy agent');
            }
        },
        [setErrorWithTimeout],
    );

    const toggleStatus = useCallback(
        (id: string) => {
            try {
                agentService.toggleAgent(id);
                setAgents(getAgentsFromTopology());
                setError(null);
            } catch (e) {
                LOGGER.warn('AgentsPanel', 'Failed to toggle agent status', { error: e });
                setErrorWithTimeout('Failed to toggle agent status');
            }
        },
        [setErrorWithTimeout],
    );

    const handlePauseAll = useCallback(() => {
        agentService.pauseAllAgents();
        setAgents(getAgentsFromTopology());
        eventBus.emit(EVENTS.NOTIFICATION, { message: 'All agents paused', type: 'info' });
    }, []);

    const handleResumeAll = useCallback(() => {
        agentService.resumeAllAgents();
        setAgents(getAgentsFromTopology());
        eventBus.emit(EVENTS.NOTIFICATION, { message: 'All agents resumed', type: 'success' });
    }, []);

    const handleDeleteAgent = useCallback(
        (agentId: string) => {
            try {
                agentService.deleteAgent(agentId);
                setAgents(getAgentsFromTopology());
                setSelectedAgentId(null);
                eventBus.emit(EVENTS.NOTIFICATION, { message: 'Agent deleted', type: 'info' });
            } catch (e) {
                LOGGER.warn('AgentsPanel', 'Failed to delete agent', { error: e });
                setErrorWithTimeout('Failed to delete agent');
            }
        },
        [setErrorWithTimeout],
    );

    const handleDuplicateAgent = useCallback(
        (agentId: string) => {
            try {
                const agentToCopy = agents.find((a) => a.id === agentId);
                if (!agentToCopy) throw new Error('Agent not found');

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, stats, ...copyFields } = agentToCopy;
                const newId = agentService.spawnAgent(
                    `${agentToCopy.name} (Copy)`,
                    undefined,
                    copyFields as unknown as Record<string, unknown>,
                );
                if (!newId) throw new Error('Failed to spawn copy');

                setAgents(getAgentsFromTopology());
                setSelectedAgentId(newId);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Agent duplicated successfully',
                    type: 'success',
                });
            } catch (e) {
                LOGGER.warn('AgentsPanel', 'Failed to duplicate agent', { error: e });
                setErrorWithTimeout('Failed to duplicate agent');
            }
        },
        [agents, setErrorWithTimeout],
    );

    const handleResetAgentStats = useCallback(
        (agentId: string) => {
            try {
                agentService.resetStats(agentId);
                setAgentStats({ ...agentService.getAllStats() });
                eventBus.emit(EVENTS.NOTIFICATION, { message: 'Agent stats reset', type: 'info' });
            } catch (e) {
                LOGGER.warn('AgentsPanel', 'Failed to reset stats', { error: e });
                setErrorWithTimeout('Failed to reset stats');
            }
        },
        [setErrorWithTimeout],
    );

    const handleResetAllStats = useCallback(() => {
        if (!resetAllArmed) {
            setResetAllArmed(true);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'Click again to reset ALL agent stats',
                type: 'warning',
            });
            if (armTimerRef.current) clearTimeout(armTimerRef.current);
            armTimerRef.current = setTimeout(() => {
                if (containerIsMountedRef.current) setResetAllArmed(false);
            }, 5000);
            return;
        }
        agentService.resetAllStats();
        setAgentStats({ ...agentService.getAllStats() });
        setResetAllArmed(false);
        eventBus.emit(EVENTS.NOTIFICATION, { message: 'All agent stats reset', type: 'info' });
    }, [resetAllArmed]);

    const handleExportAgents = useCallback(() => {
        const data = agentService.exportAgents();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agents-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        eventBus.emit(EVENTS.NOTIFICATION, {
            message: 'Agents exported successfully',
            type: 'success',
        });
    }, []);

    const handleImportAgents = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const count = agentService.importAgents(event.target?.result as string);
                setAgents(getAgentsFromTopology());
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Successfully imported ${count} agent(s)`,
                    type: 'success',
                });
            } catch (e) {
                LOGGER.warn('AgentsPanel', 'Failed to import agents', { error: e });
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to import agents',
                    type: 'error',
                });
            }
        };
        reader.readAsText(file);
    }, []);

    const handleNavigateBuilder = useCallback(() => {
        eventBus.emit(EVENTS.NAVIGATE, 'builder');
    }, []);

    const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;
    const filteredAgents = agents.filter((a) => {
        const matchesSearch =
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const ctx = useMemo(
        () => ({
            agents,
            agentStats,
            viewMode,
            searchQuery,
            statusFilter,
            selectedAgent,
            activeTab,
            isLoading,
            error,
            resetAllArmed,
            filteredAgents,
            availableRoles,
            availableTools,
            keys,
            fileInputRef,
            searchInputRef,
            modalRef,
            onSetViewMode: setViewMode,
            onSetSearchQuery: setSearchQuery,
            onSetStatusFilter: setStatusFilter,
            onSetSelectedAgentId: setSelectedAgentId,
            onSetActiveTab: setActiveTab,
            onSetError: setError,
            onDeployNewAgent: deployNewAgent,
            onToggleStatus: toggleStatus,
            onUpdateAgent: updateAgent,
            onApplyRoleToAgent: applyRoleToAgent,
            onPauseAll: handlePauseAll,
            onResumeAll: handleResumeAll,
            onDuplicateAgent: handleDuplicateAgent,
            onDeleteAgent: handleDeleteAgent,
            onResetAgentStats: handleResetAgentStats,
            onResetAllStats: handleResetAllStats,
            onExportAgents: handleExportAgents,
            onImportAgents: handleImportAgents,
            onNavigateBuilder: handleNavigateBuilder,
        }),
        [
            agents,
            agentStats,
            viewMode,
            searchQuery,
            statusFilter,
            selectedAgent,
            activeTab,
            isLoading,
            error,
            resetAllArmed,
            filteredAgents,
            availableRoles,
            availableTools,
            keys,
            deployNewAgent,
            toggleStatus,
            updateAgent,
            applyRoleToAgent,
            handlePauseAll,
            handleResumeAll,
            handleDuplicateAgent,
            handleDeleteAgent,
            handleResetAgentStats,
            handleResetAllStats,
            handleExportAgents,
            handleImportAgents,
            handleNavigateBuilder,
        ],
    );

    return (
        <AgentsPanelContext.Provider value={ctx}>
            <AgentsPanelView />
        </AgentsPanelContext.Provider>
    );
};

export default AgentsPanelContainer;
