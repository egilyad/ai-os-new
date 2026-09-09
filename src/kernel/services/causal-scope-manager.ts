import type { ICausalScopeManager, CausalScope, CausalScopeConfig } from '../contracts/causal-debugger';

let seq = 0;
function generateCausalId(): string {
  seq += 1;
  return `causal-${Date.now()}-${seq}`;
}

export class CausalScopeManager implements ICausalScopeManager {
  private scopes = new Map<string, CausalScope>();
  private requestToCausal = new Map<string, string>();
  private readonly MAX_SCOPES = 100;

  constructor(private config: CausalScopeConfig = {
    maxScopeSize: 10,
    snapshotInterval: 50,
    entropyThreshold: 0.3,
  }) {}

  destroy(): void {
    this.scopes.clear();
    this.requestToCausal.clear();
  }

  private evictOldestScope(): void {
    const oldest = this.scopes.entries().next().value;
    if (oldest) {
      const scope = oldest[1];
      for (const rid of scope.requestIds) this.requestToCausal.delete(rid);
      this.scopes.delete(oldest[0]);
    }
  }

  getConfig(): CausalScopeConfig {
    return { ...this.config };
  }

  resolveScope(requestId: string, providerIds: string[], keyIds: string[]): CausalScope {
    const existing = this.requestToCausal.get(requestId);
    if (existing) {
      const scope = this.scopes.get(existing);
      if (scope) return scope;
    }

    // Find overlapping scope by provider or key IDs
    for (const scope of this.scopes.values()) {
      const providerOverlap = scope.providerIds.some(p => providerIds.includes(p));
      const keyOverlap = scope.keyIds.some(k => keyIds.includes(k));
      if (providerOverlap || keyOverlap) {
        if (scope.requestIds.length >= this.config.maxScopeSize) break; // scope full — create new
        // Merge into existing scope
        scope.requestIds.push(requestId);
        for (const p of providerIds) { if (!scope.providerIds.includes(p)) scope.providerIds.push(p); }
        for (const k of keyIds) { if (!scope.keyIds.includes(k)) scope.keyIds.push(k); }
        this.requestToCausal.set(requestId, scope.causalId);
        return scope;
      }
    }

    // Create new scope
    if (this.scopes.size >= this.MAX_SCOPES) this.evictOldestScope();
    const causalId = generateCausalId();
    const scope: CausalScope = {
      causalId,
      requestIds: [requestId],
      startedAt: Date.now(),
      providerIds: [...providerIds],
      keyIds: [...keyIds],
    };
    this.scopes.set(causalId, scope);
    this.requestToCausal.set(requestId, causalId);
    return scope;
  }

  getScope(causalId: string): CausalScope | undefined {
    return this.scopes.get(causalId);
  }

  getAllScopes(): CausalScope[] {
    return Array.from(this.scopes.values());
  }
}
