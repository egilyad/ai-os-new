<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Карта системы

> Раздел: **Архитектура** · Статус: verified · Теги: система, слои, агенты, стратегии, провайдеры, карта

Источники: `src/data/role-library.ts`, `src/constants/pools.ts`, `src/components/DebatePanel/wizard-constants.ts`, `scripts/gen-wiki-system-map.mjs`

# Карта системы

> Автосгенерировано `scripts/gen-wiki-system-map.mjs` из кода (роли, стратегии, пулы) и каталогов. Не редактировать вручную.

Слои SuperAgents OS и где каждый описан. Источник — код; числа и связи подтверждаются
генераторами, а правила — [Стандарт документации](./docs-standard.md). Полный список документов — [Карта документации](./docs-index.md).

## Слои системы

| Слой | Где в коде | Документация |
| --- | --- | --- |
| Интерфейс: панели и маршруты | `src/route-registry-*.ts, src/route-imports.ts` | [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md) |
| Компоненты | `src/components/**` | [Каталог компонентов OS](./dev-component-catalog.md) |
| Сервисы ядра | `src/kernel/services/**` | [Карта зависимостей ядра (DI)](./dev-service-map.md) |
| События | `src/kernel/events/**` | [Каталог событий шины](./dev-event-catalog.md) |
| Хранилища | `src/**/stores, Dexie` | [Каталог сторов](./dev-store-catalog.md) |
| Контракты | `src/kernel/contracts/**` | [Контракты ядра](./dev-contracts.md) |
| Локализация | `src/i18n/**` | [Каталог локализации](./dev-i18n-catalog.md) |
| Тесты | `**/*.test.*` | [Каталог тестов](./dev-tests-catalog.md) |
| Скрипты и генераторы | `scripts/**` | [Скрипты и CLI](./dev-scripts.md) |
| Роли и агенты | `src/data/role-library.ts` | этот документ |
| Стратегии дебатов | `src/components/DebatePanel/wizard-constants.ts` | этот документ |
| Провайдеры (пулы) | `src/constants/pools.ts` | этот документ |

## Роли и агенты (28)

Библиотека ролей — `src/data/role-library.ts` (`LIBRARY_ROLES`).

| ID | Название | Категория | Темп. | Реком. модель |
| --- | --- | --- | --- | --- |
| `idea-generator` | Генератор идей | design | 0.8 | `openai:gpt-4o` |
| `critic` | Критик | analysis | 0.3 | — |
| `analyst` | Аналитик | analysis | 0.3 | — |
| `engineer` | Инженер / Разработчик | code | 0.2 | `openai:gpt-4o` |
| `defender` | Защитник решения (Адвокат) | writing | 0.4 | — |
| `moderator` | Модератор / Координатор | moderation | 0.3 | — |
| `researcher` | Исследователь / Факт-чекер | analysis | 0.2 | — |
| `secretary` | Секретарь / Детерминатор | writing | 0.2 | — |
| `erudite` | Эрудит | analysis | 0.4 | — |
| `organizer` | Организатор | moderation | 0.3 | — |
| `expert` | Эксперт | analysis | 0.3 | — |
| `communicator` | Коммуникатор | moderation | 0.4 | — |
| `entrepreneur` | Реализатор / Антрепренер | devops | 0.5 | — |
| `arbitrator` | Систематизатор / Арбитр | moderation | 0.4 | — |
| `mathematician` | Математик | analysis | 0.2 | — |
| `physicist` | Физик | analysis | 0.2 | — |
| `chemist` | Химик | analysis | 0.2 | — |
| `biologist` | Биолог | analysis | 0.3 | — |
| `computer-scientist` | Информатик / Компьютерный учёный | code | 0.2 | `openai:gpt-4o` |
| `economist` | Экономист | analysis | 0.3 | — |
| `sociologist` | Социолог | analysis | 0.4 | — |
| `psychologist` | Психолог | design | 0.4 | — |
| `philosopher` | Философ / Этик | analysis | 0.5 | — |
| `lawyer` | Юрист / Правовед | analysis | 0.2 | — |
| `doctor` | Врач / Биомедик | analysis | 0.2 | — |
| `ecologist` | Эколог | analysis | 0.3 | — |
| `statistician` | Статистик / Дата-сайентист | analysis | 0.2 | — |
| `security` | Специалист по безопасности / Криптограф | code | 0.2 | `openai:gpt-4o` |

## Стратегии дебатов

Встроенные стратегии — `src/components/DebatePanel/wizard-constants.ts`.

`round_robin` · `moderated` · `free_for_all` · `socratic` · `argument_tree` · `constrained`

Итого: **6** стратегий.

## Провайдеры (пулы)

Определения пулов — `src/constants/pools.ts` (`POOL_DEFS`).

| Пул | Провайдеры | Назначение |
| --- | --- | --- |
| Fast Compute | `groq`, `nvidia` | Low-latency inference for real-time agents |
| Balanced | `gemini`, `openrouter`, `google` | General-purpose routing with cost-quality tradeoff |
| Free Tier | `groq`, `google`, `openrouter` | Zero-cost models with quota limits for experimentation |
| Experimental | `nvidia`, `openrouter`, `together`, `fireworks`, `deepseek`, `mistral`, `cohere` | New/unstable providers and bleeding-edge models |

Упоминаемые провайдеры: `cohere`, `deepseek`, `fireworks`, `gemini`, `google`, `groq`, `mistral`, `nvidia`, `openai`, `openrouter`, `together`.

## Пробелы (по плану этапа)

- **Внешние библиотеки** — отдельный каталог из `package.json` ещё не собран.
- **Архитектурные решения** — реестр решений (ADR) пока не выделен: см. источники в [Карта документации](./docs-index.md).
- Разделы «роли», «стратегии», «провайдеры» — часть этой страницы; при росте выносятся
  в отдельные каталоги по образцу остальных (см. [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md)).

---

## Связанные материалы

- [Карта документации](./docs-index.md)
- [Карта зависимостей ядра (DI)](./dev-service-map.md)
- [Панели: Инфраструктура и платформа](./panel-infra-meta.md)
- [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md)

[← Все материалы](./README.md)
