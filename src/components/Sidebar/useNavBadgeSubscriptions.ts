import { useEffect } from 'react';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useNotificationStore } from '../../stores/useNotificationStore';

const ROUTE_MAP: Partial<Record<keyof typeof EVENTS, string[]>> = {
    DEBATE_ENDED: ['debate'],
    DEBATE_VERDICT_GENERATED: ['debate'],
    DEBATE_SESSION_CONFLICT: ['debate'],
    BUDGET_ALERT: ['pricing'],
    PRESSURE_ALERT_RAISED: ['diagnostics'],
    KEYSTATE_REMOVED: ['providers'],
    KEY_QUOTA_EXCEEDED: ['providers'],
    KEY_HEALTH_CHECK_FAILED: ['providers'],
    WEBHOOK_DELIVERY_FAILED: ['webhooks'],
    QUEUE_TASK_FAILED: ['tools'],
    ADVISOR_SUGGESTION: ['system'],
};

export function useNavBadgeSubscriptions(): void {
    const increment = useNotificationStore((s) => s.increment);
    const clear = useNotificationStore((s) => s.clear);

    useEffect(() => {
        const unsubs: (() => void)[] = [];

        for (const [eventConst, routeIds] of Object.entries(ROUTE_MAP)) {
            const ev = EVENTS[eventConst as keyof typeof EVENTS];
            if (!ev) continue;
            const handler = () => {
                for (const id of routeIds) increment(id);
            };
            unsubs.push(eventBus.on(ev as (typeof EVENTS)[keyof typeof EVENTS], handler));
        }

        return () => {
            for (const unsub of unsubs) unsub();
        };
    }, [increment, clear]);
}
