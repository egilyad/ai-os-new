/**
 * Integrations Panel — AGEMS port, Phase 10.
 * Telegram chat bridging, N8N workflow triggers, MCP server management.
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { integrationService } from '../../kernel/instances/services-extras';
import type { TelegramChat, N8NWorkflow, MCPServer, IntegrationStatus } from '../../kernel/types/integration-types';

type Tab = 'status' | 'telegram' | 'n8n' | 'mcp';

export function IntegrationsPanel() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>('status');
    const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
    const [telegramChats, setTelegramChats] = useState<TelegramChat[]>([]);
    const [n8nWorkflows, setN8nWorkflows] = useState<N8NWorkflow[]>([]);
    const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
    const [loading, setLoading] = useState(true);

    // Telegram config
    const [tgBotToken, setTgBotToken] = useState('');
    const [tgEnabled, setTgEnabled] = useState(false);

    // N8N config
    const [n8nUrl, setN8nUrl] = useState('');
    const [n8nEnabled, setN8nEnabled] = useState(false);

    // MCP form
    const [mcpName, setMcpName] = useState('');
    const [mcpUrl, setMcpUrl] = useState('');

    const load = useCallback(async () => {
        try {
            const [s, chats, wfs, servers] = await Promise.all([
                integrationService.getStatus(),
                integrationService.listTelegramChats(),
                integrationService.listN8NWorkflows(),
                integrationService.listMCPServers(),
            ]);
            setStatuses(s);
            setTelegramChats(chats);
            setN8nWorkflows(wfs);
            setMcpServers(servers);

            const tgCfg = await integrationService.getTelegramConfig();
            if (tgCfg) { setTgBotToken(tgCfg.botToken); setTgEnabled(tgCfg.enabled); }
            const n8nCfg = await integrationService.getN8NConfig();
            if (n8nCfg) { setN8nUrl(n8nCfg.baseUrl); setN8nEnabled(n8nCfg.enabled); }
        } catch (err) {
            console.error('[IntegrationsPanel] load failed', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { setLoading(true); load(); }, [load]);

    const handleSaveTelegram = useCallback(async () => {
        await integrationService.configureTelegram({ botToken: tgBotToken, enabled: tgEnabled });
        load();
    }, [tgBotToken, tgEnabled, load]);

    const handleSaveN8N = useCallback(async () => {
        await integrationService.configureN8N({ baseUrl: n8nUrl, enabled: n8nEnabled });
        load();
    }, [n8nUrl, n8nEnabled, load]);

    const handleAddMCP = useCallback(async () => {
        if (!mcpName || !mcpUrl) return;
        await integrationService.addMCPServer({ name: mcpName, url: mcpUrl, toolConfiguration: { enabled: true } });
        setMcpName(''); setMcpUrl('');
        load();
    }, [mcpName, mcpUrl, load]);

    const handleDeleteMCP = useCallback(async (id: string) => {
        await integrationService.deleteMCPServer(id);
        load();
    }, [load]);

    const handleApproveChat = useCallback(async (id: string) => {
        await integrationService.approveTelegramChat(id);
        load();
    }, [load]);

    const handleDeleteChat = useCallback(async (id: string) => {
        await integrationService.deleteTelegramChat(id);
        load();
    }, [load]);

    const handleToggleWorkflow = useCallback(async (id: string, active: boolean) => {
        await integrationService.updateN8NWorkflow(id, { active: !active });
        load();
    }, [load]);

    const handleDeleteWorkflow = useCallback(async (id: string) => {
        await integrationService.deleteN8NWorkflow(id);
        load();
    }, [load]);

    const btn = (bg: string) => ({ padding: '6px 14px', background: bg, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' as const });
    const input = { padding: 6, borderRadius: 4, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' };

    return (
        <div style={{ padding: 24 }}>
            <h1>{t('integration.title')}</h1>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['status', 'telegram', 'n8n', 'mcp'] as Tab[]).map(tb => (
                    <button key={tb} onClick={() => setTab(tb)} style={{ padding: '6px 16px', background: tab === tb ? '#6366f1' : '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        {tb === 'status' ? t('integration.status') : t(`integration.${tb}`)}
                    </button>
                ))}
                <button onClick={load} style={{ ...btn('#334155'), marginLeft: 'auto' }}>{t('integration.refresh')}</button>
            </div>

            {loading && <p>Loading...</p>}

            {/* ── Status ── */}
            {tab === 'status' && !loading && (
                <div>
                    {statuses.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>No integrations configured</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {statuses.map(s => (
                                <li key={s.provider} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid #1e293b' }}>
                                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{s.provider}</span>
                                    <span style={{ padding: '2px 10px', borderRadius: 12, background: s.connected ? '#166534' : '#991b1b', fontSize: 12 }}>
                                        {s.connected ? t('integration.connected') : t('integration.disconnected')}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* ── Telegram ── */}
            {tab === 'telegram' && !loading && (
                <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                        <input value={tgBotToken} onChange={e => setTgBotToken(e.target.value)} placeholder={t('integration.bot_token')} style={{ ...input, width: 240 }} />
                        <label style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={tgEnabled} onChange={e => setTgEnabled(e.target.checked)} />
                            {t('integration.enabled')}
                        </label>
                        <button onClick={handleSaveTelegram} style={btn('#6366f1')}>{t('integration.save')}</button>
                    </div>

                    <h3>{t('integration.chats')}</h3>
                    {telegramChats.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>{t('integration.chat_empty')}</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {telegramChats.map(chat => (
                                <li key={chat.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
                                    <span style={{ color: '#6366f1' }}>{chat.username ?? chat.telegramChatId}</span>
                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>agent: {chat.agentId}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: 4, background: chat.isApproved ? '#166534' : '#92400e', fontSize: 12 }}>
                                        {chat.isApproved ? t('integration.approve') : 'pending'}
                                    </span>
                                    {!chat.isApproved && <button onClick={() => handleApproveChat(chat.id)} style={btn('#166534')}>{t('integration.approve')}</button>}
                                    <button onClick={() => handleDeleteChat(chat.id)} style={btn('#991b1b')}>{t('integration.delete')}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* ── N8N ── */}
            {tab === 'n8n' && !loading && (
                <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                        <input value={n8nUrl} onChange={e => setN8nUrl(e.target.value)} placeholder="N8N Base URL" style={{ ...input, width: 280 }} />
                        <label style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={n8nEnabled} onChange={e => setN8nEnabled(e.target.checked)} />
                            {t('integration.enabled')}
                        </label>
                        <button onClick={handleSaveN8N} style={btn('#6366f1')}>{t('integration.save')}</button>
                    </div>

                    <h3>{t('integration.workflows')}</h3>
                    {n8nWorkflows.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>{t('integration.workflow_empty')}</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {n8nWorkflows.map(wf => (
                                <li key={wf.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
                                    <span style={{ color: '#6366f1' }}>{wf.name}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: 4, background: wf.active ? '#166534' : '#92400e', fontSize: 12 }}>
                                        {wf.active ? t('integration.workflow_active') : t('integration.workflow_inactive')}
                                    </span>
                                    <button onClick={() => handleToggleWorkflow(wf.id, wf.active)} style={btn(wf.active ? '#92400e' : '#166534')}>
                                        {wf.active ? t('integration.disabled') : t('integration.enabled')}
                                    </button>
                                    <button onClick={() => handleDeleteWorkflow(wf.id)} style={btn('#991b1b')}>{t('integration.delete')}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* ── MCP ── */}
            {tab === 'mcp' && !loading && (
                <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                        <input value={mcpName} onChange={e => setMcpName(e.target.value)} placeholder={t('integration.server_name')} style={{ ...input, width: 160 }} />
                        <input value={mcpUrl} onChange={e => setMcpUrl(e.target.value)} placeholder={t('integration.server_url')} style={{ ...input, width: 280 }} />
                        <button onClick={handleAddMCP} style={btn('#6366f1')}>{t('integration.add_server')}</button>
                    </div>

                    {mcpServers.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>{t('integration.server_empty')}</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {mcpServers.map(s => (
                                <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
                                    <span style={{ color: '#6366f1' }}>{s.name}</span>
                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{s.url}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: 4, background: s.status === 'connected' ? '#166534' : '#991b1b', fontSize: 12 }}>
                                        {s.status}
                                    </span>
                                    <button onClick={() => handleDeleteMCP(s.id)} style={btn('#991b1b')}>{t('integration.delete')}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
