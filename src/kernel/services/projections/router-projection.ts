import type { KernelEvent } from '../../contracts/event-log';
import type { Projection } from '../../contracts/projection';

export interface ProjectedDecision {
  requestId: string;
  strategy: string;
  selected: string;
  secondBest: string | null;
  scores: Array<{ provider: string; score: string; components?: unknown }>;
  skipped: Array<{ provider: string; keyLabel: string; keyId?: string; reason: string; stage: string }>;
  classification?: { complexity: string; isCode: boolean; isLong: boolean; isMultimodal: boolean };
  profile?: string;
  isExperiment?: boolean;
  timestamp: number;
}

export class RouterProjection implements Projection<Map<string, ProjectedDecision>> {
  private decisions = new Map<string, ProjectedDecision>();

  reduce(event: KernelEvent): void {
    if (event.type !== 'system:decision') return;

    const p = event.payload as Record<string, unknown>;
    if (!p || typeof p.requestId !== 'string') return;

    this.decisions.set(p.requestId, {
      requestId: p.requestId,
      strategy: typeof p.strategy === 'string' ? p.strategy : '',
      selected: typeof p.selected === 'string' ? p.selected : '',
      secondBest: typeof p.secondBest === 'string' ? p.secondBest : null,
      scores: Array.isArray(p.scores) ? (p.scores as Array<{ provider: string; score: string; components?: unknown }>).filter(s => s && typeof s.provider === 'string') : [],
      skipped: Array.isArray(p.skipped) ? (p.skipped as Array<{ provider: string; keyLabel: string; keyId?: string; reason: string; stage: string }>).filter(s => s && typeof s.provider === 'string') : [],
      classification: p.classification && typeof p.classification === 'object' ? p.classification as { complexity: string; isCode: boolean; isLong: boolean; isMultimodal: boolean } : undefined,
      profile: typeof p.profile === 'string' ? p.profile : undefined,
      isExperiment: typeof p.isExperiment === 'boolean' ? p.isExperiment : undefined,
      timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
    });
  }

  getState(): Map<string, ProjectedDecision> {
    return new Map(this.decisions);
  }

  getSnapshot(): ProjectedDecision[] {
    return [...this.decisions.values()].sort((a, b) => b.timestamp - a.timestamp);
  }

  /** Explicit deterministic snapshot ABI — deep clone via structuredClone */
  cloneSnapshot(): ProjectedDecision[] {
    return structuredClone(this.getSnapshot());
  }

  getByRequestId(id: string): ProjectedDecision | undefined {
    return this.decisions.get(id);
  }

  reset(): void {
    this.decisions.clear();
  }
}
