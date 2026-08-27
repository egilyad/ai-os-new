/**
 * DataAccessLayer — concrete implementation
 *
 * Combines all repositories and provides a single interface.
 * Registered in DI as 'dal'.
 *
 * ЗАКОН 1: Каждый domain имеет ровно ОДИН repository в DAL.
 * ЗАКОН 2: Все storage-операции проходят через DAL, не напрямую в Dexie.
 */

import type { DatabaseService } from '../services/database-service';
import type { DataAccessLayer, KvRepository } from './types';
import { WorkspaceRepository } from './workspace-repository';
import { MemoryRepository } from './memory-repository';
import { SessionRepository } from './session-repository';

import { NoteRepository } from './note-repository';
import { RoleRepository } from './role-repository';
import { DebateRepository } from './debate-repository';
import { TraceRepository } from './trace-repository';
import { CognitiveRepository } from './cognitive-repository';
import { EventLogRepository } from './event-log-repository';
import { CrystalRepository } from './crystal-repository';
import { JunctionRepository } from './junction-repository';
import { SynthesisRepository } from './synthesis-repository';
import { GeneratorRepository } from './generator-repository';
import { ForumRepository } from './forum-repository';
import { WorkflowRepository } from './workflow-repository';
import { ScenarioRepository } from './scenario-repository';
import { DirectorRepository } from './director-repository';

export class DataAccessLayerImpl implements DataAccessLayer {
    readonly memory: MemoryRepository;
    readonly session: SessionRepository;
    readonly notes: NoteRepository;
    readonly roles: RoleRepository;
    readonly debate: DebateRepository;
    readonly trace: TraceRepository;
    readonly cognitive: CognitiveRepository;
    readonly workspace: WorkspaceRepository;
    readonly eventLog: EventLogRepository;
    readonly crystal: CrystalRepository;
    readonly junction: JunctionRepository;
    readonly synthesis: SynthesisRepository;
    readonly generator: GeneratorRepository;
    readonly forum: ForumRepository;
    readonly builder: WorkflowRepository;
    readonly scenarios: ScenarioRepository;
    readonly directorSessions: DirectorRepository;
    readonly kv: KvRepository;

    constructor(db: DatabaseService) {
        this.memory = new MemoryRepository(db);
        this.session = new SessionRepository(db);
        this.notes = new NoteRepository(db);
        this.roles = new RoleRepository(db);
        this.debate = new DebateRepository(db);
        this.trace = new TraceRepository(db);
        this.cognitive = new CognitiveRepository(db);
        this.eventLog = new EventLogRepository(db);
        this.crystal = new CrystalRepository(db);
        this.junction = new JunctionRepository(db);
        this.synthesis = new SynthesisRepository(db);
        this.generator = new GeneratorRepository(db);
        this.forum = new ForumRepository(db);
        this.builder = new WorkflowRepository(db);
        this.scenarios = new ScenarioRepository(db);
        this.directorSessions = new DirectorRepository(db);
        this.kv = new KvRepositoryImpl(db);
        this.workspace = new WorkspaceRepository(this.kv);
    }
}

/** Key-Value repository using DatabaseService */
class KvRepositoryImpl {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async get<T>(id: string): Promise<T | null> {
        return this.db.getKv<T>(id);
    }

    async set<T>(id: string, value: T): Promise<void> {
        return this.db.setKv<T>(id, value);
    }

    async delete(id: string): Promise<void> {
        // DAL-7: Dexie no-ops on missing key, no need for TOCTOU check
        await this.db.keyValue.delete(id);
    }

    async list(prefix?: string): Promise<Array<{ id: string; value: unknown }>> {
        if (!prefix) return this.db.keyValue.toArray();
        return this.db.keyValue.where('id').startsWith(prefix).toArray();
    }

    async clear(): Promise<void> {
        await this.db.keyValue.clear();
    }
}
