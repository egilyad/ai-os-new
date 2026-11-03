# Подготовка: Baseline (точка старта)

> Что зафиксировать до начала писать код, чтобы старт был безопасным и измеримым.
> Дата фиксации: 2026-10-31.

---

## 1. Репозиторий и окружение

| Параметр          | Значение                                                          |
| ----------------- | ----------------------------------------------------------------- |
| Корень проекта    | `C:\Users\evgeny\Desktop\ai-os-new-fix-debate-text-truncation\`   |
| Версия            | v4.5.0 (package.json: `private: true`)                            |
| Node              | ≥22 (Node 22 используется в CI)                                   |
| Пакетный менеджер | npm (есть `package-lock.json`; `npm ci` с `--legacy-peer-deps`)   |
| Git               | репозиторий есть; ветки main/master; husky+lint-staged pre-commit |
| Язык              | TypeScript 6.0 strict (4 tsconfig: app/node/test)                 |

### Команды (памятка)

```bash
npm run dev                 # dev-сервер Vite
npm run dev:shared          # Vite + прокси + typecheck
npm run typecheck:fast      # tsc -b --noEmit --project tsconfig.app.json
npm run typecheck           # полный typecheck (~2 мин)
npm run build               # tsc -b && vite build
npm run lint                # eslint . (порог в CI --max-warnings 5600)
npm run test:stable         # стабильный scoped-набор (vitest) — то, что гоняет CI
npm run test:server         # node --test для server/tests/*
npm run test:coverage       # coverage (пороги 30/20%)
npm run test:e2e            # Playwright (12 шардов в CI)
npm run check:circular-kernel  # madge
npm run check:deps             # dependency-cruiser
npm run docs:health            # проверка здоровья документации
```

### Важные факты

- **Полный `vitest run` НЕ проходит**: 257 pre-existing падений в 67 файлах (backlog).
  CI гоняет только `test:stable` (scoped). Перед работой над файлом — сначала проверь,
  входит ли он в stable-набор; если нет, запускай его тест отдельно.
- **Coverage-пороги низкие** (30/20%) и include-список узкий.
- **Lint-порог захардкожен** (5600 warnings) — это «потолок», не количество. Не делай хуже.
- **Docker в CI не тестируется** (нет docker-джобы).
- **CI-гейт вики**: `git diff --exit-code` после 15 генераторов — любая рассинхронизация ломает CI. Перед коммитом документации — перегенерируй.

---

## 2. Ключевые «карты» проекта

### Главные директории

```
src/kernel/          ядро: contracts (1156 экспортов), services (71 подпапка/352),
                     events (event-registry.ts ~2772 стр), state/, container.ts, bootstrap.ts, instances/
src/llm/             адаптеры (26 провайдеров), декораторы (13), http/, registry/, embeddings/, core/
src/components/       ~200 панелей (в т.ч. TechniquePanels/ 58)
src/stores/          ~22 Zustand-сторов (+ hydration, deps)
src/hooks/           12 хуков
src/routes.tsx + route-registry-{core|system|content}.ts + route-imports.ts
src/i18n/            en/ru (паритет проверяется тестом)
src/data/            rivals-catalog.ts, role-library.ts
server/              sync-server.mjs, browser-sidecar.mjs, tests/
cli/                 superagents.mjs
scripts/             ~44 генератора (wiki + служебные)
docs/  wiki/ (287 материалов), audits/waves/, known-issues-deferred.md, SYSTEM_MANIFEST.md, events.md
e2e/                 Playwright (20 спек/12 шардов)
docker/              Dockerfile, docker-compose.yml + quickstart
```

### Источники правды (single source of truth)

- События: `src/kernel/events/event-registry.ts` (EVENT_REGISTRY → EVENTS/EventMap/EventValidators).
- Маршруты/панели: `route-registry-*.ts` (id) == `route-imports.ts` (PANEL_COMPONENTS) == путь.
- Контракты: `src/kernel/contracts/` (типы + I<Service>).
- DI: `src/kernel/container.ts` + `service-registration/phaseNN-*.ts`.
- Список провайдеров: `src/llm/registry/adapter-factory.ts` (SUPPORTED_PROVIDERS).
- Модели: `src/llm/catalog/models-catalog.ts` (генерится из models.dev).

---

## 3. Тестовый ландшафт

| Область      | Файлов/тестов      | Статус                 |
| ------------ | ------------------ | ---------------------- |
| kernel       | ~370 тест-файлов   | ядро лучшее            |
| llm          | ~27                | покрыто                |
| components   | ~166               | смоук/юнит             |
| stores       | ~14                | покрыто                |
| i18n         | 1 (паритет ключей) | обязателен             |
| server/tests | node:test (8)      | гоняется `test:server` |
| e2e          | 20 спек            | 12 шардов в CI         |

**Правило**: тест рядом с исходником (`foo.test.ts` / `FooPanel.test.tsx`).
**Голые места (без тестов)**: CognitiveService/OrchestrationService, LlmCrewExecutor/CouncilPort/GraphPort,
AuditService/GovernanceService/FleetMonitor/ToolGovernance, SandboxService, service-helper (lazyService).

---

## 4. Что замерить до старта (baseline-фиксация)

1. Прогнать `npm run typecheck` и `npm run test:stable` → зафиксировать «зелёный» статус.
2. `npm run lint` → зафиксировать текущее число warnings (счётчик).
3. `npm run test:coverage` → зафиксировать % по thresholds.
4. Снять «снимок» `docs/audits/waves/map-01..10` (они уже есть) и `docs/known-issues-deferred.md`.
5. Зафиксировать список 257 падающих тестов как backlog-артефакт (снять список: `npx vitest run --reporter=json` → сохранить).

---

## 5. «Definition of Done» для любой задачи

- Typecheck зелёный; lint не хуже baseline; тест-файл добавлен рядом и проходит.
- Сервис зарегистрирован в DI (фаза + тир при `init`); событие в event-registry; доступ через lazyService.
- Панель ша регистрирована в route-registry + route-imports + i18n (en+ru) + тест.
- Нет циклических зависимостей (check:circular-kernel) и нарушений cruise (check:deps: no-ui-in-kernel, no-react-in-kernel).
- Документация обновлена и перегенерированы wiki (если затронуты панели/сервисы/события).
