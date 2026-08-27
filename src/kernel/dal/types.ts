/**
 * Data Access Layer (DAL)
 *
 * Single entry point for all persistent data access.
 * Replaces direct Dexie table access throughout the codebase.
 *
 * ЗАКОН 1: Каждый domain имеет ровно ОДИН repository в DAL.
 * ЗАКОН 2: Все storage-операции проходят через DAL, не напрямую в Dexie.
 */

import type { ChatSession } from '../contracts/storage/session-store';
import type { KeyNote } from '../types/metrics-types';
import type { Role } from '../types/role-types';
import type { CognitiveTrace, CognitiveSkill, Connector } from '../types/domain-types';
import type { ExecutionTrace } from '../contracts/observability';
import type { DebateSessionRecord, DebateVerdictRecord } from '../contracts/storage/debate-store';
import type { EventLogRepository } from './event-log-repository';
import type { MemoryRepository } from './repository-types';
import type { CrystalRepository } from './crystal-repository';
import type { JunctionRepository } from './junction-repository';
import type { SynthesisRepository } from './synthesis-repository';
import type { GeneratorRepository } from './generator-repository';
import type { ForumRepository } from './forum-repository';
import type { WorkflowRepository } from './workflow-repository';
import type { ScenarioRepository } from './scenario-repository';
import type { DirectorRepository } from './director-repository';

// =============================================================================
// Repository Interfaces (see repository-types.ts for MemoryRepository)
// =============================================================================

/** Session domain — chat conversation history */
export interface SessionRepository {
    getAll(): Promise<ChatSession[]>;
    get(id: string): Promise<ChatSession | undefined>;
    save(session: ChatSession): Promise<void>;
    delete(id: string): Promise<void>;
    listRecent(limit?: number): Promise<ChatSession[]>;
}

/** Key Notes domain — analytics and observations */
export interface NoteRepository {
    getAll(): Promise<KeyNote[]>;
    get(id: string): Promise<KeyNote | undefined>;
    save(note: KeyNote): Promise<void>;
    delete(id: string): Promise<void>;
    listByKey(keyId: string): Promise<KeyNote[]>;
}

/** Role domain — agent personas and configurations */
export interface RoleRepository {
    getAll(): Promise<Role[]>;
    get(id: string): Promise<Role | undefined>;
    save(role: Role): Promise<void>;
    delete(id: string): Promise<void>;
}

/** Debate domain — structured multi-agent discussions */
export interface DebateRepository {
    // Sessions
    listSessions(): Promise<DebateSessionRecord[]>;
    getSession(id: string): Promise<DebateSessionRecord | undefined>;
    saveSession(session: DebateSessionRecord): Promise<void>;
    deleteSession(id: string): Promise<void>;

    // Verdicts
    getVerdict(sessionId: string): Promise<DebateVerdictRecord | undefined>;
    saveVerdict(verdict: DebateVerdictRecord): Promise<void>;

    // Maintenance
    clearAll(): Promise<void>;
}

/** Trace domain — execution telemetry and performance data */
export interface TraceRepository {
    getAll(limit?: number): Promise<ExecutionTrace[]>;
    get(id: string): Promise<ExecutionTrace | undefined>;
    save(trace: ExecutionTrace): Promise<void>;
    delete(id: string): Promise<void>;
    listRecent(limit?: number): Promise<ExecutionTrace[]>;
}

/** Cognitive domain — skills and connectors */
export interface CognitiveRepository {
    // Skills
    getAllSkills(): Promise<CognitiveSkill[]>;
    getSkill(id: string): Promise<CognitiveSkill | undefined>;
    saveSkill(skill: CognitiveSkill): Promise<void>;
    deleteSkill(id: string): Promise<void>;

    // Connectors
    getAllConnectors(): Promise<Connector[]>;
    getConnector(id: string): Promise<Connector | undefined>;
    saveConnector(connector: Connector): Promise<void>;
    deleteConnector(id: string): Promise<void>;

    // Cognitive Traces
    getAllCognitiveTraces(): Promise<CognitiveTrace[]>;
    getCognitiveTrace(id: string): Promise<CognitiveTrace | undefined>;
    saveCognitiveTrace(trace: CognitiveTrace): Promise<void>;
    deleteCognitiveTrace(id: string): Promise<void>;
}

/** Workspace domain — File System Access handle persistence */
export interface WorkspaceRepository {
    saveHandle(handle: FileSystemDirectoryHandle): Promise<void>;
    getHandle(): Promise<FileSystemDirectoryHandle | null>;
    deleteHandle(): Promise<void>;
}

import type { KvRepository } from './repository-types';

export type { KvRepository };

// =============================================================================
// DAL Interface — единая точка входа
// =============================================================================

export interface DataAccessLayer {
    memory: MemoryRepository;
    session: SessionRepository;
    notes: NoteRepository;
    roles: RoleRepository;
    debate: DebateRepository;
    trace: TraceRepository;
    cognitive: CognitiveRepository;
    workspace: WorkspaceRepository;
    eventLog: EventLogRepository;
    crystal: CrystalRepository;
    junction: JunctionRepository;
    synthesis: SynthesisRepository;
    generator: GeneratorRepository;
    forum: ForumRepository;
    builder: WorkflowRepository;
    scenarios: ScenarioRepository;
    directorSessions: DirectorRepository;
    kv: KvRepository;
}

// =============================================================================
// Factory type
// =============================================================================

export type DalFactory = (
    db: import('../services/database-service').DatabaseService,
) => DataAccessLayer;
