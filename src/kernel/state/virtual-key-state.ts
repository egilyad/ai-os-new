export interface VirtualKeyStateSnapshot {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  keys: Array<{
    id: string;
    realKeyId: string;
    provider: string;
    label: string;
    active: boolean;
    createdAt: number;
    lastUsedAt?: number;
  }>;
}
