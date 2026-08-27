import React, { useState, useEffect, useCallback } from 'react';
import { debatePolicyEngine } from '../../kernel/instances';
import type {
    PolicyRule,
    PolicyFireResult,
} from '../../kernel/services/debate-runtime/debate-policy-engine';
import { BUILTIN_POLICY_RULES } from '../../kernel/services/debate-runtime/debate-policy-engine';
import { Plus, Save, Upload, Trash2, GitBranch, CheckCircle, AlertCircle } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { s } from './policy-editor-styles';
import { Button } from '../Common';
import { genId, createEmptyRule, cloneRule, conditionCount } from './policy-utils';
import ConditionEditor from './ConditionEditor';
import ActionEditor from './ActionEditor';
import RuleList from './RuleList';

const PolicyEditorPanel: React.FC = () => {
    const [rules, setRules] = useState<PolicyRule[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editing, setEditing] = useState<PolicyRule | null>(null);
    const [jsonOutput, setJsonOutput] = useState('');
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const { confirm, ConfirmDialog } = useConfirm();

    const showToast = useCallback((msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const refresh = useCallback(() => {
        const list = debatePolicyEngine.listRules();
        setRules(list);
        if (selectedId && !list.find((r) => r.id === selectedId)) setSelectedId(null);
    }, [selectedId]);

    useEffect(() => {
        debatePolicyEngine.setFireListener((result: PolicyFireResult) => {
            showToast(`Rule fired: "${result.ruleName}" (${result.actionsExecuted} actions)`);
            refresh();
        });
        refresh();
        return () => debatePolicyEngine.setFireListener(() => {});
    }, [showToast, refresh]);

    const selectRule = useCallback((id: string) => {
        setSelectedId(id);
        const rule = debatePolicyEngine.getRule(id);
        if (rule) setEditing(cloneRule(rule));
    }, []);

    const handleNew = useCallback(() => {
        setEditing(createEmptyRule());
        setSelectedId(null);
    }, []);

    const handleSave = useCallback(() => {
        if (!editing) return;
        try {
            debatePolicyEngine.addRule(cloneRule(editing));
            showToast(`Rule "${editing.name || editing.id}" saved`);
            refresh();
            setSelectedId(editing.id);
        } catch (e) {
            showToast(`Save failed: ${e}`, false);
        }
    }, [editing, refresh, showToast]);

    const handleDelete = useCallback(
        async (id: string) => {
            if (
                !(await confirm({
                    title: 'Delete Rule',
                    message: 'Are you sure you want to delete this rule? This cannot be undone.',
                    variant: 'danger',
                }))
            )
                return;
            debatePolicyEngine.removeRule(id);
            showToast('Rule deleted');
            if (selectedId === id) {
                setSelectedId(null);
                setEditing(null);
            }
            refresh();
        },
        [selectedId, refresh, showToast, confirm],
    );

    const handleToggle = useCallback(
        (id: string, enabled: boolean) => {
            if (enabled) debatePolicyEngine.enableRule(id);
            else debatePolicyEngine.disableRule(id);
            refresh();
        },
        [refresh],
    );

    const handleDuplicate = useCallback(
        (id: string) => {
            const rule = debatePolicyEngine.getRule(id);
            if (!rule) return;
            const copy = {
                ...cloneRule(rule),
                id: genId(),
                name: `${rule.name} (copy)`,
            } as PolicyRule;
            debatePolicyEngine.addRule(copy);
            showToast('Rule duplicated');
            refresh();
        },
        [refresh, showToast],
    );

    const handleExport = useCallback(() => {
        setJsonOutput(debatePolicyEngine.exportRules());
        showToast('Rules exported to JSON');
    }, [showToast]);

    const handleImport = useCallback(() => {
        if (!jsonOutput) return;
        const result = debatePolicyEngine.importRules(jsonOutput);
        if (result.success) {
            showToast(`Imported ${result.count} rules`);
            refresh();
        } else {
            showToast(`Import failed: ${result.error}`, false);
        }
    }, [jsonOutput, refresh, showToast]);

    const handleReset = useCallback(async () => {
        if (
            !(await confirm({
                title: 'Reset All Rules',
                message: 'Are you sure you want to reset all debate rules? This cannot be undone.',
                variant: 'danger',
            }))
        )
            return;
        debatePolicyEngine.reset();
        showToast('All rules cleared');
        setSelectedId(null);
        setEditing(null);
        refresh();
    }, [refresh, showToast, confirm]);

    const loadPresets = useCallback(() => {
        for (const rule of BUILTIN_POLICY_RULES) {
            debatePolicyEngine.addRule(cloneRule(rule));
        }
        showToast(`Loaded ${BUILTIN_POLICY_RULES.length} built-in rules`);
        refresh();
    }, [refresh, showToast]);

    return (
        <div style={s.panel}>
            <div style={s.toolbar}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-200)' }}>
                    Debate Policy Rules Engine
                </span>
                <Button variant="success" size="sm" onClick={handleNew}>
                    <Plus size={12} /> New Rule
                </Button>
                <Button variant="ghost" size="sm" onClick={loadPresets}>
                    <GitBranch size={12} /> Load Built-ins
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExport}>
                    <Save size={12} /> Export
                </Button>
                <Button variant="ghost" size="sm" onClick={handleImport}>
                    <Upload size={12} /> Import
                </Button>
                <Button variant="danger" size="sm" onClick={handleReset}>
                    <Trash2 size={12} /> Reset
                </Button>
                <span style={{ fontSize: 10, color: 'var(--slate-500)', marginLeft: 'auto' }}>
                    {rules.length} rule{rules.length !== 1 ? 's' : ''} ·{' '}
                    {rules.filter((r) => r.enabled).length} active
                </span>
            </div>

            <div style={s.main}>
                <RuleList
                    rules={rules}
                    selectedId={selectedId}
                    onSelect={selectRule}
                    onToggle={handleToggle}
                />

                <div style={s.editor}>
                    {!editing ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: 'var(--slate-500)',
                                gap: 8,
                            }}
                        >
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ opacity: 0.3 }}
                            >
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                Select a rule or create a new one
                            </span>
                            <span style={{ fontSize: 10 }}>
                                Use conditions and actions to define debate policy automation
                            </span>
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: 'var(--slate-200)',
                                        }}
                                    >
                                        {editing.name || 'New Rule'}
                                    </span>
                                    <span style={s.badge(editing.enabled ? '#22c55e' : '#64748b')}>
                                        {editing.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={handleSave} style={s.btnPrimary}>
                                        <Save size={12} /> Save
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(editing.id)}
                                        style={s.btn}
                                    >
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <rect x="9" y="9" width="13" height="13" rx="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>{' '}
                                        Duplicate
                                    </button>
                                    <button
                                        onClick={() => handleDelete(editing.id)}
                                        style={s.btnDanger}
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div style={s.sectionTitle}>General</div>
                                <div style={s.row}>
                                    <div style={{ flex: 1 }}>
                                        <div style={s.fieldLabel}>Name</div>
                                        <input
                                            value={editing.name}
                                            onChange={(e) =>
                                                setEditing({ ...editing, name: e.target.value })
                                            }
                                            style={s.input}
                                            placeholder="Rule name"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={s.fieldLabel}>Description</div>
                                        <input
                                            value={editing.description || ''}
                                            onChange={(e) =>
                                                setEditing({
                                                    ...editing,
                                                    description: e.target.value,
                                                })
                                            }
                                            style={s.input}
                                            placeholder="Optional description"
                                        />
                                    </div>
                                    <div style={{ width: 70 }}>
                                        <div style={s.fieldLabel}>Priority</div>
                                        <input
                                            type="number"
                                            min={0}
                                            max={999}
                                            value={editing.priority}
                                            onChange={(e) =>
                                                setEditing({
                                                    ...editing,
                                                    priority: Number(e.target.value),
                                                })
                                            }
                                            style={s.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={s.sectionTitle}>Condition</div>
                                    <span style={{ fontSize: 9, color: 'var(--slate-500)' }}>
                                        {conditionCount(editing.condition)} sub-condition
                                        {conditionCount(editing.condition) !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <ConditionEditor
                                    condition={editing.condition}
                                    onChange={(c) => setEditing({ ...editing, condition: c })}
                                />
                            </div>

                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={s.sectionTitle}>
                                        Actions ({editing.actions.length})
                                    </div>
                                    <button
                                        onClick={() =>
                                            setEditing({
                                                ...editing,
                                                actions: [
                                                    ...editing.actions,
                                                    {
                                                        type: 'log',
                                                        level: 'warn',
                                                        message: 'Policy triggered',
                                                    },
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                ] as any,
                                            })
                                        }
                                        style={s.addBtn}
                                    >
                                        + Action
                                    </button>
                                </div>
                                {editing.actions.map((action, i) => (
                                    <ActionEditor
                                        key={`${action.type}-${i}`}
                                        action={action}
                                        onChange={(a) => {
                                            const aa = [...editing.actions];
                                            aa[i] = a;
                                            setEditing({ ...editing, actions: aa });
                                        }}
                                        onRemove={() =>
                                            setEditing({
                                                ...editing,
                                                actions: editing.actions.filter((_, j) => j !== i),
                                            })
                                        }
                                    />
                                ))}
                            </div>

                            <div>
                                <div style={s.sectionTitle}>Limits</div>
                                <div style={s.row}>
                                    <div style={{ width: 120 }}>
                                        <div style={s.fieldLabel}>Cooldown (ms)</div>
                                        <input
                                            type="number"
                                            min={0}
                                            value={editing.cooldownMs ?? 0}
                                            onChange={(e) =>
                                                setEditing({
                                                    ...editing,
                                                    cooldownMs: Number(e.target.value) || undefined,
                                                })
                                            }
                                            style={s.input}
                                            placeholder="0 = no cooldown"
                                        />
                                    </div>
                                    <div style={{ width: 120 }}>
                                        <div style={s.fieldLabel}>Max Firings</div>
                                        <input
                                            type="number"
                                            min={0}
                                            value={editing.maxFirings ?? 0}
                                            onChange={(e) =>
                                                setEditing({
                                                    ...editing,
                                                    maxFirings: Number(e.target.value) || undefined,
                                                })
                                            }
                                            style={s.input}
                                            placeholder="0 = unlimited"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div style={s.preview}>
                    <div style={s.fieldLabel}>JSON Preview</div>
                    {jsonOutput ? (
                        <div
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 9,
                                color: 'var(--slate-400)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                background: 'rgba(0,0,0,0.3)',
                                padding: 8,
                                borderRadius: 4,
                                maxHeight: 'calc(100% - 200px)',
                                overflow: 'auto',
                            }}
                        >
                            {jsonOutput}
                        </div>
                    ) : editing ? (
                        <div
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 9,
                                color: 'var(--slate-400)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                background: 'rgba(0,0,0,0.3)',
                                padding: 8,
                                borderRadius: 4,
                                maxHeight: 'calc(100% - 200px)',
                                overflow: 'auto',
                            }}
                        >
                            {JSON.stringify(editing, null, 2)}
                        </div>
                    ) : (
                        <div
                            style={{ fontSize: 10, color: 'var(--slate-500)', fontStyle: 'italic' }}
                        >
                            Select or create a rule to preview
                        </div>
                    )}
                </div>
            </div>

            {toast && (
                <div
                    style={{
                        ...s.toast,
                        background: toast.ok ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                    }}
                >
                    {toast.ok ? (
                        <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                    ) : (
                        <AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                    )}
                    {toast.msg}
                </div>
            )}
            <ConfirmDialog />
        </div>
    );
};

export default PolicyEditorPanel;
