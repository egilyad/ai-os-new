import Dexie from 'dexie';
import { rootLogger } from '../logger-service';
import type { KeyNote, ApiKey } from '../../types/metrics-types';
import type { MemoryEntry } from '../../types/memory-types';
import type { ChatSession } from '../../contracts/storage/session-store';
import type { CognitiveTrace, CognitiveSkill, Connector } from '../../types/domain-types';
import type { ExecutionTrace } from '../../contracts/observability';
import type { Role } from '../../types/role-types';
import type { DebateSessionRecord, DebateVerdictRecord } from '../../contracts/storage/debate-store';
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
 * импорт с dexie-schema.ts; таблицы типизируются локальными row-типами.
 */
export function installValidationHooks(db: Dexie): void {
    const h = <T>(name: string) => db.table<T, any>(name);

    h<MemoryEntry>('memories').hook('creating', rejectHook(MemoryEntrySchema, 'MemoryEntry'));
    h<MemoryEntry>('memories').hook('updating', (mods, _primKey, obj) => {
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

    h<CognitiveTrace>('cognitiveTraces').hook(
        'creating',
        rejectHook(CognitiveTraceSchema, 'CognitiveTrace'),
    );
    h<CognitiveTrace>('cognitiveTraces').hook('updating', (mods, _primKey, obj) => {
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

    h<ChatSession>('sessions').hook('creating', rejectHook(ChatSessionSchema, 'ChatSession'));
    h<ChatSession>('sessions').hook('updating', (mods, _primKey, obj) => {
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

    h<KeyNote>('notes').hook('creating', rejectHook(KeyNoteSchema, 'KeyNote'));
    h<KeyNote>('notes').hook('updating', (mods, _primKey, obj) => {
        try {
            KeyNoteSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'KeyNote update validation FAILED');
            return false;
        }
    });

    h<ApiKey>('apiKeys').hook('creating', rejectHook(ApiKeySchema, 'ApiKey'));
    h<ApiKey>('apiKeys').hook('updating', (mods, _primKey, obj) => {
        try {
            ApiKeySchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'ApiKey update validation FAILED');
            return false;
        }
    });

    h<Role>('roles').hook('creating', rejectHook(RoleSchema, 'Role'));
    h<Role>('roles').hook('updating', (mods, _primKey, obj) => {
        try {
            RoleSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'Role update validation FAILED');
            return false;
        }
    });

    h<ExecutionTrace>('traces').hook(
        'creating',
        rejectHook(ExecutionTraceSchema, 'ExecutionTrace'),
    );
    h<ExecutionTrace>('traces').hook('updating', (mods, _primKey, obj) => {
        try {
            ExecutionTraceSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'ExecutionTrace update validation FAILED');
            return false;
        }
    });

    h<CognitiveSkill>('skills').hook('creating', rejectHook(CognitiveSkillSchema, 'CognitiveSkill'));
    h<CognitiveSkill>('skills').hook('updating', (mods, _primKey, obj) => {
        try {
            CognitiveSkillSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'CognitiveSkill update validation FAILED');
            return false;
        }
    });

    h<Connector>('connectors').hook('creating', rejectHook(ConnectorSchema, 'Connector'));
    h<Connector>('connectors').hook('updating', (mods, _primKey, obj) => {
        try {
            ConnectorSchema.parse({ ...obj, ...mods });
            return undefined;
        } catch {
            LOGGER.error('DatabaseService', 'Connector update validation FAILED');
            return false;
        }
    });

    h<{ id: string; value: unknown; createdAt?: number; version?: number }>('keyValue').hook(
        'creating',
        rejectHook(KeyValueSchema, 'KeyValue'),
    );
    h<{ id: string; value: unknown; createdAt?: number; version?: number }>('keyValue').hook(
        'updating',
        (mods, _primKey, obj) => {
            try {
                KeyValueSchema.parse({ ...obj, ...mods });
                return undefined;
            } catch {
                LOGGER.error('DatabaseService', 'KeyValue update validation FAILED');
                return false;
            }
        },
    );

    h<DebateSessionRecord>('debateSessions').hook(
        'creating',
        rejectHook(DebateSessionRecordSchema, 'DebateSession'),
    );
    h<DebateSessionRecord>('debateSessions').hook('updating', (mods, _primKey, obj) => {
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

    h<DebateVerdictRecord>('debateVerdicts').hook(
        'creating',
        rejectHook(DebateVerdictRecordSchema, 'DebateVerdict'),
    );
    h<DebateVerdictRecord>('debateVerdicts').hook('updating', (mods, _primKey, obj) => {
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

    h<DebateTimelineEntry>('debateTimeline').hook(
        'creating',
        rejectHook(DebateTimelineEntrySchema, 'DebateTimeline'),
    );
    h<DebateTimelineEntry>('debateTimeline').hook('updating', (mods, _primKey, obj) => {
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

    h<DebateOverride>('debateOverrides').hook(
        'creating',
        rejectHook(DebateOverrideSchema, 'DebateOverride'),
    );
    h<DebateOverride>('debateOverrides').hook('updating', (mods, _primKey, obj) => {
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

    h<SessionLink>('sessionLinks').hook('creating', rejectHook(SessionLinkSchema, 'SessionLink'));
    h<SessionLink>('sessionLinks').hook('updating', (mods, _primKey, obj) => {
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

    h<RecordedEventRow>('eventLog').hook('creating', rejectHook(EventLogEntrySchema, 'EventLog'));
    h<RecordedEventRow>('eventLog').hook('updating', (mods, _primKey, obj) => {
        try {
            EventLogEntrySchema.parse({ ...obj, ...mods });
            return undefined;
        } catch (e) {
            LOGGER.error('DatabaseService', 'EventLog update validation FAILED', { error: e });
            return false;
        }
    });

    h<ConversationScenario>('scenarios').hook(
        'creating',
        rejectHook(ConversationScenarioSchema, 'ConversationScenario'),
    );
    h<ConversationScenario>('scenarios').hook('updating', (mods, _primKey, obj) => {
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
