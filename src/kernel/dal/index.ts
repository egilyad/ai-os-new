/**
 * Data Access Layer (DAL) — index
 *
 * Single entry point for all persistent data access.
 * Use this instead of importing DatabaseService directly.
 *
 * Usage:
 *   const dal = container.get<DataAccessLayer>('dal');
 *   const memories = await dal.memory.getAll();
 *   const sessions = await dal.session.listRecent(10);
 */

export type { DataAccessLayer, KvRepository, DalFactory } from './types';

export { MemoryRepository } from './memory-repository';
export { SessionRepository } from './session-repository';
export { NoteRepository } from './note-repository';
export { RoleRepository } from './role-repository';
export { DebateRepository } from './debate-repository';
export { TraceRepository } from './trace-repository';
export { CognitiveRepository } from './cognitive-repository';
export { DataAccessLayerImpl } from './data-access-layer';
export { WorkspaceRepository } from './workspace-repository';
export { EventLogRepository } from './event-log-repository';
export { SessionLinkRepository } from './session-link-repository';
export { DebateTimelineRepository } from './debate-timeline-repository';
export { DebateOverrideRepository } from './debate-override-repository';
export { CrystalRepository } from './crystal-repository';
export { JunctionRepository } from './junction-repository';
export { SynthesisRepository } from './synthesis-repository';
export { GeneratorRepository } from './generator-repository';
export { ForumRepository } from './forum-repository';
export { WorkflowRepository } from './workflow-repository';
