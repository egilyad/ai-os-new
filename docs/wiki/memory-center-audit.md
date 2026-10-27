<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Memory Center: аудит памяти системы

> Раздел: **Знания и память** · Статус: verified · Теги: память, аудит, memory center, хранилища, инвентаризация

Источники: `src/kernel/services/dexie-schema.ts`

## Назначение

Аудит памяти SuperAgents OS — карта того, что система сохраняет, где это хранится и кто владеет данными. Это фундамент для **Memory Center** (единого обзора памяти).

## Главный вывод

Вся основная память — **в одной базе IndexedDB** (super_agents_os_v4, Dexie), но разбита на десятки логических таблиц с разными владельцами. Плюс отдельные лёгкие механизмы (localStorage/SSR).

## Категории → таблицы → владельцы

- **Чаты**: sessions → chat-executor, useChatStore.
- **Дебаты**: debateSessions, debateVerdicts, debateTimeline → debate-engine, debate-sync-manager.
- **Агенты**: agentMemory, agentExecutions, agentMetrics → agent-service, agent-journal-service.
- **Знания/Wiki**: memories, ltMemories, knowledgePackages → memory-engine, wiki-brain.
- **Исследования**: crystals, junctions, synthSessions, genJobs → crystal-vault, junction, synthesis, generator.
- **Конфиг**: keyValue → config/settings.
- **Задачи/проекты**: agemsTasks, projects, runQueue → agems-task, project, runqueue.
- **Флот/governance**: crews, councilSessions, invocations, политики и т.д.
- **Ключи/пользователь**: apiKeys, notes, personaProfiles.

## Механизмы поиска

- MemoryEngine (BM25 + семантика) по memories.
- Wiki-Brain (семантический поиск статей).
- messageIndex (сообщения чата).
- Остальные таблицы — без общего семантического индекса.

## Пробелы и дубликаты

- Нет единого реестра источников.
- Нет общей карты происхождения.
- auditLog vs auditLogs — вероятный дубликат.
- eventLog/traces/cognitiveTraces — перекрывающиеся журналы.
- localStorage/SSR — вне единой карты.

## Рекомендации

Memory Center: Registry (каталог источников) → Overview → Storage Map → Explorer → Search (агрегация существующих) → Health & Gaps. Без дублирования хранилищ и без фиктивных цифр.

---

## Связанные материалы

- [Знания и память](./memory.md)
- [Память: что есть и чего нет (аудит)](./memory-audit.md)
- [Панель: База знаний (RAG)](./panel-knowledge.md)
- [Панели: Линзы и кристаллы](./panel-lenses-crystals.md)

[← Все материалы](./README.md)
