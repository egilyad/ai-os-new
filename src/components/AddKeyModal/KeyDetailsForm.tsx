import { HelpCircle, Upload, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface KeyDetailsFormProps {
    label: string;
    setLabel: (v: string) => void;
    group: string;
    setGroup: (v: string) => void;
    account: string;
    setAccount: (v: string) => void;
    apiKey: string;
    setApiKey: (v: string) => void;
    showKey: boolean;
    setShowKey: (v: boolean) => void;
    error: string;
    loading: boolean;
    onBack: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onSaveClose: (e: React.MouseEvent) => void;
    onBulkMode: () => void;
    docsUrl: string | null | undefined;
    onDocsClick: (e: React.MouseEvent) => void;
}

function detectProvider(apiKey: string): string | null {
    if (!apiKey.trim()) return null;
    const patterns: [string, RegExp][] = [
        ['gemini', /^AIza/],
        ['groq', /^gsk_/],
        ['anthropic', /^sk-ant-/],
        ['nvidia', /^nvapi-/],
        ['huggingface', /^hf_/],
        ['openrouter', /^sk-or-/],
        ['fireworks', /^fw_/],
        ['deepseek', /^sk-[a-f0-9]{32}$/],
        ['github', /^ghp_/],
        ['openai', /^sk-(proj-)?[A-Za-z0-9_-]{20,}/],
        ['cerebras', /^cerebras_/],
        ['cloudflare', /^[a-f0-9]{32}:[A-Za-z0-9_-]{40,}$/],
    ];
    for (const [provider, regex] of patterns) {
        if (regex.test(apiKey.trim())) return provider;
    }
    return null;
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const KeyDetailsForm: React.FC<KeyDetailsFormProps> = ({
    label,
    setLabel,
    group,
    setGroup,
    account,
    setAccount,
    apiKey,
    setApiKey,
    showKey,
    setShowKey,
    error,
    loading,
    onBack,
    onSubmit,
    onSaveClose,
    onBulkMode,
    docsUrl,
    onDocsClick,
}) => {
    const { t } = useTranslation();

    return (
        <form onSubmit={onSubmit} className="modal-form" noValidate>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '0.5rem',
                }}
            >
                <button
                    type="button"
                    onClick={onBulkMode}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <Upload size={14} /> {t('add_key.bulk_import')}
                </button>
            </div>
            <div>
                <label className="modal-field-label" htmlFor="connectionName">
                    {t('add_key.name_label')}
                </label>
                <input
                    id="connectionName"
                    type="text"
                    autoFocus
                    value={label}
                    onChange={(e) => setLabel(e.target.value.normalize('NFC'))}
                    placeholder={t('add_key.name_placeholder')}
                    className="modal-input"
                    aria-label="Connection name"
                    aria-invalid={error && error.includes('Label') ? 'true' : undefined}
                    aria-describedby={error ? 'key-error' : undefined}
                />
                <p className="modal-input-hint">{t('add_key.name_hint')}</p>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                }}
            >
                <div>
                    <label className="modal-field-label" htmlFor="keyGroup">
                        Group
                    </label>
                    <input
                        id="keyGroup"
                        type="text"
                        value={group}
                        onChange={(e) => setGroup(e.target.value.normalize('NFC'))}
                        placeholder="e.g. Personal, Work, Client-A"
                        className="modal-input"
                        aria-label="Key group"
                    />
                </div>
                <div>
                    <label className="modal-field-label" htmlFor="keyAccount">
                        Account
                    </label>
                    <input
                        id="keyAccount"
                        type="text"
                        value={account}
                        onChange={(e) => setAccount(e.target.value.normalize('NFC'))}
                        placeholder="e.g. alice@gmail.com"
                        className="modal-input"
                        aria-label="Account identifier"
                    />
                </div>
            </div>
            <div>
                <div className="modal-field-row">
                    <label className="modal-field-label" htmlFor="apiKey">
                        {t('add_key.key_label')}
                    </label>
                    {docsUrl && (
                        <a
                            href="#"
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                            }}
                            onClick={onDocsClick}
                            aria-label="Open documentation to find API key"
                        >
                            <HelpCircle size={12} aria-hidden="true" /> {t('add_key.key_help')}
                        </a>
                    )}
                </div>
                <div style={{ position: 'relative' }}>
                    <input
                        id="apiKey"
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value.normalize('NFC'))}
                        placeholder={t('add_key.key_placeholder')}
                        className="modal-input modal-input--mono"
                        aria-label="API key"
                        aria-invalid={error && error.includes('API key') ? 'true' : undefined}
                        aria-describedby={error ? 'key-error' : undefined}
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                        }}
                        aria-label={showKey ? t('add_key.hide_aria') : t('add_key.show_aria')}
                    >
                        {showKey ? (
                            <EyeOff size={18} aria-hidden="true" />
                        ) : (
                            <Eye size={18} aria-hidden="true" />
                        )}
                    </button>
                </div>
                {apiKey.length > 0 &&
                    (() => {
                        const provider = detectProvider(apiKey);
                        const isValidFormat = provider !== null;
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginTop: '0.4rem',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        background: isValidFormat
                                            ? 'rgba(16,185,129,0.12)'
                                            : 'rgba(239,68,68,0.12)',
                                        color: isValidFormat ? '#10b981' : '#ef4444',
                                    }}
                                >
                                    {isValidFormat
                                        ? `Detected: ${capitalize(provider)}`
                                        : 'Unexpected format'}
                                </span>
                                {isValidFormat ? (
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        ✓ Valid format
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        Unrecognized key prefix
                                    </span>
                                )}
                            </div>
                        );
                    })()}
            </div>

            {error && (
                <div id="key-error" className="modal-error" role="alert" aria-live="polite">
                    {error}
                </div>
            )}

            <div className="modal-actions">
                <button
                    type="button"
                    onClick={onBack}
                    className="btn-secondary"
                    style={{ padding: '0.75rem 1.25rem' }}
                    disabled={loading}
                >
                    {t('add_key.back')}
                </button>
                <button
                    type="button"
                    onClick={onSaveClose}
                    className="btn-secondary"
                    style={{
                        padding: '0.75rem 1.25rem',
                        color: 'var(--success)',
                        borderColor: 'rgba(16,185,129,0.3)',
                    }}
                    disabled={loading}
                >
                    {t('add_key.save_close')}
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    style={{
                        flex: 1,
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                    }}
                    disabled={loading}
                >
                    {loading ? <Loader2 size={18} className="spinning" aria-hidden="true" /> : null}
                    {loading ? t('add_key.verifying') : t('add_key.add')}
                </button>
            </div>
        </form>
    );
};

export default KeyDetailsForm;
