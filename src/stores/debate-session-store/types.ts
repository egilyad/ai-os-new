import type {
    DebateSessionStrategy,
    DebateParticipant,
    DebateConfig,
    DebateSession,
} from '../../kernel/contracts/debate-types';
import type { DebatePhase } from '../../kernel/contracts/debate-runtime';

export interface DebateSessionMeta {
    id: string;
    topic: string;
    strategy: DebateSessionStrategy;
    phase: DebatePhase;
    round: number;
    participants: DebateParticipant[];
    tags: string[];
    folder: string;
    isArchived: boolean;
    isPinned: boolean;
    createdAt: number;
    updatedAt: number;
    linkedSessionIds: string[];
}

export interface DebateSessionStoreState {
    sessions: DebateSessionMeta[];
    activeSessionId: string | null;
    isLoaded: boolean;
}

export interface DebateSessionStoreActions {
    init: () => void;
    createSession: (
        topic: string,
        strategy: DebateSessionStrategy,
        participants: DebateParticipant[],
        config: DebateConfig,
    ) => Promise<string | null>;
    loadSession: (id: string) => Promise<DebateSession | null>;
    saveCurrentSession: () => Promise<void>;
    listSessions: (filters?: {
        status?: string;
        folder?: string;
        search?: string;
        tags?: string[];
    }) => Promise<DebateSessionMeta[]>;
    pauseSession: (id: string) => Promise<void>;
    resumeSession: (id: string) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    archiveSession: (id: string) => Promise<void>;
    unarchiveSession: (id: string) => Promise<void>;
    tagSession: (id: string, tags: string[]) => Promise<void>;
    moveToFolder: (id: string, folder: string) => Promise<void>;
    renameSession: (id: string, title: string) => Promise<void>;
    pinSession: (id: string) => Promise<void>;
    setActiveSessionId: (id: string | null) => void;
    refresh: () => Promise<void>;
}

export type DebateSessionStoreShape = DebateSessionStoreState & DebateSessionStoreActions;
