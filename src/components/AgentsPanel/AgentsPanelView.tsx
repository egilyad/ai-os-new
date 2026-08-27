import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAgentsPanel } from './AgentsPanelContext';
import {
    Bot,
    Plus,
    Search,
    X,
    LayoutGrid,
    List,
    Wand2,
    AlertTriangle,
    Download,
    Upload,
    PlayCircle,
    PauseCircle,
    RefreshCw,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { ModalShell } from '../ModalShell';
import { ConfirmDialog } from '../ConfirmDialog';
import { templateService, agentService } from '../../kernel/instances';
import type { AgentTemplate as ServiceAgentTemplate } from '../../kernel/services/template-service';
import ModuleInfo from '../ModuleInfo';
import { AgentStatsDashboard } from './AgentStatsDashboard';
import { LiveActivityStream } from './LiveActivityStream';
import { EloLeaderboard } from './EloLeaderboard';
import { AgentWizard } from './AgentWizard';
import { AgentDetailPanel } from './AgentDetailPanel';
import { AgentCard } from './AgentCard';
import { AgentGroupsSection } from './AgentGroupsSection';
import { QuickCreateAgentModal } from './QuickCreateAgentModal';
import { AGENT_TEMPLATES } from './agent-templates';

const AgentsPanelView: React.FC = () => {
    const { t } = useTranslation();
    const {
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
        onSetViewMode,
        onSetSearchQuery,
        onSetStatusFilter,
        onSetSelectedAgentId,
        onSetActiveTab,
        onSetError,
        onNavigateBuilder,
        onDeployNewAgent,
        onToggleStatus,
        onUpdateAgent,
        onApplyRoleToAgent,
        onPauseAll,
        onResumeAll,
        onDuplicateAgent,
        onResetAgentStats,
        onResetAllStats,
        onExportAgents,
        onImportAgents,
    } = useAgentsPanel();

    const [customTemplates, setCustomTemplates] = useState<ServiceAgentTemplate[]>([]);
    const [showWizard, setShowWizard] = useState(false);
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [deleteConfirmAgent, setDeleteConfirmAgent] = useState<{
        id: string;
        name: string;
    } | null>(null);

    useEffect(() => {
        templateService
            .getTemplates()
            .then(setCustomTemplates)
            .catch(() => {});
    }, []);

    const handleDeleteAgent = (id: string) => {
        agentService.deleteAgent(id);
        setDeleteConfirmAgent(null);
        window.dispatchEvent(new CustomEvent('agents:updated'));
    };

    const deployCustomTemplate = (tmpl: ServiceAgentTemplate) => {
        agentService.spawnAgent(tmpl.name, undefined, tmpl.node.config as Record<string, unknown>);
    };

    return (
        <div className="agents-wrapper">
            <div className="agents-header">
                <div className="agents-header-left">
                    <h2 className="agents-header-title">
                        <Bot size={28} className="agents-header-icon" color="#3b82f6" />{' '}
                        {t('agents.agent_workforce')}
                    </h2>
                    <p className="agents-header-subtitle">{t('agents.header_subtitle')}</p>
                </div>
                <div className="agents-actions">
                    <button onClick={onExportAgents} className="agents-action-btn btn-secondary">
                        <Download size={16} /> {t('agents.export')}
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="agents-action-btn btn-secondary"
                    >
                        <Upload size={16} /> {t('agents.import')}
                    </button>
                    <button
                        onClick={onResetAllStats}
                        className={`agents-action-btn btn-secondary${resetAllArmed ? ' agents-action-btn--armed' : ''}`}
                    >
                        <RefreshCw size={16} />{' '}
                        {resetAllArmed
                            ? t('agents.confirm_reset_all')
                            : t('agents.reset_all_stats')}
                    </button>
                    <button onClick={onPauseAll} className="agents-action-btn btn-secondary">
                        <PauseCircle size={16} /> Pause All
                    </button>
                    <button onClick={onResumeAll} className="agents-action-btn btn-secondary">
                        <PlayCircle size={16} /> Resume All
                    </button>
                    <button
                        onClick={() => setShowQuickCreate(true)}
                        className="agents-spawn-btn btn-primary"
                    >
                        <Plus size={18} /> {t('agents.spawn_agent')}
                    </button>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="agents-spawn-btn btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(139,92,246,0.3)',
                            background: 'rgba(139,92,246,0.08)',
                            color: 'var(--purple-muted)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        <Wand2 size={16} /> Wizard
                    </button>
                </div>
            </div>

            {error && (
                <div className="agents-error" role="alert">
                    <AlertTriangle size={14} className="agents-error-icon" /> {error}
                    <button onClick={() => onSetError(null)} className="agents-error-close">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="agents-templates">
                <span className="agents-templates-label">{t('agents.quick_start_label')}</span>
                {AGENT_TEMPLATES.map((tmpl) => (
                    <button
                        key={tmpl.id}
                        onClick={() => onDeployNewAgent(tmpl)}
                        className="agents-template-btn"
                        style={{
                            border: `1px solid ${tmpl.color}30`,
                            background: `${tmpl.color}15`,
                            color: tmpl.color,
                        }}
                        title={tmpl.description}
                        aria-label={`Deploy ${tmpl.name} agent`}
                    >
                        {tmpl.icon} {tmpl.name}
                    </button>
                ))}
                {customTemplates.length > 0 && (
                    <>
                        <span className="agents-templates-label" style={{ marginLeft: '0.75rem' }}>
                            My Templates
                        </span>
                        {customTemplates.map((tmpl) => (
                            <button
                                key={tmpl.id}
                                type="button"
                                onClick={() => deployCustomTemplate(tmpl)}
                                className="agents-template-btn"
                                style={{
                                    border: '1px solid rgba(168,85,247,0.3)',
                                    background: 'rgba(168,85,247,0.12)',
                                    color: '#c084fc',
                                }}
                                title={tmpl.description || tmpl.name}
                            >
                                {tmpl.name}
                            </button>
                        ))}
                    </>
                )}
            </div>

            <AgentGroupsSection agents={agents} />

            <div className="agents-controls">
                <div className="agents-search">
                    <Search size={16} className="agents-search-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t('agents.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => onSetSearchQuery(e.target.value)}
                        className="agents-search-input"
                    />
                </div>
                <div className="agents-filters">
                    <span className="agents-filter-label">{t('agents.status_filter_label')}</span>
                    {(['all', 'active', 'paused', 'error'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => onSetStatusFilter(status)}
                            className={`agents-filter-btn${statusFilter === status ? ' agents-filter-btn--active' : ''}`}
                            aria-pressed={statusFilter === status}
                        >
                            {status === 'all'
                                ? t('agents.filter_all')
                                : status === 'active'
                                  ? t('agents.filter_active')
                                  : status === 'paused'
                                    ? t('agents.filter_paused')
                                    : t('agents.filter_error')}
                        </button>
                    ))}
                </div>
                <div className="agents-view-toggle" role="radiogroup">
                    <button
                        onClick={() => onSetViewMode('grid')}
                        className={`agents-view-btn${viewMode === 'grid' ? ' agents-view-btn--active' : ''}`}
                        role="radio"
                        aria-checked={viewMode === 'grid'}
                        aria-label={t('common.aria.grid_view')}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => onSetViewMode('list')}
                        className={`agents-view-btn${viewMode === 'list' ? ' agents-view-btn--active' : ''}`}
                        role="radio"
                        aria-checked={viewMode === 'list'}
                        aria-label={t('common.aria.list_view')}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            <div className="agents-scroll">
                {agents.length > 0 && (
                    <>
                        <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
                            <AgentStatsDashboard agentStats={agentStats} agents={agents} />
                        </div>
                        <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
                            <EloLeaderboard />
                        </div>
                        <div style={{ padding: '0 1rem', marginBottom: '1rem', height: 350 }}>
                            <LiveActivityStream />
                        </div>
                    </>
                )}
                <AnimatePresence>
                    {isLoading ? (
                        <div className="agents-skeleton-grid">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={`skeleton-${i}`}
                                    className="agents-skeleton-card glass-panel"
                                >
                                    <div className="agents-skeleton-top">
                                        <div className="agents-skeleton-avatar" />
                                        <div className="agents-skeleton-info">
                                            <div className="agents-skeleton-line" />
                                            <div className="agents-skeleton-line agents-skeleton-line--short" />
                                        </div>
                                    </div>
                                    <div className="agents-skeleton-body-line" />
                                    <div
                                        className="agents-skeleton-body-line"
                                        style={{ width: '80%' }}
                                    />
                                    <div className="agents-skeleton-tags">
                                        {[1, 2, 3].map((j) => (
                                            <div key={j} className="agents-skeleton-tag" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredAgents.length === 0 ? (
                        <div className="agents-empty">
                            <Bot size={48} className="agents-empty-icon" />
                            <p className="agents-empty-title">{t('agents.empty_title')}</p>
                            <p className="agents-empty-desc">
                                {searchQuery
                                    ? t('agents.empty_search')
                                    : t('agents.empty_no_topology')}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={onNavigateBuilder}
                                    className="btn-primary"
                                    style={{
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('agents.open_builder')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div
                            className={viewMode === 'grid' ? 'agents-grid' : ''}
                            style={
                                viewMode === 'list'
                                    ? { display: 'flex', flexDirection: 'column', gap: '1.5rem' }
                                    : undefined
                            }
                        >
                            {filteredAgents.map((agent) => (
                                <AgentCard
                                    key={agent.id}
                                    agent={agent}
                                    agentStats={agentStats}
                                    viewMode={viewMode}
                                    onSelect={onSetSelectedAgentId}
                                    onToggleStatus={onToggleStatus}
                                    t={t}
                                />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="agents-hidden-input"
                onChange={onImportAgents}
                aria-hidden="true"
            />

            <ModalShell
                open={selectedAgent !== null}
                onClose={() => onSetSelectedAgentId(null)}
                width={1100}
            >
                {selectedAgent && (
                    <AgentDetailPanel
                        agent={selectedAgent}
                        activeTab={activeTab}
                        agentStats={agentStats}
                        availableRoles={availableRoles}
                        availableTools={availableTools}
                        keys={keys}
                        onSetActiveTab={onSetActiveTab}
                        onUpdateAgent={onUpdateAgent}
                        onApplyRoleToAgent={onApplyRoleToAgent}
                        onDuplicateAgent={onDuplicateAgent}
                        onResetAgentStats={onResetAgentStats}
                        onToggleStatus={onToggleStatus}
                        onClose={() => onSetSelectedAgentId(null)}
                        onDeleteRequest={(a) => setDeleteConfirmAgent(a)}
                        t={t}
                    />
                )}
            </ModalShell>

            <AgentWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onAgentCreated={() => {}}
            />
            <QuickCreateAgentModal
                open={showQuickCreate}
                onClose={() => setShowQuickCreate(false)}
                availableRoles={availableRoles}
                onCreate={({ name, roleName, roleId, model, avatar }) => {
                    const config: Record<string, unknown> = { roleName, model, avatar: { emoji: avatar, color: '#8b5cf6' } };
                    if (roleId) (config as Record<string, unknown>).roleId = roleId;
                    // keep ENGINE untouched — after quick create user stays in Agent Manager
                    // open detail only if they want to configure
                    agentService.spawnAgent(name, roleId, config);
                    window.dispatchEvent(new CustomEvent('agents:updated'));
                }}
            />
            <ModuleInfo moduleKey="agents" />
            <ConfirmDialog
                open={deleteConfirmAgent !== null}
                title="Delete Agent"
                message={`Are you sure you want to delete "${deleteConfirmAgent?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={() => deleteConfirmAgent && handleDeleteAgent(deleteConfirmAgent.id)}
                onCancel={() => setDeleteConfirmAgent(null)}
            />
        </div>
    );
};

export default AgentsPanelView;
