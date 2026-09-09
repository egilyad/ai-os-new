import { useTranslation } from '../../i18n/useTranslation';
import { Sparkles } from 'lucide-react';
import { PromptOptimizer } from '../../kernel/services/prompt-optimizer';
import { eventBus, EVENTS } from '../../kernel/instances';
import type { AgentDetailPanelProps } from './AgentDetailPanelProps';

type Props = Pick<
    AgentDetailPanelProps,
    'agent' | 'availableRoles' | 'keys' | 'onUpdateAgent' | 'onApplyRoleToAgent'
>;

const AgentConfigTab: React.FC<Props> = ({
    agent,
    availableRoles,
    keys,
    onUpdateAgent,
    onApplyRoleToAgent,
}) => {
    const { t } = useTranslation();
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
                    Inference Provider
                </label>
                <select
                    id="agents-provider"
                    value={agent.model}
                    onChange={(e) => onUpdateAgent(agent.id, { model: e.target.value })}
                    className="agents-config-select"
                >
                    <option value="auto">Smart Router (Bandit Optimized)</option>
                    {keys
                        .filter((k) => k.status === 'active')
                        .flatMap((k) =>
                            (k.availableModels || []).map((m) => (
                                <option key={`${k.provider}-${m}`} value={`${k.provider}:${m}`}>
                                    {k.provider.toUpperCase()} - {m}
                                </option>
                            )),
                        )}
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
