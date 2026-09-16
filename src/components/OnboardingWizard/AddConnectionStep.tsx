import { Key, Globe } from 'lucide-react';
import type { TranslationKey } from '../../i18n/translations';

interface Props {
    t: (key: TranslationKey) => string;
    selectedProvider: string;
    setSelectedProvider: (v: string) => void;
    apiKey: string;
    setApiKey: (v: string) => void;
    error: string;
    setError: (v: string) => void;
}

const PROVIDERS = [
    { id: 'groq', label: 'Groq', color: '#f97316', desc: 'Fast inference, free tier' },
    { id: 'openrouter', label: 'OpenRouter', color: '#a855f7', desc: '100+ models, unified API' },
    { id: 'gemini', label: 'Google Gemini', color: '#4285f4', desc: 'Powerful reasoning' },
    { id: 'nvidia', label: 'NVIDIA NIM', color: '#76b900', desc: 'Enterprise-grade' },
];

const AddConnectionStep: React.FC<Props> = ({
    t,
    selectedProvider,
    setSelectedProvider,
    apiKey,
    setApiKey,
    error,
    setError,
}) => (
    <div>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                }}
            >
                <Key size={24} color="#3b82f6" />
            </div>
            <h2
                style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    margin: '0 0 0.35rem',
                    color: 'var(--text-primary)',
                }}
            >
                {t('onboarding.add_connection_title')}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                {t('onboarding.add_connection_subtitle')}
            </p>
        </div>

        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                marginBottom: '1rem',
            }}
        >
            {PROVIDERS.map((p) => (
                <button
                    key={p.id}
                    onClick={() => {
                        setSelectedProvider(p.id);
                        setError('');
                    }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.2rem',
                        padding: '0.65rem 0.75rem',
                        background:
                            selectedProvider === p.id ? `${p.color}20` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${selectedProvider === p.id ? p.color : 'var(--border-default)'}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: selectedProvider === p.id ? p.color : 'var(--text-primary)',
                        }}
                    >
                        {p.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.desc}</span>
                </button>
            ))}
        </div>

        <div>
            <label
                style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.4rem',
                }}
            >
                <Globe size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {t('onboarding.api_key_label')}
            </label>
            <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                    setApiKey(e.target.value);
                    setError('');
                }}
                placeholder={t('onboarding.api_key_placeholder')}
                style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
            />
            {error && (
                <p style={{ fontSize: '0.75rem', color: 'var(--error)', margin: '0.35rem 0 0' }}>
                    {error}
                </p>
            )}
        </div>

        <p
            style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginTop: '0.75rem',
                textAlign: 'center',
            }}
        >
            {t('onboarding.api_key_hint')}
        </p>
    </div>
);

export default AddConnectionStep;
