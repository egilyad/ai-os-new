<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Исследование (расширенное и Gemini)

> Раздел: **Панели** · Статус: documented · Теги: панель, исследование, gemini, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/ResearchPanel/ResearchEngineAdvancedPanel`, `src/components/GeminiResearch/GeminiResearchPanel`

## Назначение

Расширенные режимы исследования. Метки — `nav.*`.

## Инструменты

- **Research: Advanced** — продвинутый движок исследования.
- **Research: Gemini AI** — исследование через Gemini.
- **Research Reports** — отчёты по исследованию.

## Где менять

Компоненты: `ResearchEngineAdvancedPanel`, `GeminiResearchPanel`, `ResearchReportPanel`. Базовый движок — [Панель: Исследовательский движок](./panel-research.md).

---

## Связанные материалы

- [Панель: Исследовательский движок](./panel-research.md)
- [Панель: Генератор тем](./panel-topics.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `research-gemini` → маршрут `/research-gemini`
  - Компонент: `src/components/GeminiResearch/GeminiResearchPanel`
  - Тесты: `src/components/GeminiResearch/GeminiResearchPanel.test.tsx`
- Панель `research-advanced` → маршрут `/research-advanced`
  - Компонент: `src/components/ResearchPanel/ResearchEngineAdvancedPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
