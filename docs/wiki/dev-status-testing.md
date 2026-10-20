<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Состояние тестирования

> Раздел: **Состояние разработки** · Статус: verified · Теги: состояние разработки, тесты

Источники: `package.json`, `vitest.config.ts`

## Как запускать

- `npm test` — весь набор (vitest run).
- `npm run test:stable` — курируемый набор для CI: ядро (stores/hooks/events/workers), ключевые сервисы, LLM-декораторы, wiki-тесты, панели памяти и провайдеров, каталог моделей, эмбеддинги.
- Локально стабильный пул — `forks` (`--pool=forks`). Пул `vmThreads` не подходит: в нём нет `crypto.subtle`, из-за чего падают security/key-vault тесты. При большом параллелизме пул forks может не поднять воркер (`Failed to start forks worker`) — это флаки окружения, конкретные файлы проходят по отдельности.

## Что закрыто недавно

- `src/components/ChatPanel/ChatPanel.test.tsx` — был сломан: мок `useChatStore` не имел `getState()`, панель поиска сообщений поднимала message-index сервис без зарегистрированной БД, а ожидания устарели (кнопки режимов исполнения уехали в RoomPanel). Тест починен и включён в `test:stable`.
- `src/components/ProviderManager/ProviderManager.test.tsx` — в моке `kernel/instances` не было `rootLogger.child()`, а динамический импорт панели укладывался в хук-таймаут. Переведён на статический импорт, мок и ожидания исправлены; файл включён в `test:stable`.
- `src/components/MemoryPanel/MemoryPanel.test.tsx` — в моке не было `rootLogger`; панель памяти добавлена в `test:stable`.

## Известные пробелы

- Часть компонентных тестов вне `test:stable` (например, отдельные панели) запускаются только вручную — при поломке они не ловятся CI.
- Покрытие wiki/панелей описывает статический снимок: `checks` показывает tests 43%, panels 78%.

---

## Связанные материалы

- [Завершённые задачи](./dev-status-done.md)
- [Активная разработка](./dev-status-active.md)
- [Критические проблемы](./dev-status-critical.md)
- [Технический долг](./dev-status-debt.md)
- [Отложенные баги](./dev-status-bugs.md)
- [Документация](./dev-status-docs.md)
- [Заблокированные задачи](./dev-status-blocked.md)
- [Roadmaps](./dev-status-roadmaps.md)
- [MD и другие файлы от разработки](./dev-status-files.md)

[← Все материалы](./README.md)
