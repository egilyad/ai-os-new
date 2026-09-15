/**
 * Audit Panel — AGEMS port, Phase 9.
 * Security: audit log viewer + per-agent access rules.
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { auditService } from '../../kernel/instances/services-extras';
import type { AuditLogEntry, AuditAction, AuditActorType, AccessRule } from '../../kernel/types/audit-types';

type Tab = 'log' | 'rules';

const ACTIONS: AuditAction[] = ['create', 'read', 'update', 'delete', 'execute', 'communicate', 'login', 'grant_access', 'revoke_access', 'approve', 'reject'];
const ACTORS: AuditActorType[] = ['agent', 'human', 'system'];
const PERMISSIONS = ['read', 'write', 'execute', 'admin'] as const;

export function AuditPanel() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>('log');
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [rules, setRules] = useState<AccessRule[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [actorFilter, setActorFilter] = useState<AuditActorType | ''>('');
    const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
    const [resourceFilter, setResourceFilter] = useState('');

    // Rule form
    const [ruleAgentId, setRuleAgentId] = useState('');
    const [ruleResourceType, setRuleResourceType] = useState('');
    const [ruleResourceId, setRuleResourceId] = useState('');
    const [rulePermissions, setRulePermissions] = useState<string[]>([]);

    const load = useCallback(async () => {
        try {
            if (tab === 'log') {
                const filters: Record<string, string> = {};
                if (actorFilter) filters.actorType = actorFilter;
                if (actionFilter) filters.action = actionFilter;
                if (resourceFilter) filters.resourceType = resourceFilter;
                setLogs(await auditService.list(filters as Record<string, unknown>));
            } else {
                // Load all rules (for now, load without agent filter)
                setLogs([]);
                setRules([]);
            }
        } catch (err) {
            console.error('[AuditPanel] load failed', err);
        } finally {
            setLoading(false);
        }
    }, [tab, actorFilter, actionFilter, resourceFilter]);

    useEffect(() => { setLoading(true); load(); }, [load]);

    const loadRules = useCallback(async (agentId: string) => {
        if (!agentId) { setRules([]); return; }
        try {
            setRules(await auditService.getRules(agentId));
        } catch (err) {
            console.error('[AuditPanel] loadRules failed', err);
        }
    }, []);

    const handleAddRule = useCallback(async () => {
        if (!ruleAgentId || !ruleResourceType || rulePermissions.length === 0) return;
        try {
            await auditService.addRule({
                agentId: ruleAgentId,
                resourceType: ruleResourceType,
                resourceId: ruleResourceId || undefined,
                permissions: rulePermissions as ('read' | 'write' | 'execute' | 'admin')[],
            });
            setRulePermissions([]);
            setRuleResourceId('');
            loadRules(ruleAgentId);
        } catch (err) {
            console.error('[AuditPanel] addRule failed', err);
        }
    }, [ruleAgentId, ruleResourceType, ruleResourceId, rulePermissions, loadRules]);

    const handleDeleteRule = useCallback(async (id: string) => {
        try {
            await auditService.deleteRule(id);
            if (ruleAgentId) loadRules(ruleAgentId);
        } catch (err) {
            console.error('[AuditPanel] deleteRule failed', err);
        }
    }, [ruleAgentId, loadRules]);

    const togglePermission = (perm: string) => {
        setRulePermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
    };

    const formatTime = (ts: number) => new Date(ts).toLocaleString();

    return (
        <div style={{ padding: 24 }}>
            <h1>{t('audit.title')}</h1>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button
                    onClick={() => setTab('log')}
                    style={{ padding: '6px 16px', background: tab === 'log' ? '#6366f1' : '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                    {t('audit.log_tab')}
                </button>
                <button
                    onClick={() => setTab('rules')}
                    style={{ padding: '6px 16px', background: tab === 'rules' ? '#6366f1' : '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                    {t('audit.rules_tab')}
                </button>
                <button
                    onClick={load}
                    style={{ padding: '6px 16px', background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto' }}
                >
                    {t('audit.refresh')}
                </button>
            </div>

            {loading && <p>Loading...</p>}

            {/* ── Audit Log ── */}
            {tab === 'log' && !loading && (
                <div>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <select value={actorFilter} onChange={e => setActorFilter(e.target.value as AuditActorType | '')} style={{ padding: 6, borderRadius: 4, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}>
                            <option value="">{t('audit.filter_actor')}</option>
                            {ACTORS.map(a => <option key={a} value={a}>{t(`audit.actor.${a}`)}</option>)}
                        </select>
                        <select value={actionFilter} onChange={e => setActionFilter(e.target.value as AuditAction | '')} style={{ padding: 6, borderRadius: 4, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}>
                            <option value="">{t('audit.filter_action')}</option>
                            {ACTIONS.map(a => <option key={a} value={a}>{t(`audit.action.${a}`)}</option>)}
                        </select>
                        <input value={resourceFilter} onChange={e => setResourceFilter(e.target.value)} placeholder={t('audit.filter_resource')} style={{ padding: 6, borderRadius: 4, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }} />
                    </div>

                    {logs.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>{t('audit.log_empty')}</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                    <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8' }}>{t('audit.log_timestamp')}</th>
                                    <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8' }}>{t('audit.filter_actor')}</th>
                                    <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8' }}>{t('audit.filter_action')}</th>
                                    <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8' }}>{t('audit.filter_resource')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(entry => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: 8, color: '#64748b', fontSize: 12 }}>{formatTime(entry.createdAt)}</td>
                                        <td style={{ padding: 8 }}><span style={{ color: '#6366f1' }}>{t(`audit.actor.${entry.actorType}`)}</span> {entry.actorId}</td>
                                        <td style={{ padding: 8 }}><span style={{ padding: '2px 8px', borderRadius: 4, background: '#334155', fontSize: 12 }}>{t(`audit.action.${entry.action}`)}</span></td>
                                        <td style={{ padding: 8, color: '#94a3b8' }}>{entry.resourceType}:{entry.resourceId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Access Rules ── */}
            {tab === 'rules' && !loading && (
                <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <input value={ruleAgentId} onChange={e => { setRuleAgentId(e.target.value); loadRules(e.target.value); }} placeholder="Agent ID" style={{ padding: 6, borderRadius: 4, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', width: 160 }} />
                        <input value={ruleResourceType} onChange={e => setRuleResourceType(e.target.value)} placeholder="Resource type" style={{ padding: 6, borderRadius: 4, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', width: 120 }} />
                        <input value={ruleResourceId} onChange={e => setRuleResourceId(e.target.value)} placeholder="Resource ID (optional)" style={{ padding: 6, borderRadius: 4, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', width: 140 }} />
                        <div style={{ display: 'flex', gap: 4 }}>
                            {PERMISSIONS.map(p => (
                                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 13 }}>
                                    <input type="checkbox" checked={rulePermissions.includes(p)} onChange={() => togglePermission(p)} />
                                    {t(`audit.permissions.${p}`)}
                                </label>
                            ))}
                        </div>
                        <button onClick={handleAddRule} style={{ padding: '6px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                            {t('audit.add_rule')}
                        </button>
                    </div>

                    {rules.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>{t('audit.rules_empty')}</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {rules.map(rule => (
                                <li key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
                                    <span style={{ color: '#6366f1' }}>{rule.agentId}</span>
                                    <span style={{ color: '#94a3b8' }}>{rule.resourceType}:{rule.resourceId}</span>
                                    <span style={{ display: 'flex', gap: 4 }}>
                                        {rule.permissions.map(p => (
                                            <span key={p} style={{ padding: '1px 6px', borderRadius: 4, background: '#334155', fontSize: 12, color: '#e2e8f0' }}>
                                                {t(`audit.permissions.${p}`)}
                                            </span>
                                        ))}
                                    </span>
                                    <button onClick={() => handleDeleteRule(rule.id)} style={{ marginLeft: 'auto', padding: '4px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                                        {t('audit.delete_rule')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default AuditPanel;
