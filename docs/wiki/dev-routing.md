<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Разработчикам: маршруты и добавление панели

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, роутинг, панель

Источники: `src/route-registry-core.ts`, `src/route-registry-content.ts`, `src/route-registry-system.ts`, `src/route-imports.ts`

## Реестр маршрутов

- `route-registry-core.ts`, `route-registry-content.ts`, `route-registry-system.ts` — секции меню (`NAV_SECTIONS`) и пункты (id + labelKey).
- `route-imports.ts` — карта «id панели → React.lazy(import(компонент))».
- По этим данным генерируется `src/generated/wiki-panel-map.ts` (id → путь файла).

## Новая панель за 4 шага

1. Два i18n-ключа: en + ru (иначе падает тест паритета `i18n-keys.test.ts`).
2. Запись в реестре: id и labelKey в одной из секций `route-registry-*`.
3. Lazy-импорт + строка в карте `route-imports.ts`.
4. Готово: роут, пункт сайдбара, крошки и поиск появляются автоматически.

## Проверка

После добавления — `node scripts/gen-wiki-data.mjs` обновит карту «панель → файл», чтобы вики знала про новую панель.

---

## Связанные материалы

- [Разработчикам: компоненты и панели](./dev-components.md)
- [Разработчикам: локализация (i18n)](./dev-i18n.md)

[← Все материалы](./README.md)
