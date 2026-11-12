import React, { useEffect, useState } from 'react';
import { listModelsForKey } from './assistant-model-utils';
import { input } from '../../styles/common';
import type { ApiKey } from '../../kernel/types/metrics-types';

interface AssistantModelSelectProps {
    keys: ApiKey[];
    keyId: string | null;
    modelId: string | null;
    onModelChange: (model: string | null) => void;
    disabled?: boolean;
    ariaLabel?: string;
}

/**
 * Model picker for the assistant. Shows the models of the currently selected
 * key; the chosen model is persisted with the assistant (both in the chat
 * panel and in the assistant admin).
 */
const AssistantModelSelect: React.FC<AssistantModelSelectProps> = ({
    keys,
    keyId,
    modelId,
    onModelChange,
    disabled,
    ariaLabel = 'Модель ассистента',
}) => {
    const key = keys.find((k) => k.id === keyId) ?? undefined;
    const [models, setModels] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setModels([]);
        if (!key) return;
        setLoading(true);
        void listModelsForKey(key).then((list) => {
            if (cancelled) return;
            setModels(list);
            setLoading(false);
            // If the pinned model no longer belongs to this key, drop it so
            // the assistant falls back to the key's default model.
            if (modelId && list.length > 0 && !list.includes(modelId)) {
                onModelChange(null);
            }
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyId, key?.availableModels?.join('|')]);

    return (
        <select
            value={modelId ?? ''}
            onChange={(e) => onModelChange(e.target.value || null)}
            disabled={disabled || loading || models.length === 0}
            aria-label={ariaLabel}
            title="Модель, через которую отвечает ассистент"
            style={{ ...input, minWidth: 260 }}
        >
            <option value="">
                {loading
                    ? 'Загрузка моделей…'
                    : models.length === 0
                      ? 'Авто — дефолтная модель ключа'
                      : 'Авто — дефолтная модель ключа'}
            </option>
            {models.map((m) => (
                <option key={m} value={m}>
                    {m}
                </option>
            ))}
        </select>
    );
};

export default AssistantModelSelect;
