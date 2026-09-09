import { X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type {
    PolicyAction,
    PolicyType,
} from '../../kernel/services/debate-runtime/debate-policy-engine';
import { s } from './policy-editor-styles';
import { ACTION_TYPES, LOG_LEVELS, POLICY_TYPES, POLICY_TYPE_LABELS } from './policy-constants';

interface ActionEditorProps {
    action: PolicyAction;
    onChange: (a: PolicyAction) => void;
    onRemove: () => void;
}

const ActionEditor: React.FC<ActionEditorProps> = ({ action, onChange, onRemove }) => {
    const { t } = useTranslation();
    const setType = (type: string) => {
        switch (type) {
            case 'set_policy':
                onChange({ type: 'set_policy', policyType: 'max_rounds', value: 10 });
                break;
            case 'adjust_temperature':
                onChange({ type: 'adjust_temperature', delta: -0.1 });
                break;
            case 'reduce_rounds':
                onChange({ type: 'reduce_rounds', by: 2 });
                break;
            case 'skip_agent':
                onChange({ type: 'skip_agent', agentId: 'agent-name' });
                break;
            case 'inject_message':
                onChange({
                    type: 'inject_message',
                    target: 'agent-id',
                    content: 'Please consider...',
                });
                break;
            case 'pause':
                onChange({ type: 'pause' } as PolicyAction);
                break;
            case 'emit_event':
                onChange({ type: 'emit_event', eventName: 'debate:custom', payload: {} });
                break;
            case 'log':
                onChange({ type: 'log', level: 'warn', message: 'Policy triggered' });
                break;
            default:
                break;
        }
    };

    return (
        <div style={s.actionRow}>
            <select
                value={action.type}
                onChange={(e) => setType(e.target.value)}
                style={{ ...s.select, width: 110, fontSize: 10 }}
            >
                {ACTION_TYPES.map((at) => (
                    <option key={at.value} value={at.value}>
                        {at.label}
                    </option>
                ))}
            </select>
            {action.type === 'log' && (
                <>
                    <select
                        value={action.level}
                        onChange={(e) =>
                            onChange({
                                ...action,
                                level: e.target.value as 'info' | 'warn' | 'error',
                            })
                        }
                        style={{ ...s.select, width: 55, fontSize: 10 }}
                    >
                        {LOG_LEVELS.map((l) => (
                            <option key={l} value={l}>
                                {l}
                            </option>
                        ))}
                    </select>
                    <input
                        value={action.message}
                        onChange={(e) => onChange({ ...action, message: e.target.value })}
                        style={{ ...s.input, flex: 1, fontSize: 10 }}
                        placeholder="message"
                    />
                </>
            )}
            {action.type === 'set_policy' && (
                <>
                    <select
                        value={action.policyType}
                        onChange={(e) =>
                            onChange({ ...action, policyType: e.target.value as PolicyType })
                        }
                        style={{ ...s.select, width: 100, fontSize: 10 }}
                    >
                        {POLICY_TYPES.map((pt) => (
                            <option key={pt} value={pt}>
                                {POLICY_TYPE_LABELS[pt] || pt}
                            </option>
                        ))}
                    </select>
                    <input
                        value={String(action.value ?? '')}
                        onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            onChange({ ...action, value: isNaN(n) ? e.target.value : n });
                        }}
                        style={{ ...s.input, width: 60, fontSize: 10 }}
                        placeholder="value"
                    />
                </>
            )}
            {action.type === 'adjust_temperature' && (
                <input
                    type="number"
                    step={0.05}
                    value={action.delta}
                    onChange={(e) => onChange({ ...action, delta: Number(e.target.value) })}
                    style={{ ...s.input, width: 60, fontSize: 10 }}
                />
            )}
            {action.type === 'reduce_rounds' && (
                <input
                    type="number"
                    min={1}
                    value={action.by}
                    onChange={(e) => onChange({ ...action, by: Number(e.target.value) })}
                    style={{ ...s.input, width: 50, fontSize: 10 }}
                />
            )}
            {action.type === 'skip_agent' && (
                <input
                    value={action.agentId}
                    onChange={(e) => onChange({ ...action, agentId: e.target.value })}
                    style={{ ...s.input, width: 100, fontSize: 10 }}
                    placeholder="agent ID"
                />
            )}
            {action.type === 'inject_message' && (
                <>
                    <input
                        value={action.target}
                        onChange={(e) => onChange({ ...action, target: e.target.value })}
                        style={{ ...s.input, width: 80, fontSize: 10 }}
                        placeholder="target"
                    />
                    <input
                        value={action.content}
                        onChange={(e) => onChange({ ...action, content: e.target.value })}
                        style={{ ...s.input, flex: 1, fontSize: 10 }}
                        placeholder="message"
                    />
                </>
            )}
            {action.type === 'emit_event' && (
                <input
                    value={action.eventName}
                    onChange={(e) => onChange({ ...action, eventName: e.target.value })}
                    style={{ ...s.input, width: 120, fontSize: 10 }}
                    placeholder="event name"
                />
            )}
            {action.type === 'pause' && (
                <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>(no config needed)</span>
            )}
            <button onClick={onRemove} style={s.iconBtn} aria-label={t('common.aria.delete')}>
                <X size={12} />
            </button>
        </div>
    );
};

export default ActionEditor;
