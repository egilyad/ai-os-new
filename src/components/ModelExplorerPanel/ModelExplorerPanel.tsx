import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Key, MessageSquare, RefreshCw } from 'lucide-react';
import { keyService } from '../../kernel/instances';
import { useKeyList } from '../../stores/useKeyStore';
import type { ApiKey } from '../../kernel/types/metrics-types';
import { MODELS_CATALOG } from '../../llm/catalog/models-catalog-detail';
import PanelLoader from '../PanelLoader';
import { input } from '../../styles/common';

interface CatalogModel {
    id: string;
    provider: string;
    model: string;
    name: string;
    context: number;
    maxOutput?: number;
    input?: number;
    output?: number;
    reasoning?: boolean;
    toolCall?: boolean;
    vision?: boolean;
    deprecated?: boolean;
}

const PROVIDER_TO_CATALOG: Record<string, string[]> = {
    OpenRouter: ['openrouter'],
    OpenAI: ['openai'],
    Gemini: ['google', 'gemini'],
    Groq: ['groq'],
    NVIDIA: ['nvidia'],
    Mistral: ['mistral'],
    Together: ['togetherai'],
    DeepSeek: ['deepseek'],
    Cohere: ['cohere'],
    Cerebras: ['cerebras'],
    Anthropic: ['anthropic'],
    xAI: ['xai'],
    ZhipuAI: ['zhipuai'],
    Moonshot: ['moonshotai'],
    Alibaba: ['alibaba'],
    Meta: ['meta'],
    Minimax: ['minimax'],
    Perplexity: ['perplexity'],
    Qwen: ['alibaba', 'qwen'],
};

function catalogProvidersForKey(key: ApiKey): string[] {
    const direct = PROVIDER_TO_CATALOG[key.provider];
    if (direct && direct.length) return direct;
    const norm = key.provider.toLowerCase();
    const matches = new Set<string>();
    for (const m of MODELS_CATALOG) {
        if (m.provider.includes(norm)) matches.add(m.provider);
    }
    return matches.size ? [...matches] : [];
}

function formatContext(value: number): string {
    if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(value);
}

function formatPrice(value: number | undefined): string {
    if (value === undefined) return '—';
    return `$${value.toFixed(value < 1 ? 3 : 2)}`;
}

const ModelExplorerContent: React.FC = () => {
    const { keys } = useKeyList();
    const navigate = useNavigate();
    const [selectedKeyId, setSelectedKeyId] = useState<string>('');
    const [refreshTick, setRefreshTick] = useState(0);

    const allKeys = useMemo(() => {
        void refreshTick;
        try {
            return keys.length ? keys : keyService.getKeys();
        } catch {
            return keys;
        }
    }, [keys, refreshTick]);

    const selectedKey = useMemo(
        () => allKeys.find((k) => k.id === selectedKeyId) ?? allKeys[0],
        [allKeys, selectedKeyId],
    );

    const catalogModels = useMemo<CatalogModel[]>(() => {
        if (!selectedKey) return [];
        const providers = catalogProvidersForKey(selectedKey);
        if (!providers.length) return [];
        return MODELS_CATALOG.filter((m) => providers.includes(m.provider) && !m.deprecated).sort(
            (a, b) => a.name.localeCompare(b.name),
        );
    }, [selectedKey]);

    const refreshModels = async () => {
        if (!selectedKey) return;
        try {
            await keyService.refreshModels(selectedKey.id);
            setRefreshTick((x) => x + 1);
        } catch {
            /* best-effort */
        }
    };

    const openChat = (model: CatalogModel | string) => {
        if (!selectedKey) return;
        const modelId = typeof model === 'string' ? model : model.model;
        const providerId = typeof model === 'string' ? '' : model.provider;
        navigate(
            `/chat?model=${encodeURIComponent(modelId)}&keyId=${encodeURIComponent(selectedKey.id)}&provider=${encodeURIComponent(providerId)}`,
        );
    };

    const keyLabel = (k: ApiKey) => k.label || `${k.provider} — Key ${k.id.slice(0, 4)}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* ВЫБОР API-КЛЮЧА */}
            <section>
                <h2
                    style={{
                        margin: '0 0 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                    }}
                >
                    <Key
                        size={13}
                        aria-hidden="true"
                        style={{ verticalAlign: -2, marginRight: 6 }}
                    />
                    Выбор API-ключа
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                        value={selectedKey?.id ?? ''}
                        onChange={(e) => setSelectedKeyId(e.target.value)}
                        aria-label="Выбор API-ключа"
                        style={{
                            ...input,
                            minWidth: 320,
                            flex: 1,
                        }}
                    >
                        {allKeys.length === 0 && <option value="">Нет подключённых ключей</option>}
                        {allKeys.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.provider} — {keyLabel(k)}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => void refreshModels()}
                        title="Обновить модели ключа (из провайдера)"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.45rem 0.85rem',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-main)',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                        }}
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        Обновить модели
                    </button>
                </div>
            </section>

            {/* ПОДКЛЮЧЁННЫЕ КЛЮЧИ */}
            <section>
                <h2
                    style={{
                        margin: '0 0 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                    }}
                >
                    Подключённые ключи
                </h2>
                {allKeys.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Ключи не добавлены. Откройте «Providers» и добавьте первый ключ.
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '0.6rem',
                        }}
                    >
                        {allKeys.map((k) => {
                            const active = k.id === selectedKey?.id;
                            return (
                                <button
                                    key={k.id}
                                    onClick={() => setSelectedKeyId(k.id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '0.7rem 0.9rem',
                                        borderRadius: 10,
                                        border: active
                                            ? '1px solid var(--accent)'
                                            : '1px solid var(--border)',
                                        background: active
                                            ? 'rgba(167,139,250,0.10)'
                                            : 'rgba(0,0,0,0.20)',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 2 }}>
                                        {k.provider}
                                    </div>
                                    <div
                                        style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}
                                    >
                                        {keyLabel(k)} · {k.status}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* МОДЕЛИ ЭТОГО КЛЮЧА */}
            <section>
                <h2
                    style={{
                        margin: '0 0 0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                    }}
                >
                    <Brain
                        size={13}
                        aria-hidden="true"
                        style={{ verticalAlign: -2, marginRight: 6 }}
                    />
                    Модели этого ключа
                    {selectedKey && (
                        <span style={{ color: 'var(--accent)', marginLeft: 6 }}>
                            — {selectedKey.provider} ({keyLabel(selectedKey)})
                        </span>
                    )}
                </h2>

                {!selectedKey ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Выберите ключ, чтобы увидеть его модели.
                    </div>
                ) : catalogModels.length > 0 ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '0.6rem',
                        }}
                    >
                        {catalogModels.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => openChat(m)}
                                title={`Открыть чат: ${m.name} (${m.model})`}
                                style={{
                                    textAlign: 'left',
                                    padding: '0.7rem 0.9rem',
                                    borderRadius: 10,
                                    border: '1px solid var(--border)',
                                    background: 'rgba(0,0,0,0.20)',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontWeight: 700 }}>{m.name}</span>
                                    <MessageSquare
                                        size={12}
                                        color="var(--accent)"
                                        aria-hidden="true"
                                        style={{ marginLeft: 'auto', flexShrink: 0 }}
                                    />
                                </div>
                                <div
                                    style={{
                                        color: 'var(--text-muted)',
                                        fontSize: '0.7rem',
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    {m.model}
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        fontSize: '0.68rem',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    <span>ctx {formatContext(m.context)}</span>
                                    <span>in {formatPrice(m.input)}</span>
                                    <span>out {formatPrice(m.output)}</span>
                                    {m.reasoning && <span title="Reasoning">🧠</span>}
                                    {m.toolCall && <span title="Tool calling">🔧</span>}
                                    {m.vision && <span title="Vision">👁</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Для {selectedKey.provider} нет записей в каталоге моделей.
                        {selectedKey.availableModels?.length ? (
                            <>
                                {' '}
                                Доступные модели провайдера:{' '}
                                {selectedKey.availableModels.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => openChat(m)}
                                        style={{
                                            margin: '2px 4px 2px 0',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 6,
                                            border: '1px solid var(--border)',
                                            background: 'transparent',
                                            color: 'var(--text-main)',
                                            fontSize: '0.7rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </>
                        ) : (
                            ' Нажмите «Обновить модели», чтобы загрузить их из провайдера.'
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

const ModelExplorerPanel: React.FC = () => (
    <PanelLoader>
        <ModelExplorerContent />
    </PanelLoader>
);

export default ModelExplorerPanel;
