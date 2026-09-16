export interface ConfigStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  exportAll(): Promise<string>;
  importAll(payload: string): Promise<void>;
}
