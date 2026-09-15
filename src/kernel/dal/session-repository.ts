/**
 * SessionRepository — DAL wrapper for chat sessions
 * 
 * Provides typed access to chat conversation history.
 */

import type { DatabaseService } from '../services/database-service';
import type { ChatSession } from '../contracts/storage/session-store';

const MAX_SESSIONS = 500;

export class SessionRepository {
  private cache: Map<string, ChatSession> = new Map();
  private cacheLoaded = false;
  private cachePromise: Promise<void> | null = null;
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  private async ensureCache(): Promise<void> {
    if (this.cacheLoaded) return;
    if (!this.cachePromise) {
      this.cachePromise = this._loadCache().catch(err => { this.cachePromise = null; throw err; });
    }
    await this.cachePromise;
  }

  private async _loadCache(): Promise<void> {
    const sessions = await this.db.sessions
      .orderBy('updatedAt')
      .reverse()
      .limit(MAX_SESSIONS)
      .toArray();
    
    this.cache.clear();
    for (const session of sessions) {
      this.cache.set(session.id, session);
    }
    this.cacheLoaded = true;
  }

  async getAll(): Promise<ChatSession[]> {
    await this.ensureCache();
    return Array.from(this.cache.values()).map(s => ({ ...s }));
  }

  async get(id: string): Promise<ChatSession | undefined> {
    await this.ensureCache();
    
    if (this.cache.has(id)) {
      return { ...this.cache.get(id)! };
    }
    
    const session = await this.db.sessions.get(id);
    if (session) {
      this.cache.set(session.id, session);
    }
    return session ? { ...session } : undefined;
  }

  async save(session: ChatSession): Promise<void> {
    // OCC: read current version, skip stale writes, auto-increment
    const current = await this.db.sessions.get(session.id);
    const currentVersion = (current as { version?: number })?.version ?? 0;
    const incomingVersion = (session as { version?: number })?.version ?? 0;
    if (incomingVersion > 0 && incomingVersion < currentVersion) return;
    const newVersion = Math.max(currentVersion, incomingVersion) + 1;
    const record = { ...session, version: newVersion };
    await this.db.sessions.put(record);
    this.cache.set(session.id, record);
    await this.enforceLimit();
  }

  async delete(id: string): Promise<void> {
    await this.db.sessions.delete(id);
    this.cache.delete(id);
  }

  async listRecent(limit: number = 20): Promise<ChatSession[]> {
    await this.ensureCache();
    
    return Array.from(this.cache.values())
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, limit)
      .map(s => ({ ...s }));
  }

  /** Clear the in-memory cache so next read goes to Dexie (cross-tab sync) */
  clearCache(): void {
    this.cache.clear();
    this.cacheLoaded = false;
    this.cachePromise = null;
  }

  private async enforceLimit(): Promise<void> {
    if (this.cache.size <= MAX_SESSIONS) return;
    
    // B10-166: Only evict from cache, never from database
    const sorted = Array.from(this.cache.values())
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, MAX_SESSIONS);

    this.cache.clear();
    for (const session of sorted) {
      this.cache.set(session.id, session);
    }
  }
}