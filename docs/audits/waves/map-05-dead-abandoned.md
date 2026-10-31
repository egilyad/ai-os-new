# Карта мёртвого и заброшенного функционала — Dead & Abandoned Functionality Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Дата анализа:** 2026-10-31
> **Метод:** статический анализ: поиск orphan-файлов (без importers), grep `@deprecated MOCK`, чтение DemoGate/DemoBadge потребителей, проверка route-registry vs components, audit sub-components в DebatePanel/DashboardPanel/BuilderPanel/AgentsPanel
> **Парные документы:** 12 предыдущих карт
> **Главный результат:** найдено **5 категорий мёртвого/заброшенного кода**, всего **~200+ файлов**. Включает **5 `@deprecated MOCK` сервисов**, **3 DemoGated панели (782+441+516 строк)**, **~15 orphan компонентов**, **19 `rivals/` подкаталогов (~175 файлов)**, **5 пустых dev-status-\*.md**.
> **⚠️ ВАЖНО:** ничего не удалять автоматически. Сначала — назначение и зависимости.

---

## 1. Исполнительное резюме

SuperAgents OS накопила **измеримый мёртвый и заброшенный код** за итерации разработки. Найдено:

- **5 `@deprecated MOCK` сервисов** — явно помечены как simulated backends
- **3 DemoGated панели** (DeployPanel 782 строки, HealthSlaPanel 441, DistillationPanel 516) — visible в навигации, но за DemoBadge, показывают mock data
- **~15 orphan компонентов** — написаны, но не подключены ни к route, ни к другим компонентам
- **19 `rivals/` подкаталогов (~175 файлов)** — research parallel implementations, не canonical
- **5 пустых `dev-status-*.md`** — заглушки «текст в разработке»
- **Experimental panels без UI badge** — Aquarium, FederatedMemory
- **2 TODOs** (минимум — но обе про unfinished framer-motion cleanup)

**Сводные метрики:**

| Категория                  |           Кол-во |  LOC (примерно) | Severity                               |
| -------------------------- | ---------------: | --------------: | -------------------------------------- |
| `@deprecated MOCK` сервисы |                5 |          ~2 000 | 🔴 HIGH — пользователь видит mock data |
| DemoGated панели           |                3 |          ~1 739 | 🟡 MED — видны, но помечены            |
| Orphan components          |              ~15 |          ~3 000 | 🟡 MED — написаны, не используются     |
| `rivals/` subdirs          |     19 каталогов |         ~17 500 | 🟡 MED — research parallel             |
| Пустые dev-status-*.md     |         5 файлов |  ~50 (заглушки) | 🟡 MED — impression of unfinished      |
| Experimental без badge     |                2 |          ~1 500 | 🟡 LOW — помечены в коде               |
| TODOs (unfinished work)    |                2 |               — | 🟢 LOW — мало                          |
| **Total dead/abandoned**   | **~210+ файлов** | **~25 000 LOC** | —                                      |

**Главные находки:**

| #   | Находка                                       | Где                                             | Действие                                            |
| --- | --------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| 1   | `@deprecated MOCK` deploy-service             | `kernel/services/deploy-service.ts`             | DeployPanel показывает simulated deployment         |
| 2   | `@deprecated MOCK` health-sla-service         | `kernel/services/health-sla-service.ts`         | HealthSlaPanel показывает simulated SLA             |
| 3   | `@deprecated MOCK` model-distillation-service | `kernel/services/model-distillation-service.ts` | DistillationPanel показывает simulated distillation |
| 4   | `@deprecated MOCK` provider-migration-service | `kernel/services/provider-migration-service.ts` | Migration steps = no-ops                            |
| 5   | `@deprecated STATIC` obs-gaps-service         | `kernel/services/obs-gaps-service.ts`           | Static snapshot, не обновляется                     |
| 6   | DemoGated DeployPanel (782 строки!)           | `components/DeployPanel.tsx`                    | Visible, mock backend                               |
| 7   | ~15 orphan компонентов                        | various                                         | Написаны, не wired                                  |
| 8   | 19 rivals/ subdirs                            | `kernel/services/rivals*/`                      | ~17 500 LOC research parallel                       |
| 9   | 5 пустых dev-status docs                      | `docs/wiki/dev-status-*.md`                     | «текст в разработке» заглушки                       |
| 10  | Aquarium без UI experimental badge            | `components/AquariumPanel/`                     | Помечено в комментарии, не в UI                     |

**⚠️ Главное правило (из задания):** «Не удалять автоматически! Сначала выяснить назначение и зависимости». Каждый пункт ниже имеет **investigation section** — назначение, зависимости, рекомендация.

**Dead Code Score: 5.5/10** — умеренное количество мёртвого кода для проекта такого размера (509K LOC). ~25K LOC из 509K = 5% — в пределах нормы, но требует cleanup.

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

**Рекомендация:** 🟡 **HIDE + DOCUMENT**

- Скрыть DeployPanel из main nav за `featureFlags.mockServices.enabled = false` по умолчанию
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

**Рекомендация:** 🟡 **REPLACE с dynamic**

- Static snapshot устаревает
- Заменить на dynamic generation через `gen:wiki-system-map` (уже есть script)

---

## 4. 🟡 DemoGated панели — 3 visible mock panels

### 4.1. DeployPanel (782 строки)

| Аспект        | Деталь                                                              |
| ------------- | ------------------------------------------------------------------- |
| Строк         | **782** (largest panel)                                             |
| Backend       | `@deprecated MOCK` deploy-service                                   |
| UI gating     | DemoGate + DemoBadge                                                |
| Visible в nav | ✅ ДА (без явного «mock» бейджа в sidebar)                          |
| Назначение    | Preview deploy cognitive pipeline                                   |
| Зависимости   | DemoGate, DemoBadge, deploy-service                                 |
| Рекомендация  | 🟡 HIDE за `featureFlags.mockServices.enabled = false` по умолчанию |

### 4.2. HealthSlaPanel (441 строка)

| Аспект        | Деталь                                             |
| ------------- | -------------------------------------------------- |
| Строк         | 441                                                |
| Backend       | `@deprecated MOCK` health-sla-service              |
| UI gating     | DemoBadge                                          |
| Visible в nav | ✅ ДА                                              |
| Назначение    | SLA metrics preview                                |
| Зависимости   | DemoBadge, health-sla-service                      |
| Рекомендация  | 🔴 REMOVE (или merge в HealthPanel + удалить mock) |

### 4.3. DistillationPanel (516 строк)

| Аспект        | Деталь                                        |
| ------------- | --------------------------------------------- |
| Строк         | 516                                           |
| Backend       | `@deprecated MOCK` model-distillation-service |
| UI gating     | DemoBadge                                     |
| Visible в nav | ✅ ДА                                         |
| Назначение    | Model distillation preview                    |
| Зависимости   | DemoBadge, model-distillation-service         |
| Рекомендация  | 🟡 HIDE + DOCUMENT (future feature)           |

**Сводно:** 3 панели, **1 739 строк** mock UI, все visible в навигации. Пользователь открывает — видит DemoBadge «Demo mode», но в sidebar нет предупреждения.

---

## 5. 🟡 Orphan компоненты — ~15 написаны, не wired

### 5.1. Подтверждённые orphans (1–2 refs, только test files)

| Файл                                  |     Refs | Назначение (по имени)      | Рекомендация                     |
| ------------------------------------- | -------: | -------------------------- | -------------------------------- |
| `AgentsPanel/AgentStatsDashboard.tsx` | 1 (test) | Stats dashboard для agents | 🟡 probably unused — investigate |
| `AgentsPanel/LiveActivityStream.tsx`  |        2 | Live activity feed         | 🟡 maybe in tests only           |
| `AgentsPanel/AgentGroupsSection.tsx`  | (orphan) | Groups section             | 🟡 investigate                   |
| `AgentsPanel/agent-templates.tsx`     | (orphan) | Agent templates            | 🟡 investigate                   |
| `FleetPanels/CouncilsPanel.tsx`       |        1 | Councils panel             | 🟡 duplicate of `CouncilPanel`?  |
| `RolesPanel/PermissionMatrix.tsx`     |        1 | Permission matrix          | 🟡 investigate                   |
| `RolesPanel/RoleAnalytics.tsx`        |   7 refs | Role analytics             | 🟢 NOT orphan (used)             |
| `ChatPanel/PersonaSelector.tsx`       |   9 refs | Persona selector           | 🟢 NOT orphan (used)             |
| `ProjectsPanel/WebsitePreview.tsx`    | (orphan) | Website preview            | 🟡 investigate                   |

### 5.2. DebatePanel sub-components — wizard step orphans

| Файл                                      | Назначение                | Рекомендация                                                     |
| ----------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `DebatePanel/WizardStepIndicator.tsx`     | Step indicator для wizard | 🟡 может быть unused (DebateSetupWizard не импортирует)          |
| `DebatePanel/WizardNav.tsx`               | Wizard navigation         | 🟡 то же                                                         |
| `DebatePanel/ProbeResults.tsx`            | Probe results             | 🟡 investigate                                                   |
| `DebatePanel/ProbeResultsList.tsx`        | Probe results list        | 🟡 investigate                                                   |
| `DebatePanel/DebateMemoryPanel.tsx`       | Debate memory panel       | 🟡 investigate (см. Capability Gap Map — debate↔memory missing!) |
| `DebatePanel/DebateSetupFormSections.tsx` | Setup form sections       | 🟡 может быть unused                                             |
| `DebatePanel/AgentsStep.tsx`              | Wizard step: agents       | 🟡 wizard step orphan                                            |
| `DebatePanel/TopicStep.tsx`               | Wizard step: topic        | 🟡 wizard step orphan                                            |
| `DebatePanel/AutoDebateSection.tsx`       | Auto-debate section       | 🟡 investigate                                                   |
| `DebatePanel/TournamentBracketView.tsx`   | Tournament bracket        | 🟡 может быть unused                                             |

**⚠️ Важно:** `DebateMemoryPanel` существует как компонент, но **не подключён** — это может быть **half-implemented debate↔memory integration** (см. Integration Map §3.8: chat-executor → memory = 0 calls). Investigate first!

### 5.3. DashboardPanel sub-components — section orphans

| Файл                                        | Назначение               | Рекомендация   |
| ------------------------------------------- | ------------------------ | -------------- |
| `DashboardPanel/InferenceMeshSection.tsx`   | Inference mesh section   | 🟡 investigate |
| `DashboardPanel/LiveTerminalSection.tsx`    | Live terminal section    | 🟡 investigate |
| `DashboardPanel/ProviderPressureMap.tsx`    | Provider pressure map    | 🟡 investigate |
| `DashboardPanel/RoutingActivitySection.tsx` | Routing activity section | 🟡 investigate |

**Эти секции могут быть part of Desktop.tsx (465 строк) — нужно ревью.**

### 5.4. BuilderPanel sub-components

| Файл                                              | Назначение             | Рекомендация         |
| ------------------------------------------------- | ---------------------- | -------------------- |
| `BuilderPanel/BuilderAISidebar.tsx`               | AI sidebar для builder | 🟡 investigate       |
| `BuilderPanel/WorkflowListPanel.tsx` (183 строки) | Workflow list          | 🟡 может быть unused |

### 5.5. RivalsHub

| Файл                      |     Refs | Рекомендация                               |
| ------------------------- | -------: | ------------------------------------------ |
| `RivalsHub/RivalsHub.tsx` | (orphan) | 🟡 investigate — может быть separate route |

### 5.6. Orphan summary

**~15 confirmed orphan components**, ~3 000 LOC. Большинство — sub-components больших панелей (DebatePanel wizard steps, DashboardPanel sections). **Не удалять** — сначала ревью, являются ли они:

- Part of larger component (используется через props, не import)
- Half-implemented features (см. DebateMemoryPanel)
- Genuinely abandoned

---

## 6. 🔴 `rivals/` subdirs — 19 parallel research implementations

(Подробно в Duplication Map §4)

**19 каталогов** `rivals/`, `rivals2/` … `rivals20/` — ~175 файлов, ~17 500 LOC.

**Назначение:** research/experimental parallel implementations of similar concepts (cache-service, project-service, policy-service, etc.).

**Доказательство:** 7 пар duplicate files (cache-service×3, project-service×2, policy-service×2, persona-service×2, n8n-service×2, blackboard-service×2, assistant-service×2).

**Зависимости:** нужно ревью — какие rivals/ файлы реально registered в service-registration, какие abandoned.

**Рекомендация:** 🟡 **MOVE в `src/experimental/rivals/`** или удалить неиспользуемые. Не удалять автоматически — сначала audit imports.

---

## 7. 🟡 Experimental panels без UI badge

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
- Visible в sidebar БЕЗ явного «experimental» badge

**Рекомендация:** 🟡 **ADD badge** — в sidebar показать «Experimental» тег. Не удалять — decorative, но functional.

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

**Рекомендация:** 🟡 **ADD badge** + hide за featureFlag по умолчанию.

---

## 8. 🟡 Пустые dev-status-*.md — 5 заглушек

(Подробно в Tech Health Map §4.3)

**5 файлов** в `docs/wiki/`:

- `dev-status-done.md` — «текст в разработке»
- `dev-status-active.md` — «текст в разработке»
- `dev-status-critical.md` — «текст в разработке»
- `dev-status-debt.md` — «текст в разработке»
- `dev-status-bugs.md` — «текст в разработке»
- `dev-status-blocked.md` — «текст в разработке»

**Назначение:** должно быть formal issue tracking — сейчас placeholders.

**Зависимости:** referenced в wiki navigation, но content пустой.

**Рекомендация:** 🟡 **FILL или REMOVE** из wiki-меню. Сейчас создают impression of unfinished documentation.

---

## 9. 🟡 Disconnected functions — services exist, no UI

(Подробно в Integration Map и Capability Gap Map)

| Сервис                            | Exists in code                                       | UI exposure                                         |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `crystalVault`                    | ✅ kernel/services/crystal-vault/                    | ✅ CrystalVaultPanel                                |
| `synthesisEngine`                 | ✅ kernel/services/synthesis/                        | ✅ SynthesisPanel                                   |
| `lensEngine`                      | ✅ kernel/services/lens-engine/                      | ✅ LensesPanel                                      |
| `timeMachineService`              | ✅ kernel/services/time-machine/                     | ✅ TimeMachinePanel                                 |
| `forumService`                    | ✅ kernel/services/forum/                            | ✅ ForumPanel                                       |
| `directorService`                 | ✅ kernel/services/director/                         | ✅ DirectorPanel                                    |
| `memoryOrchestrator`              | ✅ kernel/services/memory-orchestrator.ts            | ✅ через MemoryPanel                                |
| `wikiBrain` (23 files)            | ✅ kernel/services/wiki-brain/                       | 🟡 WikiBrainPanel separate, WikiPanel не использует |
| `wikiIngestService`               | ✅ kernel/services/wiki-brain/wiki-ingest.service.ts | 🔴 **NO UI** (Journey 1 тупик)                      |
| `wikiGraphService`                | ✅ kernel/services/wiki-brain/wiki-graph.service.ts  | 🟡 WikiBrainPanel only                              |
| `agentMemory` table               | ✅ Dexie schema                                      | 🔴 **NO UI** (Capability Gap §5.1)                  |
| `eventBus.getSubscriptionStats()` | ✅ event-bus.ts method                               | 🔴 **NO UI** (см. Lifecycle Map)                    |
| `MemoryWatchdog`                  | ✅ kernel/utils/memory-watchdog.ts                   | 🔴 **только в логах**                               |

**4 ключевых services без UI exposure:**

1. `wikiIngestService` — WikiPanel read-only, нет create article UI
2. `agentMemory` table — schema есть, UI нет
3. `eventBus.getSubscriptionStats()` — метод есть, не используется в UI
4. `MemoryWatchdog` — heap data в логах, не в UI

**Рекомендация:** 🟡 **WIRE to UI** (см. Capability Gap Map §11, Opportunity Map 3.4, 3.22)

---

## 10. 🟢 TODOs — только 2 (минимум)

(Из Tech Health Map §3.3)

**2 TODOs во всём src/:**

1. `src/components/AppLayout.tsx:4`:

   ```typescript
   // TODO: CommandPalette and OnboardingWizard still synchronously import framer-motion (via their own imports).
   // To fully remove framer-motion from the critical path, split useCommandPalette into a separate file,
   // then wrap CommandPalette and OnboardingWizard with React.lazy + Suspense.
   ```

2. `src/kernel/services/config-registry.ts:145`:
   ```typescript
   // TODO: Per-model limits — FreeTierLimit type needs refactoring
   ```

**Назначение:** Unfinished refactoring work.

**Зависимости:**

- TODO #1: CommandPalette, OnboardingWizard, framer-motion cleanup
- TODO #2: FreeTierLimit type

**Рекомендация:** 🟢 **DOCUMENT + schedule** — оба manageable, не critical.

---

## 11. 🟡 Commented-out code — autodiscovery off

(Из Zone-1 audit)

В Zone 1 audit упомянуто: «Автодискавери моделей выключено комментарием».

**Назначение:** Feature существовала, была отключена.

**Рекомендация:** 🟡 **INVESTIGATE** — почему выключено? Bug или intentional?

---

## 12. Сводная матрица мёртвого кода

| #         | Категория                  |          Кол-во |     LOC | Severity | Действие            |
| --------- | -------------------------- | --------------: | ------: | -------- | ------------------- |
| 1         | `@deprecated MOCK` сервисы |               5 |  ~2 000 | 🔴 HIGH  | HIDE/REMOVE/REPLACE |
| 2         | DemoGated панели           |               3 |   1 739 | 🟡 MED   | HIDE за featureFlag |
| 3         | Orphan компоненты          |             ~15 |  ~3 000 | 🟡 MED   | INVESTIGATE         |
| 4         | `rivals/` subdirs          |         19 dirs | ~17 500 | 🟡 MED   | MOVE в experimental |
| 5         | Пустые dev-status-*.md     |               5 |     ~50 | 🟡 MED   | FILL или REMOVE     |
| 6         | Experimental без badge     |               2 |  ~1 500 | 🟡 LOW   | ADD badge           |
| 7         | Disconnected services      |               4 |       — | 🟡 MED   | WIRE to UI          |
| 8         | TODOs                      |               2 |       — | 🟢 LOW   | SCHEDULE            |
| 9         | Commented-out code         |        (Zone 1) |       — | 🟡 LOW   | INVESTIGATE         |
| **Total** | **~210+ файлов**           | **~25 000 LOC** |       — | —        |

**5% от 509K LOC — в пределах нормы для зрелого проекта, но требует cleanup.**

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

| #   | Что                                              | Почему investigate first                                         |
| --- | ------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | `DebatePanel/DebateMemoryPanel.tsx`              | Может быть half-implemented debate↔memory (Integration Map §3.8) |
| 2   | `DeployPanel` (782 строки, MOCK)                 | Largest mock panel, visible в nav                                |
| 3   | `rivals/` 19 subdirs                             | ~17 500 LOC, нужно audit imports                                 |
| 4   | `HealthSlaPanel` (441, MOCK)                     | Mock + overlap с HealthPanel                                     |
| 5   | `DistillationPanel` (516, MOCK)                  | Mock, но может быть future feature                               |
| 6   | `agentMemory` Dexie table                        | Schema есть, 0 UI — unfinished                                   |
| 7   | `wikiIngestService` без UI                       | Service есть, WikiPanel read-only                                |
| 8   | `obs-gaps-service` STATIC                        | Static snapshot, может быть устаревшим                           |
| 9   | 5 пустых `dev-status-*.md`                       | Impression of unfinished docs                                    |
| 10  | `WizardStepIndicator`, `WizardNav`, wizard steps | DebatePanel wizard orphans                                       |

---

## 15. Рекомендации — без auto-delete

### 🔴 P0 — investigate + decide (high priority)

1. **Audit `rivals/` 19 subdirs** — для каждого файла определить: registered в service-registration? Импортируется canonical кодом? Если нет — move в `src/experimental/rivals/` или delete.

2. **Investigate `DebatePanel/DebateMemoryPanel.tsx`** — может быть half-implemented debate↔memory integration. Если да — либо завершить, либо удалить + документировать как cancelled feature.

3. **Hide 3 DemoGated panels** за `featureFlags.mockServices.enabled = false` по умолчанию. DeployPanel, HealthSlaPanel, DistillationPanel — visible в nav, но mock.

4. **Remove `HealthSlaPanel`** (441 строка MOCK) — либо merge в HealthPanel с табом, либо удалить. Реальной SLA нет.

### 🟡 P1 — wire disconnected services

5. **Wire `wikiIngestService` to WikiPanel UI** — добавить «Create article» button (см. Opportunity Map 3.4).

6. **Wire `agentMemory` table to UI** — таб в AgentsPanel «Memory written by this agent» (см. Opportunity Map 3.22).

7. **Wire `eventBus.getSubscriptionStats()` to UI** — показать в HealthPanel или новой BackgroundServicesPanel.

8. **Wire `MemoryWatchdog` to UI** — вывести heap data в HealthPanel, не только в логах.

### 🟡 P1 — orphan components audit

9. **Audit 15 orphan components** — для каждого: используется через props? Half-implemented? Genuinely abandoned? Решение per-file.

10. **Audit DashboardPanel sections** (InferenceMesh, LiveTerminal, ProviderPressureMap, RoutingActivity) — part of Desktop.tsx? Если нет — investigate.

11. **Audit DebatePanel wizard steps** (AgentsStep, TopicStep, AutoDebateSection, WizardStepIndicator, WizardNav) — используется DebateSetupWizard? Если нет — investigate.

### 🟢 P2 — documentation + badges

12. **Add experimental badges** в UI для Aquarium, FederatedMemory.

13. **Fill 5 пустых `dev-status-*.md`** или удалить из wiki-меню.

14. **Document `@deprecated MOCK` services** в wiki — что mock, что real.

15. **Schedule 2 TODOs** — framer-motion cleanup (AppLayout) и FreeTierLimit refactor (config-registry).

---

## 16. Итоговый вердикт по мёртвому коду

| Метрика                     |   Оценка   | Комментарий                              |
| --------------------------- | :--------: | ---------------------------------------- |
| `@deprecated MOCK` services |  🔴 3/10   | 5 explicit mock backends, 3 visible в UI |
| DemoGated panels            |  🟡 5/10   | 3 panels, 1 739 строк, visible           |
| Orphan components           |  🟡 6/10   | ~15 orphans, ~3 000 LOC                  |
| `rivals/` subdirs           |  🟡 5/10   | 19 dirs, ~17 500 LOC research parallel   |
| Пустые dev-status docs      |  🟡 5/10   | 5 заглушек                               |
| Experimental без badge      |  🟡 6/10   | 2 panels, помечены в коде                |
| Disconnected services       |  🟡 5/10   | 4 key services без UI                    |
| TODOs                       |  🟢 9/10   | 2 TODOs на 509K LOC — отлично            |
| Commented-out code          |  🟡 6/10   | autodiscovery off (Zone 1)               |
| **Overall Dead Code Score** | **5.5/10** | ~25K LOC из 509K = 5%, требует cleanup   |

**Сильные стороны:**

- **Только 2 TODOs** на 509K LOC — exceptionally чисто
- **0 circular deps** (см. Dependencies Map)
- **DemoGate/DemoBadge infrastructure** — mock panels явно помечены в коде
- **Feature flags** для experimental (`ui.experimentalVisuals`, `mockServices.enabled`)
- **`@deprecated MOCK` markers** — explicit, не скрытые
- **Wiki документирует** HealthSlaService как MOCK

**Слабые стороны:**

- **3 DemoGated panels visible в nav** — пользователь видит mock без предупреждения в sidebar
- **5 `@deprecated MOCK` services** — 2 000 LOC mock code в production codebase
- **~15 orphan components** — написаны, не wired
- **19 `rivals/` subdirs** — ~17 500 LOC research parallel, не canonical
- **5 пустых dev-status-\*.md** — impression of unfinished docs
- **4 disconnected services** — exist в коде, не wired to UI
- **2 experimental panels без UI badge**

**Главный вывод:** проект накопил **~25K LOC мёртвого/заброшенного кода** (5% от 509K) — в пределах нормы для зрелого проекта, но требует systematic cleanup. **Главное правило (из задания): не удалять автоматически** — каждый пункт требует investigation: назначение, зависимости, тесты, wiki, recent activity.

**Dead Code Score: 5.5/10** — умеренно. После cleanup (opportunities из Opportunity Map 3.7, 3.12, 3.15, 3.17) — поднимется до ~7.5/10.

**Стратегическое направление:**

1. **Investigate first** — для каждого пункта выяснить назначение и зависимости
2. **Hide mock panels** за featureFlag
3. **Move rivals/ в experimental**
4. **Wire disconnected services** to UI
5. **Document or remove** пустые docs и orphans

---

## Приложение A. Все метрики мёртвого кода в цифрах

| Метрика                          |                            Значение | Источник                                                      |
| -------------------------------- | ----------------------------------: | ------------------------------------------------------------- |
| `@deprecated MOCK` services      |                                   5 | `grep -rE "@deprecated MOCK"`                                 |
| `@deprecated STATIC` services    |                        1 (obs-gaps) | grep                                                          |
| `@deprecated` (other)            | 2 (key-fingerprints method, styles) | grep                                                          |
| DemoGated panels                 |                                   3 | `grep -rlE "DemoGate\|DemoBadge"`                             |
| DemoGated panels LOC             |                               1 739 | DeployPanel 782 + HealthSlaPanel 441 + DistillationPanel 516  |
| Orphan components (confirmed)    |                                 ~15 | grep per file                                                 |
| Orphan components LOC            |                              ~3 000 | estimate                                                      |
| `rivals/` subdirs                |                                  19 | `ls src/kernel/services/ \| grep rivals`                      |
| `rivals/` files                  |                                ~175 | find per subdir                                               |
| `rivals/` LOC                    |                             ~17 500 | estimate (175 × ~100)                                         |
| Пустые dev-status-*.md           |                                   5 | WebFetch                                                      |
| Experimental panels без UI badge |                                   2 | Aquarium, FederatedMemory                                     |
| Disconnected services без UI     |                                   4 | wikiIngest, agentMemory, getSubscriptionStats, MemoryWatchdog |
| TODOs                            |                                   2 | grep (см. Tech Health Map)                                    |
| Commented-out features           |                  1+ (autodiscovery) | Zone-1 audit                                                  |
| **Total dead/abandoned files**   |                           **~210+** | sum                                                           |
| **Total dead/abandoned LOC**     |                         **~25 000** | sum                                                           |
| % от total LOC                   |                             **~5%** | 25K / 509K                                                    |

---

## Приложение B. Источники и метод

| Что                             | Где                                                  | Как проверено                              |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `@deprecated MOCK`              | `src/kernel/services/*.ts`                           | `grep -rE "@deprecated MOCK"`              |
| DemoGated panels                | `src/components/**/*.tsx`                            | `grep -rlE "DemoGate\|DemoBadge"`          |
| Orphan components               | `src/components/**/*.tsx`                            | `grep -rE "import.*BaseName"` per file     |
| `rivals/` subdirs               | `src/kernel/services/`                               | `ls \| grep rivals`                        |
| Пустые dev-status               | `docs/wiki/dev-status-*.md`                          | WebFetch (5 файлов — «текст в разработке») |
| Experimental panels             | `src/components/{Aquarium,FederatedMemory}*/`        | чтение head comments                       |
| Disconnected services           | cross-reference Integration Map + Capability Gap Map | synthesis                                  |
| TODOs                           | `src/**`                                             | `grep -rE "TODO"` (см. Tech Health Map)    |
| Commented-out                   | Zone-1 audit                                         | чтение zone-1.md                           |
| `agentMemory` table             | `src/kernel/services/dexie-schema.ts`                | grep                                       |
| `eventBus.getSubscriptionStats` | `src/kernel/events/event-bus.ts`                     | grep (1 ref в коде)                        |
| `MemoryWatchdog`                | `src/kernel/utils/memory-watchdog.ts`                | полное чтение                              |

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

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e_. Анализ статический; **ничего не удалено** — только investigation framework. Парные отчёты: 12 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle, доступность, пробелы, интеграция, user journeys, потенциал).*
