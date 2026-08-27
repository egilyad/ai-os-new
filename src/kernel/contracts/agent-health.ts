export type AgentHealth = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface AgentHealthSnapshot {
  agentId: string;
  health: AgentHealth;
  errorRate: number;
  avgLatency: number;
  p95Latency: number;
  consecutiveErrors: number;
  totalCalls: number;
  lastUpdated: number;
}
