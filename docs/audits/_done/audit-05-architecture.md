# Аудит 5: Архитектура и Зависимости (Architecture & Dependencies)

## Оценка зрелости: 8/10 — образцовая для SPA дисциплина слоёв: dependency-cruiser + madge в CI, ноль dexie-импортов в UI, ноль UI-импортов в kernel, свежие коммиты о разрыве циклов; минус — конфликт Monaco-CDN со своим же CSP, порядок правил manualChunks и связность через service-locator (520 импортов instances).

## Резюме
Слоистая архитектура «UI → kernel → инфраструктура» защищена инструментально: `.dependency-cruiser.cjs` запрещает циклы (no-circular), React/UI-библиотеки в kernel (no-react-in-kernel) и импорты kernel → components/stores (no-ui-in-kernel); оба гейма — `check:circular-kernel` (madge) и `check:deps` (depcruise) — выполняются в CI (.github/workflows/ci.yml:235, 267). Два последних коммита (934c27a, 6390e33) целенаправленно рвали циклы через leaf-модули. Проверено: 0 импортов dexie в src/components, 0 runtime-импортов kernel → components/stores, 0 импортов database-service из UI (только type-import в stores/debate-session-store/index.ts:10). Kernel не экспортирует barrel `services/index.ts` — внутренние импорты прямые, что и предотвращает barrel-циклы. Основные проблемы — в зависимостях/бандле: monaco-editor заявлен, но не используется и не конфигурирован, из-за чего Monaco грузится с CDN вопреки строгому CSP; порядок условий в manualChunks делает ветки vendor-tiptap/vendor-aria частично недостижимыми; связь UI с kernel через god-object `kernel/instances` — 520 импортов в 390 файлах.

Метрики: ~430K LOC TS в src/ (kernel 204K, components 194K, stores 8.3K, llm 7.7K, hooks 1.35K); импортов UI → kernel — 1137 ссылок; kernel → UI — 0; deps в package.json — 23 runtime / 24 dev; явных уязвимых версий (axios/lodash/moment/request) — нет; лицензии — MIT (репо, Copyright 2026) и пермиссивные у всех мажорных зависимостей.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| AR5-01 | Высокий | monaco-editor заявлен в deps, но не импортирован; @monaco-editor/react без loader.config грузит Monaco с CDN, который блокируется CSP `script-src 'self'` — код-редактор не заработает в prod | package.json:27, src/components/Editors/CodeEditor.tsx:2 |
| AR5-02 | Средний | В manualChunks условие `id.includes('react')` стоит первым и перехватывает @tiptap/react, @tanstack/react-virtual, @react-aria, react-is — ветки vendor-tiptap/vendor-aria частично мертвы, vendor-react раздувается | vite.config.ts:58 |
| AR5-03 | Средний | Service-locator связность: 520 импортов `kernel/instances` в 390 файлах мимо DI-контейнера — скрытые зависимости, тяжело мокать в тестах | src/hooks/useRealAgents.ts:2 |
| AR5-04 | Низкий | 1137 прямых импортов из components в недра kernel (минуя фасад kernel/index.ts) — высокое fan-out сцепление UI→kernel, правила depcruise глубину не ограничивают | src/components/PolicyPanel/PolicyPanel.tsx:27 |
| AR5-05 | Низкий | zustand 4.5.7 при вышедшей мажорной v5 — v4 в maintenance-режиме; миграция механическая (default export убран) | package.json:33 |
| AR5-06 | Низкий | @google/generative-ai 0.24.1 — SDK официально deprecated в пользу @google/genai; используется в google-genai-service | package.json:12, src/kernel/services/google-genai-service.ts |
| AR5-07 | Инфо | lucide-react 1.14.0 — неожиданный 1.x (исторически 0.x), зафиксирован в lock; tree-shaking сохранён именованными импортами | package-lock.json:7469 |
| AR5-08 | Инфо | Barrel src/kernel/index.ts (311 строк, 91 export) только для внешних потребителей; отдельного services/index.ts нет — сознательное предотвращение barrel-циклов, но 311-строчный фасад надо поддерживать вручную | src/kernel/index.ts:1-3 |

## Детали находок

### AR5-01: Monaco: мёртвая зависимость + CDN против собственного CSP
Файл:строка: package.json:27; src/components/Editors/CodeEditor.tsx:2; docker/nginx.conf:37 и index.html:20 (CSP)
```json
"monaco-editor": "^0.52.2",
```
```tsx
import Editor from '@monaco-editor/react';
// loader.config(...) нигде в src/ не вызывается (проверено rg 'loader\.config' — 0 вхождений)
```
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; ..."
```
Влияние: `@monaco-editor/react` v4 по умолчанию загружает Monaco с cdn.jsdelivr.net через свой loader. `monaco-editor` 0.52.2 есть в package-lock (node_modules/monaco-editor), но ни одного `from 'monaco-editor'`/`import('monaco-editor')` в src/ нет — пакет не бандлится, а CSP (и dev-мета, и nginx) разрешает скрипты только с 'self'. Итог: панель Editors (route 'editors', route-registry-content.ts:246) в продакшене зависнет на «Loading editor...». package.json:37 также объявляет `"sideEffects"` без monaco — подтверждает отсутствие интеграции.
Рекомендация: либо `import * as monaco from 'monaco-editor'` + `loader.config({ monaco })` (бандл, ~2MB в vendor-чанк — добавить ветку в manualChunks), либо vite-plugin-monaco-editor с worker-ассетами, либо убрать dep и редактор.

### AR5-02: manualChunks — порядок условий смешивает vendor-чанки
Файл:строка: vite.config.ts:58-86
```ts
if (
    id.includes('react') ||            // ← ловит и '@tiptap/react', '@tanstack/react-virtual', '@react-aria/*', 'react-is'
    id.includes('react-dom') ||
    id.includes('react-router')
) {
    return 'vendor-react';
}
...
if (id.includes('@tiptap')) { return 'vendor-tiptap'; }     // достижимо только для @tiptap/pm, @tiptap/starter-kit
if (id.includes('@react-aria')) { return 'vendor-aria'; }   // недостижимо: путь содержит 'react'
```
Влияние: пути `node_modules/@tiptap/react/...`, `@tanstack/react-virtual/...`, `@react-aria/...` содержат подстроку 'react' и уходят в vendor-react; ветки vendor-tiptap/vendor-aria отрабатывают лишь частично/никогда. vendor-react становится крупным и перегенерируется при обновлении любого из этих пакетов — хуже кэширование.
Рекомендация: проверять специфичные префиксы раньше общего (`@tiptap` → `@tanstack` → `@react-aria` → и только потом `react`), либо матчи по `id.includes('node_modules/react/')`.

### AR5-03: Связность через service-locator kernel/instances
Файл:строка: src/hooks/useRealAgents.ts:2 (пример из 390 файлов)
```ts
import { agentService } from '../kernel/instances/services-core';
```
Влияние: при наличии полноценного DI-контейнера (kernel/container.ts, регистрация адаптеров в main.tsx:69 `registerDebateStoreAdapters(defaultContainer)`) 520 импортов-синглтонов в 390 файлах создают скрытые зависимости: граф реальных связей не виден depcruise-правилам, тесты требуют моков модулей (см. коммит 240f942 «add rootLogger to debate-session-store test mock»).
Рекомендация: для новых сервисов — инъекция через токены контейнера; instances оставить как композиционный корень, а не как точку доступа.

### AR5-04: Высокое fan-out сцепление UI→kernel
Файл:строка: src/components/PolicyPanel/PolicyPanel.tsx:27 (пример; всего 1137 ссылок `from '...kernel/...'`)
```ts
import { agemsTaskService } from '../../kernel/instances/services-core';
```
Влияние: UI-панели импортируют конкретные сервисы напрямую, минуя фасад kernel/index.ts (тот по warning-комментарию «для EXTERNAL consumers» предназначен как раз для UI). Формально слои не нарушены (kernel не знает про UI), но 786 компонентов прибиты к ~сотням внутренних путей kernel — рефакторинг внутренней структуры kernel ломает UI массово.
Рекомендация: постепенно переориентировать UI на kernel/index.ts (или групповые фасады по доменам), depcruise-правилом ограничить глубину `^src/components → ^src/kernel/services/.+` уровнем warn.

### AR5-05: zustand 4 при вышедшей v5
Файл:строка: package.json:33
```json
"zustand": "^4.5.7"
```
Влияние: v5 (окт. 2024) — текущая стабильная; v4 получает только исправления. Код уже написан в v5-совместимом стиле (селекторные подписи, без default-export, проверено — `create(` через именованный импорт в stores/chat/store.ts).
Рекомендация: плановая миграция `npm i zustand@5` + прогон тестов; рисков совместимости почти нет.

### AR5-06: Deprecated Google AI SDK
Файл:строка: package.json:12; src/kernel/services/google-genai-service.ts
```json
"@google/generative-ai": "^0.24.1",
```
Влияние: Google объявила deprecated пакет `@google/generative-ai` (наследник — `@google/genai` с поддержкой Gemini 2.x-фич, Live API, unified Vertex/AI-Studio). Обновления безопасности/новых моделей в старом SDK прекращаются — прямой риск для провайдер-адаптера Gemini.
Рекомендация: мигрировать на `@google/genai` в рамках отдельного PR; API-сурфейс схож.

### AR5-07: lucide-react 1.14.0 — проверить осознанность мажора
Файл:строка: package.json:25; package-lock.json:7468-7471
```json
"lucide-react": "^1.14.0"
```
Влияние: исторически lucide-react жил в 0.x; версия 1.14.0 зафиксирована в lock и резолвится из registry — зависимости не сломаны, именованные импорты tree-shaken (в vendor-utils по vite.config.ts:68). Находка информационная: убедиться, что взята целевая версия, а не опечатка range.
Рекомендация: фиксировать в CHANGELOG причину мажора; следить за breaking-замечаниями 1.x.

### AR5-08: Ручной фасад kernel/index.ts без автогенерации
Файл:строка: src/kernel/index.ts:1-3 (311 строк, 91 export)
```ts
// WARNING: This barrel is for EXTERNAL consumers (UI, bootstrap, tests) only.
// Kernel-internal files must import directly from their dependency's source file,
// NOT from this barrel. Violations create circular dependencies through the barrel.
```
Влияние: подход правильный (внутренние barrel-циклы исключены by design; debate-runtime/index.ts:13-15 прямо документирует «import the leaf module directly... to avoid barrel cycles»), но 311 экспортов поддерживаются вручную — рассинхрон типов/имён неизбежно копится. Отдельный src/kernel/services/index.ts отсутствует (проверено ls) — это осознанно.
Рекомендация: линт-правило/тест, падающий при экспорте barrel из kernel-internal модулей, и CI-проверка полноты фасада (сравнение с публичными контрактами).

## Положительные практики
- **Автоматизированные архитектурные гейты в CI**: `check:circular-kernel` (madge, падает на «Found N circular») — ci.yml:235; `check:deps` (dependency-cruiser) — ci.yml:267 с комментарием о базовой линии «0 violations (1418 modules, 5074 deps)».
- **Правила слоёв**: .dependency-cruiser.cjs:5-27 — no-circular, no-react-in-kernel (kernel не импортирует react/zustand/framer-motion), no-ui-in-kernel (kernel → components|stores запрещён, UI-адаптеры регистрируются композиционным корнем — main.tsx:66-70).
- **Фактическое соблюдение слоёв**: rg по src/components — 0 импортов dexie; rg по src/kernel — 0 импортов components/stores; доступ к БД только через DAL-фасад (src/kernel/dal/data-access-layer.ts, «ЗАКОН 2: все storage-операции проходят через DAL»).
- **Целенаправленная работа с циклами**: коммиты 6390e33 и 934c27a выносили leaf-модули (audit types, agent-service, debate-orchestrator-factory), debate-runtime/index.ts документирует паттерн.
- **Bundle-гигиена**: manualChunks по вендорам + kernel-debate/kernel-llm чанки (vite.config.ts:87-96); `sourcemap: 'hidden'` с выгрузкой в Sentry и комментарием о нераздаче клиентам (vite.config.ts:31-36); chunkSizeWarningLimit: 700.
- **Строгий TS**: strict + noUncheckedIndexedAccess + noUnusedLocals (tsconfig.app.json:11-14, 27-28); engines node>=22 согласован с CI NODE_VERSION: '22' (ci.yml:16).
- **Лицензии**: проект — MIT (LICENSE:1-2); мажорные зависимости — React MIT, Zustand MIT, Dexie Apache-2.0, TipTap MIT, Monaco MIT, @xyflow MIT, framer-motion MIT, zod MIT, meriyah MIT, DOMPurify Apache-2.0/MPL-2.0, lucide ISC — конфликтов с MIT нет; ни одной copyleft-сильной (GPL/AGPL) зависимости не найдено.
- **Безопасные прокси-дефолты**: удалён api.allorigins.win из дефолтов фетч-прокси как «privacy leak» (vite.config.ts, комментарий SEC-07).
