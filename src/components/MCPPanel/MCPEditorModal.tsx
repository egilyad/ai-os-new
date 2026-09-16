import { useState } from 'react';
import { X } from 'lucide-react';
import { ModalShell } from '../ModalShell';
import { mcpService } from '../../kernel/instances';
import type { MCPServerConfig } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';

interface MCPEditorModalProps {
    server: Partial<MCPServerConfig> | null;
    onClose: () => void;
    onSaved: () => void;
}

export function MCPEditorModal({ server: editing, onClose, onSaved }: MCPEditorModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(editing?.name || '');
    const [url, setUrl] = useState(editing?.url || '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    if (!editing) return null;

    const handleSave = async () => {
        if (!name.trim() || !url.trim()) return;
        setSaving(true);
        setError('');
        try {
            if (editing.id) {
                mcpService.updateServer(editing.id, { name: name.trim(), url: url.trim() });
            } else {
                mcpService.addServer({
                    id: `mcp-${crypto.randomUUID().slice(0, 8)}`,
                    name: name.trim(),
                    url: url.trim(),
                });
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(`Failed to save server: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell open={editing !== null} onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                    style={{
                        padding: '2rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <h3
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            margin: 0,
                            color: 'var(--slate-50)',
                        }}
                    >
                        {editing.id ? t('mcp.edit_title') : t('mcp.add_title')}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div
                    style={{
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                    }}
                >
                    {error && (
                        <div
                            style={{
                                padding: '0.75rem',
                                borderRadius: 8,
                                background: 'var(--error-tint)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#fca5a5',
                                fontSize: '0.85rem',
                            }}
                        >
                            {error}
                        </div>
                    )}
                    <div>
                        <label
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--slate-500)',
                                marginBottom: '0.5rem',
                                display: 'block',
                                textTransform: 'uppercase',
                            }}
                        >
                            Server Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10,
                                color: 'white',
                                outline: 'none',
                                fontSize: '0.9rem',
                            }}
                            placeholder={t('mcp.name_placeholder')}
                        />
                    </div>
                    <div>
                        <label
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--slate-500)',
                                marginBottom: '0.5rem',
                                display: 'block',
                                textTransform: 'uppercase',
                            }}
                        >
                            Server URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10,
                                color: 'white',
                                outline: 'none',
                                fontSize: '0.9rem',
                                fontFamily: 'monospace',
                            }}
                            placeholder={t('mcp.url_placeholder')}
                        />
                    </div>
                    {editing.id && (
                        <div>
                            <label
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-500)',
                                    marginBottom: '0.5rem',
                                    display: 'block',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Server ID
                            </label>
                            <div
                                style={{
                                    padding: '0.85rem 1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10,
                                    color: 'var(--slate-500)',
                                    fontSize: '0.85rem',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {editing.id}
                            </div>
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: '1.5rem 2rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.8rem 1.5rem',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            cursor: 'pointer',
                        }}
                    >
                        {t('mcp.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || !url.trim() || saving}
                        style={{
                            padding: '0.8rem 2rem',
                            borderRadius: 12,
                            fontWeight: 800,
                            background: 'linear-gradient(90deg, #a855f7, #9333ea)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            opacity: !name.trim() || !url.trim() || saving ? 0.5 : 1,
                        }}
                    >
                        {saving ? 'Saving...' : editing.id ? t('mcp.update') : t('mcp.add_server')}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
