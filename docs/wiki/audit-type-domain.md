<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Аудит: системный по доменам

> Раздел: **Разработчикам** · Статус: verified · Теги: аудит, домены, модули, системный

Источники: `src/kernel/`, `src/components/`

## Назначение

Широкий аудит по доменам, а не по отдельным багам: проект воспринимается как взаимосвязанная система рисков.

## Домены

- Ядро (kernel core), service registration, DAL/storage.
- Key management, debate runtime, agents/roles.
- LLM/chat, стриминг, router-ы, advisor/research.
- Provider runtime, stores, utils, schemas.

## Итог

Выход на «классы дефектов»: race conditions, memory leaks, stale state, schema drift, streaming correctness, DI inconsistency, security boundaries. См. также [Аудит: данные, состояние и стриминг](./audit-type-data-streaming.md) и [Аудит: безопасность и hardening](./audit-type-security.md).

---

## Связанные материалы

- [Аудит: методология и процесс](./audit-methodology.md)
- [Аудит: консолидация архитектуры](./audit-type-architecture.md)
- [Аудит: данные, состояние и стриминг](./audit-type-data-streaming.md)

[← Все материалы](./README.md)
