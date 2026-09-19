# SuperAgents OS — Полный аудит DEMO / mock / placeholder / stub / incomplete

> Папка: `C:\Users\evgeny\Desktop\ai-os-new-fix-debate-text-truncation`
> Scope: `src/` (исключён `node_modules`), проверено ~ `169` файлов `src/kernel/services/rivals*` + `src/components` + `src/stores` + `src/kernel/contracts` + `src/llm`
> Метод: `Grep` (case-insensitive) + `Glob` + `Read` + `Select-String` PowerShell
> Дата: 2026-09-16

---

## 1. Сводная таблица

| Категория | Паттерны | Уникальных файлов (сырой Grep) | Релевантных продакшн-файлов | Вердикт |
|---|---|---|---|---|
| **1. STUB/MOCK** <br>возвращает константу вместо execution | `stub`, `mock`, `MockAdapter`, `[echo]`, `cargo check: ok (stub)`, `stub artifact`, `PROVIDER-PENDING` | `stub: 40` <br>`mock: 157` <br>`echo [echo]: 8` | **18 продакшн** + 1 `MockAdapter` + ~140 `vi.mock` тестовых | Требует ревью |
| **2. TODO/FIXME** | `TODO`, `FIXME` | `TODO сырых: 14` <br>`FIXME: 0` | **2 реальных TODO** | Низкий риск |
| **3. HANDOFF/QUEUED** <br>честный guardrail (ticket-gated) | `handoff: 54`, `queued: 66` | 54 / 66 | **~12 честных сервисов** (CodeExec/Computer/Sandbox/Broker/Workqueue/TaskHandoff) — **HANDOFF** | Защита, не заглушка |
| **4. Incomplete / partially** | `incomplete: 5`, `partially: 14` | 5 / 14 | **0 продакшн incomplete** <br> `partially_supported` — доменный enum (6 файлов) | Ложные срабатывания |
| **5. DEMO/UI без backend** | `DEMO`, `DemoGate`, `DemoBadge` | `DEMO сырых: 120` (но 80% — `downgrade/demonstrate`) <br>`DemoGate/Badge: 6` | **6 файлов** (4 панелей + Scheduler + Governance) | Feature-flagged |

**Дополнительно (часто ложные):**

| Паттерн | Сыро | Реально |
|---|---|---|
| `placeholder` | 272 файла | 272 — почти всё `placeholder="..."` / `translation placeholder` (UI input), **REAL** |
| `fallback` | 100+ | 95% — `FallbackDecorator`, `fallback chain` (routing), `fallback: React.createElement` — **REAL** |
| `fake` | 100+ | 98% — `fake-indexeddb/auto`, `fakeDb/fakeBus` тест-хелперы — **REAL/MOCK-TEST** |
| `not implemented` / `NotImplemented` | 2 | `base-adapter.ts:126,131` — **HANDOFF (честный throw)** |
| `cargo check` | 2 | `whale-service.ts:28` — **STUB** |
| `throw new Error` | 100+ | реальные ошибки валидации, не заглушки |

**Всего файлов с хотя бы одним паттерном (сыро): 1063** (из-за `placeholder`/`fallback`/`mock` в тестах). **Продакшн-заглушек: ~18 уникальных файлов**.

---

## 2. Все файлы с найденными паттернами

### 2.1 STUB/MOCK/echo — 40 stub-файлов (сыро)
```
src/kernel/services/rivals19/whale-service.ts
src/kernel/services/sandbox/code-sandbox-service.ts
src/kernel/services/eval/llm-judge-service.ts
src/kernel/services/simulation/simulation-engine-service.ts
src/kernel/services/simulation/agent-act-adapter-service.ts
src/kernel/services/eval/scorer-registry-service.ts
src/kernel/contracts/eval-scorer.ts
src/kernel/contracts/hybrid-retrieval.ts
src/kernel/contracts/code-sandbox.ts
src/kernel/contracts/deploy-bundle.ts
src/kernel/contracts/simulation-engine.ts
src/kernel/service-registration/phase1-foundation.ts
src/kernel/service-registration/phase58-code-sandbox.ts
src/kernel/service-registration/phase61-eval-scorers.ts
src/kernel/service-registration/phase63-simulation-engine.ts
src/kernel/service-registration/phase64-agent-adapter.ts
src/kernel/events/event-registry.ts
src/types/routing.ts
src/route-imports.ts
src/components/SimulationPanel/SimulationPanel.tsx
src/components/ExperimentalPanel.tsx
src/components/ModuleInfo.tsx
+ 19 других (test/setup, contracts/project)
```

### 2.3 handoff — 54 файла
```
src/kernel/services/sandbox/code-sandbox-service.ts
src/kernel/services/rivals5/codeexec-service.ts
src/kernel/services/rivals5/computer-service.ts
src/kernel/services/rivals6/support-service.ts
src/kernel/services/task-handoff.ts
src/kernel/services/rivals9/openclaw-service.ts
src/kernel/contracts/browser-harness.ts
src/kernel/services/ops/sandbox-broker-service.ts
src/components/FleetPanel/FleetPanel.tsx
src/stores/interopStore.ts
... + 44 других
```

### 2.4 queued — 66 файлов
Ключевые продакшн: `codeexec-service.ts`, `code-sandbox-service.ts`, `computer-service.ts`, `workqueue-service.ts`, `runqueue-service.ts`, `genspark-service.ts`, `dsh-service.ts`, `notebook-service.ts`, `swe-service.ts`, `aiscientist-service.ts`

### 2.5 echo — 8 файлов с `[echo]` (продакшн fallback)
```
src/kernel/services/rivals7/selfcon-service.ts
src/kernel/services/rivals7/reflexion-service.ts
src/kernel/services/rivals3/session-state-service.ts
src/kernel/services/rivals2/react-service.ts
src/kernel/services/rivals15/localtriple-service.ts
src/kernel/services/rivals15/analitik-service.ts
src/kernel/services/rivals19/warp-service.ts
src/kernel/services/frontier/eval-service.ts
src/kernel/services/capability/agent-factory.ts
```

### 2.6 DEMO/UI — 6 файлов DemoGate
```
src/components/Common/DemoGate.tsx
src/components/Common/DemoBadge.tsx
src/components/DeployPanel.tsx
src/components/DistillationPanel.tsx
src/components/FineTuningPanel.tsx
src/components/HealthSlaPanel.tsx
src/components/SchedulerPanel.tsx
src/components/GovernancePanel/GovernancePanel.tsx
```

### 2.7 TODO — 2 реальных
```
src/components/AppLayout.tsx:4
src/kernel/services/config-registry.ts:145
```

---

## 3. Группировка по категориям с деталями

### Категория 1: STUB / MOCK — 11 файлов + 1 MockAdapter + 8 echo

| Файл:строка | Фрагмент | Статус | Объяснение |
|---|---|---|---|
| `src/kernel/services/rivals19/whale-service.ts:28` | `output = 'cargo check: ok (no tool runner — stub)'` | **STUB** | Константа когда `this.tools` отсутствует. После нашего фикса — `emit + kv`, но fallback остаётся stub при отсутствии runner. |
| `src/kernel/services/sandbox/code-sandbox-service.ts:138` | `stub artifact (${lang}, ${c.length} chars) — BLOCKED-RUNTIME` | **STUB** | `delegate ?? stub`. Без executor — заглушка. Честно помечен `BLOCKED-RUNTIME`. |
| `src/kernel/services/eval/llm-judge-service.ts:21` | `function stubScore(...) { return {score: f1, reasoning: "stub: token_f1=..." } }` | **STUB** | Heuristic `token_f1` вместо LLM judge. |
| `src/kernel/services/simulation/simulation-engine-service.ts:17` | `class StubActPort { act() { return {action:'move', meta:{stub:true}} } }` | **STUB** | Детерминированный `idle/move` по хешу. Используется когда `IAgentActPort` не wired. |
| `src/kernel/services/simulation/agent-act-adapter-service.ts:16` | `function stubAct(...) { return {action:'idle', meta:{via:'stub-fallback'}} }` | **STUB** | Fallback при `agent not found`. |
| `src/kernel/services/rivals7/selfcon-service.ts:62` | `return { answer: `[echo] ${task.slice(0, 300)}`, confidence:1}` | **STUB** | Offline ветка без LLM — echo. Теперь `emit` добавлен, но fallback остаётся. |
| `src/kernel/services/rivals2/react-service.ts:127` | `return { thought: `[echo] ${task}` }` | **STUB** | ReAct offline echo. |
| `src/llm/mock/mock-adapter.ts:11` | `export type MockMode='echo'|'preset'` | **MOCK** | Продакшн mock-адаптер, доступен via `adapter-factory.ts:117 case 'mock'`. За флагом. |

### Категория 2: TODO / FIXME — 2

| Файл | Фрагмент | Статус |
|---|---|---|
| `src/components/AppLayout.tsx:4` | `// TODO: CommandPalette still synchronously import framer-motion` | TODO — lazy import |
| `src/kernel/services/config-registry.ts:145` | `// TODO: Per-model limits — FreeTierLimit type` | TODO — рефактор типа |

### Категория 3: HANDOFF / QUEUED — честный guardrail

| Файл:строка | Фрагмент | Статус |
|---|---|---|
| `src/kernel/services/rivals5/codeexec-service.ts:99` | `status: 'queued'` / `queued — no external executor` | HANDOFF — E2B билеты, никогда не «исполнены» тихо |
| `src/kernel/services/rivals5/computer-service.ts:43` | `handoff: ${action} (no approved ticket)` | HANDOFF — требует `SandboxBroker` approved ticket |
| `src/kernel/services/rivals6/support-service.ts:87` | `async handoff(ticketId, team='humans')` | HANDOFF — human handoff |

> **12 сервисов** — не править, документировать как фичу `BLOCKED-RUNTIME`.

### Категория 4: Incomplete / partially — 0 реальных

| Файл | Фрагмент | Статус |
|---|---|---|
| `src/kernel/service-registration/phase1-foundation.ts:72` | `'keyStore missing or incomplete — using safe stub'` | PARTIAL — дефензивный fallback |
| Остальные `partially_supported` | доменный enum | REAL |

### Категория 5: DEMO / UI без backend — 6

| Файл | Статус |
|---|---|
| `src/components/Common/DemoGate.tsx:17` | HANDOFF — feature-flag гейт |
| `src/components/DeployPanel.tsx:20` | DEMO — за `DemoGate`, backend `deployBundleService` stub |
| `src/components/SchedulerPanel.tsx:81` | DEMO — `Preview - not connected to SchedulerService` |
| `src/components/GovernancePanel/GovernancePanel.tsx:10` | DEMO — `demo-user` хардкод |
| `src/components/DistillationPanel.tsx:16` | DEMO — за `mockServices.enabled` |
| `src/i18n/translations/*/settings.ts` | DEMO — флаг `mock_services` |

---

## 4. Детальная таблица по rivals* (169 файлов, 42 с хитами)

**42 из 169 содержат `stub/echo/queued/handoff`:**
```
whale-service.ts => stub
code-sandbox-service.ts => BLOCKED-RUNTIME stub
llm-judge-service.ts => token_f1 stub
simulation-engine-service.ts => StubActPort
agent-act-adapter-service.ts => stub-fallback
selfcon/reflexion/react/localtriple/analitik/warp/session-state ... => echo fallback
codeexec/computer/ide/workqueue/runqueue/swe/dust-bulk/agencyru/aiscientist/dsh ... => queued/handoff (честный)
interpreter-services.ts => queued+echo (теперь emit+kv, stub только fallback)
```

**Остальные 127 rivals-файлов — чистые** (нет stub/mock/echo/handoff в продакшн коде).

---

## 5. Проверки по src/components, src/stores, src/kernel/contracts, src/llm

- `src/components` ~200 файлов — 6 демо за флагом, остальное `placeholder` (UI input) REAL
- `src/stores` — только тестовые `vi.mock`, продакшн стор без заглушек
- `src/kernel/contracts` — 5 контрактов с `stub` в документации (`eval-scorer.ts:28 via: 'stub'|'llm'`), не реализация
- `src/llm` — `mock-adapter.ts` продакшн mock за `case 'mock'`, `FallbackDecorator` REAL

---

## 6. Специальные паттерны

| Паттерн | Найдено | Статус |
|---|---|---|
| `not production-ready` | 0 | — |
| `not implemented` | 2 | `base-adapter.ts:126 throw LLMError('checkHealth not implemented',501)` — честный 501 |
| `cargo check: ok (stub)` | 1 | `whale-service.ts:28` — STUB (теперь с emit/kv) |
| `handoff, queued` | 54 / 66 | HANDOFF честный guardrail |

---

## 7. Итоговая оценка и рекомендации

**Критичные STUB (требуют реализации для продакшн):**
1. `CodeWhaleService.cargoCheck` — теперь с `emit+kv`, fallback остаётся stub при отсутствии `toolRunner` — оставить как `PROVIDER-PENDING` или подключить `sandboxBroker`.
2. `CodeSandboxService` (`BLOCKED-RUNTIME`) — требует E2B delegate.
3. `LlmJudgeService` — `token_f1` stub; для прод нужен LLM judge.
4. `SimulationEngineService` / `AgentActAdapterService` — `StubActPort`; нужен `AgentFactory` LLM.
5. 8 rivals echo-сервисов — теперь с `emit+kv`, offline echo остаётся `PROVIDER-PENDING`.
6. `MockAdapter` — держать за флагом, не включать в прод по умолчанию.

**Честные guardrail (не править):**
- Все `queued — no external executor` и `handoff: ... (no approved ticket)` — правильная защита.

**DEMO без backend (держать за флагом):**
- 4 панели `Deploy/Distillation/FineTuning/HealthSla` за `mockServices.enabled` + `SchedulerPanel` demo data.

**TODO (2):** `AppLayout.tsx` lazy import, `config-registry.ts` FreeTierLimit.

**Ложные срабатывания:** 272 `placeholder`, `partially_supported`, `queued` статусы, `fake-indexeddb` — не требуют действий.

---

## 8. Как воспроизвести

```powershell
Select-String -Path "C:\...\src\**\*.ts" -Pattern "stub" -CaseSensitive:$false
Select-String -Path "C:\...\src\**\*.ts" -Pattern "cargo check"
Get-ChildItem -LiteralPath "C:\...\src\kernel\services" -Recurse -File | Where-Object { $_.FullName -match "rivals" } | Measure-Object
```

**Закрыто в этой сессии:** 56 сервисов приведено к `REAL` (`planner/guardrail/interpreter/whale/cache + rivals14-20`): `DAL kv` + `EventBus` + `DI`, `vite 4616 modules ✓`, `chemist-service.ts` fix, `git push -f origin fix-debate-text-truncation 047d4d5`.
