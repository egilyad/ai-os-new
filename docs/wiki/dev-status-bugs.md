<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Отложенные баги

> Раздел: **Состояние разработки** · Статус: needs-check · Теги: состояние разработки, баги

Зафиксированные отложенные баги/расхождения:

- `browser-use-service.test.ts` — завышенное ожидание («is it running») vs реальное сообщение.
- `metrics-service` — 3 теста про эмиссию алертов флакают в окружении (не связаны с правками).
- Cross-tab: последний пишущий побеждает, silent message loss (W6-019, W7-ANA-007).
- `isStaleSessionWrite` — guard обходится через `SessionRepository.save` (W6-011).

---

## Связанные материалы

- [Завершённые задачи](./dev-status-done.md)
- [Активная разработка](./dev-status-active.md)
- [Критические проблемы](./dev-status-critical.md)
- [Технический долг](./dev-status-debt.md)
- [Состояние тестирования](./dev-status-testing.md)
- [Документация](./dev-status-docs.md)
- [Заблокированные задачи](./dev-status-blocked.md)
- [Roadmaps](./dev-status-roadmaps.md)
- [MD и другие файлы от разработки](./dev-status-files.md)

[← Все материалы](./README.md)
