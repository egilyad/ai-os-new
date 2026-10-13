import React, { useState } from 'react';
import { MonitorPlay, Loader2, AlertTriangle, SquareTerminal, Crosshair } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { agemsApprovalService } from '../../kernel/services/agems-approval-service';
import { browserUseService } from '../../kernel/instances/services-extras';
import { computerUseLoopService } from '../../kernel/instances/services-extras';
import type { ComputerUseProvider } from '../../kernel/services/computer/computer-use-loop-service';

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
    const [history, setHistory] = useState<RunRecord[]>([]);

    function pushHistory(patch: Partial<RunRecord> & { id: number }) {
        setHistory((prev) => prev.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)));
    }

    async function runBrowser(id: number, agent: string, text: string, maxSteps: number): Promise<void> {
        const req = await agemsApprovalService.requestApproval({
            agentId: agent,
            toolName: 'browser.act',
            toolInput: { task: text },
            category: 'browser',
            riskLevel: 'medium',
            description: `tasks panel: ${text.slice(0, 200)}`,
        });
        await agemsApprovalService.resolve(req.id as number, 'APPROVED', undefined, 'ui:direct:tasks');
        const res = await browserUseService.execute(text, { maxSteps });
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
        await agemsApprovalService.resolve(req.id as number, 'APPROVED', undefined, 'ui:direct:tasks');
        const res = await computerUseLoopService.runApproved({
            task: text,
            approvedRequestId: req.id as number,
            maxTurns: turns,
            provider: prov,
        });
        pushHistory({
            id,
            status: 'done',
            output: `${res.stopReason} · turns ${res.turns} · calls ${res.computerCalls}\n${res.output}`.slice(0, 2000),
            screenshot: res.lastScreenshot,
            turns: res.turns,
        });
    }

    async function onRun(): Promise<void> {
        const text = task.trim();
        if (!text || running) return;
        setError(null);
        setRunning(true);
        const id = ++runSeq;
        const agent = agentId.trim() || 'ui-tasks';
        const turns = Math.max(1, Math.min(50, Math.floor(Number(maxTurns) || 10)));
        setHistory((prev) => [{ id, capability, task: text, status: 'running' as const, output: '', at: Date.now() }, ...prev].slice(0, 20));
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
        }
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <MonitorPlay size={20} />
                <h2 style={{ margin: 0 }}>{t('tasks.title')}</h2>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
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
                        <select value={provider} onChange={(e) => setProvider(e.target.value as ComputerUseProvider)}>
                            <option value="anthropic">anthropic</option>
                            <option value="gemini-computer">gemini-computer</option>
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
                    />
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
                    <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{t('tasks.hitl_note')}</span>
                </div>
                {error && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#dc2626', marginTop: '0.5rem' }}>
                        <AlertTriangle size={16} /> <span>{error}</span>
                    </div>
                )}
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0' }}>{t('tasks.history')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((r) => (
                    <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <strong>[{r.capability}]</strong>
                            <span style={{ fontSize: 11, color: r.status === 'error' ? '#dc2626' : '#059669' }}>{r.status}</span>
                            {r.turns !== undefined && <span style={{ fontSize: 11 }}>turns {r.turns}</span>}
                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{new Date(r.at).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>{r.task}</div>
                        {r.output && (
                            <pre style={{ background: '#f8fafc', padding: 8, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
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
