<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Полный перечень проверок CI

> Раздел: **Разработчикам** · Статус: verified · Теги: ci, проверки, гейты

Источники: `.github/workflows/ci.yml`

## Все реально включённые проверки

1. **TypeScript type-check** — `tsc --noEmit` по проектным tsconfig-ссылкам.
2. **ESLint** — 0 ошибок, порог предупреждений 4300.
3. **Build (Vite)** — `npm run build` + предупреждение, если dist > 30 МБ.
4. **Unit Tests** — `npm run test:stable` + `npm run test:server` (Node test-runner,
   серверные и скриптовые тесты).
5. **Full Unit Tests** — 23 среза, включая kernel, components, rest.
6. **Test Coverage** — v8: statements ≥ 31, branches ≥ 25, functions ≥ 30, lines ≥ 32.
7. **E2E Tests** — 12 шардов Playwright (23 спек-файла, ~65 тестов).
8. **Demo screenshots** — `npm run gen:demos` (screenshots + visual regression);
   CI загружает PNG артефактом для просмотра и не обновляет закоммиченные изображения
   автоматически (обновление — `npm run gen:demos` локально).
9. **Security Audit** — `npm audit` (provenance/audit флаги).
10. **Circular Dependency Check** — поиск циклов в графе импортов.
11. **Dependency Graph Check** — целостность графа зависимостей ядра.
12. **Wiki docs in sync** — генераторы вики должны давать нулевой diff.
13. **Documentation health** — проверка источников статей и внутренних ссылок вики.
14. **Deploy to GitHub Pages** — только на main/master и только если гейты из
    `deploy.needs` зелёные (см. CI/CD Architecture; full-tests и demos в needs нет).


---

## Связанные материалы

- [CI/CD Architecture](./ci-architecture.md)
- [Инструкция по запуску тестов](./testing-runbook.md)

[← Все материалы](./README.md)
