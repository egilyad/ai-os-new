<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панель: Режиссёр

> Раздел: **Панели** · Статус: verified · Теги: панель, режиссёр, director, сценарии, инструкция

Источники: `src/i18n/translations/en/analytics.ts`, `src/components/DirectorPanel/DirectorPanel.tsx`

## Назначение

Прогон сценариев и целей через роли агентов. Ключи `director.*`.

## Вкладки

Настройка (configure), библиотека (library) и запуск (run).

## Что настраивается

Сценарий, цель (objective) и роли. Есть сид-демо для быстрого старта.

## Где менять

Компонент: `DirectorPanel`. Синтез — [Панель: Синтез мнений](./panel-synthesis.md), дебаты — [Дебаты: режимы и механика](./debates.md).

---

## Связанные материалы

- [Дебаты: режимы и механика](./debates.md)
- [Панель: Синтез мнений](./panel-synthesis.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `director` → маршрут `/director`
  - Компонент: `src/components/DirectorPanel/DirectorPanel`
  - Тесты: `src/components/DirectorPanel/DirectorPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
