<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Разработчикам: тесты

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, тесты, vitest, playwright

Источники: `vitest.config.ts`, `package.json`, `e2e/`

## Уровни

- **Unit/компонентные** — Vitest + Testing Library (`.test.ts/.test.tsx` рядом с кодом).
- **Server** — `node --test` для sync-server (атомарность, очереди, адаптеры): `npm run test:server`.
- **E2E** — Playwright (`e2e/`), холодный boot + маршруты.

## Команды

- `npm run test:stable` — проверенный стабильный набор (то, что гоняет CI как гейт; полный `vitest run` на общих раннерах не тянет).
- `npm run test:coverage` — тот же набор с покрытием (пороги в `vitest.config.ts`).
- `npm run test:server`, `npm run test:e2e`.

## Грабли (проверено болью)

- Нестабильный `t` в моке → петля рендера. Стабилизируй через `vi.hoisted`.
- Мок-фабрика, ссылающаяся на top-level `let`, падает на статическом импорте (TDZ) — используй `vi.hoisted` или динамический `import` внутри теста.
- `useVirtualizer` в jsdom рендерит 0 строк (нет layout) — мокируй виртуализатор или ассерти по данным, не по DOM.
- Протухшие моки ядра (`rootLogger`, `services-core`, `useKeyStore`) — чини мок, а не панель.

## Когда локальный прогон недоступен

Если пул воркеров в окружении мёртв — валидируй синтаксис транспиляцией, гоняй eslint на файл и опирайся на CI как гейт.

---

## Связанные материалы

- [Каталог тестов](./dev-tests-catalog.md)
- [Разработчикам: ворота качества и CI](./dev-ci.md)
- [Разработчикам: конвенции кода](./dev-conventions.md)

[← Все материалы](./README.md)
