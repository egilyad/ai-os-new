/**
 * NoteRepository — DAL wrapper for key notes (analytics/observations)
 * 
 * Provides typed access to key analytics data.
 */

import type { DatabaseService } from '../services/database-service';
import type { KeyNote } from '../types/metrics-types';

const MAX_NOTES = 1000;

export class NoteRepository {
  private cache: Map<string, KeyNote> = new Map();
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
    const notes = await this.db.notes.toArray();
    
    this.cache.clear();
    for (const note of notes) {
      this.cache.set(note.id, note);
    }
    this.cacheLoaded = true;
  }

  async getAll(): Promise<KeyNote[]> {
    await this.ensureCache();
    return Array.from(this.cache.values());
  }

  async get(id: string): Promise<KeyNote | undefined> {
    await this.ensureCache();
    
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    const note = await this.db.notes.get(id);
    if (note) {
      this.cache.set(note.id, note);
    }
    return note;
  }

  async save(note: KeyNote): Promise<void> {
    await this.db.notes.put(note);
    this.cache.set(note.id, note);
    await this.enforceLimit();
  }

  async delete(id: string): Promise<void> {
    await this.db.notes.delete(id);
    this.cache.delete(id);
  }

  async deleteByKeyId(keyId: string): Promise<number> {
    const notes = await this.listByKey(keyId);
    const ids = notes.map(n => n.id);
    if (ids.length > 0) {
      await this.db.notes.bulkDelete(ids);
      for (const id of ids) this.cache.delete(id);
    }
    return ids.length;
  }

  async listByKey(keyId: string): Promise<KeyNote[]> {
    await this.ensureCache();
    
    return Array.from(this.cache.values())
      .filter(n => n.keyId === keyId)
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }

  private async enforceLimit(): Promise<void> {
    if (this.cache.size <= MAX_NOTES) return;
    
    // B10-166: Only evict from cache, never from database
    const sorted = Array.from(this.cache.values())
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, MAX_NOTES);

    this.cache.clear();
    for (const note of sorted) {
      this.cache.set(note.id, note);
    }
  }
}