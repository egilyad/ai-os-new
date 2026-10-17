<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Исследования системы дебатов

> Раздел: **Панели** · Статус: documented · Теги: панель, дебаты, исследование, эксперименты, инструкция

Источники: `src/i18n/translations/en/debate.ts`, `src/components/DebateResearch/`

## Назначение

Экспериментальные исследования самой системы дебатов (папка DebateResearch). Метки — `nav.*`, часть ключей — `debate.*`.

## Инструменты

- **Architecture Review** — разбор архитектуры.
- **Prompt & Strategy Audit** — аудит промптов и стратегий.
- **Model Routing Experiments** — эксперименты маршрутизации моделей.
- **Governance Stress-Test** — стресс-тест управления.
- **Observability Gaps Scanner** — поиск пробелов наблюдаемости.
- **Hypothesis Generator** — генерация гипотез: создание/запуск/удаление, старт дебата (`hypothesis_generator.*`).
- **Debate System Research** — исследование системы дебатов.

## Где менять

Компоненты: `src/components/DebateResearch/*`. Анализ дебатов — [Панель: Анализ дебатов](./panel-debate-analysis.md), метрики — [Панели: Метрики-анализаторы](./panel-eval-extra.md).

---

## Связанные материалы

- [Дебаты: режимы и механика](./debates.md)
- [Панель: Анализ дебатов](./panel-debate-analysis.md)
- [Панели: Метрики-анализаторы](./panel-eval-extra.md)
- [Зона 17: debate research](./zone-17.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `obs-gaps` → маршрут `/obs-gaps`
  - Компонент: `src/components/DebateResearch/ObsGaps`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `debate-system-research` → маршрут `/debate-system-research`
  - Компонент: `src/components/DebateResearch/DebateSystemResearch`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `hypothesis-gen` → маршрут `/hypothesis-gen`
  - Компонент: `src/components/DebateResearch/HypothesisGenerator`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `routing-experiments` → маршрут `/routing-experiments`
  - Компонент: `src/components/DebateResearch/RoutingExperiments`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `arch-review` → маршрут `/arch-review`
  - Компонент: `src/components/DebateResearch/ArchitectureReview`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `prompt-audit` → маршрут `/prompt-audit`
  - Компонент: `src/components/DebateResearch/PromptAudit`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `gov-stress-test` → маршрут `/gov-stress-test`
  - Компонент: `src/components/DebateResearch/GovStressTest`
  - Тесты: `src/components/DebateResearch/GovStressTest.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
