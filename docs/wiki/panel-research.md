<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панель: Исследовательский движок

> Раздел: **Панели** · Статус: verified · Теги: панель, исследование, research, инструкция

Источники: `src/i18n/translations/en/analytics.ts`, `src/components/ResearchPanel/ResearchEnginePanel.tsx`

## Назначение

Исследовательские сессии с источниками. Ключи `research_engine.*`.

## Как пользоваться

Создание сессии (заголовок), формулировка вопроса, выбор доступных источников, запуск. Есть списки сессий и источников.

## Состояния

Пустые состояния честные; ошибки обновления, создания, запуска и удаления показываются.

## Где менять

Компонент: `ResearchEnginePanel`. Синтез мнений — [Панель: Синтез мнений](./panel-synthesis.md).

---

## Связанные материалы

- [Панель: Синтез мнений](./panel-synthesis.md)
- [Панель: Форум](./panel-forum.md)
- [Дебаты: режимы и механика](./debates.md)
- [Зона 15: исследования](./zone-15.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `research-engine` → маршрут `/research-engine`
  - Компонент: `src/components/ResearchPanel/ResearchEnginePanel`
  - Тесты: `src/components/ResearchPanel/ResearchEnginePanel.test.tsx`
- Панель `research-reports` → маршрут `/research-reports`
  - Компонент: `src/components/ResearchReportPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
