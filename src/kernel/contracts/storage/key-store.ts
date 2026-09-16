import type { ApiKey } from '../../types/metrics-types';

export interface KeyStore {
  saveKey(key: ApiKey): Promise<void>;
  getKey(id: string): Promise<ApiKey | null>;
  listKeys(): Promise<ApiKey[]>;
  deleteKey(id: string): Promise<void>;
  bulkPut(keys: ApiKey[]): Promise<void>;
  bulkAdd(keys: ApiKey[]): Promise<void>;
  where(field: string, value: string): Promise<ApiKey | undefined>;
  exportAll(): Promise<string>;
  importAll(payload: string): Promise<void>;
  clear(): Promise<void>;
}
