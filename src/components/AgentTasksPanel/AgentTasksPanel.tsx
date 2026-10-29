import React, { useState, useEffect, useRef } from 'react';
import {
    MonitorPlay,
    Loader2,
    AlertTriangle,
    SquareTerminal,
    Crosshair,
    Server,
    Rocket,
    MousePointerClick,
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { agemsApprovalService } from '../../kernel/services/agems-approval-service';
import {
    browserUseService,
    computerUseLoopService,
    crystalVault,
} from '../../kernel/instances/services-extras';
import { agentService, keyService } from '../../kernel/instances/services-core';
import type { ComputerUseProvider } from '../../kernel/services/computer/computer-use-loop-service';

const PROVIDER_LABEL: Record<ComputerUseProvider, string> = {
    anthropic: 'Anthropic (Claude)',
    'gemini-computer': 'Gemini Computer',
};

const HISTORY_KEY = 'agent-tasks:history:v1';
const HISTORY_CAP = 20;

function loadHistory(): RunRecord[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as RunRecord[];
        return Array.isArray(parsed) ? parsed.slice(0, HISTORY_CAP) : [];
    } catch {
        return [];
    }
}

type Capability = 'browser' | 'computer';

interface RunRecord {
    id: number;
    capability: Capability;
    task: string;
    status: 'running' | 'done' | 'error';
    output: string;
    screenshot?: string;
    turns?: number;
    at: number;
}

let runSeq = 0;

/**
 * AgentTasks — панель запуска автоматизации нажатием кнопки (без кода).
 * НЕ путать с TasksPanel (органайзер задач/kanban): здесь — исполнение
 * browser/computer-задач sidecar'ом, там — планирование и трекинг.
 *
 * Два режима (один и тот же sidecar, разные trade-off):
 * - browser: разовая задача через BrowserUseService (быстро, DOM-уровень).
 * - computer: визуальный CUA-loop через ComputerUseLoopService
 *   (медленно, попиксельно; провайдер anthropic / gemini-computer).
 *
 * HITL здесь — сама кнопка Run: человек видит полный текст задачи до
 * запуска. Для аудита создаём заявку и тут же закрываем её resolve'ом
 * с `ui:direct:tasks` — этот префикс мост игнорирует (иначе было бы
 * двойное исполнение: панель + bridge). См. approval-execution-bridge.
 * Настройка executor'а (sidecar URL) — в панели Approvals.
 */
const AgentTasksPanel: React.FC = () => {
    const { t } = useTranslation();
    const [capability, setCapability] = useState<Capability>('browser');
    const [provider, setProvider] = useState<ComputerUseProvider>('anthropic');
    const [agentId, setAgentId] = useState('ui-tasks');
    const [task, setTask] = useState('');
    const [maxTurns, setMaxTurns] = useState('10');
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [history, setHistory] = useState<RunRecord[]>(loadHistory);
    const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string }>>([]);
    const [sidecar, setSidecar] = useState<{ ok: boolean; via: string; detail?: string } | null>(
        null,
    );
    const [checking, setChecking] = useState(false);
    const [providerReady, setProviderReady] = useState<Record<string, boolean>>({});
    const [savingId, setSavingId] = useState<number | null>(null);
    const [selector, setSelector] = useState('');
    const [schemaText, setSchemaText] = useState('');
    const [toolBusy, setToolBusy] = useState(false);
    const [toolOutput, setToolOutput] = useState<string | null>(null);
    const appliedTurns = Math.max(1, Math.min(50, Math.floor(Number(maxTurns) || 10)));

    // UX: подсказать реальных агентов для «от чьего имени».
    useEffect(() => {
        try {
            const list = agentService.getAgents?.() ?? [];
            setAvailableAgents(
                list.map((a) => ({ id: String(a.id), name: String(a.name ?? a.id) })),
            );
        } catch {
            /* registry may be empty */
        }
    }, []);

    const checkHealth = async () => {
        setChecking(true);
        try {
            const h = await browserUseService.health();
            setSidecar(h);
        } catch (e) {
            setSidecar({
                ok: false,
                via: 'sidecar',
                detail: e instanceof Error ? e.message : String(e),
            });
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        void checkHealth();
        try {
            const keys = keyService.getKeys?.() ?? [];
            setProviderReady({
                anthropic: keys.some((k) => k.provider === 'anthropic'),
                'gemini-computer': keys.some(
                    (k) => k.provider === 'gemini' || k.provider === 'gemini-computer',
                ),
            });
        } catch {
            /* ignore */
        }
    }, [capability]);

    const startSidecar = () => {
        window.open('http://localhost:3100/health', '_blank');
        setTimeout(() => void checkHealth(), 2000);
    };

    // Persist text-only history across reloads (screenshots stay in-memory:
    // base64 would blow the 5MB localStorage budget on the first run).
    useEffect(() => {
        try {
            const slim = history
                .slice(0, HISTORY_CAP)
                .map(({ screenshot: _screenshot, ...rest }) => rest);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(slim));
        } catch {
            // Quota or privacy mode — in-memory history still works.
        }
    }, [history]);

    function pushHistory(patch: Partial<RunRecord> & { id: number }) {
        setHistory((prev) => prev.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)));
    }

    function logRun(
        capability: Capability,
        task: string,
        status: RunRecord['status'],
        output: string,
        screenshot?: string,
    ) {
        const id = ++runSeq;
        const rec: RunRecord = { id, capability, task, status, output, screenshot, at: Date.now() };
        setHistory((prev) => [rec, ...prev].slice(0, HISTORY_CAP));
    }

    async function runBrowser(
        id: number,
        agent: string,
        text: string,
        maxSteps: number,
    ): Promise<void> {
        const req = await agemsApprovalService.requestApproval({
            agentId: agent,
            toolName: 'browser.act',
            toolInput: { task: text },
            category: 'browser',
            riskLevel: 'medium',
            description: `tasks panel: ${text.slice(0, 200)}`,
        });
        await agemsApprovalService.resolve(
            req.id as number,
            'APPROVED',
            undefined,
            'ui:direct:tasks',
        );
        const res = await browserUseService.execute(text, {
            maxSteps,
            signal: abortRef.current?.signal,
        });
        // Человеческая сводка вместо сырого stdout (там JSON со скриншотом —
        // именно он раньше пугал обрезанным base64-блобом).
        const fs = (res.finalState ?? {}) as { mode?: string; title?: string; url?: string };
        const summary =
            [fs.mode, fs.title, fs.url].filter((s): s is string => Boolean(s)).join(' · ') ||
            (res.stdout || '').slice(0, 500);
        pushHistory({
            id,
            status: 'done',
            output: `${res.via} · ${summary}`.slice(0, 2000),
            screenshot: res.screenshot,
        });
    }

    async function runComputer(
        id: number,
        agent: string,
        text: string,
        prov: ComputerUseProvider,
        turns: number,
    ): Promise<void> {
        const req = await agemsApprovalService.requestApproval({
            agentId: agent,
            toolName: 'computer.use',
            toolInput: { task: text, provider: prov },
            category: 'computer',
            riskLevel: 'high',
            description: `tasks panel: ${text.slice(0, 200)}`,
        });
        await agemsApprovalService.resolve(
            req.id as number,
            'APPROVED',
            undefined,
            'ui:direct:tasks',
        );
        const res = await computerUseLoopService.runApproved({
            task: text,
            approvedRequestId: req.id as number,
            maxTurns: turns,
            provider: prov,
        });
        pushHistory({
            id,
            status: 'done',
            output: `${res.stopReason} · turns ${res.turns} · calls ${res.computerCalls}\n${res.output}`.slice(
                0,
                2000,
            ),
            screenshot: res.lastScreenshot,
            turns: res.turns,
        });
    }

    const saveToCrystal = async (r: RunRecord) => {
        if (savingId !== null) return;
        setSavingId(r.id);
        try {
            const evidence = r.output ? [r.output.slice(0, 500)] : [];
            await crystalVault.propose({
                content: {
                    statement: `Browser-задача: ${r.task.slice(0, 200)}`,
                    elaboration: r.output ? r.output.slice(0, 2000) : undefined,
                    evidence,
                },
                originKind: 'observation',
                originId: `browser-task:${r.id}`,
                contributingAgents: ['ui-tasks'],
            });
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setSavingId(null);
        }
    };

    function onCancel() {
        abortRef.current?.abort();
        setRunning(false);
        setError('Отменено пользователем');
    }

    type ToolKind = 'click_selector' | 'extract_text_selector' | 'extract_table' | 'extract_schema';

    async function runTool(kind: ToolKind): Promise<void> {
        if (running || toolBusy) return;
        if (!sidecar?.ok) {
            setError('Sidecar не запущен. Запусти: npm run browser:sidecar, затем «Проверить».');
            return;
        }
        if (kind !== 'extract_table' && !selector.trim()) {
            setError('Введи CSS-селектор (например: #price, h1, table tr)');
            return;
        }
        setError(null);
        setToolOutput(null);
        setToolBusy(true);
        const label = `[${kind}] ${kind === 'extract_table' ? '' : selector.trim()}`;
        try {
            const agent = agentId.trim() || 'ui-tasks';
            const req = await agemsApprovalService.requestApproval({
                agentId: agent,
                toolName: 'browser.act',
                toolInput: { action: kind, selector, schema: schemaText },
                category: 'browser',
                riskLevel: 'medium',
                description: `tasks panel tool: ${label}`.slice(0, 200),
            });
            await agemsApprovalService.resolve(
                req.id as number,
                'APPROVED',
                undefined,
                'ui:direct:tasks',
            );
            let res: Awaited<ReturnType<typeof browserUseService.act>>;
            if (kind === 'extract_schema') {
                let schema: Record<string, unknown>;
                try {
                    schema = JSON.parse(schemaText) as Record<string, unknown>;
                } catch {
                    throw new Error('Схема — не корректный JSON: {"поле": "селектор"}');
                }
                if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
                    throw new Error('Схема должна быть объектом {"поле": "селектор"}');
                }
                res = await browserUseService.act('extract_schema', { schema });
            } else {
                res = await browserUseService.act(kind, {
                    ...(kind === 'extract_table' ? {} : { selector }),
                });
            }
            const summary = res.output.slice(0, 2000);
            setToolOutput(summary);
            logRun(
                'browser',
                `${label} → ${summary.slice(0, 120)}`,
                'done',
                `${res.via} · ${summary}`,
            );
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            logRun('browser', label, 'error', msg.slice(0, 2000));
        } finally {
            setToolBusy(false);
        }
    }

    async function onRun(): Promise<void> {
        const text = task.trim();
        if (!text || running) return;
        setError(null);
        setRunning(true);
        abortRef.current = new AbortController();
        const id = ++runSeq;
        const agent = agentId.trim() || 'ui-tasks';
        const turns = Math.max(1, Math.min(50, Math.floor(Number(maxTurns) || 10)));
        setHistory((prev) =>
            [
                {
                    id,
                    capability,
                    task: text,
                    status: 'running' as const,
                    output: '',
                    at: Date.now(),
                },
                ...prev,
            ].slice(0, 20),
        );
        try {
            if (capability === 'browser') await runBrowser(id, agent, text, turns);
            else await runComputer(id, agent, text, provider, turns);
            setTask('');
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            pushHistory({ id, status: 'error', output: msg.slice(0, 2000) });
            setError(msg);
        } finally {
            setRunning(false);
            abortRef.current = null;
        }
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.25rem',
                }}
            >
                <MonitorPlay size={20} />
                <h2 style={{ margin: 0 }}>{t('tasks.title')}</h2>
            </div>
            <p
                style={{
                    margin: '0 0 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--slate-400)',
                    lineHeight: 1.5,
                }}
            >
                💻 Автоматизация нажатием кнопки: <b>Browser</b> — быстрая DOM-задача (сайты,
                формы); <b>Computer</b> — визуальный контроль экрана (попиксельно, медленнее,
                требует провайдера). Задача запускается после нажатия «Run».
            </p>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 8,
                    marginBottom: '0.75rem',
                    border: '1px solid var(--border)',
                    background: sidecar?.ok ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.06)',
                }}
            >
                <Server size={15} color={sidecar?.ok ? '#059669' : '#dc2626'} />
                <span style={{ fontSize: 12, color: 'var(--slate-300)' }}>
                    sidecar:{' '}
                    <b style={{ color: sidecar?.ok ? '#059669' : '#dc2626' }}>
                        {checking ? 'проверка…' : sidecar?.ok ? 'готов' : 'не запущен'}
                    </b>
                    {!sidecar?.ok && (
                        <span style={{ color: 'var(--slate-500)', fontSize: 11 }}>
                            {' '}
                            — {sidecar?.detail ?? 'недоступен'} · запусти:{' '}
                            <code>npm run browser:sidecar</code>
                        </span>
                    )}
                </span>
                <button
                    onClick={() => void checkHealth()}
                    disabled={checking}
                    style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 8px' }}
                    title="Проверить статус sidecar"
                >
                    {checking ? '…' : 'Проверить'}
                </button>
                {!sidecar?.ok && (
                    <button
                        onClick={startSidecar}
                        style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            display: 'inline-flex',
                            gap: 4,
                            alignItems: 'center',
                        }}
                        title="Открыть / запустить sidecar (npm run browser:sidecar)"
                    >
                        <Rocket size={12} /> Открыть
                    </button>
                )}
            </div>

            <div
                style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '1rem',
                    marginBottom: '1rem',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap',
                    }}
                >
                    <button
                        onClick={() => setCapability('browser')}
                        style={capStyle(capability === 'browser')}
                    >
                        <SquareTerminal size={14} /> {t('tasks.browser')}
                    </button>
                    <button
                        onClick={() => setCapability('computer')}
                        style={capStyle(capability === 'computer')}
                    >
                        <Crosshair size={14} /> {t('tasks.computer')}
                    </button>
                    {capability === 'computer' && (
                        <>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value as ComputerUseProvider)}
                            >
                                <option value="anthropic">{PROVIDER_LABEL.anthropic}</option>
                                <option value="gemini-computer">
                                    {PROVIDER_LABEL['gemini-computer']}
                                </option>
                            </select>
                            <span
                                style={{
                                    fontSize: 11,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: providerReady[provider] ? '#059669' : '#dc2626',
                                    color: providerReady[provider] ? '#059669' : '#dc2626',
                                }}
                                title={
                                    providerReady[provider]
                                        ? 'Ключ провайдера найден'
                                        : 'Ключ провайдера не найден — добавь его в «Провайдеры»'
                                }
                            >
                                {providerReady[provider] ? 'ключ есть' : 'нет ключа'}
                            </span>
                        </>
                    )}
                    {availableAgents.length > 0 && (
                        <select
                            value=""
                            onChange={(e) => {
                                if (e.target.value) setAgentId(e.target.value);
                            }}
                            title="Выбрать агента (или впиши свой id)"
                        >
                            <option value="">— агент: {agentId} —</option>
                            {availableAgents.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <input
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        placeholder={t('tasks.agent_ph')}
                        style={{ width: 140 }}
                    />
                    <input
                        value={maxTurns}
                        onChange={(e) => setMaxTurns(e.target.value)}
                        placeholder={t('tasks.turns_ph')}
                        style={{ width: 90 }}
                        inputMode="numeric"
                        title="Clamped to 1–50"
                    />
                    <span style={{ fontSize: 11, color: 'var(--slate-400)', alignSelf: 'center' }}>
                        1–50 · applied: {appliedTurns}
                    </span>
                </div>
                <textarea
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder={t('tasks.task_ph')}
                    rows={3}
                    style={{ width: '100%', padding: 8, borderRadius: 8, marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => void onRun()} disabled={running || !task.trim()}>
                        {running ? <Loader2 size={14} /> : null} {t('tasks.run')}
                    </button>
                    {running && (
                        <button
                            onClick={onCancel}
                            style={{
                                fontSize: 12,
                                padding: '4px 10px',
                                color: '#fff',
                                background: '#dc2626',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                            }}
                        >
                            Отменить
                        </button>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>
                        {t('tasks.hitl_note')}
                    </span>
                </div>
                {error && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            color: '#dc2626',
                            marginTop: '0.5rem',
                        }}
                    >
                        <AlertTriangle size={16} /> <span>{error}</span>
                    </div>
                )}
            </div>

            <div
                style={{
                    border: '1px dashed var(--border)',
                    borderRadius: 8,
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--slate-300)',
                        marginBottom: '0.5rem',
                    }}
                >
                    🎯 Инструменты селектора (точный контроль, sidecar)
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 6 }}>
                    <input
                        value={selector}
                        onChange={(e) => setSelector(e.target.value)}
                        placeholder="CSS-селектор, напр. #price или table tr"
                        style={{ flex: '1 1 200px', padding: 8, borderRadius: 8 }}
                    />
                    <button onClick={() => void runTool('click_selector')} disabled={toolBusy}>
                        <MousePointerClick size={14} /> Кликнуть
                    </button>
                    <button
                        onClick={() => void runTool('extract_text_selector')}
                        disabled={toolBusy}
                    >
                        Извлечь текст
                    </button>
                    <button onClick={() => void runTool('extract_table')} disabled={toolBusy}>
                        Извлечь таблицу
                    </button>
                </div>
                <textarea
                    value={schemaText}
                    onChange={(e) => setSchemaText(e.target.value)}
                    placeholder={'Схема (JSON): {"цена": "#price", "заголовок": "h1"}'}
                    rows={2}
                    style={{ width: '100%', padding: 8, borderRadius: 8 }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                    <button onClick={() => void runTool('extract_schema')} disabled={toolBusy}>
                        {toolBusy ? <Loader2 size={14} /> : null} Извлечь по схеме
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>
                        {toolBusy ? 'выполняется…' : 'действия идут через sidecar /act'}
                    </span>
                </div>
                {toolOutput !== null && (
                    <pre
                        style={{
                            background: '#f8fafc',
                            padding: 8,
                            marginTop: 8,
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
                            fontSize: 12,
                        }}
                    >
                        {toolOutput}
                    </pre>
                )}
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0' }}>{t('tasks.history')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((r) => (
                    <div
                        key={r.id}
                        style={{
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: '0.75rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <strong>[{r.capability}]</strong>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: r.status === 'error' ? '#dc2626' : '#059669',
                                }}
                            >
                                {r.status}
                            </span>
                            {r.turns !== undefined && (
                                <span style={{ fontSize: 11 }}>turns {r.turns}</span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                {new Date(r.at).toLocaleTimeString()}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>{r.task}</div>
                        {r.output && (
                            <pre
                                style={{
                                    background: '#f8fafc',
                                    padding: 8,
                                    overflowX: 'auto',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {r.output}
                            </pre>
                        )}
                        {r.screenshot && (
                            <img
                                src={`data:image/png;base64,${r.screenshot}`}
                                alt="run screenshot"
                                style={{ maxWidth: '100%', borderRadius: 6, marginTop: 6 }}
                            />
                        )}
                        {r.status === 'done' && r.capability === 'browser' && (
                            <button
                                onClick={() => void saveToCrystal(r)}
                                disabled={savingId === r.id}
                                style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    padding: '4px 10px',
                                    border: '1px solid var(--border)',
                                    borderRadius: 6,
                                    background: 'transparent',
                                    color: 'var(--slate-200)',
                                    cursor: savingId === r.id ? 'default' : 'pointer',
                                }}
                                title="Сохранить результат как факт в Crystal Vault"
                            >
                                {savingId === r.id ? 'Сохранение…' : '💎 В Crystal Vault'}
                            </button>
                        )}
                    </div>
                ))}
                {history.length === 0 && <div style={{ color: '#64748b' }}>{t('tasks.empty')}</div>}
            </div>
        </div>
    );
};

function capStyle(active: boolean): React.CSSProperties {
    return {
        padding: '6px 12px',
        borderRadius: 8,
        border: active ? '1px solid #3b82f6' : '1px solid var(--border)',
        background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
        color: active ? '#60a5fa' : 'inherit',
        cursor: 'pointer',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
    };
}

export default AgentTasksPanel;
