# Аудит 9: Тестирование и покрытие (Testing & Coverage)

## Оценка зрелости: 5/10
366 тест-файлов / 2794 кейса / 43K тест-LOC (~10% от 430K LOC) с качественными моками и антифлаг-гигиеной, но покрытие официально замеряется только по 5 «удобным» директориям (30% порог), сетевое ядро LLM (http-client, retry, circuit-breaker, 14 из 15 адаптеров) не покрыто вовсе, e2e — 4 smoke-теста, а CI-триггер сломан опечаткой в YAML.

## Резюме
Unit-слой развит неравномерно: kernel/dal (18 тестов на 37 файлов), kernel/services (187/692) и компоненты (106/786, ~13%) покрыты фрагментарно; src/llm — 5 тест-файлов на 50 файлов, при этом критичные для денег и доступности модули (LLMHttpClient, RetryDecorator, CircuitBreakerDecorator, RateLimitDecorator, adapter-factory) не имеют ни одного теста. Витес-пороги (30/20/30/30) применяются к `include` из 5 директорий — метрика показывает ~46% по маленькому срезу, скрывая реальное покрытие по всему src. e2e-слой — один файл basic-flow.spec.ts на 26 строк с 4 проверками видимости текста. Хрупкость умеренная: 1 it.skip, 8 sleep-ов в 7 файлах, 7 waitFor с захардкоженными таймаутами, снепшот-тестов нет, test.only/xdescribe нет. Ключевой операционный риск — `.github/workflows/ci.yml`: в веточных фильтрах `branches: ain, master]` потеряна открывающая `[`, из-за чего push/PR-триггеры фактически не срабатывают и CI запускается только вручную.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| TS9-01 | Критический | CI: `branches: ain, master]` — потеряна `[`, push/PR-триггеры не срабатывают, suite гоняется только через workflow_dispatch | .github/workflows/ci.yml:9 |
| TS9-02 | Высокий | Coverage.include ограничен 5 директориями (stores, hooks, kernel/events, kernel/workers, container) — 90%+ кодовой базы вне метрики, порог 30% на «удобном» срезе | vitest.config.ts:25 |
| TS9-03 | Высокий | 0 unit-тестов сетевого ядра LLM: llm-http-client, retry-decorator, circuit-breaker, rate-limit-decorator, adapter-factory — поиск *.test даёт пусто | src/llm/http/llm-http-client.ts:1 |
| TS9-04 | Средний | e2e — 1 файл, 4 smoke-теста (видимость текста), 0 сценариев с данными/действиями; на 786 компонентов | e2e/basic-flow.spec.ts:9 |
| TS9-05 | Средний | Покрытие по каталогам: компоненты 106/786 (~13%), kernel/services 187/692 (~27%), stores 12/42, hooks 3/15, llm 5/50 | src/components/DebatePanel/DebatePanel.test.tsx:1 |
| TS9-06 | Низкий | it.skip с Promise-constructor anti-pattern (reject вместо done-семантики, скрытая деградация) | src/kernel/services/ChatService.test.ts:14 |
| TS9-07 | Низкий | src/tests/setup.ts не подключён ни к одному конфигу (vitest использует setup-light.ts) — мёртвый, с top-level `await runtime.start()` | src/tests/setup.ts:39 |
| TS9-08 | Низкий | src/test_map.ts — мусорный экспорт `export class Test {}` (2 строки), ни на что не ссылается | src/test_map.ts:1 |
| TS9-09 | Низкий | 8 `await new Promise(setTimeout)` в 7 тест-файлах + 7 waitFor с хардкод-таймаутами ≥4 c — зависимость от реального времени | src/kernel/services/debate-runtime/debate-orchestrator.test.ts:116 |
| TS9-10 | Инфо | Playwright webServer = `vite preview` — e2e требует предварительного build; CI e2e-job собирает отдельно (дублирование 60 с ожидания) | e2e/playwright.config.ts:12 |

Метрики: всего `*.test.ts(x)` — 366 (kernel 236, components 106, stores 14, llm 5, hooks 3, i18n 1, debate-enhancements 1); тест-кейсов (`it|test(`) — 2794; тест-LOC — 43 184 из 429 951 (≈10%); `vi.mock` — 315 в 118 файлах; `useFakeTimers` — 11 файлов; снепшоты — 0; it.skip — 1; test.only/xit/xdescribe — 0; CI-джобы: quality, build, test, coverage, security-audit, circular-check, dep-graph, e2e, deploy (9). Проверено: пустых тест-функций (`it('...', () => {})`) — не обнаружено; тестов без assert — не обнаружено (выборочная проверка крупных файлов).

## Детали находок

### TS9-01 — сломанные триггеры CI (Критический)
Файл:строка: `.github/workflows/ci.yml:9` (то же :11)
```yaml
on:
    push:
        branches: ain, master]
    pull_request:
        branches: ain, master]
```
Влияние: YAML-скаляр `ain, master]` (cat -A подтверждает отсутствие `[`) вместо списка `[main, master]` — фильтр веток не матчит ни одну реальную ветку, поэтому `quality/build/test/coverage/e2e/deploy` не запускаются на push и PR; защита main держится только на ручном workflow_dispatch (строка 13). При этом сам набор джоб сильный (tsc -b, lint-порог, coverage с порогами, madge circular, npm audit) — он просто не выполняется автоматически.
Рекомендация: восстановить `[main, master]`, добавить branch-protection с обязательными checks.

### TS9-02 — метрика покрытия на «удобном» срезе (Высокий)
Файл:строка: `vitest.config.ts:25`
```ts
include: [
    'src/stores/**',
    'src/hooks/**',
    'src/kernel/events/**',
    'src/kernel/workers/**',
    'src/kernel/container.ts',
],
thresholds: { statements: 30, branches: 20, functions: 30, lines: 30 },
```
Влияние: комментарий честно признаёт: «broad include of all of src would report ~4%». Порог 30% выполняется на срезе stores+hooks+events+workers+container — то есть 90%+ из ~430K LOC (kernel/services — 692 файла, src/llm, dal) выпадают из gates; dashboard-цифра вводит в заблуждение, регрессии покрытия в непокрытых зонах невидимы.
Рекомендация: оставить честный all-src отчёт (без gate), а thresholds поднять инкрементально по мере добавления тестов (план P1.3–P1.7 уже описан в комментарии — закрепить его CI-артефактом lcov).

### TS9-03 — нетестированное сетевое ядро LLM (Высокий)
Файл:строка: `src/llm/http/llm-http-client.ts:1` (поиск `rg --files src | grep '<модуль>.test'` → 0 для llm-http-client, retry-decorator, circuit-breaker, rate-limit-decorator, openai-compatible-adapter, adapter-factory)
```ts
export const PROVIDER_HTTP_TIMEOUT_MS = 120000;
export class LLMHttpClient {
    private static readonly MAX_CONCURRENT = 50;
```
Влияние: самые ответственные за доступность и расходы модули (таймауты, merge AbortSignal, Retry-After, backoff/jitter, состояния контура open/half-open, token bucket, выбор адаптера) не имеют unit-покрытия; из 15 файлов адаптеров тестируется только gemini-adapter (5 тест-файлов на весь src/llm: flyweight, middleware-pipeline, sse-parser, cache-decorator, gemini). Регрессия в shouldRetry/openTimeout обнаружится только в проде на живых 429/5xx.
Рекомендация: в первую очередь тесты RetryDecorator (таблица сценариев 429/5xx/401/abort/mid-stream), CircuitBreaker (переходы состояний), LLMHttpClient (таймаут/семафор/классификация статусов) — модули чистые и легко мокаются.

### TS9-04 — поверхностный e2e (Средний)
Файл:строка: `e2e/basic-flow.spec.ts:9`
```ts
test('should navigate to agents page', async ({ page }) => {
    await page.goto('/agents');
    await expect(page.getByText(/agent|builder/i)).toBeVisible({ timeout: 10000 });
});
```
Влияние: 4 теста проверяют лишь видимость заголовков после перехода; ни один сценарий не создаёт данные (ключ провайдера, чат-сообщение, дебат), нет проверок сетевого слоя/persistence; регрессии логики e2e не ловит — это smoke, а не покрытие. `retries: 1` и таймаут 60 с маскируют флаки.
Рекомендация: 3–5 ключевых сквозных сценариев (создание ключа → health-check → чат с mock-провайдером → сохранение сессии в IndexedDB) с fake-indexeddb-подобным провайдером или mock-роутами Playwright.

### TS9-05 — фрагментарное покрытие слоёв (Средний)
Файл:строка: `src/components/DebatePanel/DebatePanel.test.tsx:1` (репрезентативный качественный тест)
```ts
const { mockNodes, mockDebateService, ... } = vi.hoisted(() => ({
    const mockGetActiveSession = vi.fn();
    ...
```
Влияние: при 2794 кейсах покрытие распределено неравномерно: компоненты 106/786 файлов (~13%), kernel/services 187/692 (~27%), stores 12/42, hooks 3/15. Крупные тесты (DebateRuntimePanel.comprehensive — 903 строки, budget-service — 644) качественные, но «длинный хвост» из ~600 сервисных файлов остаётся без проверки при рефакторингах (а мега-рефакторинги в проекте регулярны — см. коммиты о разрыве circular deps).
Рекомендация: приоритизировать по risk-матрице (деньги: budget/key-management; данные: dal; сеть: llm) вместо равномерного догоняющего покрытия.

### TS9-06 — закомментированный тест с анти-паттерном (Низкий)
Файл:строка: `src/kernel/services/ChatService.test.ts:14`
```ts
it.skip(
    'should respond to SEND_MESSAGE event and emit error for unconfigured provider',
    () =>
        new Promise<void>((done, reject) => {
            const timer = setTimeout(() => { unsub(); reject(new Error('Timed out ...')); }, 5000);
```
Влияние: единственный skip в кодовой базе — и он с анти-паттерном: `reject` в Promise-конструкторе вместо resolve/done, фиктивный второй аргумент `10000` у it, скрытая причина отключения не задокументирована.
Рекомендация: переписать через vi.waitFor / fake timers либо удалить с пояснением в issue.

### TS9-07 — мёртвый setup с тяжёлым bootstrap (Низкий)
Файл:строка: `src/tests/setup.ts:39`
```ts
// Initialize the unified runtime so that all resolved services are registered in the DI container
import { runtime } from '../kernel/runtime';
await runtime.start();
```
Влияние: файл не указан ни в vitest.config.ts (`setupFiles: ['./src/tests/setup-light.ts']`), ни в других конфигах — дублирует setup-light.ts и содержит top-level await старта всего runtime; при случайном подключении каждый воркер будет поднимать полный контейнер сервисов (минуты, OOM-риски, о которых пишет CI-комментарий).
Рекомендация: удалить или явно переиспользовать; причину расхождения setup/setup-light задокументировать.

### TS9-08 — мусорный test_map.ts (Низкий)
Файл:строка: `src/test_map.ts:1`
```ts
export class Test {
}
```
Влияние: пустой класс без единой ссылки в репозитории (rg 'test_map' — только сам файл) — шум в корне src, попадает в tsc и бандл-граф.
Рекомендация: удалить.

### TS9-09 — реальный sleep в тестах (Низкий)
Файл:строка: `src/kernel/services/debate-runtime/debate-orchestrator.test.ts:116` (8 вхождений `await new Promise(...setTimeout)` в 7 файлах: store.test.ts, GoTDeliberationPanel.test.tsx, chat-executor.test.ts, code-sandbox-service.test.ts, execution-viz-service.test.ts, agent-project-runtime.test.ts, debate-orchestrator.test.ts; 7 `waitFor` с таймаутами ≥4000 мс)
```ts
await new Promise((r) => setTimeout(r, 50));
```
Влияние: привязка к реальному времени — источник флаки на загруженных CI-раннерах (в проекте уже поднимали teardownTimeout до 30 с из-за этого — vitest.config.ts:14–16); общий testTimeout 15 с провоцирует редкие срывы.
Рекомендация: vi.useFakeTimers (уже используется в 11 файлах — распространить практику) или advanceTimersByTime дляsleep-ов.

### TS9-10 — e2e требует ручного build (Инфо)
Файл:строка: `e2e/playwright.config.ts:12`
```ts
webServer: {
    command: 'npx vite preview --port 5173',
    port: 5173,
    reuseExistingServer: true,
},
```
Влияние: `vite preview` обслуживает dist — без `npm run build` локальный запуск e2e падает с непонятной ошибкой; в CI (job e2e, ci.yml:269+) build выполняется отдельным шагом — дублирование и лишние ~минуты.
Рекомендация: `webServer.command: 'npm run build && npx vite preview'` либо явный pretest-скрипт в package.json.

## Положительные практики
- `.github/workflows/ci.yml:19-236` — 9 джоб: `tsc -b --noEmit` (с пояснением про solution-style tsconfig, BLD-C3), ESLint с фиксированным порогом warning, bundle-size gate 30 МБ, security-audit, madge circular-check, dependency-cruiser dep-graph, coverage-джоба с порогами.
- `src/kernel/dal/_test-harness.ts` + 18 тест-файлов DAL — создание тестовой БД через createTestDb, `clearAll()` в beforeEach (data-access-layer.test.ts:7–10) — изоляция без обмена состоянием.
- `src/tests/setup-light.ts` — единый лёгкий сетап: fake-indexeddb/auto, Worker-мок, скролл-стабы без лишнего глобального состояния.
- `src/components/DebatePanel/DebatePanel.test.tsx:15-23` — паттерн `vi.hoisted` для hoist-safe моков; 315 vi.mock в 118 файлах без «перехвата всего».
- Нулевая терпимость к анти-флагам: 0 test.only/xit/xdescribe/снепшотов на 366 файлов; `it.skip` — единственный.
- `vitest.config.ts:14-16` — осознанная настройка teardownTimeout под fork-воркеры с комментарием-обоснованием.
- Крупные кейсы проверяют поведение, а не структуру: container.test.ts (382 строки, DI-регистрации), budget-service.test.ts (644 строки, граничные случаи бюджета).
