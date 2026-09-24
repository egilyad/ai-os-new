import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('VerifyGate');

/**
 * B4: verify-gate — изменение → проверка → откат.
 *
 * Generic runner без своих зависимостей: snapshot/apply/verify/rollback
 * инжектятся вызовом. Ничего не знает про SRE/роутер/ключи.
 * История гейтов — опциональный KV-стор (наблюдаемость, не источник правды).
 */
export interface GatedChange<T> {
    label: string;
    snapshot: () => Promise<unknown> | unknown;
    apply: () => Promise<T> | T;
    verify: (snap: unknown) => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string };
    rollback: (snap: unknown) => Promise<void> | void;
}

export interface GateRecord {
    label: string;
    ok: boolean;
    rolledBack: boolean;
    verifyDetail: string;
    at: number;
}

export interface VerifyGateStore {
    getKv: <T>(id: string) => Promise<T | null>;
    setKv: <T>(id: string, value: T) => Promise<void>;
}

const HISTORY_KEY = 'verify_gate_history';
const HISTORY_CAP = 100;

export async function runGatedChange<T>(
    change: GatedChange<T>,
    store?: VerifyGateStore,
): Promise<{ result: T | null; gate: GateRecord }> {
    let snap: unknown;
    try {
        snap = await change.snapshot();
    } catch (e) {
        const gate: GateRecord = {
            label: change.label,
            ok: false,
            rolledBack: false,
            verifyDetail: `snapshot failed: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500),
            at: Date.now(),
        };
        await recordGate(store, gate);
        return { result: null, gate };
    }
    let result: T | null;
    try {
        result = await change.apply();
    } catch (e) {
        const gate: GateRecord = {
            label: change.label,
            ok: false,
            rolledBack: false,
            verifyDetail: `apply failed: ${e instanceof Error ? e.message : String(e)}`,
            at: Date.now(),
        };
        await recordGate(store, gate);
        return { result: null, gate };
    }
    let verdict: { ok: boolean; detail: string };
    try {
        verdict = await change.verify(snap);
    } catch (e) {
        verdict = { ok: false, detail: `verify crashed: ${e instanceof Error ? e.message : String(e)}` };
    }
    let rolledBack = false;
    if (!verdict.ok) {
        try {
            await change.rollback(snap);
            rolledBack = true;
        } catch (e) {
            LOGGER.warn('gate', 'rollback failed', {
                label: change.label,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }
    const gate: GateRecord = {
        label: change.label,
        ok: verdict.ok,
        rolledBack,
        verifyDetail: verdict.detail.slice(0, 500),
        at: Date.now(),
    };
    LOGGER.info('gate', verdict.ok ? 'passed' : 'regressed', {
        label: change.label,
        rolledBack,
        detail: gate.verifyDetail,
    });
    await recordGate(store, gate);
    return { result, gate };
}

async function recordGate(store: VerifyGateStore | undefined, gate: GateRecord): Promise<void> {
    if (!store) return;
    try {
        const hist = (await store.getKv<GateRecord[]>(HISTORY_KEY)) || [];
        hist.unshift(gate);
        await store.setKv(HISTORY_KEY, hist.slice(0, HISTORY_CAP));
    } catch {
        /* history best-effort */
    }
}
