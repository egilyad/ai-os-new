<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Разработчикам: карта каталогов

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, структура

Источники: `package.json`, `src/`

## Верхний уровень

```text
src/
  kernel/       ядро: DI-контейнер, шина, сервисы, контракты, bootstrap, тип-баррели
  components/   панели UI (по папке на фичу) + WikiPanel
  stores/       состояние UI (Zustand-подобные сторы)
  i18n/         локали en/ru + тест паритета
  llm/          адаптеры провайдеров, декораторы, HTTP/SSE
  generated/    сгенерированные данные (commits-feed, wiki-panel-map, каталоги)
  route-*.ts    реестр маршрутов и lazy-импортов
scripts/        генераторы, sidecar-ctl, smoke, cors-прокси
server/         sync-server, dev-хост, server-тесты
e2e/            Playwright-спеки
cli/            superagents CLI
docs/           манифесты, аудиты, roadmap
```

## Ядро изнутри (src/kernel)

- Корень: `bootstrap.ts`, `bootstrap-phases.ts`, `container.ts`, `kernel.ts`, `runtime.ts`, `security.ts`, `service-helper.ts`.
- Каталоги: `agents`, `contracts` (интерфейсы), `dal`, `events`, `instances` (паблик-баррели), `services`, `state`, `types`, `utils`, `workers`.

## Точки входа для чтения кода

1. `src/kernel/DEPENDENCY_MAP.md` — карта инъекций «кто от кого зависит».
2. `src/kernel/instances/index.ts` — что вообще доступно панелям.
3. `src/route-imports.ts` — соответствие «id панели → файл компонента».

---

## Связанные материалы

- [Разработчикам: обзор и слои](./dev-overview.md)
- [Разработчикам: компоненты и панели](./dev-components.md)
- [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md)

[← Все материалы](./README.md)
