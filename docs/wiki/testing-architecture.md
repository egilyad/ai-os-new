<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Архитектура тестирования

> Раздел: **Разработчикам** · Статус: verified · Теги: тесты, vitest, playwright, архитектура

Источники: `package.json`, `vitest.config.ts`, `e2e/playwright.config.ts`, `.github/workflows/ci.yml`

## Уровни проверок

Проект использует четыре независимых уровня проверок, запускаемых в CI:

1. **Unit-тесты (Vitest).** Тестовые файлы лежат рядом с кодом: `src/**/*.test.{ts,tsx}`.
   Среда: jsdom + `fake-indexeddb/auto` + лёгкий setup (`src/tests/setup-light.ts`).
   Пул: `forks` (по умолчанию) или `threads` в CI; покрытие — v8.
2. **E2E-тесты (Playwright).** Все спек-файлы в `e2e/*.spec.ts` (23 файла).
   Запускаются против свежесобранного `dist/` через `vite preview` (порт 5199)
   и test-only sync-server (порт 3001).
3. **Визуальные/демо-проверки.** `e2e/screenshots.spec.ts` и `visual-regression.spec.ts`
   генерируют PNG и обновляют `docs/demos/img/`.
4. **Статические и системные проверки.** TypeScript (`tsc --noEmit`), ESLint,
   проверка связности (`dependency-cruiser`-стиль), Security Audit (`npm audit`),
   покрытие c порогами.

## Как unit-тесты организованы

Каталоги:

- `src/kernel/**` — логика ядра: сервисы, DAL, события, контракты, утилиты (453 файла);
- `src/components/**` — UI-компоненты и панели (169 файлов);
- `src/llm/**` — HTTP-клиенты и декораторы LLM-провайдеров (27 файлов);
- `src/stores/**`, `src/hooks/**`, `src/tests/**` — сторы, хуки, интеграционные бут-тесты.

Полная unit-матрица в CI разбита на 17 срезов (см. «CI/CD Architecture»),
чтобы уложиться в лимит памяти раннера и ускорить параллельность.

## Как E2E-тесты организованы

Каждый спек стартует с общего `boot(page)`-гейта (`e2e/helpers.ts`):
ждём появления заголовка `Mission Control`, что означает завершённую гидратацию SPA.
Затем тесты работают с реальным приложением через роуты и UI.

Шарды E2E (12) разбиты по доменам: basic/routes, debate, dialogs, fleet, forum,
health-chat-sync, knowledge, organizer, projects, research, runtime.


---

## Связанные материалы

- [Инструкция по запуску тестов](./testing-runbook.md)
- [CI/CD Architecture](./ci-architecture.md)
- [Каталог тестов](./testing-catalog.md)

[← Все материалы](./README.md)
