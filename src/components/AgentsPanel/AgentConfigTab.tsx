import { useTranslation } from '../../i18n/useTranslation';
import { Sparkles } from 'lucide-react';
import { PromptOptimizer } from '../../kernel/services/prompt-optimizer';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useKeyStore } from '../../stores/useKeyStore';
import { PROVIDER_DEFAULT_MODELS } from '../../kernel/utils/provider-default-models';
import type { AgentDetailPanelProps } from './AgentDetailPanelProps';

type Props = Pick<
    AgentDetailPanelProps,
    'agent' | 'availableRoles' | 'keys' | 'onUpdateAgent' | 'onApplyRoleToAgent'
>;

// T1.4: model options from SSOT (old hardcoded llama-3.x IDs are EOL)
const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'auto', label: 'Auto (router)' },
    ...Object.entries(PROVIDER_DEFAULT_MODELS)
        .filter(([p]) => !['gemini_flash', 'gemini_pro'].includes(p))
        .map(([p, m]) => ({ value: m, label: `${m} (${p})` })),
];

const AgentConfigTab: React.FC<Props> = ({
    agent,
    availableRoles,
    onUpdateAgent,
    onApplyRoleToAgent,
}) => {
    const { t } = useTranslation();
    const storeKeys = useKeyStore((s) => s.keys);
    // Legacy migration: old select stored "provider:model" combined string in model
    const legacySplit = agent.model.includes(':') ? agent.model.split(':') : null;
    const effProvider =
        agent.providerId && agent.providerId !== 'Auto'
            ? agent.providerId
            : legacySplit
              ? legacySplit[0]!
              : 'auto';
    const effModel = legacySplit ? legacySplit.slice(1).join(':') : agent.model;
    const effKeyId = agent.keyId ?? 'auto';
    const providers = [...new Set(storeKeys.filter((k) => k.status === 'active').map((k) => k.provider))].sort();
    const providerKeys = effProvider === 'auto' ? [] : storeKeys.filter((k) => k.provider === effProvider && k.status === 'active');
    return (
        <>
            <div className="agents-config-grid">
                <div className="agents-config-field">
                    <label className="agents-config-label" htmlFor="agents-node-name">
                        Node Name
                    </label>
                    <input
                        id="agents-node-name"
                        type="text"
                        value={agent.name}
                        onChange={(e) => onUpdateAgent(agent.id, { label: e.target.value })}
                        className="agents-config-input"
                    />
                </div>
                <div className="agents-config-field">
                    <label className="agents-config-label" htmlFor="agents-behavior-blueprint">
                        Behavioral Blueprint
                    </label>
                    <select
                        id="agents-behavior-blueprint"
                        value={agent.roleId || ''}
                        onChange={(e) => onApplyRoleToAgent(agent.id, e.target.value)}
                        className="agents-config-select"
                    >
                        <option value="">Custom (Unlinked)</option>
                        {availableRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="agents-config-field agents-config-field--full">
                <label className="agents-config-label" htmlFor="agents-provider">
                    Inference Provider (rotation by default)
                </label>
                <select
                    id="agents-provider"
                    value={effProvider}
                    onChange={(e) => {
                        const p = e.target.value;
                        if (p === 'auto') {
                            // Back to rotation: clear pin, model back to auto
                            onUpdateAgent(agent.id, { provider: 'auto', keyId: undefined, model: 'auto' });
                        } else {
                            onUpdateAgent(agent.id, { provider: p });
                        }
                    }}
                    className="agents-config-select"
                >
                    <option value="auto">Auto (rotation)</option>
                    {providers.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
            </div>
            {effProvider !== 'auto' && (
                <div className="agents-config-field agents-config-field--full">
                    <label className="agents-config-label" htmlFor="agents-key">
                        Pinned Key (pool by default)
                    </label>
                    <select
                        id="agents-key"
                        value={effKeyId}
                        onChange={(e) =>
                            onUpdateAgent(agent.id, {
                                keyId: e.target.value === 'auto' ? undefined : e.target.value,
                            })
                        }
                        className="agents-config-select"
                    >
                        <option value="auto">Auto (pool)</option>
                        {providerKeys.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.label || k.id.slice(0, 12)}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <div className="agents-config-field agents-config-field--full">
                <label className="agents-config-label" htmlFor="agents-model">
                    Model
                </label>
                <select
                    id="agents-model"
                    value={MODEL_OPTIONS.some((o) => o.value === effModel) ? effModel : 'auto'}
                    onChange={(e) => onUpdateAgent(agent.id, { model: e.target.value })}
                    className="agents-config-select"
                >
                    {MODEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="agents-config-field agents-config-field--full">
                <label className="agents-config-label">
                    <span>Core Prompt Directives</span>
                    <span
                        className="agents-config-optimize"
                        onClick={() => {
                            const optimizer = new PromptOptimizer();
                            const suggestions = optimizer.analyze(agent.systemPrompt, agent.stats);
                            if (suggestions.length === 0) {
                                eventBus.emit(EVENTS.NOTIFICATION, {
                                    message: 'Prompt already optimized!',
                                    type: 'info',
                                });
                                return;
                            }
                            const chosen = suggestions
                                .map((s, i) => `${i + 1}. ${s.title}: ${s.description}`)
                                .join('\n');
                            const idx = parseInt(
                                prompt(
                                    `Optimization suggestions:\n\n${chosen}\n\nEnter number to apply (or Cancel to skip):`,
                                ) || '0',
                                10,
                            );
                            if (idx > 0 && idx <= suggestions.length) {
                                onUpdateAgent(agent.id, {
                                    prompt: suggestions[idx - 1]!.apply(agent.systemPrompt),
                                });
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <Sparkles size={12} /> Auto-Optimize
                    </span>
                </label>
                <textarea
                    rows={10}
                    value={agent.systemPrompt}
                    onChange={(e) => onUpdateAgent(agent.id, { prompt: e.target.value })}
                    className="agents-config-textarea"
                    aria-label={t('common.aria.system_prompt')}
                />
            </div>
        </>
    );
};

export default AgentConfigTab;
