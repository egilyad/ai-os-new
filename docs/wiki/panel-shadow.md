<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Теневые прогоны и стратегия

> Раздел: **Панели** · Статус: documented · Теги: панель, shadow, стратегия, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/ShadowPanel/ShadowPanel.tsx`, `src/components/ShadowOpponentPanel/ShadowOpponentPanel.tsx`

## Назначение

Теневое сравнение вариантов и стратегия дебатов. Метки — `nav.*`.

## Инструменты

- **Shadow Compare** — теневое сравнение.
- **Shadow Opponent** — теневой оппонент для отработки аргументов.
- **Audience** — модель аудитории.
- **Strategy Builder** — конструктор стратегии дебатов.

## Где менять

Компоненты: `ShadowPanel`, `ShadowOpponentPanel`, `AudiencePanel`, `DebatePanel/DebateStrategyBuilder`. Дебаты — [Дебаты: режимы и механика](./debates.md).

---

## Связанные материалы

- [Дебаты: режимы и механика](./debates.md)
- [Панели: Симуляция и контрфакты](./panel-simulation.md)
- [Панель: Анализ дебатов](./panel-debate-analysis.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `audience` → маршрут `/audience`
  - Компонент: `src/components/AudiencePanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `strategy-builder` → маршрут `/strategy-builder`
  - Компонент: `src/components/DebatePanel/DebateStrategyBuilder`
  - Тесты: `src/components/DebatePanel/DebateStrategyBuilder.test.tsx`
- Панель `shadow-opponent` → маршрут `/shadow-opponent`
  - Компонент: `src/components/ShadowOpponentPanel/ShadowOpponentPanel`
  - Тесты: `src/components/ShadowOpponentPanel/ShadowOpponentPanel.test.tsx`
- Панель `shadow` → маршрут `/shadow`
  - Компонент: `src/components/ShadowPanel/ShadowPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
