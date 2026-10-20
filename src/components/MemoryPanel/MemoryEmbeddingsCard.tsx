import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { CONFIG, configService, memoryService } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';

const PROVIDERS = [
    'openai',
    'openrouter',
    'nvidia',
    'together',
    'deepinfra',
    'siliconflow',
    'gemini',
    'ollama',
];

const DEFAULT_MODEL = 'text-embedding-3-small';

const MemoryEmbeddingsCard: React.FC = () => {
    const { t } = useTranslation();
    const current = CONFIG?.services?.memory?.providerEmbeddings;
    const [enabled, setEnabled] = useState(!!current?.enabled);
    const [provider, setProvider] = useState(current?.provider || 'openai');
    const [model, setModel] = useState(current?.model || DEFAULT_MODEL);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const persist = async (next: {
        enabled: boolean;
        provider: string;
        model: string;
    }): Promise<void> => {
        const services = CONFIG.services;
        await configService.updateServices({
            memory: {
                ...services.memory,
                providerEmbeddings: {
                    ...services.memory.providerEmbeddings,
                    ...next,
                },
            },
        });
    };

    const handleToggle = async (value: boolean): Promise<void> => {
        setEnabled(value);
        setStatus(null);
        await persist({ enabled: value, provider, model });
    };

    const handleProvider = async (value: string): Promise<void> => {
        setProvider(value);
        setStatus(null);
        await persist({ enabled, provider: value, model });
    };

    const handleModel = async (value: string): Promise<void> => {
        setModel(value);
        setStatus(null);
        await persist({ enabled, provider, model: value });
    };

    const handleReembed = async (): Promise<void> => {
        setBusy(true);
        setStatus(null);
        try {
            const result = await memoryService.backfillProviderEmbeddings?.();
            setStatus(
                !result || result.failed
                    ? t('memory.embeddings_unavailable')
                    : t('memory.embeddings_reembedded').replace('{0}', String(result.embedded)),
            );
        } catch (e) {
            setStatus(
                t('memory.embeddings_failed').replace(
                    '{0}',
                    e instanceof Error ? e.message : String(e),
                ),
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            style={{
                padding: '1.25rem',
                marginBottom: '1rem',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Sparkles size={18} color="#a78bfa" aria-hidden="true" />
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                            {t('memory.embeddings_title')}
                        </div>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--slate-400)',
                                marginTop: '0.2rem',
                            }}
                        >
                            {t('memory.embeddings_description')}
                        </div>
                    </div>
                </div>
                <button
                    role="switch"
                    aria-checked={enabled}
                    aria-label={t('memory.embeddings_title')}
                    onClick={() => void handleToggle(!enabled)}
                    style={{
                        width: 48,
                        height: 26,
                        borderRadius: 13,
                        position: 'relative',
                        background: enabled ? '#a78bfa' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'white',
                            position: 'absolute',
                            top: 3,
                            left: enabled ? 25 : 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    />
                </button>
            </div>

            {enabled && (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginTop: '1rem',
                    }}
                >
                    <select
                        value={provider}
                        onChange={(e) => void handleProvider(e.target.value)}
                        aria-label={t('memory.embeddings_provider')}
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: 8,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            fontSize: '0.78rem',
                        }}
                    >
                        {PROVIDERS.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        onBlur={(e) => void handleModel(e.target.value)}
                        aria-label={t('memory.embeddings_model')}
                        placeholder={DEFAULT_MODEL}
                        style={{
                            flex: '1 1 200px',
                            minWidth: 160,
                            padding: '0.4rem 0.6rem',
                            borderRadius: 8,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            fontSize: '0.78rem',
                        }}
                    />
                    <button
                        onClick={() => void handleReembed()}
                        disabled={busy}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.45rem 0.8rem',
                            borderRadius: 8,
                            border: '1px solid rgba(167,139,250,0.35)',
                            background: 'rgba(167,139,250,0.12)',
                            color: '#a78bfa',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: busy ? 'wait' : 'pointer',
                            opacity: busy ? 0.6 : 1,
                        }}
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        {t('memory.embeddings_reembed')}
                    </button>
                </div>
            )}

            {status && (
                <div
                    role="status"
                    style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.75rem' }}
                >
                    {status}
                </div>
            )}
        </div>
    );
};

export default MemoryEmbeddingsCard;
