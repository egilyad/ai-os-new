import type { ApiKey, ProviderAlert } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';

export interface KeyAlertsDeps {
  eventBus: {
    emit: (event: string, data?: unknown) => void;
  };
}

export class KeyAlerts {
  constructor(private deps: KeyAlertsDeps) {}

  addAlert(key: ApiKey, alert: { type: string; severity: string; message: string }): void {
    if (!key.stats?.extended) return;

    const newAlert: ProviderAlert = {
      id: `alert-${Date.now()}-${crypto.randomUUID()}`,
      type: alert.type as ProviderAlert['type'],
      severity: alert.severity as ProviderAlert['severity'],
      message: alert.message,
      timestamp: Date.now(),
      resolved: false,
    };

    const lastHour = Date.now() - 3600000;
    const isDuplicate = key.stats.extended.alerts.some(
      a => a.type === alert.type && a.timestamp > lastHour && !a.resolved
    );

    if (!isDuplicate) {
      key.stats.extended.alerts = [newAlert, ...key.stats.extended.alerts].slice(0, 10);
      this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
        message: alert.message,
        type: alert.severity === 'critical' ? 'error' : 'warning',
      });
    }
  }

  getAlerts(keys: ApiKey[]): ProviderAlert[] {
    const alerts: ProviderAlert[] = [];
    for (const key of keys) {
      if (key.stats?.extended?.alerts) {
        alerts.push(...key.stats.extended.alerts.filter(a => !a.resolved));
      }
    }
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  resolveAlert(keys: ApiKey[], alertId: string): void {
    for (const key of keys) {
      const alert = key.stats?.extended?.alerts?.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        // OBS-57: emit alert resolution event
        this.deps.eventBus.emit(EVENTS.KEY_ALERT_RESOLVED, { alertId, keyId: key.id, type: alert.type, severity: alert.severity, resolvedAt: Date.now() });
        return;
      }
    }
  }

  getAlertSummary(keys: ApiKey[]): { total: number; unresolved: number; critical: number } {
    const allAlerts = keys.flatMap(k => k.stats?.extended?.alerts || []);
    return {
      total: allAlerts.length,
      unresolved: allAlerts.filter(a => !a.resolved).length,
      critical: allAlerts.filter(a => a.severity === 'critical' && !a.resolved).length,
    };
  }
}
