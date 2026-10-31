/**
 * gen-cards.mjs — генератор карт системной разведки (карты 1..25).
 * Читает таблицу CARD_DEFS и пишет docs/audits/waves/card-<n>-<slug>.md
 * в едином скелетном формате. Заполнение фактов — руками/из аудитов.
 *
 * Запуск: node scripts/gen-cards.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'audits', 'waves');

const CARDS = [
  {
    num: 11,
    slug: 'security-trust',
    title: 'Безопасность, доверие и границы (Security & Trust)',
    scope:
      'Модель безопасности и границ доверия: доступ панелей/сервисов/агентов к файлам, сети, ключам и shell; секреты; изоляция; prompt injection; surface атаки; привилегии.',
    method: 'Статический анализ прав/импортов + карты: Security&Trust, Trust Boundary, Agent Safety/Sandbox, Attack Surface, Privilege, Privacy.',
    feeds: ['map-03-technical-health', 'map-08-capability-accessibility', 'audit-wave2', 'audit-wave4', 'audit-wave5', 'audit-wave7'],
  },
  {
    num: 12,
    slug: 'data-flows',
    title: 'Потоки данных, владение и целостность (Data Flow & Ownership)',
    scope:
      'Как данные движутся: откуда возникают, трансформации, кэши/дубли, потеря/устаревание, владельцы (single source of truth), целостность и миграции.',
    method: 'Анализ хранилищ (Dexie/IndexedDB), событий и владельцев + карты: Data Flow/Lineage/Ownership/Integrity, Data Landscape, Data Trust.',
    feeds: ['map-01-requirements', 'map-10-resource-consumption', 'audit-wave2', 'audit-wave5', 'audit-wave7'],
  },
  {
    num: 13,
    slug: 'context-prompts-memory',
    title: 'Контекст, промпты и память (Context & Prompts)',
    scope:
      'Что попадает в контекст агента и кто это решает; обрезка; бюджет токенов; промпты (где живут, дубли, версии); память между сессиями.',
    method: 'Анализ сборки промптов, контекстного бюджета, памяти + карты: Prompt&Context, Context&Memory, Context Integrity, Prompt&Model Behavior.',
    feeds: ['audit-wave3', 'audit-wave4', 'audit-wave6', 'audit-wave8'],
  },
  {
    num: 14,
    slug: 'knowledge-quality',
    title: 'Качество знаний и происхождение решений (Knowledge & Provenance)',
    scope:
      'Противоречия/дубли/устаревшие знания; источники и доверие; цитируемость; можно ли к выводу задать «почему» и получить цепочку.',
    method: 'Контент-анализ Wiki/графа + карты: Knowledge Quality, Decision Provenance, Source Quality/Citations, Contradiction.',
    feeds: ['map-02-feature-value', 'audit-wave3', 'audit-wave7'],
  },
  {
    num: 15,
    slug: 'failure-resilience',
    title: 'Отказы, восстановление и blast radius (Failure & Resilience)',
    scope:
      'Что происходит при падении узла; каскады; мед degradation; retry/таймауты/очереди; восстановление состояния и БД; границы транзакций.',
    method: 'Анализ отказоустойчивости + карты: Failure Mode, Resilience, Recovery, Blast Radius, Cascade Failure.',
    feeds: ['map-03-technical-health', 'map-10-resource-consumption', 'audit-wave4', 'audit-wave6', 'audit-wave8'],
  },
  {
    num: 16,
    slug: 'concurrency-races',
    title: 'Параллелизм и гонки (Concurrency & Races)',
    scope:
      'Общее мутабельное состояние; одновременные записи; идемпотентность; блокировки; дедлоки; переходы состояний; фоновые задачи.',
    method: 'Анализ асинхронности/очередей + карты: Concurrency&Race, Async&Concurrency, State Machine, Long-Running Tasks.',
    feeds: ['audit-wave3', 'audit-wave6', 'audit-wave7', 'audit-wave8'],
  },
  {
    num: 17,
    slug: 'cost-tokens',
    title: 'Экономика: токены и стоимость (Cost / Token Economy)',
    scope:
      'Стоимость сценариев в токенах/деньгах; топ-дорогие операции; кэширование; дешёвые модели; фоновые расходы; «невидимые» повторы.',
    method: 'Анализ вызовов LLM/API + карты: Cost/Token Economy, Cost Awareness, LLM Cost, Intelligence Cost.',
    feeds: ['map-10-resource-consumption', 'audit-wave4', 'audit-wave6'],
  },
  {
    num: 18,
    slug: 'configuration-secrets',
    title: 'Конфигурация, флаги и секреты (Configuration & Secrets)',
    scope:
      'Инвентаризация настроек/env/флагов; мёртвые флаги; дрейф dev/staging/prod; секреты в коде/репозитории; опасные дефолты.',
    method: 'Анализ config-registry/.env/CI + карты: Configuration, Config&Secrets Drift, Feature Flag.',
    feeds: ['map-03-technical-health', 'audit-wave3', 'audit-wave4', 'audit-wave7'],
  },
  {
    num: 19,
    slug: 'evolution-change',
    title: 'Эволюция, churn и стоимость изменений (Evolution & Change)',
    scope:
      'Частота изменений (git), горячие зоны, возраст кода; что ломается при изменении; стоимость добавления фичи; владение/bus factor.',
    method: 'git log --stat + blame + анализ зависимостей + карты: Evolution, Churn/Hotspot, Change Impact/Cost/Safety, Ownership.',
    feeds: ['map-03-technical-health', 'map-06-capability-gap', 'audit-wave4', 'audit-wave7'],
  },
  {
    num: 20,
    slug: 'ux-perception',
    title: 'UX: восприятие, нагрузка и онбординг (UX & Cognition)',
    scope:
      'Ощущение скорости; когнитивная нагрузка; онбординг; обратная связь; терминология; тупики и ошибки пользователя.',
    method: 'UX-анализ + карты: Perceived Performance, Cognitive Load, Onboarding, Feedback Loop, Terminology, Friction.',
    feeds: ['map-01-requirements', 'map-08-capability-accessibility', 'audit-wave3', 'audit-wave7'],
  },
  {
    num: 21,
    slug: 'contracts-api',
    title: 'Контракты, API и миграции (Contracts & Migrations)',
    scope:
      'API/типы/схемы/события между компонентами; версионирование; обратная совместимость; миграции данных; разрыв контрактов.',
    method: 'Анализ contracts/* и хранилищ + карты: Contract Compatibility, API&Contract, Schema/Migration, Compatibility&Migration.',
    feeds: ['map-09-duplication', 'audit-wave2', 'audit-wave7', 'audit-wave8'],
  },
  {
    num: 22,
    slug: 'verification-confidence',
    title: 'Верификация и уверенность (Verification & Confidence)',
    scope:
      'Уровень доверия к каждому компоненту: автотесты/вручную/по ощущениям/не проверялось; покрытие; качество результатов агентов.',
    method: 'Анализ тестов/CI + карты: Verification&Confidence, Audit Coverage, Output Quality, Agent Quality.',
    feeds: ['map-04-observability-diagnostics', 'map-03-technical-health', 'audit-wave4'],
  },
  {
    num: 23,
    slug: 'autonomy-control',
    title: 'Автономия агентов vs контроль (Autonomy & Control)',
    scope:
      'Уровень автономности каждого агента; kill-switch; подтверждения; необратимые действия; качество результата; границы «решают сами».',
    method: 'Анализ approval/autonomy-гвардов + карты: Autonomy vs Control, Agent Autonomy/Quality, HITL.',
    feeds: ['audit-wave4', 'audit-wave6', 'audit-wave7'],
  },
  {
    num: 24,
    slug: 'extensibility-platform',
    title: 'Расширяемость и платформа (Extensibility)',
    scope:
      'Сколько стоит добавить панель/сервис/инструмент; точки расширения; Builder; версионирование API сервисов; developer experience.',
    method: 'Анализ Builder/container/registration + карты: Extensibility, Hooks, Platform Complexity, Developer Experience.',
    feeds: ['map-06-capability-gap', 'audit-wave3', 'audit-wave4'],
  },
  {
    num: 25,
    slug: 'observability-deep',
    title: 'Наблюдаемость (расширенная) (Observability Deep)',
    scope:
      'Сигналы (лог/метрика/трейс/событие); топология событий; подписки; self-explanation; восстановление причинной цепочки.',
    method: 'Анализ trace/events + карты: Observability extension, Event & Message Topology, Subscription stats.',
    feeds: ['map-04-observability-diagnostics', 'audit-wave2', 'audit-wave6'],
  },
];

function cardPath(def) {
  return path.join(OUT_DIR, `card-${String(def.num).padStart(2, '0')}-${def.slug}.md`);
}

function render(def) {
  const feeds = def.feeds.map((f) => `- \`${f}\``).join('\n');
  return `# ${def.title}

> **Карта ${def.num} из «супер-карт»** · дата генерации: ${new Date().toISOString().slice(0, 10)}
> **Формат:** скелет — наполняется из аудитов/фактов. Парные: карты 1–10 + wave-аудиты.
> **Покрывает исходные идеи списков:** ${def.scope.split('\n')[0]}

---

## Назначение

${def.scope}

## Методология

${def.method}

## Что уже есть (факты из аудитов)

- (заполнить из источников ниже)

## Пробелы / риски

- (заполнить)

## Рекомендации

- (заполнить)

---

## Источники-доноры

${feeds}
`;
}

let made = 0;
for (const def of CARDS) {
  fs.writeFileSync(cardPath(def), render(def), 'utf8');
  made++;
}
console.log(`cards: ${made} -> docs/audits/waves/card-*.md`);
