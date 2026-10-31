<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Технический долг

> Раздел: **Состояние разработки** · Статус: needs-check · Теги: состояние разработки, долг

Технический долг (крупные рефакторинги, требуют проверки регрессий):

- CacheDecorator `streamMessage` без in-flight dedup (W6-039).
- Singleton `ArgumentGraphService` — cross-session clobber (W6-014).
- Feature-flag UI: `as unknown as Record<string, boolean>` (W6-018).
- ReDoS-риски: 6 мест с пользовательскими regex (W6-023).
- CI: deploy-гейт без тестов, `test:stable` неполный, `--ignore-scripts` (W4-001/002/036).
- Prompt-versioning: 156 unversioned «You are…» (W4-041).
- Retrieval: O(N) сканы, recall-перезапись (W8-012/013/014/015).

---

## Связанные материалы

- [Завершённые задачи](./dev-status-done.md)
- [Активная разработка](./dev-status-active.md)
- [Критические проблемы](./dev-status-critical.md)
- [Отложенные баги](./dev-status-bugs.md)
- [Состояние тестирования](./dev-status-testing.md)
- [Документация](./dev-status-docs.md)
- [Заблокированные задачи](./dev-status-blocked.md)
- [Roadmaps](./dev-status-roadmaps.md)
- [MD и другие файлы от разработки](./dev-status-files.md)

[← Все материалы](./README.md)
