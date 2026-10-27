/**
 * Memory Registry — static catalog of storage sources in SuperAgents OS.
 *
 * The registry holds METADATA about sources (what is stored, who owns it,
 * which table/route backs it). It never copies records. Record counts are
 * computed on demand through the real Dexie table APIs via getDexieDb().
 */
import { getDexieDb } from '../database-service';
import type { MemorySourceDescriptor, MemorySourceCount } from '../../types/memory-center-types';

const SOURCES: MemorySourceDescriptor[] = [
    // 🗣️ Чат
    {
        id: 'chat.sessions',
        name: 'Сессии чата',
        category: 'chat',
        description: 'Сохранённые сессии и сообщения чатов.',
        owner: 'ChatExecutor / useChatStore',
        storageType: 'dexie',
        table: 'sessions',
        capabilities: { read: true, search: true, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'chat',
    },
    // ⚔️ Дебаты
    {
        id: 'debate.sessions',
        name: 'Сессии дебатов',
        category: 'debate',
        description: 'История и состояние дебатов.',
        owner: 'DebateEngine / DebateSyncManager',
        storageType: 'dexie',
        table: 'debateSessions',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'debate',
    },
    {
        id: 'debate.verdicts',
        name: 'Вердикты дебатов',
        category: 'debate',
        description: 'Итоговые вердикты и выводы дебатов.',
        owner: 'DebateEngine',
        storageType: 'dexie',
        table: 'debateVerdicts',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'debate',
    },
    // 🤖 Агенты
    {
        id: 'agent.memory',
        name: 'Память агентов',
        category: 'agent',
        description: 'Долговременная память агентов (AGEMS).',
        owner: 'AgentService',
        storageType: 'dexie',
        table: 'agentMemory',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'agents',
    },
    {
        id: 'agent.executions',
        name: 'Выполнения агентов',
        category: 'agent',
        description: 'Журнал выполнений агентов.',
        owner: 'AgentService',
        storageType: 'dexie',
        table: 'agentExecutions',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'agents',
    },
    // 🧠 Знания
    {
        id: 'knowledge.memories',
        name: 'Память (MemoryEngine)',
        category: 'knowledge',
        description: 'Гибридная память: BM25 + семантические эмбеддинги.',
        owner: 'MemoryEngine / MemoryOrchestrator',
        storageType: 'dexie',
        table: 'memories',
        capabilities: { read: true, search: true, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'memory',
    },
    {
        id: 'knowledge.long-term',
        name: 'Долговременная память (LTM)',
        category: 'knowledge',
        description: 'Долговременная память — знания с приоритетами.',
        owner: 'LtMemory',
        storageType: 'dexie',
        table: 'ltMemories',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'memory',
    },
    {
        id: 'knowledge.packages',
        name: 'Пакеты знаний',
        category: 'knowledge',
        description: 'Собранные пакеты знаний.',
        owner: 'KnowledgeGenerator',
        storageType: 'dexie',
        table: 'knowledgePackages',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'knowledge-generator',
    },
    // 🔬 Исследования
    {
        id: 'research.crystals',
        name: 'Кристаллы',
        category: 'research',
        description: 'Проверенные утверждения с доказательствами.',
        owner: 'CrystalVault',
        storageType: 'dexie',
        table: 'crystals',
        capabilities: { read: true, search: true, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'crystals',
    },
    {
        id: 'research.junctions',
        name: 'Junction-пересечения',
        category: 'research',
        description: 'Пересечения между источниками знаний.',
        owner: 'JunctionEngine',
        storageType: 'dexie',
        table: 'junctions',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'junctions',
    },
    {
        id: 'research.synthesis',
        name: 'Синтез',
        category: 'research',
        description: 'Мультиперспективные синтезы.',
        owner: 'SynthesisEngine',
        storageType: 'dexie',
        table: 'synthSessions',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'synthesis',
    },
    {
        id: 'research.generator-jobs',
        name: 'Джобы генератора знаний',
        category: 'research',
        description: 'Автономные исследовательские задачи.',
        owner: 'KnowledgeGenerator',
        storageType: 'dexie',
        table: 'genJobs',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'knowledge-generator',
    },
    // ⚙️ Конфигурация
    {
        id: 'config.key-value',
        name: 'Конфигурация (KV)',
        category: 'config',
        description: 'Настройки, параметры, служебные состояния.',
        owner: 'ConfigService / SettingsService',
        storageType: 'dexie',
        table: 'keyValue',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'settings',
    },
    {
        id: 'config.keys',
        name: 'API-ключи',
        category: 'user',
        description: 'Зашифрованные ключи провайдеров.',
        owner: 'KeyManagement',
        storageType: 'dexie',
        table: 'apiKeys',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'keys',
    },
    // 📋 Выполнение
    {
        id: 'execution.tasks',
        name: 'Задачи (AGEMS)',
        category: 'execution',
        description: 'Задачи и пайплайны.',
        owner: 'AgemsTaskService',
        storageType: 'dexie',
        table: 'agemsTasks',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'tasks',
    },
    {
        id: 'execution.projects',
        name: 'Проекты',
        category: 'execution',
        description: 'Проекты, задачи, артефакты.',
        owner: 'ProjectService',
        storageType: 'dexie',
        table: 'projects',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'projects',
    },
    {
        id: 'execution.queue',
        name: 'Очередь запусков',
        category: 'execution',
        description: 'Очередь crew/graph/eval запусков.',
        owner: 'RunQueueService',
        storageType: 'dexie',
        table: 'runQueue',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'run-queue',
    },
    {
        id: 'execution.traces',
        name: 'Когнитивные трассы',
        category: 'execution',
        description: 'Трассы когнитивных шагов.',
        owner: 'CognitiveService',
        storageType: 'dexie',
        table: 'cognitiveTraces',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'traces',
    },
    // 🛰️ Флот
    {
        id: 'fleet.crews',
        name: 'Экипажи',
        category: 'fleet',
        description: 'Экипажи и команды.',
        owner: 'CrewService',
        storageType: 'dexie',
        table: 'crews',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'fleet',
    },
    {
        id: 'fleet.councils',
        name: 'Советы (Council)',
        category: 'fleet',
        description: 'Сессии советов и сообщения.',
        owner: 'CouncilService',
        storageType: 'dexie',
        table: 'councilSessions',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'fleet',
    },
    {
        id: 'fleet.graphs',
        name: 'Графы',
        category: 'fleet',
        description: 'Графовые запуски и чекпойнты.',
        owner: 'GraphService',
        storageType: 'dexie',
        table: 'graphs',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
        openRoute: 'fleet',
    },
    // Дубликаты / журналы
    {
        id: 'system.event-log',
        name: 'Журнал событий',
        category: 'execution',
        description: 'EventRecorder — журнал событий (WAL).',
        owner: 'EventRecorder',
        storageType: 'dexie',
        table: 'eventLog',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
    },
    {
        id: 'system.audit',
        name: 'Аудит-журнал (ядро)',
        category: 'execution',
        description: 'Журнал аудита ядра. POSSIBLE DUPLICATE с auditLogs.',
        owner: 'AdminService',
        storageType: 'dexie',
        table: 'auditLog',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
    },
    {
        id: 'system.audit-agems',
        name: 'Аудит-журнал (AGEMS)',
        category: 'execution',
        description: 'Журнал аудита AGEMS. POSSIBLE DUPLICATE с auditLog.',
        owner: 'AgemsAuditService',
        storageType: 'dexie',
        table: 'auditLogs',
        capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
        status: 'verified',
    },
];

export function listMemorySources(): MemorySourceDescriptor[] {
    return SOURCES;
}

export function getMemorySource(id: string): MemorySourceDescriptor | undefined {
    return SOURCES.find((s) => s.id === id);
}

/** Compute the row count for a Dexie-backed source through its real table. */
async function countTable(tableName: string): Promise<number | null> {
    try {
        const db = getDexieDb();
        const table = (db as unknown as Record<string, { count(): Promise<number> }>)[tableName];
        if (!table || typeof table.count !== 'function') return null;
        return await table.count();
    } catch {
        return null;
    }
}

/** Compute counts for all sources (null when the table/API is unavailable). */
export async function computeMemoryCounts(): Promise<MemorySourceCount[]> {
    const out: MemorySourceCount[] = [];
    for (const s of SOURCES) {
        if (s.storageType !== 'dexie' || !s.table) {
            out.push({ sourceId: s.id, count: null, reason: 'non-dexie source' });
            continue;
        }
        const count = await countTable(s.table);
        out.push({ sourceId: s.id, count, reason: count === null ? 'table unavailable' : undefined });
    }
    return out;
}
