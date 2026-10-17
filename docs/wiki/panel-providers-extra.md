<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Провайдерские дополнения

> Раздел: **Панели** · Статус: verified · Теги: панель, провайдеры, маркетплейс, инструкция

Источники: `src/i18n/translations/en/providers.ts`, `src/components/ProviderDashboard`, `src/components/ProviderMarketplace`

## Назначение

Дополнительные панели вокруг провайдеров: дашборд, маркетплейс и интеграции отдельных вендоров. Ключи `provider_dashboard.*`.

## Дашборд

Активные ключи, провайдеры, всего запросов, средняя латентность, оценочная стоимость, недавние решения и события.

## Маркетплейс и вендоры

Маркетплейс провайдеров, интеграции OpenRouter, Groq (скорость), NVIDIA Enterprise, Google Studio и Gemini Live, а также сравнение лабораторий (Rival Labs) и каталог соперников. Дистилляция моделей — отдельная панель.

## Где менять

Компоненты: `ProviderDashboard`, `ProviderMarketplace`, `OpenRouterPanel`, `GroqSpeedDashboard`, `NvidiaEnterprisePanel`, `GoogleStudioPanel`, `GeminiLivePanel`, `RivalLabsPanel`, `DistillationPanel`. Основное — [Панель: Провайдеры и ключи](./panel-providers.md).

---

## Связанные материалы

- [Панель: Провайдеры и ключи](./panel-providers.md)
- [Панели: Умная маршрутизация](./panel-routing.md)
- [Панель: Пул ключей провайдеров](./panel-pools.md)

[← Все материалы](./README.md)
