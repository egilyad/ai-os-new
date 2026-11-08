import Dexie from 'dexie';
import { rootLogger } from '../logger-service';
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
} from '../../types/schema-types';

const LOGGER = rootLogger.child('DatabaseService');

const rejectHook =
    (schema: { parse: (data: unknown) => unknown }, label: string) =>
    (_primKey: unknown, obj: unknown): boolean | undefined => {
        try {
            schema.parse(obj);
            return undefined;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            LOGGER.error(
                'DatabaseService',
                `${label} validation FAILED — rejecting write: ${msg}`,
            );
            return false;
        }
    };

/**
 * Устанавливает Zod-хуки валидации на таблицы Dexie (creating/updating).
 * Вызывается из конструктора SuperAgentsDB после регистрации версий.
 * Принимает Dexie (не конкретный класс), чтобы не создавать циклический
 * импорт с dexie-schema.ts.
 */
export function installValidationHooks(db: Dexie): void {
    db.table('memories').hook('creating', rejectHook(MemoryEntrySchema, 'MemoryEntry'));
    db.table('memories').hook('updating', (mods, _primKey, obj) => {
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

    db.table('cognitiveTraces').hook('creating', rejectHook(CognitiveTraceSchema, 'CognitiveTrace'));
    db.table('cognitiveTraces').hook('updating', (mods, _primKey, obj) => {
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

    db.table('sessions').hook('creating', rejectHook(ChatSessionSchema, 'ChatSession'));
    db.table('sessions').hook('updating', (mods, _primKey, obj) => {
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

    db.table('notes').hook('creating', rejectHook(KeyNoteSchema, 'KeyNote'));
    db.table('notes').hook('updating', (mods, _primKey, obj) => {
        try {
            KeyNoteSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'KeyNote update validation FAILED');
            return false;
        }
    });

    db.table('apiKeys').hook('creating', rejectHook(ApiKeySchema, 'ApiKey'));
    db.table('apiKeys').hook('updating', (mods, _primKey, obj) => {
        try {
            ApiKeySchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'ApiKey update validation FAILED');
            return false;
        }
    });

    db.table('roles').hook('creating', rejectHook(RoleSchema, 'Role'));
    db.table('roles').hook('updating', (mods, _primKey, obj) => {
        try {
            RoleSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'Role update validation FAILED');
            return false;
        }
    });

    db.table('traces').hook('creating', rejectHook(ExecutionTraceSchema, 'ExecutionTrace'));
    db.table('traces').hook('updating', (mods, _primKey, obj) => {
        try {
            ExecutionTraceSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'ExecutionTrace update validation FAILED');
            return false;
        }
    });

    db.table('skills').hook('creating', rejectHook(CognitiveSkillSchema, 'CognitiveSkill'));
    db.table('skills').hook('updating', (mods, _primKey, obj) => {
        try {
            CognitiveSkillSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'CognitiveSkill update validation FAILED');
            return false;
        }
    });

    db.table('connectors').hook('creating', rejectHook(ConnectorSchema, 'Connector'));
    db.table('connectors').hook('updating', (mods, _primKey, obj) => {
        try {
            ConnectorSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'Connector update validation FAILED');
            return false;
        }
    });

    db.table('keyValue').hook('creating', rejectHook(KeyValueSchema, 'KeyValue'));
    db.table('keyValue').hook('updating', (mods, _primKey, obj) => {
        try {
            KeyValueSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'KeyValue update validation FAILED');
            return false;
        }
    });

    db.table('debateSessions').hook(
        'creating',
        rejectHook(DebateSessionRecordSchema, 'DebateSession'),
    );
    db.table('debateSessions').hook('updating', (mods, _primKey, obj) => {
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

    db.table('debateVerdicts').hook(
        'creating',
        rejectHook(DebateVerdictRecordSchema, 'DebateVerdict'),
    );
    db.table('debateVerdicts').hook('updating', (mods, _primKey, obj) => {
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

    db.table('debateTimeline').hook(
        'creating',
        rejectHook(DebateTimelineEntrySchema, 'DebateTimeline'),
    );
    db.table('debateTimeline').hook('updating', (mods, _primKey, obj) => {
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

    db.table('debateOverrides').hook('creating', rejectHook(DebateOverrideSchema, 'DebateOverride'));
    db.table('debateOverrides').hook('updating', (mods, _primKey, obj) => {
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

    db.table('sessionLinks').hook('creating', rejectHook(SessionLinkSchema, 'SessionLink'));
    db.table('sessionLinks').hook('updating', (mods, _primKey, obj) => {
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

    db.table('eventLog').hook('creating', rejectHook(EventLogEntrySchema, 'EventLog'));
    db.table('eventLog').hook('updating', (mods, _primKey, obj) => {
        try {
            EventLogEntrySchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'EventLog update validation FAILED', { error: e });
            return false;
        }
    });

    db.table('scenarios').hook(
        'creating',
        rejectHook(ConversationScenarioSchema, 'ConversationScenario'),
    );
    db.table('scenarios').hook('updating', (mods, _primKey, obj) => {
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
}
