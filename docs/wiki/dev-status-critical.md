<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Критические проблемы

> Раздел: **Состояние разработки** · Статус: needs-check · Теги: состояние разработки, риски

Актуальные критические проблемы (не закрыты, отложены до продуктового решения):

- **Authz/роли** — fail-open в permission middleware (W2-001), мутации без авторизации (W2-002/017/018), admin-гейт AUTOPILOT (W4-044), bearer-токен в localStorage (W2-015).
- **CSAM/модерация изображений отсутствует** — требуется внешний сервис (W7-UGC-009).
- **Cost-enforcement** — CostManagerDecorator только логирует, не блокирует (W2-012, W4-030/031/032).
- **Внешний аудит sandbox** — нужен до того, как предлагать расширения как безопасные (Tech Map §6).

Закрыто 07.11.2026: **P0-1** passphrase-vault (шифрование at-rest, fail-closed, миграция ключей) и **P0-2** multi-tenant IDOR (per-company секреты, WS-скоупинг). До создания vault ключи остаются незашифрованными — см. README.

Коды и детали — в `docs/known-issues-deferred.md`, разделы 12–13.

---

## Связанные материалы

- [Завершённые задачи](./dev-status-done.md)
- [Активная разработка](./dev-status-active.md)
- [Технический долг](./dev-status-debt.md)
- [Отложенные баги](./dev-status-bugs.md)
- [Состояние тестирования](./dev-status-testing.md)
- [Документация](./dev-status-docs.md)
- [Заблокированные задачи](./dev-status-blocked.md)
- [Roadmaps](./dev-status-roadmaps.md)
- [MD и другие файлы от разработки](./dev-status-files.md)

[← Все материалы](./README.md)
