import type { KeyStore } from './key-store';
import type { DexieMemoryStore } from './dexie-memory-store';
import type { TraceStore } from './trace-store';
import type { SessionStore } from './session-store';
import type { ConfigStore } from './config-store';
import type { RolesStore } from './roles-store';
import type { SkillsStore } from './skills-store';
import type { DebateStore } from './debate-store';

export interface StorageLayer {
    keys: KeyStore;
    memory: DexieMemoryStore;
    traces: TraceStore;
    sessions: SessionStore;
    config: ConfigStore;
    roles: RolesStore;
    skills: SkillsStore;
    debates: DebateStore;
}

export type {
    KeyStore,
    DexieMemoryStore,
    TraceStore,
    SessionStore,
    ConfigStore,
    RolesStore,
    SkillsStore,
    DebateStore,
};
export type { ChatSession, ChatEntry } from './session-store';
export type { CognitiveTrace } from '../../types/domain-types';
export type { MemoryEntry } from '../../types/memory-types';
export type { ApiKey } from '../../types/metrics-types';
