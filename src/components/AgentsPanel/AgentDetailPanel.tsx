import React, { useState, useEffect } from 'react';
import { Copy, BookOpen, RefreshCw, Trash2, Pause, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { templateService, agentService } from '../../kernel/instances';
import type { ISNode } from '../../kernel/contracts/topology';
import { AgentHistoryTab } from './AgentHistoryTab';
import { AgentPolicySection } from './AgentPolicySection';
import { sidebarTabs } from './sidebar-tabs';
import AgentConfigTab from './AgentConfigTab';
import AgentProfileTab from './AgentProfileTab';
import AgentCapabilitiesTab from './AgentCapabilitiesTab';
import AgentInfraTab from './AgentInfraTab';
import AgentObservabilityTab from './AgentObservabilityTab';
import AgentHandoffsTab from './AgentHandoffsTab';
import AgentIdentityEditor from './AgentIdentityEditor';
import { AgentAvatar } from './AgentAvatar';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { agentRepositoryService } from '../../kernel/services/agent-repository-service';
import type { AgentDetailPanelProps } from './AgentDetailPanelProps';
import { getDexieDb } from '../../kernel/instances';
import { useChatStore } from '../../stores/useChatStore';

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
                            {activeTab === 'profile' && (
                                <AgentProfileTab
                                    agent={agent}
                                    agentStats={agentStats}
                                    onDuplicateAgent={onDuplicateAgent}
                                    onResetAgentStats={onResetAgentStats}
                                    onEdit={() => onSetActiveTab('config')}
                                    onClose={onClose}
                                />
                            )}
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
                            {activeTab === 'memory' && <MemoryTab agentId={agent.id} />}
                            {activeTab === 'hierarchy' && <HierarchyTab agentId={agent.id} agentName={agent.name} />}
                            {activeTab === 'approvals' && <ApprovalsTab agentId={agent.id} />}
                            {activeTab === 'responsibilities' && <ResponsibilitiesTab agentId={agent.id} />}
                            {activeTab === 'budget' && <BudgetTab agentId={agent.id} />}
                            {activeTab === 'repository' && <RepositoryTab agentId={agent.id} />}
                            {activeTab === 'chat' && <ChatTab agentId={agent.id} agentName={agent.name} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// --- Minimal inline tabs for AGEMS 0.3 (full CRUD to be expanded) ---

function MemoryTab({ agentId }: { agentId: string }) {
    const [entries, setEntries] = useState<Array<{ id: number; type: string; content: string }>>([]);
    const [content, setContent] = useState('');
    const [type, setType] = useState('CONTEXT');
    useEffect(() => {
        getDexieDb().agentMemory.where('agentId').equals(agentId).toArray().then((rows) => setEntries(rows as unknown as Array<{ id: number; type: string; content: string }>));
    }, [agentId]);
    const add = async () => {
        if (!content.trim()) return;
        await getDexieDb().agentMemory.add({ agentId, type: type as 'CONTEXT', content: content.slice(0, 2000), createdAt: Date.now() } as unknown as never);
        setContent('');
        const rows = await getDexieDb().agentMemory.where('agentId').equals(agentId).toArray();
        setEntries(rows as unknown as Array<{ id: number; type: string; content: string }>);
    };
    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>Memory — {entries.length} entries</div>
            <div style={{ display: 'flex', gap: 8 }}>
                <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12 }}>
                    <option value="CONTEXT">CONTEXT</option><option value="CONVERSATION">CONVERSATION</option><option value="FILE">FILE</option><option value="KNOWLEDGE">KNOWLEDGE</option>
                </select>
                <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="New memory…" style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12 }} />
                <button onClick={() => void add()} style={{ padding: '6px 12px', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entries.map((e) => (
                    <div key={e.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: '#60a5fa', marginRight: 6 }}>{e.type}</span>{e.content}
                    </div>
                ))}
                {entries.length === 0 && <div style={{ color: 'var(--slate-500)', fontSize: 12, textAlign: 'center', padding: 12 }}>No memory yet</div>}
            </div>
        </div>
    );
}

function HierarchyTab({ agentId, agentName }: { agentId: string; agentName: string }) {
    const [parent, setParent] = useState<string | null>(null);
    const [children, setChildren] = useState<string[]>([]);
    const [newChildName, setNewChildName] = useState('');
    useEffect(() => {
        try { setParent(agentService.getParent(agentId)); } catch { setParent(null); }
        try { setChildren(agentService.getChildren(agentId)); } catch { setChildren([]); }
    }, [agentId]);
    const spawn = () => {
        if (!newChildName.trim()) return;
        const id = agentService.spawn(agentId, { name: newChildName.trim() });
        if (id) { setChildren((prev) => [...prev, id]); setNewChildName(''); }
    };
    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><span style={{ fontWeight: 700 }}>Hierarchy</span> — parent: {parent ?? '— none —'} · children: {children.length}</div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input value={newChildName} onChange={(e) => setNewChildName(e.target.value)} placeholder={`Child of ${agentName}`} style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12 }} />
                <button onClick={spawn} style={{ padding: '6px 12px', borderRadius: 8, background: '#8b5cf6', color: 'white', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Spawn Child</button>
            </div>
            {children.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children.map((id) => <span key={id} style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 11 }}>{id}</span>)}</div>}
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Parent stored in ISNode.config.parentAgentId · child inherits LLM/runtime/tools</div>
        </div>
    );
}

function ApprovalsTab({ agentId }: { agentId: string }) {
    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>Approval Policy — {agentId.slice(0, 8)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['readMode', 'writeMode', 'deleteMode', 'executeMode', 'sendMode', 'adminMode'].map((k) => (
                    <div key={k} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11 }}>
                        <div style={{ fontWeight: 700, color: 'var(--slate-400)' }}>{k}</div>
                        <div style={{ marginTop: 4, color: 'var(--slate-300)' }}>FREE · requires approval → Guided preset</div>
                    </div>
                ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Full per-tool overrides + auto-approve rules (costThreshold, low-risk) in next iteration. Persists to Dexie `approvalPolicies`.</div>
        </div>
    );
}

function ResponsibilitiesTab({ agentId }: { agentId: string }) {
    const [items, setItems] = useState<Array<{ id: number; title: string; priority: string }>>([]);
    const [title, setTitle] = useState('');
    useEffect(() => { getDexieDb().agentResponsibilities.where('agentId').equals(agentId).toArray().then((rows) => setItems(rows as unknown as Array<{ id: number; title: string; priority: string }>)); }, [agentId]);
    const add = async () => {
        if (!title.trim()) return;
        await getDexieDb().agentResponsibilities.add({ agentId, title: title.slice(0, 120), priority: 'MEDIUM' } as unknown as never);
        setTitle('');
        const rows = await getDexieDb().agentResponsibilities.where('agentId').equals(agentId).toArray();
        setItems(rows as unknown as Array<{ id: number; title: string; priority: string }>);
    };
    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>Responsibilities & KPIs — {items.length}</div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New responsibility…" style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12 }} />
                <button onClick={() => void add()} style={{ padding: '6px 12px', borderRadius: 8, background: '#f59e0b', color: 'white', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((r) => <div key={r.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>{r.title} <span style={{ float: 'right', fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{r.priority}</span></div>)}
                {items.length === 0 && <div style={{ color: 'var(--slate-500)', fontSize: 12, textAlign: 'center', padding: 12 }}>No duties yet</div>}
            </div>
        </div>
    );
}

function BudgetTab({ agentId }: { agentId: string }) {
    const [budget, setBudget] = useState<{ monthlyLimitUsd: number; currentSpendUsd: number } | null>(null);
    useEffect(() => { getDexieDb().agentBudgets.where('agentId').equals(agentId).first().then((b) => setBudget(b as unknown as { monthlyLimitUsd: number; currentSpendUsd: number } | null)); }, [agentId]);
    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>Budget — {agentId.slice(0, 8)}</div>
            {budget ? (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div style={{ fontSize: 12 }}>Monthly limit: ${budget.monthlyLimitUsd} · spent: ${budget.currentSpendUsd.toFixed(2)} · {(budget.currentSpendUsd / budget.monthlyLimitUsd * 100).toFixed(1)}%</div>
                    <div style={{ height: 6, borderRadius: 6, background: 'rgba(0,0,0,0.2)', marginTop: 8 }}><div style={{ width: `${Math.min(100, budget.currentSpendUsd / budget.monthlyLimitUsd * 100)}%`, height: '100%', borderRadius: 6, background: '#10b981' }} /></div>
                </div>
            ) : (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--slate-500)' }}>No budget set — default hardStop at $100/mo (soft alert 80%). Create via BudgetPanel or set monthlyLimitUsd in agent config.</div>
            )}
        </div>
    );
}

function RepositoryTab({ agentId }: { agentId: string }) {
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('main');
    const [repos, setRepos] = useState<Array<{ repositoryId: string; repoUrl: string; branch: string; isDefault: boolean }>>([]);

    const load = async () => {
        const list = await agentRepositoryService.listByAgent(agentId);
        setRepos(list);
    };
    useEffect(() => { void load(); }, [agentId]);

    const handleLink = async () => {
        if (!repoUrl.trim()) return;
        await agentRepositoryService.link(agentId, repoUrl.trim(), branch.trim() || 'main', repos.length === 0);
        setRepoUrl('');
        void load();
    };

    const handleUnlink = async (repositoryId: string) => {
        await agentRepositoryService.unlink(repositoryId);
        void load();
    };

    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>Repository — {agentId.slice(0, 8)}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repo" style={{ flex: 1, minWidth: 200, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'inherit', fontSize: 12 }} />
                <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="branch" style={{ width: 120, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'inherit', fontSize: 12 }} />
                <button onClick={handleLink} disabled={!repoUrl.trim()} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: repoUrl.trim() ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, fontSize: 12, cursor: repoUrl.trim() ? 'pointer' : 'not-allowed' }}>Link</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {repos.map((r) => (
                    <div key={r.repositoryId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                        <span style={{ fontWeight: 600, flex: 1 }}>{r.repoUrl}{r.isDefault ? ' ⭐' : ''}</span>
                        <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>branch: {r.branch}</span>
                        <button onClick={() => handleUnlink(r.repositoryId)} style={{ border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 10 }}>✕</button>
                    </div>
                ))}
                {repos.length === 0 && <div style={{ fontSize: 11, color: 'var(--slate-500)', textAlign: 'center', padding: 8 }}>No repositories linked</div>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Reads/writes via WorkspaceService — uses <code>projectFiles</code> Dexie table.</div>
        </div>
    );
}

function ChatTab({ agentId, agentName }: { agentId: string; agentName: string }) {
    const [text, setText] = useState('');
    const send = () => {
        if (!text.trim()) return;
        const store = useChatStore.getState();
        const target = store.getSessionConfig();
        // Direct message: create or reuse chat session with agent attached
        void store.setAgent(agentId).then(() => {
            const firstKey = store.getSessionConfig()?.keyId;
            if (!firstKey) return;
            // use current model/key from session
        });
        // Minimal: just set agent and send via default key/model
        const cfg = useChatStore.getState().getSessionConfig();
        const provider = cfg?.provider ?? 'auto';
        const model = cfg?.model ?? 'llama-3.3-70b-versatile';
        const keyId = cfg?.keyId;
        void useChatStore.getState().sendMessage([{ provider, model, keyId, agentId }], text);
        setText('');
    };
    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12, height: 360 }}>
            <div style={{ fontWeight: 700 }}>Chat with {agentName} — direct channel</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--slate-400)' }}>Auto-creates channel on first message. History appears in Chat panel with agent badge.</div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder={`Message ${agentName}…`} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12 }} />
                <button onClick={send} style={{ padding: '8px 14px', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Send</button>
            </div>
        </div>
    );
}
