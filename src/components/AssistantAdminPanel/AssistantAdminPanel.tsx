import React, { useCallback, useEffect, useState } from 'react';
import {
    ShieldCheck,
    BookOpen,
    Brain,
    History,
    Key,
    RefreshCw,
    Trash2,
    Loader2,
} from 'lucide-react';
import {
    agentPermissionService,
    capabilityTrustService,
    assistantDiaryService,
    projectAssistantService,
    agentService,
    orchestrator,
    skillService,
    toolService,
} from '../../kernel/instances/services-core';
import { useAssistantStore, type AssistantSessionMeta } from '../../stores/assistant-store';
import { useKeyStore } from '../../stores/useKeyStore';
import { eventBus, EVENTS } from '../../kernel/instances';
import PanelLoader from '../PanelLoader';
import AssistantModelSelect from '../Assistant/AssistantModelSelect';
import { input } from '../../styles/common';

const ASSISTANT_AGENT_ID = 'assistant';

const MODES = ['read-only', 'guarded', 'workspace', 'full'] as const;
const PRESETS = ['read-only', 'workspace-write', 'guarded', 'danger-full-access'] as const;

const TRUST_LABEL: Record<string, string> = {
    verified: 'verified',
    discovered: 'discovered',
    declared: 'declared',
};

const DIARY_KINDS = ['question', 'action', 'decision', 'mistake', 'lesson', 'answer'] as const;

interface SelfRow {
    id: string;
    name: string;
    status: string;
    mode: string;
    preset: string;
    denials: number;
}

interface TrustRow {
    id: string;
    kind: string;
    title: string;
    trust: string;
    stale: boolean;
    evid: string[];
}

interface DiaryRow {
    id: string;
    kind: string;
    text: string;
    evidence?: string;
    outcome: string;
    timestamp: number;
}

const AssistantAdminContent: React.FC = () => {
    const [self, setSelf] = useState<SelfRow | null>(null);
    const [mode, setMode] = useState<string>('guarded');
    const [preset, setPreset] = useState<string>('guarded');
    const [trustRows, setTrustRows] = useState<TrustRow[]>([]);
    const [trustStats, setTrustStats] = useState<{
        total: number;
        verified: number;
        discovered: number;
        declared: number;
        stale: number;
    } | null>(null);
    const [diary, setDiary] = useState<DiaryRow[]>([]);
    const [diaryKind, setDiaryKind] = useState<string>('all');
    const [trustFilter, setTrustFilter] = useState<string>('all');
    const [saving, setSaving] = useState(false);
    const [agentLabel, setAgentLabel] = useState('');
    const [agentRole, setAgentRole] = useState('');
    const [agentPrompt, setAgentPrompt] = useState('');
    const [assignedSkills, setAssignedSkills] = useState<string[]>([]);
    const [assignedTools, setAssignedTools] = useState<string[]>([]);
    const [denyTools, setDenyTools] = useState<string[]>([]);
    const [allSkills, setAllSkills] = useState<Array<{ id: string; name: string; status: string }>>(
        [],
    );
    const [allTools, setAllTools] = useState<Array<{ id: string; name: string; group: string }>>(
        [],
    );

    const sessionList = useAssistantStore((s) => s.sessionList);
    const sessionId = useAssistantStore((s) => s.sessionId);
    const loadSession = useAssistantStore((s) => s.loadSession);
    const newSession = useAssistantStore((s) => s.newSession);
    const deleteSession = useAssistantStore((s) => s.deleteSession);
    const assistantKeyId = useAssistantStore((s) => s.keyId);
    const setAssistantKey = useAssistantStore((s) => s.setKey);
    const assistantModelId = useAssistantStore((s) => s.modelId);
    const setAssistantModel = useAssistantStore((s) => s.setModel);
    const keys = useKeyStore((s) => s.keys);

    const refresh = useCallback(() => {
        try {
            const state = agentPermissionService.getState(ASSISTANT_AGENT_ID);
            setMode(state.mode);
            setPreset(state.preset);
            let selfRow: SelfRow;
            try {
                const s = projectAssistantService.describeSelf();
                selfRow = {
                    id: s.id,
                    name: s.name,
                    status: s.status,
                    mode: s.mode,
                    preset: s.preset,
                    denials: s.denials,
                };
            } catch {
                selfRow = {
                    id: ASSISTANT_AGENT_ID,
                    name: 'Project Assistant',
                    status: 'unknown',
                    mode: state.mode,
                    preset: state.preset,
                    denials: state.consecutiveDenials,
                };
            }
            setSelf(selfRow);
        } catch {
            /* permission service not ready */
        }
        try {
            const rows = capabilityTrustService.list();
            setTrustRows(
                rows.map((r) => ({
                    id: r.id,
                    kind: r.kind,
                    title: r.title,
                    trust: r.trust,
                    stale: r.stale,
                    evid: r.evidence ?? [],
                })),
            );
            const stats = capabilityTrustService.stats();
            setTrustStats({
                total: stats.total,
                verified: stats.verified,
                discovered: stats.discovered,
                declared: stats.declared,
                stale: stats.stale,
            });
        } catch {
            setTrustRows([]);
        }
        try {
            const entries = assistantDiaryService.recent(100);
            setDiary(
                entries.map((e) => ({
                    id: e.id,
                    kind: e.kind,
                    text: e.text,
                    evidence: e.evidence,
                    outcome: e.outcome,
                    timestamp: e.timestamp,
                })),
            );
        } catch {
            setDiary([]);
        }
        // Profile + skills/tools of the assistant node.
        try {
            const top = orchestrator.getActiveTopology();
            const node = top?.nodes.find((n) => n.id === ASSISTANT_AGENT_ID);
            const cfg = ((node?.config ?? {}) as Record<string, unknown>) ?? {};
            const asArr = (v: unknown): string[] =>
                Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
            setAgentLabel(typeof node?.label === 'string' ? node.label : 'Project Assistant');
            setAgentRole(typeof cfg.roleName === 'string' ? (cfg.roleName as string) : '');
            setAgentPrompt(
                typeof cfg.systemPrompt === 'string'
                    ? (cfg.systemPrompt as string)
                    : typeof cfg.prompt === 'string'
                      ? (cfg.prompt as string)
                      : '',
            );
            setAssignedSkills(asArr(cfg.skills));
            setAssignedTools(asArr(cfg.tools));
            setDenyTools(asArr(cfg.denyTools));
        } catch {
            /* topology not ready */
        }
        try {
            const skills = skillService.getSkills();
            setAllSkills(
                skills.map((s) => ({
                    id: s.id,
                    name: s.name ?? s.id,
                    status: s.status ?? 'installed',
                })),
            );
        } catch {
            setAllSkills([]);
        }
        try {
            const tools = toolService.getTools();
            setAllTools(
                tools.map((t) => ({
                    id: t.id,
                    name: t.name ?? t.id,
                    group: t.group ?? '',
                })),
            );
        } catch {
            setAllTools([]);
        }
    }, []);

    useEffect(() => {
        refresh();
        const unsubTrust = eventBus.on(EVENTS.CAPABILITY_TRUST_CHANGED, refresh);
        const unsubPerm = eventBus.on(EVENTS.PERMISSION_UPDATED, refresh);
        return () => {
            unsubTrust();
            unsubPerm();
        };
    }, [refresh]);

    const applyMode = async (nextMode: string) => {
        setSaving(true);
        try {
            await agentPermissionService.setMode(ASSISTANT_AGENT_ID, nextMode as never);
            setMode(nextMode);
        } catch {
            /* best-effort */
        } finally {
            setSaving(false);
        }
    };

    const applyPreset = async (nextPreset: string) => {
        setSaving(true);
        try {
            await agentPermissionService.setPreset(ASSISTANT_AGENT_ID, nextPreset as never);
            setPreset(nextPreset);
        } catch {
            /* best-effort */
        } finally {
            setSaving(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            agentService.updateAgent(ASSISTANT_AGENT_ID, {
                label: agentLabel.trim() || 'Project Assistant',
                roleName: agentRole,
                systemPrompt: agentPrompt,
            });
        } catch {
            /* best-effort */
        } finally {
            setSaving(false);
            refresh();
        }
    };

    const toggleSkill = async (skillId: string) => {
        const next = assignedSkills.includes(skillId)
            ? assignedSkills.filter((s) => s !== skillId)
            : [...assignedSkills, skillId];
        setAssignedSkills(next);
        try {
            agentService.updateAgent(ASSISTANT_AGENT_ID, { skills: next });
        } catch {
            /* best-effort */
        }
    };

    const toggleTool = async (toolId: string) => {
        const next = assignedTools.includes(toolId)
            ? assignedTools.filter((t) => t !== toolId)
            : [...assignedTools, toolId];
        setAssignedTools(next);
        try {
            agentService.updateAgent(ASSISTANT_AGENT_ID, { tools: next });
        } catch {
            /* best-effort */
        }
    };

    const visibleDiary = diary.filter((d) => diaryKind === 'all' || d.kind === diaryKind);
    const visibleTrust = trustRows.filter((r) => {
        if (trustFilter === 'all') return true;
        if (trustFilter === 'stale') return r.stale;
        return r.trust === trustFilter;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Идентичность */}
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
                    <ShieldCheck
                        size={13}
                        aria-hidden="true"
                        style={{ verticalAlign: -2, marginRight: 6 }}
                    />
                    Ассистент
                </h2>
                {self ? (
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {[
                            ['agent', self.id],
                            ['status', self.status],
                            ['mode', self.mode],
                            ['preset', self.preset],
                            ['denials', String(self.denials)],
                        ].map(([k, v]) => (
                            <span
                                key={k}
                                style={{
                                    padding: '0.3rem 0.7rem',
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    background: 'rgba(0,0,0,0.2)',
                                    fontSize: '0.75rem',
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                                <b>{v}</b>
                            </span>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Сервис не готов.
                    </div>
                )}
            </section>

            {/* Разрешения */}
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
                    Режим разрешений
                </h2>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.6rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <select
                        value={mode}
                        onChange={(e) => void applyMode(e.target.value)}
                        disabled={saving}
                        aria-label="Режим разрешений"
                        style={{ ...input, minWidth: 180 }}
                    >
                        {MODES.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <select
                        value={preset}
                        onChange={(e) => void applyPreset(e.target.value)}
                        disabled={saving}
                        aria-label="Пресет разрешений"
                        style={{ ...input, minWidth: 200 }}
                    >
                        {PRESETS.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    {saving && <Loader2 size={14} className="assistant-spin" />}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Смена режима применяется сразу; чтения остаются свободными,
                        записи/исполнения зависят от пресета.
                    </span>
                </div>
            </section>

            {/* Ключ */}
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
                    Ключ по умолчанию
                </h2>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.6rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <select
                        value={assistantKeyId ?? ''}
                        onChange={(e) => setAssistantKey(e.target.value || null)}
                        aria-label="Ключ ассистента"
                        style={{ ...input, minWidth: 320 }}
                    >
                        <option value="">Авто — первый активный</option>
                        {keys.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.label || k.id.slice(0, 8)} · {k.provider} ({k.status})
                            </option>
                        ))}
                    </select>
                    <AssistantModelSelect
                        keys={keys}
                        keyId={assistantKeyId}
                        modelId={assistantModelId}
                        onModelChange={setAssistantModel}
                        ariaLabel="Модель ассистента"
                    />
                </div>
            </section>

            {/* Профиль */}
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
                    Профиль
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.6rem',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Имя агента
                        </label>
                        <input
                            value={agentLabel}
                            onChange={(e) => setAgentLabel(e.target.value)}
                            aria-label="Имя агента"
                            style={{ ...input, minWidth: 240, flex: 1 }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.6rem',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Роль
                        </label>
                        <input
                            value={agentRole}
                            onChange={(e) => setAgentRole(e.target.value)}
                            aria-label="Роль агента"
                            style={{ ...input, minWidth: 240, flex: 1 }}
                        />
                    </div>
                    <textarea
                        value={agentPrompt}
                        onChange={(e) => setAgentPrompt(e.target.value)}
                        aria-label="Системный промпт"
                        placeholder="Системный промпт ассистента"
                        rows={4}
                        style={{
                            ...input,
                            width: '100%',
                            resize: 'vertical',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                        }}
                    />
                    <div>
                        <button
                            onClick={() => void saveProfile()}
                            disabled={saving}
                            style={{
                                padding: '0.4rem 1rem',
                                borderRadius: 8,
                                border: '1px solid var(--accent)',
                                background: 'rgba(167,139,250,0.12)',
                                color: 'var(--accent)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                            }}
                        >
                            {saving ? 'Сохраняю…' : 'Сохранить профиль'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Skills */}
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
                    Skills — {assignedSkills.length} назначено
                </h2>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        maxHeight: 260,
                        overflowY: 'auto',
                    }}
                >
                    {allSkills.map((s) => {
                        const on = assignedSkills.includes(s.id);
                        return (
                            <label
                                key={s.id}
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.15)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={on}
                                    onChange={() => void toggleSkill(s.id)}
                                />
                                <span style={{ flex: 1 }}>{s.name}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                    {s.id}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                    {s.status}
                                </span>
                            </label>
                        );
                    })}
                    {allSkills.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Навыки не найдены.
                        </div>
                    )}
                </div>
            </section>

            {/* Tools */}
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
                    Tools — {assignedTools.length} включено
                </h2>
                {denyTools.length > 0 && (
                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--warning)',
                            marginBottom: '0.4rem',
                        }}
                    >
                        Запрещены: {denyTools.join(', ')}
                    </div>
                )}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        maxHeight: 260,
                        overflowY: 'auto',
                    }}
                >
                    {allTools.map((t) => {
                        const on = assignedTools.includes(t.id);
                        return (
                            <label
                                key={t.id}
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.15)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={on}
                                    onChange={() => void toggleTool(t.id)}
                                />
                                <span style={{ flex: 1 }}>{t.name}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                    {t.id}
                                </span>
                                {t.group && (
                                    <span
                                        style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}
                                    >
                                        {t.group}
                                    </span>
                                )}
                            </label>
                        );
                    })}
                    {allTools.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Инструменты не найдены.
                        </div>
                    )}
                </div>
            </section>

            {/* Возможности / trust */}
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
                    Возможности (trust) —{' '}
                    {trustStats
                        ? `${trustStats.verified} verified · ${trustStats.discovered} discovered · ${trustStats.declared} declared · ${trustStats.stale} stale`
                        : ''}
                </h2>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap',
                    }}
                >
                    {['all', 'verified', 'discovered', 'declared', 'stale'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setTrustFilter(f)}
                            style={{
                                padding: '0.25rem 0.7rem',
                                borderRadius: 100,
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                border: `1px solid ${trustFilter === f ? 'var(--accent)' : 'var(--border)'}`,
                                background:
                                    trustFilter === f ? 'rgba(167,139,250,0.12)' : 'transparent',
                                color: trustFilter === f ? 'var(--accent)' : 'var(--text-muted)',
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        maxHeight: 320,
                        overflowY: 'auto',
                    }}
                >
                    {visibleTrust.slice(0, 300).map((r) => (
                        <div
                            key={r.id}
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 8,
                                background: 'rgba(0,0,0,0.15)',
                                fontSize: '0.75rem',
                            }}
                        >
                            <span
                                style={{
                                    minWidth: 84,
                                    textAlign: 'center',
                                    color:
                                        r.trust === 'verified'
                                            ? 'var(--success)'
                                            : r.trust === 'discovered'
                                              ? 'var(--warning)'
                                              : 'var(--text-muted)',
                                    fontWeight: 700,
                                }}
                            >
                                {TRUST_LABEL[r.trust] ?? r.trust}
                            </span>
                            {r.stale && <span style={{ color: 'var(--error)' }}>stale</span>}
                            <span
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                                title={r.id}
                            >
                                {r.title || r.id}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                {r.kind}
                            </span>
                        </div>
                    ))}
                    {visibleTrust.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Пусто</div>
                    )}
                </div>
            </section>

            {/* Дневник */}
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
                    <BookOpen
                        size={13}
                        aria-hidden="true"
                        style={{ verticalAlign: -2, marginRight: 6 }}
                    />
                    Дневник опыта
                </h2>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap',
                    }}
                >
                    {['all', ...DIARY_KINDS].map((k) => (
                        <button
                            key={k}
                            onClick={() => setDiaryKind(k)}
                            style={{
                                padding: '0.25rem 0.7rem',
                                borderRadius: 100,
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                border: `1px solid ${diaryKind === k ? 'var(--accent)' : 'var(--border)'}`,
                                background:
                                    diaryKind === k ? 'rgba(167,139,250,0.12)' : 'transparent',
                                color: diaryKind === k ? 'var(--accent)' : 'var(--text-muted)',
                            }}
                        >
                            {k}
                        </button>
                    ))}
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        maxHeight: 320,
                        overflowY: 'auto',
                    }}
                >
                    {visibleDiary.map((d) => (
                        <div
                            key={d.id}
                            style={{
                                padding: '0.35rem 0.6rem',
                                borderRadius: 8,
                                background: 'rgba(0,0,0,0.15)',
                                fontSize: '0.75rem',
                            }}
                        >
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span
                                    style={{
                                        color: 'var(--accent)',
                                        fontWeight: 700,
                                        minWidth: 84,
                                    }}
                                >
                                    {d.kind}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    {new Date(d.timestamp).toLocaleString()}
                                </span>
                                <span
                                    style={{
                                        color:
                                            d.outcome === 'success'
                                                ? 'var(--success)'
                                                : 'var(--warning)',
                                    }}
                                >
                                    {d.outcome}
                                </span>
                            </div>
                            <div>{d.text}</div>
                            {d.evidence && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                                    {d.evidence.slice(0, 300)}
                                </div>
                            )}
                        </div>
                    ))}
                    {visibleDiary.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Записей нет.
                        </div>
                    )}
                </div>
            </section>

            {/* История диалогов */}
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
                    <History
                        size={13}
                        aria-hidden="true"
                        style={{ verticalAlign: -2, marginRight: 6 }}
                    />
                    История диалогов
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => void newSession()}
                        style={{
                            padding: '0.35rem 0.8rem',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-main)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                        }}
                    >
                        + Новый диалог
                    </button>
                    <button
                        onClick={refresh}
                        title="Обновить"
                        style={{
                            padding: '0.35rem 0.8rem',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-main)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                        }}
                    >
                        <RefreshCw
                            size={13}
                            aria-hidden="true"
                            style={{ verticalAlign: -2, marginRight: 4 }}
                        />
                        Обновить
                    </button>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        marginTop: '0.5rem',
                    }}
                >
                    {sessionList.map((s: AssistantSessionMeta) => (
                        <div
                            key={s.id}
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                padding: '0.35rem 0.6rem',
                                borderRadius: 8,
                                background:
                                    s.id === sessionId
                                        ? 'rgba(167,139,250,0.10)'
                                        : 'rgba(0,0,0,0.15)',
                                fontSize: '0.78rem',
                            }}
                        >
                            <button
                                onClick={() => void loadSession(s.id)}
                                style={{
                                    flex: 1,
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                }}
                            >
                                {s.title}
                            </button>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                {new Date(s.updatedAt).toLocaleString()}
                            </span>
                            <button
                                onClick={() => void deleteSession(s.id)}
                                aria-label={`Удалить: ${s.title}`}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                    {sessionList.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Диалогов пока нет.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

const AssistantAdminPanel: React.FC = () => (
    <PanelLoader>
        <AssistantAdminContent />
    </PanelLoader>
);

export default AssistantAdminPanel;
