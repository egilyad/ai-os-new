import { X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type {
    PolicyCondition,
    DebatePhase,
} from '../../kernel/services/debate-runtime/debate-policy-engine';
import { s } from './policy-editor-styles';
import {
    CONDITION_TYPES,
    PHASES,
    PRESSURE_LEVELS,
    POLICY_TYPES,
    POLICY_TYPE_LABELS,
} from './policy-constants';
import { createDefaultCondition } from './policy-utils';

interface ConditionEditorProps {
    condition: PolicyCondition;
    onChange: (c: PolicyCondition) => void;
    onRemove?: () => void;
    depth?: number;
}

const ConditionEditor: React.FC<ConditionEditorProps> = ({
    condition,
    onChange,
    onRemove,
    depth = 0,
}) => {
    const { t } = useTranslation();
    const isLogical = condition.type === 'and' || condition.type === 'or';
    const isNot = condition.type === 'not';
    const showValue = !isLogical;
    const showValues = condition.type === 'phase_is' || condition.type === 'policy_equals';
    const setType = (type: string) => {
        switch (type) {
            case 'and':
                onChange({
                    type: 'and',
                    conditions: [createDefaultCondition(), createDefaultCondition()],
                });
                break;
            case 'or':
                onChange({
                    type: 'or',
                    conditions: [createDefaultCondition(), createDefaultCondition()],
                });
                break;
            case 'not':
                onChange({ type: 'not', condition: createDefaultCondition() });
                break;
            case 'phase_is':
                onChange({ type: 'phase_is', value: 'active' });
                break;
            case 'phase_in':
                onChange({ type: 'phase_in', values: ['active', 'deliberating'] });
                break;
            case 'round_gt':
                onChange({ type: 'round_gt', value: 2 });
                break;
            case 'round_lt':
                onChange({ type: 'round_lt', value: 5 });
                break;
            case 'round_eq':
                onChange({ type: 'round_eq', value: 3 });
                break;
            case 'tokens_gt':
                onChange({ type: 'tokens_gt', value: 10000 });
                break;
            case 'tokens_lt':
                onChange({ type: 'tokens_lt', value: 100000 });
                break;
            case 'cost_gt':
                onChange({ type: 'cost_gt', value: 0.05 });
                break;
            case 'agent_error_rate_gt':
                onChange({ type: 'agent_error_rate_gt', value: 0.5 });
                break;
            case 'confidence_lt':
                onChange({ type: 'confidence_lt', value: 0.3 });
                break;
            case 'pressure_is':
                onChange({ type: 'pressure_is', value: 'high' });
                break;
            case 'policy_equals':
                onChange({ type: 'policy_equals', policyType: 'max_rounds', value: 'active' });
                break;
            default:
                break;
        }
    };

    return (
        <div style={{ ...s.conditionBlock, marginLeft: depth * 16 }}>
            <div style={s.row}>
                <select
                    value={condition.type}
                    onChange={(e) => setType(e.target.value)}
                    style={{ ...s.select, width: 120, fontSize: 10 }}
                >
                    {CONDITION_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                            {ct.label}
                        </option>
                    ))}
                </select>
                {showValue &&
                    (condition.type as string) !== 'not' &&
                    (condition.type === 'pressure_is' ? (
                        <select
                            value={String((condition as { value: string }).value)}
                            onChange={(e) =>
                                onChange({ ...condition, value: e.target.value } as PolicyCondition)
                            }
                            style={{ ...s.select, width: 80, fontSize: 10 }}
                        >
                            {PRESSURE_LEVELS.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    ) : condition.type === 'policy_equals' ? (
                        <>
                            <select
                                value={(condition as { policyType: string }).policyType}
                                onChange={(e) =>
                                    onChange({
                                        ...condition,
                                        policyType: e.target.value,
                                    } as PolicyCondition)
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
                                type="text"
                                value={String((condition as { value: unknown }).value ?? '')}
                                onChange={(e) => {
                                    const n = parseFloat(e.target.value);
                                    onChange({
                                        ...condition,
                                        value: isNaN(n) ? e.target.value : n,
                                    } as PolicyCondition);
                                }}
                                style={{ ...s.input, width: 60, fontSize: 10 }}
                                placeholder="value"
                            />
                        </>
                    ) : condition.type === 'phase_is' ? (
                        <select
                            value={(condition as { value: DebatePhase }).value}
                            onChange={(e) =>
                                onChange({ ...condition, value: e.target.value } as PolicyCondition)
                            }
                            style={{ ...s.select, width: 100, fontSize: 10 }}
                        >
                            {PHASES.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="number"
                            step="any"
                            value={Number((condition as { value: number }).value)}
                            onChange={(e) =>
                                onChange({
                                    ...condition,
                                    value: Number(e.target.value),
                                } as PolicyCondition)
                            }
                            style={{ ...s.input, width: 70, fontSize: 10 }}
                        />
                    ))}
                {showValues && (
                    <input
                        type="text"
                        value={(condition as unknown as { values: string[] }).values.join(', ')}
                        onChange={(e) =>
                            onChange({
                                ...condition,
                                values: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                            } as unknown as PolicyCondition)
                        }
                        style={{ ...s.input, width: 140, fontSize: 10 }}
                        placeholder="phase1, phase2"
                    />
                )}
                {onRemove && (
                    <button
                        onClick={onRemove}
                        style={s.iconBtn}
                        aria-label={t('common.aria.delete')}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
            {isLogical &&
                (condition as { conditions: PolicyCondition[] }).conditions.map((sub, i) => (
                    <ConditionEditor
                        key={`${sub.type}-${i}`}
                        condition={sub}
                        depth={depth + 1}
                        onChange={(c) => {
                            const cc = {
                                ...condition,
                                conditions: [
                                    ...(condition as { conditions: PolicyCondition[] }).conditions,
                                ],
                            };
                            cc.conditions[i] = c;
                            onChange(cc);
                        }}
                        onRemove={() => {
                            const cc = {
                                ...condition,
                                conditions: (
                                    condition as { conditions: PolicyCondition[] }
                                ).conditions.filter((_, j) => j !== i),
                            };
                            onChange(cc);
                        }}
                    />
                ))}
            {isLogical && (
                <button
                    onClick={() => {
                        const cc = {
                            ...condition,
                            conditions: [
                                ...(condition as { conditions: PolicyCondition[] }).conditions,
                                createDefaultCondition(),
                            ],
                        };
                        onChange(cc);
                    }}
                    style={s.addBtn}
                >
                    + Sub-condition
                </button>
            )}
            {isNot && (
                <ConditionEditor
                    condition={(condition as { condition: PolicyCondition }).condition}
                    depth={depth + 1}
                    onChange={(c) => onChange({ ...condition, condition: c })}
                />
            )}
        </div>
    );
};

export default ConditionEditor;
