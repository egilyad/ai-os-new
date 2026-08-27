import { useState, useEffect, useRef } from 'react';
import { runtime } from '../kernel/runtime';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import type { SystemStatusReport } from '../kernel/contracts/system-status';

const EVENTS_REFRESH = [
    EVENTS.KEY_STATE_CHANGED,
    EVENTS.GROUP_SYNC,
    EVENTS.KEY_ADDED,
    EVENTS.KEY_REMOVED,
    EVENTS.KERNEL_UPDATED,
];
const STALE_AFTER_MS = 30_000;

export interface SystemStatusWithStaleness {
    report: SystemStatusReport;
    lastUpdated: number;
    stalenessMs: number;
}

const _getStatus = (): SystemStatusReport => {
    try {
        return runtime
            .getService<{ getStatus(): SystemStatusReport }>('systemStatusService')
            .getStatus();
    } catch {
        return {} as SystemStatusReport;
    }
};

/** Hook that tracks system status reactively — re-computes on key events + periodic refresh */
export function useSystemStatus(): SystemStatusWithStaleness {
    const [report, setReport] = useState(() => _getStatus());
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const recompute = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                setReport(_getStatus());
                setLastUpdated(Date.now());
                timer = null;
            }, 50);
        };

        const unsubs = EVENTS_REFRESH.map((e) => eventBus.on(e, recompute));

        // OBS-76: periodic refresh to detect staleness when no events fire
        intervalId = setInterval(recompute, STALE_AFTER_MS);

        return () => {
            unsubs.forEach((u) => u());
            if (timer) clearTimeout(timer);
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    const [stalenessMs, setStalenessMs] = useState(0);
    const lastUpdatedRef = useRef(lastUpdated);
    useEffect(() => {
        lastUpdatedRef.current = lastUpdated;
    }, [lastUpdated]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setStalenessMs(Date.now() - lastUpdatedRef.current);
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    return { report, lastUpdated, stalenessMs };
}
