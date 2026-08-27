export type SessionStatus = 'pending' | 'active' | 'completed' | 'errored' | 'cancelled';

export interface SessionTokenUsage {
  input: number;
  output: number;
  total: number;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface ProviderSessionSnapshot {
  readonly id: string;
  readonly instanceId: string;
  readonly provider: string;
  readonly model: string;
  readonly status: SessionStatus;
  readonly startedAt: number;
  readonly completedAt: number | null;
  readonly latency: number;
  readonly tokens: SessionTokenUsage;
  readonly cost: number;
  readonly error: string | null;
  readonly timedOut: boolean;
}

export class ProviderSession {
  readonly id: string;
  readonly instanceId: string;
  readonly provider: string;
  readonly model: string;
  readonly startedAt: number;
  status: SessionStatus = 'pending';
  completedAt: number | null = null;
  latency = 0;
  tokens: SessionTokenUsage = { input: 0, output: 0, total: 0 };
  cost = 0;
  error: string | null = null;
  // B10-71: Track whether session was activated to prevent budget corruption
  private _wasActivated = false;

  private _onComplete: ((session: ProviderSession) => void) | null = null;

  constructor(
    instanceId: string,
    provider: string,
    model: string,
    sessionId?: string
  ) {
    this.id = sessionId ?? crypto.randomUUID().slice(0, 12);
    this.instanceId = instanceId;
    this.provider = provider;
    this.model = model;
    this.startedAt = Date.now();
  }

  activate(): void {
    this._wasActivated = true;
    this.status = 'active';
  }

  recordTokens(input: number, output: number): void {
    this.tokens.input += input;
    this.tokens.output += output;
    this.tokens.total = this.tokens.input + this.tokens.output;
  }

  recordCost(cost: number): void {
    this.cost += cost;
  }

  complete(latency: number): void {
    // B10-72: Guard against double-completion to prevent budget double-decrement
    if (this.status === 'completed' || this.status === 'errored' || this.status === 'cancelled') return;
    this.status = 'completed';
    this.completedAt = Date.now();
    this.latency = latency;
    // B10-71: Only fire onComplete if session was activated (budget.startSession was called)
    if (this._wasActivated) this._onComplete?.(this);
  }

  fail(error: string): void {
    // B10-72: Guard against double-fail
    if (this.status === 'completed' || this.status === 'errored' || this.status === 'cancelled') return;
    this.status = 'errored';
    this.completedAt = Date.now();
    this.error = error;
    if (this._wasActivated) this._onComplete?.(this);
  }

  cancel(): void {
    // B10-72: Guard against double-cancel
    if (this.status === 'completed' || this.status === 'errored' || this.status === 'cancelled') return;
    this.status = 'cancelled';
    this.completedAt = Date.now();
    if (this._wasActivated) this._onComplete?.(this);
  }

  onComplete(cb: (session: ProviderSession) => void): void {
    this._onComplete = cb;
  }

  snapshot(): ProviderSessionSnapshot {
    return {
      id: this.id,
      instanceId: this.instanceId,
      provider: this.provider,
      model: this.model,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      latency: this.latency,
      tokens: { ...this.tokens },
      cost: this.cost,
      error: this.error,
      timedOut: this.isTimedOut(),
    };
  }

  getDuration(): number {
    const end = this.completedAt ?? Date.now();
    return end - this.startedAt;
  }

  isTimedOut(): boolean {
    return (this.status === 'pending' || this.status === 'active') && Date.now() - this.startedAt > SESSION_TIMEOUT_MS;
  }

  static SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MS;
}
