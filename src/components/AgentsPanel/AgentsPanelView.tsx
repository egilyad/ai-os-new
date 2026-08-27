import React, { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAgentsPanel } from './AgentsPanelContext';
import { Bot, Plus, Search, X, AlertTriangle, Wand2 } from 'lucide-react';
import { ModalShell } from '../ModalShell';
import { ConfirmDialog } from '../ConfirmDialog';
import { agentService } from '../../kernel/instances';
import ModuleInfo from '../ModuleInfo';
import { AgentWizard } from './AgentWizard';
import { AgentDetailPanel } from './AgentDetailPanel';
import { QuickCreateAgentModal } from './QuickCreateAgentModal';
import { AgentsTable } from './AgentsTable';

const AgentsPanelView: React.FC = () => {
    const { t } = useTranslation();
    const {
        agentStats,
        searchQuery,
        statusFilter,
        selectedAgent,
        activeTab,
        isLoading,
        error,
        filteredAgents,
        availableRoles,
        availableTools,
        keys,
        fileInputRef,
        searchInputRef,
        onSetSearchQuery,
        onSetStatusFilter,
        onSetSelectedAgentId,
        onSetActiveTab,
        onSetError,
        onNavigateBuilder,
        onToggleStatus,
        onUpdateAgent,
        onApplyRoleToAgent,
        onDuplicateAgent,
        onResetAgentStats,
    } = useAgentsPanel();

    const [showWizard, setShowWizard] = useState(false);
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [deleteConfirmAgent, setDeleteConfirmAgent] = useState<{ id: string; name: string } | null>(null);

    const handleDeleteAgent = (id: string) => {
        agentService.deleteAgent(id);
        setDeleteConfirmAgent(null);
        window.dispatchEvent(new CustomEvent('agents:updated'));
    };

    const total = filteredAgents.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 20px', minHeight: 0 }}>
            {/* Header — compact */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bot size={18} color="#3b82f6" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-100)' }}>{t('agents.agent_workforce')}</h2>
                            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>{total}</span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('agents.header_subtitle')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                        onClick={() => setShowWizard(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.08)', color: '#a78bfa', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                        <Wand2 size={14} /> Wizard
                    </button>
                    <button
                        onClick={() => setShowQuickCreate(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.25)' }}
                    >
                        <Plus size={16} /> {t('agents.spawn_agent')}
                    </button>
                </div>
            </div>

            {error && (
                <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5', fontSize: '0.85rem' }}>
                    <AlertTriangle size={14} /> <span style={{ flex: 1 }}>{error}</span>
                    <button onClick={() => onSetError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
                </div>
            )}

            {/* Controls — single compact row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t('agents.search_placeholder')}
                        value={searchQuery}
                        onChange={e => onSetSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.5)', color: 'var(--slate-100)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Status filter">
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, marginRight: 2 }}>{t('agents.status_filter_label')}</span>
                    {(['all', 'active', 'paused', 'error'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => onSetStatusFilter(status)}
                            aria-pressed={statusFilter === status}
                            style={{
                                padding: '7px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                border: statusFilter === status ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
                                background: statusFilter === status ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                                color: statusFilter === status ? '#93c5fd' : 'var(--slate-300)'
                            }}
                        >
                            {status === 'all' ? t('agents.filter_all') : status === 'active' ? t('agents.filter_active') : status === 'paused' ? t('agents.filter_paused') : t('agents.filter_error')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, minHeight: 0 }}>
                {isLoading ? (
                    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: 56, borderTop: i === 1 ? 'none' : '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
                        ))}
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 32, textAlign: 'center', background: 'rgba(15,23,42,0.3)' }}>
                        <Bot size={28} style={{ color: 'var(--slate-500)', marginBottom: 8 }} />
                        <div style={{ fontWeight: 600, color: 'var(--slate-200)', marginBottom: 4 }}>{t('agents.empty_title')}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: 12 }}>{searchQuery ? t('agents.empty_search') : t('agents.empty_no_topology')}</div>
                        {!searchQuery && (
                            <button onClick={onNavigateBuilder} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{t('agents.open_builder')}</button>
                        )}
                    </div>
                ) : (
                    <AgentsTable
                        agents={filteredAgents}
                        agentStats={agentStats}
                        onSelect={onSetSelectedAgentId}
                        onToggleStatus={onToggleStatus}
                        onDuplicate={onDuplicateAgent}
                        onDeleteRequest={(id, name) => setDeleteConfirmAgent({ id, name })}
                        t={t}
                    />
                )}
            </div>

            <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} aria-hidden="true" />

            <ModalShell open={selectedAgent !== null} onClose={() => onSetSelectedAgentId(null)} width={1100}>
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
                        onDeleteRequest={a => setDeleteConfirmAgent(a)}
                        t={t}
                    />
                )}
            </ModalShell>

            <AgentWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onAgentCreated={() => {}} />
            <QuickCreateAgentModal
                open={showQuickCreate}
                onClose={() => setShowQuickCreate(false)}
                availableRoles={availableRoles}
                onCreate={({ name, roleName, roleId, model, avatar }) => {
                    const config: Record<string, unknown> = { roleName, model, avatar: { emoji: avatar, color: '#8b5cf6' } };
                    if (roleId) config.roleId = roleId;
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
