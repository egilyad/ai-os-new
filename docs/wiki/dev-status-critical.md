<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Критические проблемы

> Раздел: **Состояние разработки** · Статус: needs-check · Теги: состояние разработки, риски

Актуальные критические проблемы (не закрыты, отложены до продуктового решения):

- **KeyVault fail-open + deviceKey в plaintext** (localStorage) — шифрование ключей обесценивается; нужен passphrase-UI.
- **API-ключи/секреты в открытом виде в IndexedDB** — зависит от vault.
- **Multi-tenant IDOR / общий SYNC_SECRET / WS cross-tenant leak** — нужен server-скоупинг.
- **CSAM/модерация изображений отсутствует** — требуется внешний сервис.

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
