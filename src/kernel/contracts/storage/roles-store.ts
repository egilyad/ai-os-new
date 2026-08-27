import type { Role } from '../../types/role-types';
export type { Role };

export interface RolesStore {
  loadAll(): Promise<Role[]>;
  saveAll(roles: Role[]): Promise<void>;
  toArray(): Promise<Role[]>;
  bulkAdd(roles: Role[]): Promise<void>;
  bulkPut(roles: Role[]): Promise<void>;
  count(): Promise<number>;
  clear(): Promise<void>;
  exportAll(): Promise<string>;
  importAll(payload: string): Promise<void>;
}
