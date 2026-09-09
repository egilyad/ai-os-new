import { Shield, Key, Globe } from 'lucide-react';

interface ToolSecurityTabProps {
    t: (key: string) => string;
}

export const ToolSecurityTab: React.FC<ToolSecurityTabProps> = ({ t }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.25rem',
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                padding: '1.5rem',
                borderRadius: 16,
            }}
        >
            <Shield size={28} color="#ef4444" style={{ flexShrink: 0 }} aria-hidden="true" />
            <div>
                <h4
                    style={{
                        margin: '0 0 0.4rem 0',
                        fontSize: '1rem',
                        color: 'var(--error)',
                        fontWeight: 800,
                    }}
                >
                    {t('tools.security_heading')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.6 }}>
                    This tool runs in a strict sandboxed OS environment. File system access and
                    unapproved network calls are automatically intercepted and blocked by the event
                    bus kernel.
                </p>
            </div>
        </div>

        <div>
            <label
                style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--slate-500)',
                    textTransform: 'uppercase',
                    marginBottom: '1rem',
                    display: 'block',
                    letterSpacing: '0.05em',
                }}
            >
                {t('tools.secrets_label')}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '1rem 1.25rem',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Key size={16} color="#f59e0b" aria-hidden="true" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                            API_KEY_VAULT
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--success)',
                            background: 'rgba(16,185,129,0.15)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {t('common.active')}
                    </span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '1rem 1.25rem',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Globe size={16} color="#3b82f6" aria-hidden="true" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                            {t('tools.network_label')}
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--error)',
                            background: 'rgba(239,68,68,0.15)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {t('common.not_available')}
                    </span>
                </div>
            </div>
        </div>
    </div>
);
