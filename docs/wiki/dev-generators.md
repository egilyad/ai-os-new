<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Разработчикам: генераторы и сгенерированные файлы

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, генераторы, scripts

Источники: `scripts/`, `src/generated/`

## Что генерируется

- `src/generated/commits-feed.ts` — лента коммитов (git log, 40 записей) для раздела «Новости».
- `src/generated/wiki-panel-map.ts` — карта «id панели → путь компонента» (из `route-imports.ts`).
- `src/generated/wiki-component-catalog.ts` — каталог компонентов и их связей (статья [Каталог компонентов OS](./dev-component-catalog.md)).
- `src/generated/wiki-event-catalog.ts` — каталог событий шины (статья [Каталог событий шины](./dev-event-catalog.md)).

## Скрипты

- `node scripts/gen-wiki-data.mjs` — обновить ленту коммитов и карту панелей.
- `node scripts/gen-wiki-catalog.mjs` — каталог компонентов (обойти дерево src/components).
- `node scripts/gen-wiki-events.mjs` — каталог событий (из event-registry.ts).
- `node scripts/gen-technique-panels.mjs` — панели техник дебатов.
- `node scripts/gen-readme-maps.mjs` — карты для README.

## Правило

Сгенерированные файлы не редактируются руками (в шапке — «do not hand-edit»). Меняешь содержимое — правь генератор и перезапусти его.

---

## Связанные материалы

- [Разработчикам: ворота качества и CI](./dev-ci.md)
- [Разработчикам: маршруты и добавление панели](./dev-routing.md)
- [Разработчикам: карта каталогов](./dev-layout.md)
- [Скрипты и CLI](./dev-scripts.md)

[← Все материалы](./README.md)
