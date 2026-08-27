import type { ApiKey } from '../types/metrics-types';

export interface IKeyVaultService {
  unlock(password: string): Promise<boolean>;
  lock(keys?: ApiKey[]): void;
  isLocked(): boolean;
  encryptKey(plaintext: string): Promise<string | null>;
  decryptKey(ciphertext: string): Promise<string | null>;
  decryptAllKeys(keys: ApiKey[]): Promise<ApiKey[]>;
  encryptAllKeys(keys: ApiKey[]): Promise<ApiKey[]>;
  stripPlaintextKeys(keys: ApiKey[]): ApiKey[];
  purgeKey(key: ApiKey): void;
  purgeAll(keys: ApiKey[]): void;
}
