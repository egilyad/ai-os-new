import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import type { DebateSessionSnapshot, DebatePhase } from '../../contracts/debate-runtime';

const LOGGER = rootLogger.child('DebateWorkspace');

// ── Types ──────────────────────────────────────────────────────────

export interface WorkspaceRoomEntry {
    readonly id: string;
    readonly topic: string;
    readonly modeId?: string;
    readonly status: DebatePhase;
    readonly createdAt: number;
    readonly updatedAt: number;
}

export interface WorkspaceIndex {
    readonly rooms: WorkspaceRoomEntry[];
    readonly activeRoomId: string | null;
    readonly lastUpdated: number;
}

export interface DebateWorkspaceDeps {
    getRoom: () => unknown;
    getEngine: () =>
        | {
              getSession(id: string): DebateSessionSnapshot | undefined;
              getAllSessions(): DebateSessionSnapshot[];
          }
        | undefined;
    storage?: {
        config: {
            get<T>(key: string): Promise<T | null>;
            set<T>(key: string, value: T): Promise<void>;
        };
    };
}

// ── Workspace Manager ──────────────────────────────────────────────

const STORAGE_KEY = 'debate-workspace-index';

export class DebateWorkspace {
    private index: WorkspaceIndex = { rooms: [], activeRoomId: null, lastUpdated: Date.now() };
    private deps: DebateWorkspaceDeps;
    private _initialized = false;

    constructor(deps: DebateWorkspaceDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        await this.loadIndex();
    }

    // ── Room Management ──────────────────────────────────────────

    async createRoom(topic: string, modeId?: string): Promise<string> {
        const roomId = genId('room');

        // The actual session creation is handled by DebateEngine
        // Here we just track the workspace-level metadata
        const entry: WorkspaceRoomEntry = {
            id: roomId,
            topic,
            modeId,
            status: 'created',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.index = {
            ...this.index,
            rooms: [...this.index.rooms, entry],
            activeRoomId: roomId,
            lastUpdated: Date.now(),
        };

        await this.saveIndex();
        return roomId;
    }

    async closeRoom(roomId: string): Promise<void> {
        this.index = {
            ...this.index,
            rooms: this.index.rooms.filter((r) => r.id !== roomId),
            activeRoomId: this.index.activeRoomId === roomId ? null : this.index.activeRoomId,
            lastUpdated: Date.now(),
        };
        await this.saveIndex();
    }

    setActiveRoom(roomId: string): void {
        this.index = {
            ...this.index,
            activeRoomId: roomId,
            lastUpdated: Date.now(),
        };
        void this.saveIndex().catch((e) =>
            LOGGER.warn('DebateWorkspace', 'Persist failed', {
                error: e instanceof Error ? e.message : String(e),
            }),
        );
    }

    getActiveRoom(): WorkspaceRoomEntry | null {
        if (!this.index.activeRoomId) return null;
        return this.index.rooms.find((r) => r.id === this.index.activeRoomId) ?? null;
    }

    listRooms(): WorkspaceRoomEntry[] {
        return [...this.index.rooms];
    }

    getRoomEntry(roomId: string): WorkspaceRoomEntry | undefined {
        return this.index.rooms.find((r) => r.id === roomId);
    }

    // ── Sync from Engine (single source of truth) ────────────────

    async syncFromEngine(): Promise<void> {
        let engine:
            | {
                  getSession(id: string): DebateSessionSnapshot | undefined;
                  getAllSessions(): DebateSessionSnapshot[];
              }
            | undefined;
        try {
            engine = this.deps.getEngine();
        } catch {
            return;
        }
        if (!engine) return;

        const sessions = engine.getAllSessions();
        const engineIds = new Set(sessions.map((s) => s.id));

        // Update existing rooms
        const updated = this.index.rooms.map((entry) => {
            const snap = sessions.find((s) => s.id === entry.id);
            if (snap) {
                return { ...entry, status: snap.phase, updatedAt: snap.updatedAt };
            }
            return entry;
        });

        // Remove rooms that no longer exist in engine
        this.index = {
            ...this.index,
            rooms: updated.filter((r) => engineIds.has(r.id) || r.status === 'created'),
            lastUpdated: Date.now(),
        };

        await this.saveIndex();
    }

    // ── Persistence ──────────────────────────────────────────────

    private async loadIndex(): Promise<void> {
        if (!this.deps.storage) return;
        try {
            const stored = await this.deps.storage.config.get<WorkspaceIndex>(STORAGE_KEY);
            if (stored) {
                this.index = stored;
            }
        } catch {
            // Use default empty index
        }
    }

    private async saveIndex(): Promise<void> {
        if (!this.deps.storage) return;
        try {
            await this.deps.storage.config.set(STORAGE_KEY, this.index);
        } catch {
            // Non-critical persistence failure
        }
    }

    // ── Snapshot ─────────────────────────────────────────────────

    getIndex(): WorkspaceIndex {
        return { ...this.index, rooms: [...this.index.rooms] };
    }

    destroy(): void {
        this._initialized = false;
        this.index = { rooms: [], activeRoomId: null, lastUpdated: Date.now() };
    }
}
