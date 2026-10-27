<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Аудит: ключи и секреты

> Раздел: **Разработчикам** · Статус: verified · Теги: аудит, ключи, секреты, api keys, безопасность

Источники: `src/kernel/services/key-management/`, `src/kernel/services/key-state-store.ts`

## Назначение

Аудит подсистемы ключей/секретов как управляемых сущностей, а не просто строк в storage.

## Что проверять

- Registry и жизненный цикл ключей (lifecycle), статусы, probation, ротация.
- Квоты, health-проверки, аналитика использования.
- Reconciler, hydrator, group manager, reset pipeline.
- Единый source of truth для ключей/секретов (без дублирующих хранилищ).
- Отсутствие утечек секретов в логах/сообщениях.

## Связи

Пересекается с [Аудит: безопасность и hardening](./audit-type-security.md). Идеал — один официальный источник правды для ключей и секретов.

---

## Связанные материалы

- [Аудит: безопасность и hardening](./audit-type-security.md)
- [Аудит: методология и процесс](./audit-methodology.md)

[← Все материалы](./README.md)
