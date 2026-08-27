import { EVENT_REGISTRY, type EventMap } from './event-registry';

export const ObservabilityEvents = {
    TIMELINE_EVENT_ADDED: EVENT_REGISTRY.TIMELINE_EVENT_ADDED.name,
    TIMELINE_CLEARED: EVENT_REGISTRY.TIMELINE_CLEARED.name,
    METRICS_SNAPSHOT: EVENT_REGISTRY.METRICS_SNAPSHOT.name,
    METRICS_ALERT: EVENT_REGISTRY.METRICS_ALERT.name,
    METRICS_ALERT_RESOLVED: EVENT_REGISTRY.METRICS_ALERT_RESOLVED.name,
    TRACE_UPDATED: EVENT_REGISTRY.TRACE_UPDATED.name,
    SYSTEM_HEALTH_CHANGED: EVENT_REGISTRY.SYSTEM_HEALTH_CHANGED.name,
    ERROR_BOUNDARY_CAUGHT: EVENT_REGISTRY.ERROR_BOUNDARY_CAUGHT.name,
} as const;

export type ObservabilityEventMap = Pick<
    EventMap,
    | 'observability:timeline:event:added'
    | 'observability:timeline:cleared'
    | 'observability:metrics:snapshot'
    | 'observability:metrics:alert'
    | 'observability:metrics:alert:resolved'
    | 'observability:trace:updated'
    | 'observability:health:changed'
    | 'observability:error:boundary:caught'
>;
