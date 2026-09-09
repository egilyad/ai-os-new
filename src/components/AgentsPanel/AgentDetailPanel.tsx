import { Copy, BookOpen, RefreshCw, Trash2, Pause, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { templateService } from '../../kernel/instances';
import type { ISNode } from '../../kernel/contracts/topology';
import { AgentHistoryTab } from './AgentHistoryTab';
import { AgentPolicySection } from './AgentPolicySection';
import { sidebarTabs } from './sidebar-tabs';
import AgentConfigTab from './AgentConfigTab';
import AgentCapabilitiesTab from './AgentCapabilitiesTab';
import AgentInfraTab from './AgentInfraTab';
import AgentObservabilityTab from './AgentObservabilityTab';
import AgentHandoffsTab from './AgentHandoffsTab';
import AgentIdentityEditor from './AgentIdentityEditor';
import { AgentAvatar } from './AgentAvatar';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import type { AgentDetailPanelProps } from './AgentDetailPanelProps';

const AgentAvatarHeader: React.FC<{ agent: AgentDetailPanelProps['agent'] }> = ({ agent }) => {
    const identity = resolveAgentIdentity(agent.id);
    return (
        <div className="agents-modal-header-icon">
            <AgentAvatar
                agentId={agent.id}
                name={agent.name}
                size={36}
                emoji={identity.avatar.emoji}
                color={identity.avatar.color}
                url={identity.avatar.url}
            />
        </div>
    );
};

export const AgentDetailPanel: React.FC<AgentDetailPanelProps> = ({
    agent,
    activeTab,
    agentStats,
    availableRoles,
    availableTools,
    keys,
    onSetActiveTab,
    onUpdateAgent,
    onApplyRoleToAgent,
    onDuplicateAgent,
    onResetAgentStats,
    onToggleStatus,
    onClose,
    onDeleteRequest,
    t,
}) => {
    return (
        <div className="agents-modal glass-panel">
            <div className="agents-modal-header">
                <div className="agents-modal-header-left">
                    <AgentAvatarHeader agent={agent} />
                    <div className="agents-modal-header-info">
                        <h2 className="agents-modal-header-name">{agent.name}</h2>
                        <div className="agents-modal-header-meta">
                            <span className="agents-modal-header-role">{agent.role}</span>
                            <span className="agents-modal-header-dot" />
                            <span
                                className={`agents-modal-header-status agents-modal-header-status--${agent.status}`}
                            >
                                {agent.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="agents-modal-header-actions">
                    <button
                        onClick={() => onDuplicateAgent(agent.id)}
                        className="agents-modal-header-action-btn btn-secondary"
                        title="Duplicate Agent"
                        aria-label="Duplicate agent"
                    >
                        <Copy size={16} /> Duplicate
                    </button>
                    <button
                        onClick={() =>
                            templateService.saveAsTemplate(
                                {
                                    id: agent.id,
                                    type: 'agent',
                                    label: agent.name,
                                    config: {
                                        prompt: agent.systemPrompt,
                                        tools: agent.tools,
                                        temperature: agent.temperature,
                                        model: agent.model,
                                        provider: agent.providerId,
                                    },
                                } as ISNode,
                                agent.description,
                            )
                        }
                        className="agents-modal-header-action-btn btn-secondary"
                        title="Save as Template"
                        aria-label="Save as template"
                    >
                        <BookOpen size={16} /> Save as Template
                    </button>
                    <button
                        onClick={() => onResetAgentStats(agent.id)}
                        className="agents-modal-header-action-btn btn-secondary"
                        title="Reset Agent Stats"
                        aria-label="Reset agent stats"
                    >
                        <RefreshCw size={16} /> Reset Stats
                    </button>
                    <button
                        onClick={() => onDeleteRequest({ id: agent.id, name: agent.name })}
                        className="agents-modal-header-action-btn btn-secondary"
                        title="Delete Agent"
                        aria-label="Delete agent"
                        style={{
                            color: 'var(--error)',
                            borderColor: 'rgba(239,68,68,0.2)',
                        }}
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                    <button
                        onClick={() => onToggleStatus(agent.id)}
                        className="agents-modal-header-action-btn btn-secondary"
                        aria-label={agent.status === 'active' ? 'Pause node' : 'Resume node'}
                    >
                        {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                        {agent.status === 'active' ? 'Pause Node' : 'Resume Node'}
                    </button>
                    <button
                        onClick={onClose}
                        className="agents-modal-close-btn btn-secondary"
                        aria-label="Close agent details"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="agents-modal-body">
                <div
                    className="agents-modal-sidebar"
                    role="tablist"
                    aria-label="Agent configuration tabs"
                >
                    {sidebarTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onSetActiveTab(tab.id)}
                            className={`agents-modal-sidebar-btn${activeTab === tab.id ? ' agents-modal-sidebar-btn--active' : ''}`}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`agents-tabpanel-${tab.id}`}
                            id={`agents-tab-${tab.id}`}
                        >
                            <span className="agents-modal-sidebar-btn-icon">{tab.icon}</span>{' '}
                            {t(`agents.tab_${tab.id}`)}
                        </button>
                    ))}
                </div>

                <div className="agents-modal-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="agents-modal-content-inner"
                            role="tabpanel"
                            id={`agents-tabpanel-${activeTab}`}
                            aria-labelledby={`agents-tab-${activeTab}`}
                        >
                            {activeTab === 'config' && (
                                <AgentConfigTab
                                    agent={agent}
                                    availableRoles={availableRoles}
                                    keys={keys}
                                    onUpdateAgent={onUpdateAgent}
                                    onApplyRoleToAgent={onApplyRoleToAgent}
                                />
                            )}
                            {activeTab === 'capabilities' && (
                                <AgentCapabilitiesTab
                                    agent={agent}
                                    availableTools={availableTools}
                                    onUpdateAgent={onUpdateAgent}
                                />
                            )}
                            {activeTab === 'permissions' && (
                                <AgentPolicySection agentId={agent.id} />
                            )}
                            {activeTab === 'infra' && (
                                <AgentInfraTab agent={agent} onUpdateAgent={onUpdateAgent} />
                            )}
                            {activeTab === 'observability' && (
                                <AgentObservabilityTab agent={agent} agentStats={agentStats} />
                            )}
                            {activeTab === 'handoffs' && <AgentHandoffsTab agent={agent} />}
                            {activeTab === 'identity' && (
                                <AgentIdentityEditor
                                    agentId={agent.id}
                                    onUpdateAgent={onUpdateAgent}
                                    t={t}
                                />
                            )}
                            {activeTab === 'history' && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <AgentHistoryTab agentId={agent.id} />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
