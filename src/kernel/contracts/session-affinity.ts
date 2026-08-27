export interface SessionBinding {
  sessionId: string;
  keyId: string;
  participantId?: string;
  provider: string;
  boundAt: number;
  pendingEviction?: boolean;
  pendingEvictionAt?: number;
}

export const PENDING_TTL = 300_000; // 5 min

export interface ISessionAffinityStore {
  bind(sessionId: string, keyId: string, provider: string, participantId?: string): void;
  getBoundKey(sessionId: string, participantId?: string): SessionBinding | undefined;
  isSessionBound(sessionId: string): boolean;
  unbind(sessionId: string, participantId?: string): void;
  unbindAll(): void;
  getAllBindings(): SessionBinding[];
  evictUnhealthy(isHealthy: (keyId: string) => boolean): string[];
  /** React to key:state:changed — reads projected truth from KeyStateStore */
  handleStateChange(keyId: string): void;
}
