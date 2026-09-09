import type { IProviderInstance, InstanceStatus } from './provider-instance';

export interface RuntimeProviderMetric {
  readonly instanceId: string;
  readonly provider: string;
  readonly status: InstanceStatus;
  readonly concurrent: number;
  readonly avgLatency: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly loadFactor: number;
  readonly healthy: boolean;
}

export interface RuntimeStateSnapshot {
  readonly instances: RuntimeProviderMetric[];
  readonly totalActive: number;
  readonly totalDead: number;
  readonly totalBackoff: number;
  readonly totalIdle: number;
  readonly globalErrorRate: number;
  readonly globalLoadFactor: number;
  readonly timestamp: number;
}

export class ProviderRuntimeState {
  private instances = new Map<string, IProviderInstance>();
  private listeners: Array<(snapshot: RuntimeStateSnapshot) => void> = [];
  private interval: ReturnType<typeof setInterval> | null = null;

  register(instance: IProviderInstance): void {
    this.instances.set(instance.id, instance);
  }

  unregister(instanceId: string): void {
    this.instances.delete(instanceId);
  }

  getInstance(instanceId: string): IProviderInstance | undefined {
    return this.instances.get(instanceId);
  }

  getInstancesByProvider(provider: string): IProviderInstance[] {
    return Array.from(this.instances.values()).filter(
      i => i.key.provider.toLowerCase() === provider.toLowerCase()
    );
  }

  getAllInstances(): IProviderInstance[] {
    return Array.from(this.instances.values());
  }

  snapshot(): RuntimeStateSnapshot {
    const allInstances = this.getAllInstances();
    const metrics: RuntimeProviderMetric[] = allInstances.map(i => ({
      instanceId: i.id,
      provider: i.key.provider,
      status: i.status,
      concurrent: i.concurrent,
      avgLatency: i.avgLatency,
      successCount: i.successCount,
      errorCount: i.errorCount,
      loadFactor: i.getLoadFactor(),
      healthy: i.getHealth().healthy,
    }));

    const totalActive = metrics.filter(m => m.status === 'active').length;
    const totalDead = metrics.filter(m => m.status === 'dead').length;
    const totalBackoff = metrics.filter(m => m.status === 'backoff').length;
    const totalIdle = metrics.filter(m => m.status === 'idle').length;

    const unhealthyCount = metrics.filter(m => !m.healthy).length;
    const globalErrorRate = metrics.length > 0
      ? unhealthyCount / metrics.length
      : 0;

    const globalLoadFactor = allInstances.length > 0
      ? allInstances.reduce((s, i) => s + i.getLoadFactor(), 0) / allInstances.length
      : 0;

    const snapshot: RuntimeStateSnapshot = {
      instances: metrics,
      totalActive,
      totalDead,
      totalBackoff,
      totalIdle,
      globalErrorRate,
      globalLoadFactor,
      timestamp: Date.now(),
    };

    return snapshot;
  }

  onUpdate(cb: (snapshot: RuntimeStateSnapshot) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  /** Immediately emit current snapshot to all listeners — SI-52 */
  emitImmediate(): void {
    const snap = this.snapshot();
    for (const cb of this.listeners) cb(snap);
  }

  startAutoRefresh(intervalMs = 10000): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.emitImmediate();
    }, intervalMs);
  }

  stopAutoRefresh(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  destroy(): void {
    this.stopAutoRefresh();
    this.listeners = [];
    this.instances.clear();
  }
}
