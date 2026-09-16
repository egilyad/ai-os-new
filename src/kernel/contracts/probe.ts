export type ProbeStatus = 'ready' | 'degraded' | 'limited' | 'broken' | 'unknown';

export interface ProbeResult {
  status: ProbeStatus;
  provider: string;
  keyId: string;
  keyLabel: string;
  model: string;
  latency: number;
  quotaRemaining?: number;
  quotaLimit?: number;
  rateLimited: boolean;
  circuitOpen: boolean;
  error?: string;
  statusCode?: number;
  timestamp: number;
  responseContent?: string;
  /** Per-model health from multi-model probe — 'ok' if model responded, 'failed' if it errored */
  modelHealth?: Record<string, 'ok' | 'failed'>;
}

export interface IProbeService {
  probeKey(keyId: string, model?: string): Promise<ProbeResult>;
  probeAll(): Promise<ProbeResult[]>;
  probeForDebate(participants: Array<{ id: string; provider?: string; modelId?: string }>): Promise<Map<string, ProbeResult>>;
}
