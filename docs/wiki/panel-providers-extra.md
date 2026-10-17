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

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `google-studio` → маршрут `/google-studio`
  - Компонент: `src/components/GoogleStudio/GoogleStudioPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `gemini-live` → маршрут `/gemini-live`
  - Компонент: `src/components/GeminiLivePanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `rival-labs` → маршрут `/rival-labs`
  - Компонент: `src/components/RivalLabs/RivalLabsPanel`
  - Тесты: `src/components/RivalLabs/RivalLabsPanel.test.tsx`
- Панель `rivals-catalog` → маршрут `/rivals-catalog`
  - Компонент: `src/components/RivalsCatalogPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `provider-dashboard` → маршрут `/provider-dashboard`
  - Компонент: `src/components/ProviderDashboard`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `provider-marketplace` → маршрут `/provider-marketplace`
  - Компонент: `src/components/ProviderMarketplace`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `groq-speed` → маршрут `/groq-speed`
  - Компонент: `src/components/ProviderManager/GroqSpeedDashboard`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `nvidia-enterprise` → маршрут `/nvidia-enterprise`
  - Компонент: `src/components/NvidiaEnterprise/NvidiaEnterprisePanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `openrouter` → маршрут `/openrouter`
  - Компонент: `src/components/OpenRouterPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `model-distillation` → маршрут `/model-distillation`
  - Компонент: `src/components/DistillationPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
