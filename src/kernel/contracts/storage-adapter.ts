/** Low-level sync localStorage adapter — do NOT use for generic storage. Use BucketBucketStorageAdapter (async, bucket-based) instead. */
export interface ILocalStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
}
