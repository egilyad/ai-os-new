export interface SecretRef {
  path: string;
  version?: string;
}

export interface SecretStoreConfig {
  type: 'local' | 'vault' | 'aws' | 'gcp';
  label: string;
  endpoint?: string;
  auth?: string;
  mount?: string;
  region?: string;
  projectId?: string;
  timeoutMs?: number;
}

export interface SecretStore {
  readonly type: SecretStoreConfig['type'];
  readonly label: string;
  init(config: SecretStoreConfig): Promise<boolean>;
  get(ref: SecretRef): Promise<string | null>;
  set(ref: SecretRef, value: string): Promise<boolean>;
  delete(ref: SecretRef): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
  health(): Promise<boolean>;
}
