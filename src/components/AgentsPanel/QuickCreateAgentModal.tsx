import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ModalShell } from '../ModalShell';
import { PROVIDER_DEFAULT_MODELS } from '../../kernel/utils/provider-default-models';
import type { ApiKey } from '../../types/metrics';

const AVATAR_OPTIONS = ['🧠', '🤖', '⚡', '🔧', '📊', '🛡️', '🎯', '💡', '🔬', '🎨', '📝', '🚀', '🧪', '🏗️', '🔍', '🌐'];

// T1.3: model options from SSOT (old hardcoded llama-3.x IDs are EOL)
const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'auto', label: 'Auto (router)' },
    ...Object.entries(PROVIDER_DEFAULT_MODELS)
        .filter(([p]) => !['gemini_flash', 'gemini_pro'].includes(p))
        .map(([p, m]) => ({ value: m, label: `${m} (${p})` })),
];

interface QuickCreateAgentModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; roleName: string; roleId?: string; model: string; provider?: string; keyId?: string; avatar: string }) => void;
    availableRoles: { id: string; name: string }[];
    keys?: ApiKey[];
}

export const QuickCreateAgentModal: React.FC<QuickCreateAgentModalProps> = ({ open, onClose, onCreate, availableRoles, keys = [] }) => {
    const [name, setName] = useState('New Autonomous Agent');
    const [roleName, setRoleName] = useState('General Assistant');
    const [roleId, setRoleId] = useState<string | undefined>(undefined);
    const [model, setModel] = useState('auto');
    // T1.3: rotation (default) vs pinned provider/key binding
    const [provider, setProvider] = useState('auto');
    const [keyId, setKeyId] = useState('auto');
    const [avatar, setAvatar] = useState('🧠');

    const handleRoleChange = (val: string) => {
        const found = availableRoles.find(r => r.name === val || r.id === val);
        if (found) {
            setRoleName(found.name);
            setRoleId(found.id);
        } else {
            setRoleName(val);
            setRoleId(undefined);
        }
    };

    const providers = [...new Set(keys.filter((k) => k.status === 'active').map((k) => k.provider))].sort();
    const providerKeys = provider === 'auto' ? [] : keys.filter((k) => k.provider === provider && k.status === 'active');

    const handleProviderChange = (val: string) => {
        setProvider(val);
        setKeyId('auto');
    };

    const handleCreate = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onCreate({
            name: trimmed,
            roleName: roleName.trim() || 'General Assistant',
            roleId,
            model,
            provider: provider === 'auto' ? undefined : provider,
            keyId: keyId === 'auto' ? undefined : keyId,
            avatar,
        });
        // reset for next open but keep values for UX
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <ModalShell open={open} onClose={handleClose} width={420}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-100, #f1f5f9)' }}>Create Agent</h3>
                <button onClick={handleClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>Name</span>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="New Autonomous Agent"
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-100)', fontSize: '0.9rem', outline: 'none' }}
                    />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>Role</span>
                    <select
                        value={roleName}
                        onChange={e => handleRoleChange(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-100)', fontSize: '0.9rem', outline: 'none' }}
                    >
                        <option value="General Assistant">General Assistant</option>
                        {availableRoles.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                    </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>Provider (rotation by default)</span>
                    <select
                        value={provider}
                        onChange={e => handleProviderChange(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-100)', fontSize: '0.9rem', outline: 'none' }}
                    >
                        <option value="auto">Auto (rotation)</option>
                        {providers.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </label>

                {provider !== 'auto' && (
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>Key (pinned to provider)</span>
                        <select
                            value={keyId}
                            onChange={e => setKeyId(e.target.value)}
                            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-100)', fontSize: '0.9rem', outline: 'none' }}
                        >
                            <option value="auto">Auto (pool)</option>
                            {providerKeys.map(k => (
                                <option key={k.id} value={k.id}>{k.label || k.id.slice(0, 12)}</option>
                            ))}
                        </select>
                    </label>
                )}

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>Model</span>
                    <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-100)', fontSize: '0.9rem', outline: 'none' }}
                    >
                        {MODEL_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>Avatar</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {AVATAR_OPTIONS.map(e => (
                            <button
                                key={e}
                                onClick={() => setAvatar(e)}
                                style={{
                                    width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.1rem',
                                    border: avatar === e ? '2px solid #8b5cf6' : '1px solid rgba(100,116,139,0.2)',
                                    background: avatar === e ? 'rgba(139,92,246,0.15)' : 'rgba(15,23,42,0.4)',
                                    cursor: 'pointer'
                                }}
                                aria-label={`Select avatar ${e}`}
                                aria-pressed={avatar === e}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button onClick={handleClose} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)', background: 'transparent', color: 'var(--slate-300)', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={!name.trim()} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: !name.trim() ? 'rgba(139,92,246,0.4)' : '#8b5cf6', color: 'white', fontWeight: 700, cursor: !name.trim() ? 'not-allowed' : 'pointer', opacity: !name.trim() ? 0.6 : 1 }}>
                        Create
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};

export default QuickCreateAgentModal;
