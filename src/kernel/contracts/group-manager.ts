import type { Result } from './results';
import type { ApiKey } from '../types/metrics-types';

/** Immutable record of every key's origin and group assignment */
export interface KeyPassport {
  keyId: string;
  keyLabel: string;
  provider: string;
  groupId: string;
  groupName: string;
  account?: string;
  accountId?: string;
  status: string;
  createdAt: number;
  source: 'ui' | 'import' | 'rotation' | 'console' | 'migration' | 'seed';
}

/** A named group of API keys — the only source of truth for group membership */
export interface KeyGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  keyIds: string[];
}

export interface IGroupManager {
  /** True after passports and groups are loaded from storage */
  readonly ready: boolean;
  /** Create a new group and return its id */
  createGroup(name: string, description?: string): Promise<string>;

  /** Delete a group and un-assign its keys (they go to the default group) */
  deleteGroup(id: string): Promise<void>;

  /** List all groups */
  getGroups(): KeyGroup[];

  /** Get a single group */
  getGroup(id: string): KeyGroup | undefined;

  /** Rename a group */
  renameGroup(id: string, name: string): Promise<void>;

  /** Add a key to a group (removes from previous group). Auto-creates group if name is new. */
  assignKeyToGroup(keyId: string, groupName: string): Promise<void>;

  /** Get all keys in a group */
  getKeysByGroup(groupId: string): string[];

  /** Get the passport for a key — throws if missing (should never happen) */
  getPassport(keyId: string): KeyPassport | undefined;

  /** Validate that a key has a valid passport and belongs to a group */
  validatePassport(keyId: string): Result<KeyPassport, string>;

  /** Create a key through the group manager (the ONLY way to create keys) */
  createKey(
    data: Omit<ApiKey, 'id' | 'stats'>,
    opts?: { source?: KeyPassport['source']; groupName?: string },
  ): Promise<Result<string, string>>;

  /** Sync all existing keys — creates passports for keys that lack them, assigns ungrouped keys to 'default' */
  syncExistingKeys(): Promise<{ passportAdded: number; assigned: number; reassigned: number }>;

  /** Get the default group (auto-created, never deletable) */
  getDefaultGroup(): KeyGroup;

  /**
   * Get all keys merged with passport data.
   * This is the SINGLE source of truth for reading key state.
   * Every returned key includes passport fields (group, account, source).
   */
  getAllKeys(): ApiKey[];

  /**
   * Get a single key merged with passport data.
   * Returns undefined if key doesn't exist.
   */
  getKeyById(keyId: string): ApiKey | undefined;

  /**
   * Update a key through the group manager.
   * Validates passport exists, delegates to keyService.updateKey(),
   * syncs passport.status/group if changed in updates.
   */
  updateKey(keyId: string, updates: Partial<ApiKey>): Promise<void>;

  /**
   * Delete a key through the group manager.
   * Removes passport, removes from all groups, then delegates to keyService.removeKey().
   */
  deleteKey(keyId: string): Promise<void>;

  /**
   * Sync key status through the group manager.
   * Validates passport, calls keyService.updateKeyStatus(),
   * updates passport.status, emits KEY_STATE_CHANGED.
   */
  syncKeyStatus(keyId: string, status: string, opts?: { reason?: string; latency?: number }): Promise<void>;
}
