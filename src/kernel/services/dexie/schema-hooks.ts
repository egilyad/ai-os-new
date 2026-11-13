import type { Table } from 'dexie';
import { rootLogger } from '../logger-service';
import type { KeyNote, ApiKey } from '../../types/metrics-types';
import type { MemoryEntry } from '../../types/memory-types';
import type { ChatSession } from '../../contracts/storage/session-store';
import type { CognitiveTrace, CognitiveSkill, Connector } from '../../types/domain-types';
import type { ExecutionTrace } from '../../contracts/observability';
import type { Role } from '../../types/role-types';
import type {
    DebateSessionRecord,
    DebateVerdictRecord,
} from '../../contracts/storage/debate-store';
import type {
    DebateTimelineEntry,
    DebateOverride,
    SessionLink,
} from '../../contracts/session-manager';
import type { ConversationScenario } from '../../contracts/conversation';
import type { RecordedEventRow } from './recorded-event-row';
import {
    MemoryEntrySchema,
    CognitiveTraceSchema,
    ChatSessionSchema,
    KeyNoteSchema,
    RoleSchema,
    ExecutionTraceSchema,
    CognitiveSkillSchema,
    ConnectorSchema,
    KeyValueSchema,
    ApiKeySchema,
} from '../../../types/schemas';
import {
    DebateSessionRecordSchema,
    DebateVerdictRecordSchema,
    DebateTimelineEntrySchema,
    DebateOverrideSchema,
    SessionLinkSchema,
    EventLogEntrySchema,
    ConversationScenarioSchema,
    AgemsTaskSchema,
    TaskCommentSchema,
    LabelSchema,
    TaskLabelSchema,
    TaskWorkProductSchema,
    TaskTriggerSchema,
} from '../../types/schema-types';
import type {
    AgemsTask,
    TaskComment,
    Label,
    TaskLabel,
    TaskWorkProduct,
    TaskTrigger,
} from '../../types/agems-task';

const LOGGER = rootLogger.child('DatabaseService');

/**
 * Структурный тип для хуков валидации. Это не полный SuperAgentsDB,
 * а только набор таблиц с типами строк — позволяет избежать циклического
 * импорта с dexie-schema.ts (хуки вызываются из его конструктора).
 */
export interface ValidationHookDb {
    memories: Table<MemoryEntry>;
    cognitiveTraces: Table<CognitiveTrace>;
    sessions: Table<ChatSession>;
    notes: Table<KeyNote>;
    apiKeys: Table<ApiKey>;
    roles: Table<Role>;
    traces: Table<ExecutionTrace>;
    skills: Table<CognitiveSkill>;
    connectors: Table<Connector>;
    keyValue: Table<{ id: string; value: unknown; createdAt?: number; version?: number }>;
    debateSessions: Table<DebateSessionRecord>;
    debateVerdicts: Table<DebateVerdictRecord>;
    debateTimeline: Table<DebateTimelineEntry>;
    debateOverrides: Table<DebateOverride>;
    sessionLinks: Table<SessionLink>;
    eventLog: Table<RecordedEventRow>;
    scenarios: Table<ConversationScenario>;
    agemsTasks: Table<AgemsTask>;
    taskComments: Table<TaskComment>;
    labels: Table<Label>;
    taskLabels: Table<TaskLabel>;
    taskWorkProducts: Table<TaskWorkProduct>;
    taskTriggers: Table<TaskTrigger>;
}

const rejectHook =
    (schema: { parse: (data: unknown) => unknown }, label: string) =>
    (_primKey: unknown, obj: unknown): boolean | undefined => {
        try {
            schema.parse(obj);
            return undefined;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            LOGGER.error('DatabaseService', `${label} validation FAILED — rejecting write: ${msg}`);
            return false;
        }
    };

/**
 * Устанавливает Zod-хуки валидации на таблицы Dexie (creating/updating).
 * Вызывается из конструктора SuperAgentsDB после регистрации версий.
 */
export function installValidationHooks(db: ValidationHookDb): void {
    db.memories.hook('creating', rejectHook(MemoryEntrySchema, 'MemoryEntry'));
    db.memories.hook('updating', (mods, _primKey, obj) => {
        try {
            MemoryEntrySchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'MemoryEntry update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.cognitiveTraces.hook('creating', rejectHook(CognitiveTraceSchema, 'CognitiveTrace'));
    db.cognitiveTraces.hook('updating', (mods, _primKey, obj) => {
        try {
            CognitiveTraceSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'CognitiveTrace update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.sessions.hook('creating', rejectHook(ChatSessionSchema, 'ChatSession'));
    db.sessions.hook('updating', (mods, _primKey, obj) => {
        try {
            ChatSessionSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'ChatSession update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.notes.hook('creating', rejectHook(KeyNoteSchema, 'KeyNote'));
    db.notes.hook('updating', (mods, _primKey, obj) => {
        try {
            KeyNoteSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'KeyNote update validation FAILED');
            return false;
        }
    });

    db.apiKeys.hook('creating', rejectHook(ApiKeySchema, 'ApiKey'));
    db.apiKeys.hook('updating', (mods, _primKey, obj) => {
        try {
            ApiKeySchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'ApiKey update validation FAILED');
            return false;
        }
    });

    db.roles.hook('creating', rejectHook(RoleSchema, 'Role'));
    db.roles.hook('updating', (mods, _primKey, obj) => {
        try {
            RoleSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'Role update validation FAILED');
            return false;
        }
    });

    db.traces.hook('creating', rejectHook(ExecutionTraceSchema, 'ExecutionTrace'));
    db.traces.hook('updating', (mods, _primKey, obj) => {
        try {
            ExecutionTraceSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'ExecutionTrace update validation FAILED');
            return false;
        }
    });

    db.skills.hook('creating', rejectHook(CognitiveSkillSchema, 'CognitiveSkill'));
    db.skills.hook('updating', (mods, _primKey, obj) => {
        try {
            CognitiveSkillSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'CognitiveSkill update validation FAILED');
            return false;
        }
    });

    db.connectors.hook('creating', rejectHook(ConnectorSchema, 'Connector'));
    db.connectors.hook('updating', (mods, _primKey, obj) => {
        try {
            ConnectorSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'Connector update validation FAILED');
            return false;
        }
    });

    db.keyValue.hook('creating', rejectHook(KeyValueSchema, 'KeyValue'));
    db.keyValue.hook('updating', (mods, _primKey, obj) => {
        try {
            KeyValueSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'KeyValue update validation FAILED');
            return false;
        }
    });

    db.debateSessions.hook('creating', rejectHook(DebateSessionRecordSchema, 'DebateSession'));
    db.debateSessions.hook('updating', (mods, _primKey, obj) => {
        try {
            DebateSessionRecordSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'DebateSession update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.debateVerdicts.hook('creating', rejectHook(DebateVerdictRecordSchema, 'DebateVerdict'));
    db.debateVerdicts.hook('updating', (mods, _primKey, obj) => {
        try {
            DebateVerdictRecordSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'DebateVerdict update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.debateTimeline.hook('creating', rejectHook(DebateTimelineEntrySchema, 'DebateTimeline'));
    db.debateTimeline.hook('updating', (mods, _primKey, obj) => {
        try {
            DebateTimelineEntrySchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'DebateTimeline update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.debateOverrides.hook('creating', rejectHook(DebateOverrideSchema, 'DebateOverride'));
    db.debateOverrides.hook('updating', (mods, _primKey, obj) => {
        try {
            DebateOverrideSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'DebateOverride update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.sessionLinks.hook('creating', rejectHook(SessionLinkSchema, 'SessionLink'));
    db.sessionLinks.hook('updating', (mods, _primKey, obj) => {
        try {
            SessionLinkSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'SessionLink update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.eventLog.hook('creating', rejectHook(EventLogEntrySchema, 'EventLog'));
    db.eventLog.hook('updating', (mods, _primKey, obj) => {
        try {
            EventLogEntrySchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'EventLog update validation FAILED', { error: e });
            return false;
        }
    });

    db.scenarios.hook('creating', rejectHook(ConversationScenarioSchema, 'ConversationScenario'));
    db.scenarios.hook('updating', (mods, _primKey, obj) => {
        try {
            ConversationScenarioSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'ConversationScenario update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.agemsTasks.hook('creating', rejectHook(AgemsTaskSchema, 'AgemsTask'));
    db.agemsTasks.hook('updating', (mods, _primKey, obj) => {
        try {
            AgemsTaskSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'AgemsTask update validation FAILED', { error: e });
            return false;
        }
    });

    db.taskComments.hook('creating', rejectHook(TaskCommentSchema, 'TaskComment'));
    db.taskComments.hook('updating', (mods, _primKey, obj) => {
        try {
            TaskCommentSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'TaskComment update validation FAILED', { error: e });
            return false;
        }
    });

    db.labels.hook('creating', rejectHook(LabelSchema, 'Label'));
    db.labels.hook('updating', (mods, _primKey, obj) => {
        try {
            LabelSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'Label update validation FAILED', { error: e });
            return false;
        }
    });

    db.taskLabels.hook('creating', rejectHook(TaskLabelSchema, 'TaskLabel'));
    db.taskLabels.hook('updating', (mods, _primKey, obj) => {
        try {
            TaskLabelSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'TaskLabel update validation FAILED', { error: e });
            return false;
        }
    });

    db.taskWorkProducts.hook('creating', rejectHook(TaskWorkProductSchema, 'TaskWorkProduct'));
    db.taskWorkProducts.hook('updating', (mods, _primKey, obj) => {
        try {
            TaskWorkProductSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'TaskWorkProduct update validation FAILED', {
                error: e,
            });
            return false;
        }
    });

    db.taskTriggers.hook('creating', rejectHook(TaskTriggerSchema, 'TaskTrigger'));
    db.taskTriggers.hook('updating', (mods, _primKey, obj) => {
        try {
            TaskTriggerSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'TaskTrigger update validation FAILED', { error: e });
            return false;
        }
    });
}
