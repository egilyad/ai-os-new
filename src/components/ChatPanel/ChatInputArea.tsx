import React, { useState, useCallback } from 'react';
import { Send, Square, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKeyList } from '../../stores/useKeyStore';
import { useChatStore } from '../../stores/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';
import { VoiceButton } from './VoiceButton';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { DEFAULT_MODELS, formatContextWindow } from './chat-panel-utils';
import { getCatalogContextWindow, getCatalogPricing } from '../../llm/catalog/catalog-lookup';

interface Props {
    selectedKeys: string[];
    selectedModel: string;
    selectedModelPerKey: Record<string, string>;
    onSend: (text: string) => Promise<void> | void;
    isSending: boolean;
    onError: (msg: string) => void;
    onKeysChange: (keys: string[]) => void;
    onModelChange: (model: string) => void;
    onSelectedModelsChange: (models: Record<string, string>) => void;
}

const ChatInputArea: React.FC<Props> = ({
    selectedKeys,
    selectedModel: _selectedModel,
    selectedModelPerKey,
    onSend,
    isSending,
    onError,
    onKeysChange,
    onModelChange,
    onSelectedModelsChange,
}) => {
    const { t } = useTranslation();
    const { activeKeys } = useKeyList();
    const cancelSending = useChatStore((s) => s.cancelSending);
    const navigate = useNavigate();

    const [input, setInput] = useState('');

    // M-07: clear optimistically but restore the text if the send is rejected
    // (e.g. write-through persist failure) instead of losing it silently.
    const doSend = useCallback(
        (text: string) => {
            setInput('');
            void Promise.resolve()
                .then(() => onSend(text))
                .catch((e: unknown) => {
                    setInput(text);
                    onError(e instanceof Error ? e.message : 'Failed to send message');
                });
        },
        [onSend, onError],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            // W7-UNI-007: don't submit while an IME composition is in progress.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                const text = input.trim();
                if (!text) return;
                doSend(text);
            }
        },
        [input, doSend],
    );

    const handleSendClick = useCallback(() => {
        const text = input.trim();
        if (!text) return;
        doSend(text);
    }, [input, doSend]);

    return (
        <div
            style={{
                borderTop: '1px solid var(--border)',
                padding: '1rem 1.25rem',
                background: 'var(--bg-panel)',
            }}
        >
            {/* Key pills */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.35rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem',
                }}
            >
                {activeKeys.map((k) => {
                    const isSelected = selectedKeys.includes(k.id);
                    return (
                        <button
                            key={k.id}
                            onClick={() => {
                                const next = isSelected
                                    ? selectedKeys.filter((id) => id !== k.id)
                                    : [...selectedKeys, k.id];
                                onKeysChange(next);
                                if (!isSelected && !selectedModelPerKey[k.id]) {
                                    const defaultModel =
                                        k.availableModels?.[0] || DEFAULT_MODELS[k.provider] || '';
                                    onSelectedModelsChange({
                                        ...selectedModelPerKey,
                                        [k.id]: defaultModel,
                                    });
                                    onModelChange(defaultModel);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.3rem 0.65rem',
                                borderRadius: 100,
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: isSelected
                                    ? 'rgba(59,130,246,0.08)'
                                    : 'rgba(255,255,255,0.03)',
                                border: isSelected
                                    ? '1px solid rgba(59,130,246,0.2)'
                                    : '1px solid var(--border)',
                                color: isSelected ? '#3b82f6' : 'var(--text-muted)',
                                transition: 'all 0.15s',
                            }}
                        >
                            <ProviderIcon provider={k.provider} size={12} />
                            {k.label}
                        </button>
                    );
                })}
            </div>

            {/* Model selector per key */}
            {selectedKeys.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.75rem',
                    }}
                >
                    {selectedKeys.map((kid) => {
                        const k = activeKeys.find((ak) => ak.id === kid);
                        if (!k) return null;
                        const models = k.availableModels || [];
                        const currentModel = selectedModelPerKey[k.id] || '';
                        return (
                            <div
                                key={kid}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{k.label}:</span>
                                <select
                                    value={currentModel}
                                    onChange={(e) => {
                                        const m = e.target.value;
                                        onSelectedModelsChange({
                                            ...selectedModelPerKey,
                                            [k.id]: m,
                                        });
                                        onModelChange(m);
                                    }}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 6,
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-main)',
                                        fontSize: '0.7rem',
                                        outline: 'none',
                                    }}
                                >
                                    {models.length > 0 ? (
                                        models.map((m) => {
                                            const context = getCatalogContextWindow(m);
                                            const pricing = getCatalogPricing(m);
                                            const suffix = context
                                                ? ` — ${formatContextWindow(context)}${
                                                      pricing
                                                          ? ` · $${pricing.input.toFixed(
                                                                pricing.input < 1 ? 3 : 2,
                                                            )}/$${pricing.output.toFixed(
                                                                pricing.output < 1 ? 3 : 2,
                                                            )}`
                                                          : ''
                                                  }`
                                                : '';
                                            return (
                                                <option key={m} value={m}>
                                                    {m}
                                                    {suffix}
                                                </option>
                                            );
                                        })
                                    ) : (
                                        <option value="">{t('chat.no_models')}</option>
                                    )}
                                </select>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Zero-keys dead end: point at Providers instead of a disabled box */}
            {activeKeys.length === 0 && (
                <button
                    type="button"
                    onClick={() => navigate('/keys')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        padding: '0.55rem 0.9rem',
                        borderRadius: 10,
                        border: '1px dashed rgba(59,130,246,0.4)',
                        background: 'rgba(59,130,246,0.07)',
                        color: '#60a5fa',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                        justifyContent: 'center',
                    }}
                >
                    <KeyRound size={14} aria-hidden="true" />
                    {t('chat.add_provider_key')}
                </button>
            )}

            {/* Textarea + Send */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                        value={input}
                        aria-label={t('chat.placeholder')}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={8000}
                        placeholder={
                            selectedKeys.length === 0
                                ? t('chat.no_keys_selected')
                                : isSending
                                  ? t('chat.sending')
                                  : t('chat.placeholder')
                        }
                        rows={2}
                        disabled={isSending || selectedKeys.length === 0}
                        style={{
                            width: '100%',
                            padding: '0.85rem 1rem',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            resize: 'none',
                            fontSize: '0.95rem',
                            lineHeight: 1.5,
                            color: 'var(--text-main)',
                            outline: 'none',
                            fontFamily: 'inherit',
                        }}
                    />
                    <VoiceButton onTranscript={setInput} onError={onError} />
                </div>
                {isSending ? (
                    <button
                        onClick={cancelSending}
                        className="btn-secondary"
                        style={{
                            padding: '0.85rem 1.25rem',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Square size={16} aria-hidden="true" />
                        {t('chat.stop')}
                    </button>
                ) : (
                    <button
                        onClick={handleSendClick}
                        className="btn-primary"
                        style={{
                            padding: '0.85rem 1.25rem',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                        disabled={!input.trim() || selectedKeys.length === 0}
                    >
                        <Send size={16} aria-hidden="true" />
                        {t('chat.send')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatInputArea;
