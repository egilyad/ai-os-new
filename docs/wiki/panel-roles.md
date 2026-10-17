<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панель: Роли и консорциумы

> Раздел: **Панели** · Статус: verified · Теги: панель, роли, консорциум, инструкция

Источники: `src/i18n/translations/en/agents.ts`, `src/components/RolesPanel/RolesPanel.tsx`, `src/components/RolesPanel/RolesConsortiaPanel.tsx`

## Назначение

Роли агентов и их объединения (консорциумы). Ключи `roles.*` и `roles_consortia.*`.

## Роли

Список ролей: создание, редактирование и удаление, поиск, роль по умолчанию, температура у роли, импорт и экспорт. Удаление подтверждается, ошибки удаления показываются.

## Консорциумы

Объединения ролей: список и поиск.

## Где менять

Компоненты: `RolesPanel`, `RolesConsortiaPanel`. Обзор агентов — [Агенты: устройство и управление](./agents.md), роли доступа — [Панель: Governance и безопасность](./panel-governance.md).

---

## Связанные материалы

- [Агенты: устройство и управление](./agents.md)
- [Панель: Governance и безопасность](./panel-governance.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `roles` → маршрут `/roles`
  - Компонент: `src/components/RolesPanel/RolesPanel`
  - Тесты: `src/components/RolesPanel/RolesPanel.test.tsx`
- Панель `roles-consortia` → маршрут `/roles-consortia`
  - Компонент: `src/components/RolesPanel/RolesConsortiaPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
