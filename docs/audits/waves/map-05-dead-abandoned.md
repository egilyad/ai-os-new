# Карта мёртвого и заброшенного функционала — Dead & Abandoned Functionality Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `ae2dad8` (Nov 17, 2026, ветка `main`)
> **Дата анализа:** 2026-11-17 (актуализация карты от 2026-10-31)
> **Метод:** статический анализ: поиск orphan-файлов (без importers), grep `@deprecated MOCK`, чтение DemoGate/DemoBadge потребителей, проверка route-registry vs components, audit sub-components в DebatePanel/DashboardPanel/BuilderPanel/AgentsPanel. Все проверки повторены 2026-11-17 (Test-Path, Select-String по `src/`, route-registry-*.ts + routes.tsx, git log).
> **Парные документы:** 12 предыдущих карт
> **Главный результат:** найдено **5 категорий мёртвого/заброшенного кода**, всего **~200+ файлов**. Включает **5 `@deprecated MOCK` сервисов**, **3 DemoGated панели (782+441+516 строк) — теперь скрыты из nav/без маршрутов**, **~26 orphan компонентов (все подтверждены)**, **19 `rivals/` подкаталогов (179 файлов)**, **dev-status-\*.md: 10 файлов, заполнены (не пустые)**.
> **Изменения с 2026-10-31:** `agentMemory` подключён к UI (AgentsPanel/AgentDetailPanel MemoryTab); Aquarium получил `experimental` badge; TODO про framer-motion в AppLayout закрыт; пропали маршруты/навигация DeployPanel/HealthSlaPanel/DistillationPanel; появились новые live-панели topic-graph/nav-graph/graph-workbench/graph-studio/universal-graph.
> **⚠️ ВАЖНО:** ничего не удалять автоматически. Сначала — назначение и зависимости.

---

## 1. Исполнительное резюме

SuperAgents OS накопила **измеримый мёртвый и заброшенный код** за итерации разработки. Найдено:

- **5 `@deprecated MOCK` сервисов** — явно помечены как simulated backends
- **3 DemoGated панели** (DeployPanel 782 строки, HealthSlaPanel 441, DistillationPanel 516) — скрыты из навигации и роутов (с 2026-11-17), но код на месте
- **26 orphan компонентов** — написаны, но не подключены ни к route, ни к другим компонентам (все подтверждены)
- **19 `rivals/` подкаталогов (179 файлов)** — research parallel implementations, не canonical
- **dev-status-\*.md: 10 файлов, заполнены** — заглушек больше нет
- **Experimental panels без UI badge: 0** — Aquarium получил `experimental: true`; FederatedMemoryPanel не подключена вообще
- **1 TODO** (config-registry FreeTierLimit; TODO про framer-motion закрыт)

**Сводные метрики:**

| Категория                  |           Кол-во |  LOC (примерно) | Severity                              |
| -------------------------- | ---------------: | --------------: | ------------------------------------- |
| `@deprecated MOCK` сервисы |                5 |          ~2 000 | 🔴 HIGH — mock data, но панели скрыты |
| DemoGated панели           |                3 |          ~1 739 | 🟡 MED — скрыты из nav, кода в репо   |
| Orphan components          |               26 |          ~4 000 | 🟡 MED — написаны, не используются    |
| `rivals/` subdirs          |     19 каталогов |         ~12 600 | 🟡 MED — research parallel            |
| dev-status-*.md            |        10 файлов |       ~1.4-3.4K | 🟢 FIXED — заполнены, не пустые       |
| Experimental без badge     |                0 |               — | 🟢 FIXED — Aquarium получил badge     |
| TODOs (unfinished work)    |                1 |               — | 🟢 LOW — мало                         |
| **Total dead/abandoned**   | **~200+ файлов** | **~20 000 LOC** | —                                     |

**Главные находки:**

| #   | Находка                                       | Где                                             | Действие                                                                  |
| --- | --------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | `@deprecated MOCK` deploy-service             | `kernel/services/deploy-service.ts`             | DeployPanel показывает simulated deployment; панель скрыта из nav         |
| 2   | `@deprecated MOCK` health-sla-service         | `kernel/services/health-sla-service.ts`         | HealthSlaPanel показывает simulated SLA; панель скрыта из nav             |
| 3   | `@deprecated MOCK` model-distillation-service | `kernel/services/model-distillation-service.ts` | DistillationPanel показывает simulated distillation; панель скрыта из nav |
| 4   | `@deprecated MOCK` provider-migration-service | `kernel/services/provider-migration-service.ts` | Migration steps = no-ops (зарегистрирован в phase6)                       |
| 5   | `@deprecated STATIC` obs-gaps-service         | `kernel/services/obs-gaps-service.ts`           | Static snapshot, не обновляется (маркер на стр. 392)                      |
| 6   | DemoGated DeployPanel (782 строки!)           | `components/DeployPanel.tsx`                    | Mock backend; **нет маршрута в routes.tsx**                               |
| 7   | 26 orphan компонентов                         | various                                         | Написаны, не wired (все подтверждены case-sensitive grep)                 |
| 8   | 19 rivals/ subdirs                            | `kernel/services/rivals*/`                      | 179 файлов, ~12 600 LOC research parallel                                 |
| 9   | dev-status docs                               | `docs/wiki/dev-status-*.md`                     | 10 файлов, все заполнены (1331–3388 байт)                                 |
| 10  | Aquarium получил UI experimental badge        | `components/AquariumPanel/`                     | `experimental: true` в route-registry-content.ts                          |

**⚠️ Главное правило (из задания):** «Не удалять автоматически! Сначала выяснить назначение и зависимости». Каждый пункт ниже имеет **investigation section** — назначение, зависимости, рекомендация.

**Dead Code Score: 5.5/10** — умеренное количество мёртвого кода для проекта такого размера (569K LOC). ~20K LOC из 569K ≈ 3.5% — в пределах нормы, но требует cleanup.

---

## 2. Методология: 6 типов мёртвого кода

| #   | Тип                          | Что ищем                             | Метод                                  |
| --- | ---------------------------- | ------------------------------------ | -------------------------------------- |
| 1   | **Unused components**        | .tsx files без importers             | `grep -rE "import.*BaseName"` per file |
| 2   | **Outdated implementations** | `@deprecated MOCK/STATIC`            | `grep -rE "@deprecated"`               |
| 3   | **Inaccessible panels**      | DemoGated panels visible в nav       | `grep -rlE "DemoGate\|DemoBadge"`      |
| 4   | **Unused services**          | .ts files без importers              | grep per service file                  |
| 5   | **Unfinished experiments**   | rivals/ subdirs, experimental panels | ls + grep featureFlag                  |
| 6   | **Disconnected functions**   | Services exist, no UI exposure       | Integration Map findings               |

**Принцип:** «не удалять автоматически» — для каждого пункта:

- **Назначение** — зачем написано
- **Зависимости** — кто использует (если кто-то)
- **Рекомендация** — KEEP / REMOVE / HIDE / DOCUMENT / REPLACE

---

## 3. 🔴 `@deprecated MOCK` сервисы — 5 explicit mock backends

### 3.1. `deploy-service.ts` — @deprecated MOCK deployment

**Назначение:** DeployPanel (782 строки) показывает «deploy» cognitive pipeline — но backend симулирован.

**Доказательство:**

```typescript
// src/kernel/services/deploy-service.ts
/**
 * @deprecated MOCK — simulated deployment. No real build, upload, or server interaction.
 */
```

И: `'deploy uses @deprecated MOCK backend — no real build, upload, or server interaction'`

**Зависимости:**

- `DeployPanel.tsx` (782 строки) — explicit consumer, использует DemoGate
- DemoBadge показывается пользователю

**Проверено 2026-11-17:** `deploy-service.ts` существует, маркеры `@deprecated MOCK` на строках 26 и 176. `DeployPanel.tsx` существует (782 строки), `deploy` присутствует в мапе панелей (`route-imports.ts:464`), но **пути `/deploy` в `routes.tsx` нет и пункта навигации нет** — панель фактически скрыта (HIDE выполнено де-факто). Появился новый сервис `kernel/services/deploy/deploy-bundle-service.ts` (phase57, G4) — локальный bundle-manifest, тоже не настоящий deploy.

**Рекомендация:** 🟡 **HIDE + DOCUMENT**

- DeployPanel уже скрыта из nav/роутов — зафиксировать это как статус «hidden»
- Документировать в wiki: «DeployPanel — preview/mock, не production»
- Long-term: либо реализовать real deploy, либо удалить

### 3.2. `health-sla-service.ts` — @deprecated MOCK SLA

**Назначение:** HealthSlaPanel (441 строка) показывает SLA-метрики — но simulated.

**Доказательство:**

```typescript
// src/kernel/services/health-sla-service.ts
/**
 * @deprecated MOCK — simulated backend. Replace with real implementation before production use.
 */
```

**Зависимости:**

- `HealthSlaPanel.tsx` — explicit consumer, DemoGated
- `wiki-components.ts` (2 refs): «HealthSlaService помечен в коде как `@deprecated MOCK` — симулированный бэкенд»

**Проверено 2026-11-17:** `health-sla-service.ts` существует, маркер на строке 17. `HealthSlaPanel.tsx` существует (441 строка), `'health-sla'` есть в мапе панелей (`route-imports.ts:475`), но **пути `/health-sla` в `routes.tsx` нет, пункта навигации нет**. Фактически скрыта.

**Рекомендация:** 🔴 **REMOVE**

- HealthSlaPanel = 441 строка mock UI
- Реальной SLA нет (см. Tech Health Map — HealthSlaPanel должен быть merged в HealthPanel или удалён)
- Если SLA нужен — реализовать заново, не как mock

### 3.3. `model-distillation-service.ts` — @deprecated MOCK distillation

**Назначение:** DistillationPanel (516 строк) показывает model distillation — но simulated progress, no real distillation API call.

**Доказательство:**

```typescript
// src/kernel/services/model-distillation-service.ts
/**
 * @deprecated MOCK — simulated backend. Replace with real implementation before production use.
 */
'startJob uses @deprecated MOCK backend — simulated progress, no real distillation API call';
```

**Зависимости:**

- `DistillationPanel.tsx` (516 строк) — explicit consumer, DemoGated
- DemoBadge показывается

**Проверено 2026-11-17:** `model-distillation-service.ts` существует, маркеры `@deprecated MOCK` на строках 38 и 149. `DistillationPanel.tsx` существует (516 строк), `'model-distillation'` есть в мапе панелей (`route-imports.ts:463`), но **пути в `routes.tsx` нет, пункта навигации нет** — фактически скрыта.

**Рекомендация:** 🟡 **HIDE + DOCUMENT**

- Distillation — реальная ML-концепция, может быть future feature
- Скрыть за featureFlag, не удалять код (может стать основой для real impl)
- Документировать: «DistillationPanel — mock preview»

### 3.4. `provider-migration-service.ts` — @deprecated MOCK migration

**Назначение:** Migration steps для provider data — но no-ops.

**Доказательство:**

```typescript
// src/kernel/services/provider-migration-service.ts
/**
 * @deprecated MOCK — simulated backend. Migration steps are no-ops. Replace with real
 */
```

**Зависимости:**

- Используется в bootstrap (но как no-op)
- Не visible в UI напрямую

**Проверено 2026-11-17:** `provider-migration-service.ts` существует, маркер `@deprecated MOCK` на строке 11. Зарегистрирован в `kernel/service-registration/phase6-high-level.ts` (строки 69/328/329) и инстанцируется в `kernel/instances/services-extras.ts` (46/717/718) — но шаги остаются no-ops.

**Рекомендация:** 🟢 **DOCUMENT + KEEP (no-op safe)**

- No-op migration безопасна (ничего не делает)
- Документировать в коде: «migration запускается, но steps = no-ops»
- Если real migration понадобится — заменить

### 3.5. `obs-gaps-service.ts` — @deprecated STATIC snapshot

**Назначение:** Service inventory snapshot — static, не обновляется автоматически.

**Доказательство:**

```typescript
// src/kernel/services/obs-gaps-service.ts
/**
 * @deprecated STATIC — service inventory snapshot. Update `STATIC_SERVICES` and `SERVICE_FILE_MAP`
 */
```

**Зависимости:**

- Возможно используется в Observability panels (нужно ревью)

**Проверено 2026-11-17:** `obs-gaps-service.ts` существует, маркер `@deprecated STATIC` на строке 392; `STATIC_SERVICES` (стр. 11) и `SERVICE_FILE_MAP` (стр. 290) на месте. Статический снимок не обновляется автоматически.

**Рекомендация:** 🟡 **REPLACE с dynamic**

- Static snapshot устаревает
- Заменить на dynamic generation через `gen:wiki-system-map` (уже есть script)

---

## 4. 🟡 DemoGated панели — 3 mock panels (скрыты из nav)

### 4.1. DeployPanel (782 строки)

| Аспект        | Деталь                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| Строк         | **782** (largest panel)                                                  |
| Backend       | `@deprecated MOCK` deploy-service                                        |
| UI gating     | DemoGate + DemoBadge                                                     |
| Visible в nav | ❌ НЕТ (с 2026-11-17: пути `/deploy` в routes.tsx нет, пункта в nav нет) |
| Назначение    | Preview deploy cognitive pipeline                                        |
| Зависимости   | DemoGate, DemoBadge, deploy-service                                      |
| Рекомендация  | 🟡 HIDE за `featureFlags.mockServices.enabled = false` по умолчанию      |

### 4.2. HealthSlaPanel (441 строка)

| Аспект        | Деталь                                                     |
| ------------- | ---------------------------------------------------------- |
| Строк         | 441                                                        |
| Backend       | `@deprecated MOCK` health-sla-service                      |
| UI gating     | DemoBadge                                                  |
| Visible в nav | ❌ НЕТ (с 2026-11-17: пути `/health-sla` в routes.tsx нет) |
| Назначение    | SLA metrics preview                                        |
| Зависимости   | DemoBadge, health-sla-service                              |
| Рекомендация  | 🔴 REMOVE (или merge в HealthPanel + удалить mock)         |

### 4.3. DistillationPanel (516 строк)

| Аспект        | Деталь                                                       |
| ------------- | ------------------------------------------------------------ |
| Строк         | 516                                                          |
| Backend       | `@deprecated MOCK` model-distillation-service                |
| UI gating     | DemoBadge                                                    |
| Visible в nav | ❌ НЕТ (с 2026-11-17: пути `/distillation` в routes.tsx нет) |
| Назначение    | Model distillation preview                                   |
| Зависимости   | DemoBadge, model-distillation-service                        |
| Рекомендация  | 🟡 HIDE + DOCUMENT (future feature)                          |

**Сводно:** 3 панели, **1 739 строк** mock UI. С 2026-11-17 **ни одна не visible в навигации и не имеет маршрута в `routes.tsx`** (lazy-импорты и мапа `route-imports.ts` сохранены, но открыть их из UI нельзя). Таким образом рекомендация «HIDE» выполнена де-факто (удалением из роутов), код и mock-backend остались в репо.

---

## 5. 🟡 Orphan компоненты — 26 написаны, не wired

### 5.1. Подтверждённые orphans (1–2 refs, только test files)

| Файл                                  |               Refs | Назначение (по имени)      | Рекомендация                                                                                                                            |
| ------------------------------------- | -----------------: | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `AgentsPanel/AgentStatsDashboard.tsx` | 0 (case-sensitive) | Stats dashboard для agents | 🟡 orphan подтверждён                                                                                                                   |
| `AgentsPanel/LiveActivityStream.tsx`  |                  0 | Live activity feed         | 🟡 orphan подтверждён                                                                                                                   |
| `AgentsPanel/AgentGroupsSection.tsx`  |                  0 | Groups section             | 🟡 orphan подтверждён                                                                                                                   |
| `AgentsPanel/agent-templates.tsx`     |                  0 | Agent templates            | 🟡 orphan подтверждён                                                                                                                   |
| `FleetPanels/CouncilsPanel.tsx`       |                  0 | Councils panel             | 🟡 duplicate of `CouncilPanel`?                                                                                                         |
| `RolesPanel/PermissionMatrix.tsx`     |                  0 | Permission matrix          | 🟡 orphan подтверждён                                                                                                                   |
| `RolesPanel/RoleAnalytics.tsx`        |                  0 | Role analytics             | 🟡 **переклассифицирован** из NOT orphan: компонент не импортируется (тип `RoleAnalyticsEntry` в analytics-utils.ts — не компонент)     |
| `ChatPanel/PersonaSelector.tsx`       |                  0 | Persona selector           | 🟡 **переклассифицирован** из NOT orphan: компонент не импортируется (сервисный класс `PersonaSelector` в debate-runtime — другой файл) |
| `ProjectsPanel/WebsitePreview.tsx`    |                  0 | Website preview            | 🟡 orphan подтверждён (совпадения были только с сервисом `websitePreviewService`)                                                       |

### 5.2. DebatePanel sub-components — wizard step orphans

| Файл                                      | Назначение                | Рекомендация                                                                                                     |
| ----------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DebatePanel/WizardStepIndicator.tsx`     | Step indicator для wizard | 🟡 orphan подтверждён (import-строк нет)                                                                         |
| `DebatePanel/WizardNav.tsx`               | Wizard navigation         | 🟡 orphan подтверждён                                                                                            |
| `DebatePanel/ProbeResults.tsx`            | Probe results             | 🟡 orphan подтверждён (используется только state `probeResults` и отдельный `ProbeResultsSection` в HealthPanel) |
| `DebatePanel/ProbeResultsList.tsx`        | Probe results list        | 🟡 orphan подтверждён                                                                                            |
| `DebatePanel/DebateMemoryPanel.tsx`       | Debate memory panel       | 🟡 orphan подтверждён (интеграция debate↔memory так и не подключена)                                             |
| `DebatePanel/DebateSetupFormSections.tsx` | Setup form sections       | 🟡 orphan подтверждён                                                                                            |
| `DebatePanel/AgentsStep.tsx`              | Wizard step: agents       | 🟡 orphan подтверждён                                                                                            |
| `DebatePanel/TopicStep.tsx`               | Wizard step: topic        | 🟡 orphan подтверждён                                                                                            |
| `DebatePanel/AutoDebateSection.tsx`       | Auto-debate section       | 🟡 orphan подтверждён                                                                                            |
| `DebatePanel/TournamentBracketView.tsx`   | Tournament bracket        | 🟡 orphan подтверждён                                                                                            |

**⚠️ Важно:** `DebateMemoryPanel` существует как компонент, но **не подключён** — это может быть **half-implemented debate↔memory integration** (см. Integration Map §3.8: chat-executor → memory = 0 calls). Investigate first!

### 5.3. DashboardPanel sub-components — section orphans

| Файл                                        | Назначение               | Рекомендация                                     |
| ------------------------------------------- | ------------------------ | ------------------------------------------------ |
| `DashboardPanel/InferenceMeshSection.tsx`   | Inference mesh section   | 🟡 orphan подтверждён (внешних import-строк нет) |
| `DashboardPanel/LiveTerminalSection.tsx`    | Live terminal section    | 🟡 orphan подтверждён                            |
| `DashboardPanel/ProviderPressureMap.tsx`    | Provider pressure map    | 🟡 orphan подтверждён                            |
| `DashboardPanel/RoutingActivitySection.tsx` | Routing activity section | 🟡 orphan подтверждён                            |

**Эти секции могут быть part of Desktop.tsx (465 строк) — нужно ревью.**

### 5.4. BuilderPanel sub-components

| Файл                                              | Назначение             | Рекомендация          |
| ------------------------------------------------- | ---------------------- | --------------------- |
| `BuilderPanel/BuilderAISidebar.tsx`               | AI sidebar для builder | 🟡 orphan подтверждён |
| `BuilderPanel/WorkflowListPanel.tsx` (183 строки) | Workflow list          | 🟡 orphan подтверждён |

### 5.5. RivalsHub

| Файл                      |                 Refs | Рекомендация                                                                                                                   |
| ------------------------- | -------------------: | ------------------------------------------------------------------------------------------------------------------------------ |
| `RivalsHub/RivalsHub.tsx` | 0 (есть только test) | 🟡 orphan подтверждён — роута нет; отдельные `RivalsCatalogPanel` и `RivalLabsPanel` зарегистрированы в nav, `RivalsHub` — нет |

### 5.6. Orphan summary

**~26 confirmed orphan components** (проверено 2026-11-17 case-sensitive grep по import-строкам по всему `src/`, с исключением тестов и сгенерированных вики-артефактов). Большинство — sub-components больших панелей (DebatePanel wizard steps, DashboardPanel sections). **Не удалять** — сначала ревью, являются ли они:

- Part of larger component (используется через props, не import)
- Half-implemented features (см. DebateMemoryPanel)
- Genuinely abandoned

---

## 6. 🔴 `rivals/` subdirs — 19 parallel research implementations

(Подробно в Duplication Map §4)

**19 каталогов** `rivals/`, `rivals2/` … `rivals20/` — **179 файлов, ~12 600 LOC** (проверено 2026-11-17: `Get-ChildItem` по `src/kernel/services/rivals*`).

**Назначение:** research/experimental parallel implementations of similar concepts (cache-service, project-service, policy-service, etc.).

**Доказательство:** 7 пар duplicate files (cache-service×3, project-service×2, policy-service×2, persona-service×2, n8n-service×2, blackboard-service×2, assistant-service×2).

**Зависимости:** нужно ревью — какие rivals/ файлы реально registered в service-registration, какие abandoned.

**Рекомендация:** 🟡 **MOVE в `src/experimental/rivals/`** или удалить неиспользуемые. Не удалять автоматически — сначала audit imports.

---

## 7. 🟡 Experimental panels без UI badge → FIXED (2026-11-17)

### 7.1. AquariumPanel

**Назначение:** Cognitive-aux / research panel (Experimental). Decorative aquarium visualization of provider health.

**Доказательство:**

```typescript
// src/components/AquariumPanel/AquariumPanel.tsx
/**
 * Cognitive-aux / research panel (Experimental).
 * Same provider health data as HealthPanel, rendered as an aquarium showcase.
 * Sidebar: feature flag ui.experimentalVisuals. Research-grade — not production surface (P1.21).
 */
```

**Зависимости:**

- Feature flag `ui.experimentalVisuals` (в SettingsPanel/GeneralTab)
- Route-элемент в `route-registry-content.ts:695` с **`experimental: true`** — badge теперь показывается (компонент `Common/ExperimentalBadge.tsx`)

**Проверено 2026-11-17:** `AquariumPanel.tsx` существует, `id: 'aquarium'` в nav (route-registry-content.ts:695) помечен `experimental: true`, маршрут `/diagnostics/aquarium` есть в `routes.tsx:407-412`. → **ADD badge выполнено**.

**Рекомендация:** 🟢 **KEEP** — badge присутствует, панель рабочая (decorative).

### 7.2. FederatedMemoryPanel

**Назначение:** Federated memory — research-grade, not production surface (P1.21).

**Доказательство:**

```typescript
// src/components/FederatedMemoryPanel.tsx
/**
 * Cognitive-aux / research panel (Experimental).
 * Federated memory — research-grade, not production surface (P1.21).
 */
```

**Зависимости:** `federatedMemoryService` (экспериментальный)

**Проверено 2026-11-17:** `FederatedMemoryPanel.tsx` существует (+тест), но **отсутствует в route-registry/nav и в мапе панелей `route-imports.ts`** — панель вообще не подключена (не только без бейджа, а нигде не зарегистрирована).

**Рекомендация:** 🟡 **HIDE + DOCUMENT** — либо удалить, либо зарегистрировать в nav с `experimental: true` (инфраструктура badge уже есть).

---

## 8. 🟡 Пустые dev-status-*.md → FIXED (2026-11-17)

(Подробно в Tech Health Map §4.3)

**10 файлов** в `docs/wiki/` (проверено 2026-11-17, все непустые, 1331–3388 байт):

- `dev-status-active.md`, `dev-status-blocked.md`, `dev-status-bugs.md`, `dev-status-critical.md`, `dev-status-debt.md`, `dev-status-docs.md`, `dev-status-done.md`, `dev-status-files.md`, `dev-status-roadmaps.md`, `dev-status-testing.md`

**Назначение:** formal issue tracking — файлы заполнены реальными пунктами (security/resilience-фиксы, депт, баги, roadmap). Заглушек «текст в разработке» больше нет.

**Зависимости:** referenced в wiki navigation — content теперь содержательный.

**Рекомендация:** 🟢 **FILL выполнено** — убрать из списка мёртвого кода (пункт закрыт).

---

## 9. 🟡 Disconnected functions — services exist, no UI

(Подробно в Integration Map и Capability Gap Map)

| Сервис                            | Exists in code                                       | UI exposure                                                                                                                |
| --------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `crystalVault`                    | ✅ kernel/services/crystal-vault/                    | ✅ CrystalVaultPanel                                                                                                       |
| `synthesisEngine`                 | ✅ kernel/services/synthesis/                        | ✅ SynthesisPanel                                                                                                          |
| `lensEngine`                      | ✅ kernel/services/lens-engine/                      | ✅ LensesPanel                                                                                                             |
| `timeMachineService`              | ✅ kernel/services/time-machine-service.ts           | ✅ TimeMachinePanel (time-machine-service.ts)                                                                              |
| `forumService`                    | ✅ kernel/services/forum/                            | ✅ ForumPanel                                                                                                              |
| `directorService`                 | ✅ kernel/services/director/                         | ✅ DirectorPanel                                                                                                           |
| `memoryOrchestrator`              | ✅ kernel/services/memory-orchestrator.ts            | ✅ через MemoryPanel                                                                                                       |
| `wikiBrain` (23 files)            | ✅ kernel/services/wiki-brain/                       | 🟡 WikiBrainPanel separate, WikiPanel не использует                                                                        |
| `wikiIngestService`               | ✅ kernel/services/wiki-brain/wiki-ingest.service.ts | 🟡 **NO UI**, но WikiPanel получил локальный редактор статей (`WikiArticleEditor` + `addUserArticle`), не через wikiIngest |
| `wikiGraphService`                | ✅ kernel/services/wiki-brain/wiki-graph.service.ts  | 🟡 WikiBrainPanel only                                                                                                     |
| `agentMemory` table               | ✅ Dexie schema                                      | ✅ **WIRED** (2026-11-17): AgentsPanel/AgentDetailPanel MemoryTab читает/пишет `agentMemory`                               |
| `eventBus.getSubscriptionStats()` | ✅ event-bus.ts method                               | 🔴 **NO UI** (метод на event-bus.ts:303, только тесты)                                                                     |
| `MemoryWatchdog`                  | ✅ kernel/utils/memory-watchdog.ts                   | 🔴 **только в логах/bootstrap** (start/stop в bootstrap.ts)                                                                |

**Осталось без UI exposure (2026-11-17):**

1. `wikiIngestService` — сервис зарегистрирован (phase81-wiki-brain.ts) и используется в операциях ingest-analyze/ingest-generate, но в UI не подключён; создание статей идёт через локальные `wiki-user-articles` (не через wikiIngest)
2. `eventBus.getSubscriptionStats()` — метод есть (line 303), используется только в тестах
3. `MemoryWatchdog` — heap data в логах/bootstrap, не в UI

**Пункт закрыт:** `agentMemory` (по ` dev переклассифицирован в live: AgentsPanel/AgentDetailPanel.tsx:242,265-368 (MemoryTab)).

**Рекомендация:** 🟡 **WIRE to UI** для оставшихся 3 (см. Capability Gap Map §11, Opportunity Map 3.4, 3.22)

---

## 10. 🟢 TODOs — 1 (было 2, один закрыт)

(Из Tech Health Map §3.3)

**1 TODO во всём src/** (проверено 2026-11-17, grep `TODO:` по `src/`):

1. `src/kernel/services/config-registry.ts:145`:
   ```typescript
   // TODO: Per-model limits — FreeTierLimit type needs refactoring
   ```

**Закрыт:** TODO про framer-motion в `AppLayout.tsx` **исчез** — комментарий переписан («Route transitions use CSS animation instead of framer-motion»), CommandPalette теперь lazy-loaded, framer-motion убран из критического пути.

**Назначение:** Unfinished refactoring work.

**Зависимости:**

- TODO: FreeTierLimit type (config-registry)

**Рекомендация:** 🟢 **DOCUMENT + schedule** — manageable, не critical.

---

## 11. 🟡 Commented-out code — autodiscovery off

(Из Zone-1 audit)

В Zone 1 audit упомянуто: «Автодискавери моделей выключено комментарием».

**Проверено 2026-11-17:** да, автодискавери моделей по-прежнему выключен комментарием в `src/components/ChatPanel/ChatPanel.tsx:208-212`:

```typescript
// B.3: auto-discover models for keys that have no cached availableModels
// Temporarily disabled - discovery is on-demand via KeyTable; auto-spam ...
// DEFAULT_MODELS fallback ensures Chat remains usable without discovery.
```

**Назначение:** Feature существовала, была отключена (discovery теперь on-demand через KeyTable).

**Рекомендация:** 🟡 **INVESTIGATE** — почему выключено? Bug или intentional?

---

## 12. Сводная матрица мёртвого кода

| #         | Категория                  |          Кол-во |       LOC | Severity | Действие                 |
| --------- | -------------------------- | --------------: | --------: | -------- | ------------------------ |
| 1         | `@deprecated MOCK` сервисы |               5 |    ~2 000 | 🔴 HIGH  | HIDE/REMOVE/REPLACE      |
| 2         | DemoGated панели           |               3 |     1 739 | 🟡 MED   | уже скрыты из nav/роутов |
| 3         | Orphan компоненты          |              26 |    ~4 000 | 🟡 MED   | INVESTIGATE              |
| 4         | `rivals/` subdirs          |         19 dirs |   ~12 600 | 🟡 MED   | MOVE в experimental      |
| 5         | dev-status-*.md            |              10 | ~1.4-3.4K | 🟢 FIXED | заполнены                |
| 6         | Experimental без badge     |               0 |         — | 🟢 FIXED | Aquarium получил badge   |
| 7         | Disconnected services      |               3 |         — | 🟡 MED   | WIRE to UI               |
| 8         | TODOs                      |               1 |         — | 🟢 LOW   | SCHEDULE                 |
| 9         | Commented-out code         |        (Zone 1) |         — | 🟡 LOW   | INVESTIGATE              |
| **Total** | **~200+ файлов**           | **~20 000 LOC** |         — | —        |

**~3.5% от 569K LOC — в пределах нормы для зрелого проекта, но требует cleanup.**

---

## 13. Investigation framework — для каждого пункта

**Перед удалением/изменением — ответить на 5 вопросов:**

1. **Назначение** — зачем этот код был написан?
2. **Зависимости** — кто его использует? (grep imports)
3. **Tests** — есть ли test file? Что он проверяет?
4. **Wiki** — упомянут в документации?
5. **Recent activity** — был изменён недавно? (git log)

**Только после ответов — решение:**

| Вердикт     | Условие                             | Действие                    |
| ----------- | ----------------------------------- | --------------------------- |
| 🟢 KEEP     | Используется, полезно               | Ничего не делать            |
| 🟡 HIDE     | Mock/experimental, visible          | Feature flag, badge         |
| 🟡 DOCUMENT | Назначение не очевидно              | Wiki article, code comments |
| 🟡 REPLACE  | Mock с real implementation needed   | Реализовать заново          |
| 🔴 REMOVE   | Подтверждённый dead, нет dependents | Delete + remove route       |

---

## 14. Топ-10 priority investigations

| #   | Что                                              | Почему investigate first                                                                   |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | `DebatePanel/DebateMemoryPanel.tsx`              | Может быть half-implemented debate↔memory (Integration Map §3.8); всё ещё не импортируется |
| 2   | `DeployPanel` (782 строки, MOCK)                 | Largest mock panel; **скрыт из nav** (с 2026-11-17)                                        |
| 3   | `rivals/` 19 subdirs                             | ~12 600 LOC, нужно audit imports                                                           |
| 4   | `HealthSlaPanel` (441, MOCK)                     | Mock + overlap с HealthPanel; скрыт из nav                                                 |
| 5   | `DistillationPanel` (516, MOCK)                  | Mock, но может быть future feature; скрыт из nav                                           |
| 6   | `agentMemory` Dexie table                        | ✅ WIRED (2026-11-17): AgentsPanel MemoryTab; пункт закрыт                                 |
| 7   | `wikiIngestService` без UI                       | Service есть; WikiPanel получил локальный editor (user-articles), не через сервис          |
| 8   | `obs-gaps-service` STATIC                        | Static snapshot, может быть устаревшим                                                     |
| 9   | dev-status-*.md                                  | ✅ FIXED (2026-11-17): 10 файлов заполнены                                                 |
| 10  | `WizardStepIndicator`, `WizardNav`, wizard steps | DebatePanel wizard orphans (подтверждены)                                                  |

---

## 15. Рекомендации — без auto-delete

### 🔴 P0 — investigate + decide (high priority)

1. **Audit `rivals/` 19 subdirs** — для каждого файла определить: registered в service-registration? Импортируется canonical кодом? Если нет — move в `src/experimental/rivals/` или delete. (Данные на 2026-11-17: 179 файлов, ~12 600 LOC.)

2. **Investigate `DebatePanel/DebateMemoryPanel.tsx`** — может быть half-implemented debate↔memory integration. Если да — либо завершить, либо удалить + документировать как cancelled feature. (По-прежнему не импортируется.)

3. **Hide 3 DemoGated panels** за `featureFlags.mockServices.enabled = false` по умолчанию. **Статус на 2026-11-17: уже скрыты** — DeployPanel, HealthSlaPanel, DistillationPanel не имеют маршрутов в `routes.tsx` и пунктов в nav; код остался в репо.

4. **Remove `HealthSlaPanel`** (441 строка MOCK) — либо merge в HealthPanel с табом, либо удалить. Реальной SLA нет.

### 🟡 P1 — wire disconnected services

5. **Wire `wikiIngestService` to WikiPanel UI** — WikiPanel уже получил «Create article» (WikiArticleEditor + addUserArticle), но через локальные user-articles, а не через `wikiIngestService`; решить: переключить на сервис или оставить.

6. **Wire `eventBus.getSubscriptionStats()` to UI** — показать в HealthPanel или новой BackgroundServicesPanel. (agentMemory уже wired — см. ниже.)

7. **Wire `MemoryWatchdog` to UI** — вывести heap data в HealthPanel, не только в логах.

### 🟡 P1 — orphan components audit

8. **Audit 26 orphan components** — для каждого: используется через props? Half-implemented? Genuinely abandoned? Решение per-file. (Все 26 подтверждены 2026-11-17 case-sensitive grep.)

9. **Audit DashboardPanel sections** (InferenceMesh, LiveTerminal, ProviderPressureMap, RoutingActivity) — part of Desktop.tsx? Если нет — investigate.

10. **Audit DebatePanel wizard steps** (AgentsStep, TopicStep, AutoDebateSection, WizardStepIndicator, WizardNav) — используется DebateSetupWizard? Если нет — investigate.

### 🟢 P2 — documentation + badges

11. **Add experimental badges** — Aquarium уже получил (route-registry-content.ts `experimental: true`); FederatedMemoryPanel не подключена вообще — либо зарегистрировать с badge, либо удалить.

12. **dev-status-\*.md** — заполнены (10 файлов), пункт закрыт.

13. **Document `@deprecated MOCK` services** в wiki — что mock, что real.

14. **Schedule 1 TODO** — FreeTierLimit refactor (config-registry.ts:145). (TODO про framer-motion в AppLayout закрыт.)

---

## 16. Итоговый вердикт по мёртвому коду

| Метрика                     |   Оценка   | Комментарий                                           |
| --------------------------- | :--------: | ----------------------------------------------------- |
| `@deprecated MOCK` services |  🔴 3/10   | 5 explicit mock backends, 0 visible в UI              |
| DemoGated panels            |  🟡 5/10   | 3 panels, 1 739 строк, скрыты из nav                  |
| Orphan components           |  🟡 6/10   | 26 orphans, ~4 000 LOC                                |
| `rivals/` subdirs           |  🟡 5/10   | 19 dirs, ~12 600 LOC research parallel                |
| dev-status docs             |  🟢 8/10   | 10 файлов, заполнены                                  |
| Experimental без badge      |  🟢 8/10   | Aquarium получил badge; FederatedMemory не подключена |
| Disconnected services       |  🟡 6/10   | 3 key services без UI (agentMemory wired)             |
| TODOs                       |  🟢 9/10   | 1 TODO на 569K LOC — отлично                          |
| Commented-out code          |  🟡 6/10   | autodiscovery off (Zone 1)                            |
| **Overall Dead Code Score** | **5.5/10** | ~20K LOC из 569K ≈ 3.5%, требует cleanup              |

**Сильные стороны:**

- **Только 1 TODO** на 569K LOC — exceptionally чисто
- **0 circular deps** (см. Dependencies Map)
- **DemoGate/DemoBadge infrastructure** — mock panels явно помечены в коде
- **Feature flags** для experimental (`ui.experimentalVisuals`, `mockServices.enabled`)
- **`@deprecated MOCK` markers** — explicit, не скрытые
- **Wiki документирует** HealthSlaService как MOCK
- **HIDE выполнено де-факто**: DemoGated панели скрыты из nav/роутов
- **`agentMemory` wired** в AgentsPanel MemoryTab
- **dev-status заполнены**, **Aquarium получил badge**

**Слабые стороны:**

- **5 `@deprecated MOCK` services** — 2 000 LOC mock code в production codebase
- **26 orphan components** — написаны, не wired
- **19 `rivals/` subdirs** — ~12 600 LOC research parallel, не canonical
- **3 disconnected services** — exist в коде, не wired to UI
- **FederatedMemoryPanel** — не подключена вообще

**Главный вывод:** проект накопил **~20K LOC мёртвого/заброшенного кода** (~3.5% от 569K, проверено 2026-11-17) — в пределах нормы для зрелого проекта, но требует systematic cleanup. **Главное правило (из задания): не удалять автоматически** — каждый пункт требует investigation: назначение, зависимости, тесты, wiki, recent activity.

**Dead Code Score: 5.5/10** — умеренно. После cleanup (opportunities из Opportunity Map 3.7, 3.12, 3.15, 3.17) — поднимется до ~7.5/10.

**Стратегическое направление (на 2026-11-17):**

1. **Investigate first** — для каждого пункта выяснить назначение и зависимости
2. **Hide mock panels** — уже скрыты из nav/роутов (зафиксировать, оставить код)
3. **Move rivals/ в experimental**
4. **Wire disconnected services** — осталось 3 (wikiIngest, getSubscriptionStats, MemoryWatchdog); agentMemory wired
5. **Delete/deprecate** FederatedMemoryPanel (не подключена) и решить судьбу 26 orphans

---

## Приложение A. Все метрики мёртвого кода в цифрах

| Метрика                          |                            Значение | Источник                                                             |
| -------------------------------- | ----------------------------------: | -------------------------------------------------------------------- |
| `@deprecated MOCK` services      |                                   5 | `grep -rE "@deprecated MOCK"`                                        |
| `@deprecated STATIC` services    |                        1 (obs-gaps) | grep (маркер на стр. 392)                                            |
| `@deprecated` (other)            | 2 (key-fingerprints method, styles) | grep                                                                 |
| DemoGated panels                 |                                   3 | `grep -rlE "DemoGate\|DemoBadge"`                                    |
| DemoGated panels LOC             |                               1 739 | DeployPanel 782 + HealthSlaPanel 441 + DistillationPanel 516         |
| DemoGated panels visible в nav   |                                   0 | нет путей в routes.tsx, нет пунктов в route-registry                 |
| Orphan components (confirmed)    |                                  26 | case-sensitive grep по import-строкам (2026-11-17)                   |
| Orphan components LOC            |                              ~4 000 | estimate                                                             |
| `rivals/` subdirs                |                                  19 | `ls src/kernel/services/ \| grep rivals`                             |
| `rivals/` files                  |                                 179 | find per subdir                                                      |
| `rivals/` LOC                    |                             ~12 600 | `Measure-Object` по файлам (2026-11-17)                              |
| dev-status-*.md                  |                                  10 | все заполнены (1331–3388 байт), не пустые                            |
| Experimental panels без UI badge |                                   0 | Aquarium получил `experimental: true`; FederatedMemory не подключена |
| Disconnected services без UI     |                                   3 | wikiIngest, getSubscriptionStats, MemoryWatchdog (agentMemory wired) |
| TODOs                            |                                   1 | grep (config-registry.ts:145)                                        |
| Commented-out features           |                  1+ (autodiscovery) | Zone-1 audit (подтверждён: ChatPanel.tsx:208-212)                    |
| **Total dead/abandoned files**   |                           **~200+** | sum                                                                  |
| **Total dead/abandoned LOC**     |                         **~20 000** | sum                                                                  |
| % от total LOC                   |                           **~3.5%** | 20K / 569K                                                           |

---

## Приложение B. Источники и метод

| Что                             | Где                                                                                                        | Как проверено                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `@deprecated MOCK`              | `src/kernel/services/*.ts`                                                                                 | `grep -rE "@deprecated MOCK"` (2026-11-17)                                       |
| DemoGated panels                | `src/components/**/*.tsx`                                                                                  | `grep -rlE "DemoGate\|DemoBadge"`                                                |
| Orphan components               | `src/components/**/*.tsx`                                                                                  | case-sensitive `Select-String` по import-строкам (2026-11-17)                    |
| `rivals/` subdirs               | `src/kernel/services/`                                                                                     | `Get-ChildItem` по `rivals*` (19 dirs, 179 файлов)                               |
| dev-status                      | `docs/wiki/dev-status-*.md`                                                                                | `Get-ChildItem` + размеры (10 файлов, заполнены)                                 |
| Experimental panels             | `src/components/{Aquarium,FederatedMemory}*/`                                                              | чтение head comments + route-registry (`experimental` flag)                      |
| Disconnected services           | cross-reference Integration Map + Capability Gap Map                                                       | synthesis (2026-11-17)                                                           |
| TODOs                           | `src/**`                                                                                                   | `grep -rE "TODO:"` (2026-11-17)                                                  |
| Commented-out                   | Zone-1 audit                                                                                               | чтение zone-1.md + ChatPanel.tsx:208-212                                         |
| `agentMemory` table             | `src/kernel/services/dexie-schema.ts`                                                                      | grep + AgentsPanel/AgentDetailPanel.tsx:242-368 (MemoryTab)                      |
| `eventBus.getSubscriptionStats` | `src/kernel/events/event-bus.ts`                                                                           | grep (метод на стр. 303, только тесты)                                           |
| `MemoryWatchdog`                | `src/kernel/utils/memory-watchdog.ts`                                                                      | полное чтение + bootstrap.ts (start/stop)                                        |
| Новые live-панели               | `src/components/{TopicGraphPanel,NavGraphPanel,GraphWorkbenchPanel,GraphStudioPanel,UniversalGraphPanel}/` | `route-registry-core.ts` (nav, `experimental`), `route-imports.ts` (lazy + мапа) |

---

## Сверка с аудитами (волны 2–8)

Дополнительные факты по мёртвому/заброшенному из волн аудитов:

- W6-032: `costHistory` count-cap был мёртвой логикой (искажал monthlySpend) — исправлено на time-retention.
- W3-028: 4 dead/misleading feature-флага.
- W4-021: OpenRouter rotation — только локальный флип, без revoke (DELETE).
- W2-002/017/018: GovernanceService/AgentService/CrewService — мутации без authz (частично неиспользуемые вызовы).
- W6-023: ReDoS-гвард отсутствовал в 6 местах (исправлено: regex-safe в prompt-security/policy).
- W7-ANA-012: UsageTracker — мёртвый код (не enforced).
- W4-083: AgemsAuditService — мёртвый.
- W3-014/015: service worker / Web App Manifest отсутствуют (недореализовано).

---

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e`; актуализирован 2026-11-17 на основе коммита `ae2dad8`. Анализ статический; **ничего не удалено** — только investigation framework. Парные отчёты: 12 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle, доступность, пробелы, интеграция, user journeys, потенциал).*
