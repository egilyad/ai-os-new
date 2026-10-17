<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панель: Проекты

> Раздел: **Панели** · Статус: verified · Теги: панель, проекты, инструкция

Источники: `src/i18n/translations/en/analytics.ts`, `src/components/ProjectsPanel/ProjectsPanel.tsx`

## Назначение

Проекты как контейнеры работы. Ключи `projects.*`.

## Проекты

Создание проекта (имя, описание, тип), список со статусами, сид-демо для быстрого старта. Ошибки загрузки и действий показываются, есть повтор (retry).

## Вкладки

Обзор, Q&A, артефакты и превью — содержимое проекта по разделам.

## Где менять

Компонент: `ProjectsPanel`. Задачи — [Панель: Задачи и пайплайны](./panel-tasks.md), потоки — [Панель: Потоки (workflows)](./panel-workflows.md).

---

## Связанные материалы

- [Панель: Задачи и пайплайны](./panel-tasks.md)
- [Панель: Потоки (workflows)](./panel-workflows.md)
- [Каталог компонентов OS](./dev-component-catalog.md)
- [Зона 11: workspace и проекты](./zone-11.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `project-os` → маршрут `/project-os`
  - Компонент: `src/components/DebateResearch/ProjectOsExplorer`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `projects` → маршрут `/projects`
  - Компонент: `src/components/ProjectsPanel/ProjectsPanel`
  - Тесты: `src/components/ProjectsPanel/ProjectsPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
