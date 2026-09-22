import {
    listWakeups,
    ackWakeup,
    heartbeatCompany,
    isOverBudget,
    startRun,
    appendRunEvent,
    finishRun,
    logActivity,
} from './company-store.mjs';
import { consumeAutocycleSlot } from './autocycle-guard.mjs';

const DEFAULT_POLL_MS = parseInt(process.env.HEARTBEAT_POLL_MS || '15000', 10);
const DEFAULT_BATCH = parseInt(process.env.HEARTBEAT_BATCH || '10', 10);

export function processPendingWakeups({ batch = DEFAULT_BATCH, onEvent } = {}) {
    const pending = listWakeups(true).slice(0, batch);
    const results = [];
    for (const w of pending) {
        // Фаза 0: автономный путь (schedule) — за kill-switch и лимитом итераций.
        // Ручные триггеры идут как раньше без гарда.
        if (w.trigger === 'schedule') {
            const slot = consumeAutocycleSlot(w.companyId);
            if (!slot.allowed) {
                ackWakeup(w.id, 'error', `autocycle blocked: ${slot.reason}`);
                try {
                    logActivity(w.companyId, 'autocycle_blocked', `${w.id}: ${slot.reason}`);
                } catch {
                    /* trail best-effort */
                }
                results.push({ id: w.id, ok: false, reason: slot.reason });
                onEvent?.({
                    type: 'wakeup_error',
                    wakeupId: w.id,
                    companyId: w.companyId,
                    reason: `autocycle blocked: ${slot.reason}`,
                });
                continue;
            }
        }
        // M5.1: каждый wakeup исполняется как run с трейсом шагов протокола.
        let run = null;
        try {
            run = startRun({
                companyId: w.companyId,
                agentId: w.agentId || null,
                trigger: w.trigger,
                ref: w.ref,
                wakeupId: w.id,
            });
        } catch (e) {
            ackWakeup(w.id, 'error', e instanceof Error ? e.message : String(e));
            results.push({ id: w.id, ok: false, reason: e instanceof Error ? e.message : String(e) });
            onEvent?.({ type: 'wakeup_error', wakeupId: w.id, reason: String(e) });
            continue;
        }
        const step = (s, d) => {
            try {
                appendRunEvent(run.id, s, d);
            } catch {
                /* trace best-effort */
            }
        };
        try {
            step('assignments', `review wakeup ${w.id}`);
            step('pick', `trigger=${w.trigger}`);
            // M7.1 hard-stop: бюджет исчерпан — heartbeat блокируется, эскалация менеджеру.
            const gate = isOverBudget(w.companyId, w.agentId || null);
            if (gate.over) {
                step('checkout', 'blocked: budget gate');
                finishRun(run.id, 'error', `budget exhausted (${gate.scope})`);
                ackWakeup(w.id, 'error', `budget exhausted (${gate.scope})`);
                results.push({
                    id: w.id,
                    ok: false,
                    reason: 'budget exhausted',
                    scope: gate.scope,
                    runId: run.id,
                });
                onEvent?.({
                    type: 'wakeup_error',
                    wakeupId: w.id,
                    companyId: w.companyId,
                    runId: run.id,
                    reason: `budget exhausted (${gate.scope})`,
                });
                continue;
            }
            step('checkout', `agent=${w.agentId || '-'}`);
            const company = heartbeatCompany(
                w.companyId,
                `[${w.trigger}] agent=${w.agentId || '-'} ref=${w.ref || '-'}`,
            );
            if (!company) {
                finishRun(run.id, 'error', 'company not found');
                ackWakeup(w.id, 'error', 'company not found');
                results.push({ id: w.id, ok: false, reason: 'company not found', runId: run.id });
                onEvent?.({ type: 'wakeup_error', wakeupId: w.id, runId: run.id, reason: 'company not found' });
                continue;
            }
            step('work', `heartbeat #${company.heartbeats}`);
            finishRun(run.id, 'done', `heartbeat #${company.heartbeats}`);
            ackWakeup(w.id, 'done', `heartbeat #${company.heartbeats}`);
            try {
                logActivity(w.companyId, 'heartbeat', `#${company.heartbeats} via ${w.trigger} ${w.id}`);
            } catch {
                /* trail best-effort */
            }
            results.push({ id: w.id, ok: true, heartbeats: company.heartbeats, runId: run.id });
            onEvent?.({
                type: 'wakeup_done',
                wakeupId: w.id,
                companyId: w.companyId,
                runId: run.id,
                heartbeats: company.heartbeats,
            });
        } catch (e) {
            try {
                finishRun(run.id, 'error', e instanceof Error ? e.message : String(e));
            } catch {
                /* ignore */
            }
            ackWakeup(w.id, 'error', e instanceof Error ? e.message : String(e));
            results.push({ id: w.id, ok: false, reason: e instanceof Error ? e.message : String(e), runId: run.id });
            try {
                logActivity(w.companyId, 'wakeup_error', `${w.id}: ${e instanceof Error ? e.message : String(e)}`.slice(0, 300));
            } catch {
                /* trail best-effort */
            }
            onEvent?.({ type: 'wakeup_error', wakeupId: w.id, runId: run.id, reason: String(e) });
        }
    }
    return results;
}

export function startHeartbeatLoop({ pollMs = DEFAULT_POLL_MS, onEvent } = {}) {
    if (!Number.isFinite(pollMs) || pollMs < 1000) pollMs = DEFAULT_POLL_MS;
    let stopped = false;
    const tick = () => {
        if (stopped) return;
        try {
            processPendingWakeups({ onEvent });
        } catch (e) {
            console.error('[heartbeat-loop] tick error:', e instanceof Error ? e.message : e);
        }
    };
    const timer = setInterval(tick, pollMs);
    if (timer.unref) timer.unref();
    return {
        stop() {
            stopped = true;
            clearInterval(timer);
        },
    };
}
