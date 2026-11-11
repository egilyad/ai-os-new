<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Инструкция по запуску тестов

> Раздел: **Разработчикам** · Статус: verified · Теги: тесты, инструкция, команды

Источники: `package.json`, `vitest.config.ts`, `e2e/playwright.config.ts`

## Локальный запуск

### Unit-тесты (Vitest)

```bash
# Один файл
npx vitest run src/kernel/services/budget-service.test.ts --pool=forks --no-coverage

# Группа файлов
npx vitest run src/components/PlannerPanel src/components/CostsPanel.test.tsx --pool=forks --no-coverage

# Стабильный набор (используется джобой test)
npm run test:stable

# Полные прогоны (как в CI)
npm run test:full:kernel
npm run test:full:components
npm run test:full:rest

# Покрытие
npm run test:coverage
```

> На слабых машинах используйте `--pool=forks` и избегайте полного прогона src/kernel
> целиком (OOM) — лучше по каталогам.

### E2E (Playwright)

```bash
# Сначала собрать приложение (обязательно с base "/"):
VITE_BASE_PATH=/ npm run build

# Один спек
npx playwright test --config=e2e/playwright.config.ts e2e/basic-flow.spec.ts

# Группа
npx playwright test --config=e2e/playwright.config.ts e2e/data-forum.spec.ts e2e/data-projects.spec.ts

# Все E2E
npm run test:e2e

# Демо-скриншоты
npm run gen:demos
```

### Полный CI локально

Полный CI локально не запускается одной командой — он состоит из джоб.
Последовательность, эквивалентная CI:

```bash
npx tsc --noEmit
npm run lint -- --max-warnings 4300
npm run build
npm run test:stable
npm run test:coverage
VITE_BASE_PATH=/ npm run build && npm run test:e2e
npm run gen:demos
npm audit
```

### Полезные флаги

- `--pool=forks` / `--pool=threads` — выбор пула;
- `--no-coverage` — быстрее, без v8;
- `-t "имя теста"` — запуск одного теста по имени;
- `--reporter=verbose` — подробный вывод.


---

## Связанные материалы

- [CI/CD Architecture](./ci-architecture.md)
- [Архитектура тестирования](./testing-architecture.md)

[← Все материалы](./README.md)
