import { Power, PowerOff } from 'lucide-react';
import type { PolicyRule } from '../../kernel/services/debate-runtime/debate-policy-engine';
import { s } from './policy-editor-styles';
import { conditionSummary, conditionCount } from './policy-utils';

interface RuleListProps {
    rules: PolicyRule[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onToggle: (id: string, enabled: boolean) => void;
}

const RuleList: React.FC<RuleListProps> = ({ rules, selectedId, onSelect, onToggle }) => {
    return (
        <div style={s.ruleList}>
            <div style={s.fieldLabel}>Rules</div>
            {rules.length === 0 && (
                <div
                    style={{
                        fontSize: 10,
                        color: 'var(--slate-500)',
                        fontStyle: 'italic',
                        padding: 8,
                        textAlign: 'center',
                    }}
                >
                    No rules. Click "New Rule" or "Load Built-ins" to start.
                </div>
            )}
            {rules.map((rule) => (
                <div
                    key={rule.id}
                    style={s.ruleCard(rule.enabled, selectedId === rule.id)}
                    onClick={() => onSelect(rule.id)}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 2,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle(rule.id, !rule.enabled);
                                }}
                                style={{
                                    ...s.iconBtn,
                                    color: rule.enabled ? '#22c55e' : '#64748b',
                                }}
                                aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                            >
                                {rule.enabled ? <Power size={11} /> : <PowerOff size={11} />}
                            </button>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-200)' }}>
                                {rule.name || rule.id.slice(0, 16)}
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: 9,
                                color: 'var(--slate-500)',
                                fontFamily: 'monospace',
                            }}
                        >
                            P{rule.priority}
                        </span>
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--slate-400)', marginBottom: 2 }}>
                        {conditionSummary(rule.condition)}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span style={s.badge('#8b5cf6')}>
                            {rule.actions.length} action
                            {rule.actions.length !== 1 ? 's' : ''}
                        </span>
                        <span style={s.badge('#06b6d4')}>
                            {conditionCount(rule.condition)} condition
                            {conditionCount(rule.condition) !== 1 ? 's' : ''}
                        </span>
                        {rule.cooldownMs && (
                            <span style={s.badge('#f59e0b')}>
                                {rule.cooldownMs / 1000}s cooldown
                            </span>
                        )}
                        {rule.maxFirings && (
                            <span style={s.badge('#ef4444')}>max {rule.maxFirings}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RuleList;
