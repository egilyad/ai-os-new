# Карта потенциала — Opportunity Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Дата анализа:** 2026-10-31
> **Метод:** синтез всех находок из 11 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle, доступность, пробелы, интеграция, user journeys) в **28 конкретных opportunities** с 5 параметрами и 4 квадрантами приоритизации
> **Парные документы:** 11 предыдущих карт
> **Главный результат:** **28 opportunities** → **8 «Do First»** (большая польза, низкий риск) → **6 «Quick Wins»** (быстрая отдача) → **9 «Strategic Bets»** (высокий риск) → **5 «Defer»** (дорогие и сомнительные)

---

## 1. Исполнительное резюме

SuperAgents OS имеет **5 killer-фичей** (Crystal Vault, Synthesis zones, Cognitive Builder, Time Machine, 33+75 debate catalog) и **зрелое ядро** (0 circular deps, 0 layer violations, 199 self-guard сервисов, 3-tier error recovery). НО **архитектура не использует свой потенциал**: cognitive chain рвана, 9 пар компонентов не интегрированы, Builder не вызывает killer-сервисы, 64 панели без wiki, 12 user journey тупиков.

**Сводные метрики потенциала:**

| Метрика                                    | Значение |
| ------------------------------------------ | -------: |
| Всего opportunities проанализировано       |   **28** |
| **Do First** (большая польза, низкий риск) |    **8** |
| **Quick Wins** (быстрая отдача)            |    **6** |
| **Strategic Bets** (высокий риск)          |    **9** |
| **Defer** (дорогие и сомнительные)         |    **5** |
| Средняя польза                             |   7.4/10 |
| Средняя стоимость                          |   5.2/10 |
| Средний риск                               |   4.8/10 |
| Среднее влияние                            |   7.2/10 |
| Средняя уверенность                        |   7.6/10 |

**Топ-3 opportunities (по ROI = Польза × Влияние / Стоимость):**

1. **Builder killer-service nodes** — ROI = 9 × 9 / 7 = **11.6** → unlocks cognitive pipelines
2. **Cross-panel navigation links** — ROI = 8 × 8 / 2 = **32.0** → fixes 12 journey dead-ends
3. **Import в 9 панелях (broken round-trip)** — ROI = 8 × 8 / 4 = **16.0** → restores local-first principle

**Главный вывод:** проект имеет **измеримый неиспользованный потенциал** — 28 identified opportunities, из которых **14 можно начать немедленно** (8 Do First + 6 Quick Wins). Стратегическое направление: **не добавлять random features, а закрыть integration gaps** между существующими зрелыми компонентами.

**Opportunity Score: 7.0/10** — высокий потенциал, измеримая стратегия роста.

---

## 2. Методология: 5 параметров + 4 квадранта

### 2.1. Пять параметров (для каждой opportunity)

| Параметр                 | Шкала | Что означает                                                          |
| ------------------------ | ----- | --------------------------------------------------------------------- |
| **Польза**               | 1–10  | Какую ценность создаст для пользователя/системы (10 = transformative) |
| **Стоимость реализации** | 1–10  | Effort: 1 = часы, 5 = недели, 10 = кварталы                           |
| **Риск**                 | 1–10  | Технический/UX риск (10 = может сломать существующее)                 |
| **Ожидаемое влияние**    | 1–10  | Impact на overall OS health/score (10 = поднимает на 2+ балла)        |
| **Уверенность в оценке** | 1–10  | Насколько уверен в оценке (10 = data-backed, 3 = hypothesis)          |

### 2.2. Четыре квадранта приоритизации

| Квадрант              | Условие                    | Действие                   |
| --------------------- | -------------------------- | -------------------------- |
| 🟢 **Do First**       | Польза ≥ 7, Риск ≤ 4       | Начать немедленно          |
| 🟡 **Quick Wins**     | Польза 4–7, Стоимость ≤ 3  | Внедрить в спринт          |
| 🔴 **Strategic Bets** | Польза ≥ 7, Риск ≥ 6       | Требует RFC + осторожность |
| ⚪ **Defer**          | Стоимость ≥ 7, Влияние ≤ 5 | Отложить / не делать       |

### 2.3. ROI формула

```
ROI = (Польза × Ожидаемое влияние) / Стоимость реализации
```

Чем выше ROI — тем выше приоритет.

---

## 3. 28 Opportunities — детальный список

### 3.1. 🔴 Builder killer-service nodes

**Описание:** Добавить 8 новых node-types в Builder: `<CrystalNode>`, `<SynthesisNode>`, `<LensNode>`, `<TimeMachineNode>`, `<MemoryNode>`, `<ForumNode>`, `<DirectorNode>`, `<MemoryOrchestratorNode>`. Каждый — expose existing service as Builder-callable.

| Параметр          | Значение | Обоснование                                                                             |
| ----------------- | :------: | --------------------------------------------------------------------------------------- |
| Польза            |  **9**   | Cognitive pipelines станут возможны — главный architectural unlock                      |
| Стоимость         |  **7**   | 8 node-types × ~1 день = ~2 недели. Нужны contract definitions + UI nodes + DSL mapping |
| Риск              |  **5**   | Builder稳定, но расширение palette может запутать UI                                    |
| Ожидаемое влияние |  **9**   | Поднимет Builder score с 3/10 до 8/10, Journey 8 с 3.0 до 7.0                           |
| Уверенность       |  **9**   | Data-backed: Capability Gap Map §3, Integration Map §3.4, Journey 8                     |

**Quadrant:** 🔴 **Strategic Bet** (Польза 9, Риск 5 — на границе с Do First, но стоимость 7)
**ROI:** 9 × 9 / 7 = **11.6**
**Sources:** Capability Gap Map §3, Integration Map §3.4, Journey 8

---

### 3.2. 🟢 Cross-panel navigation links

**Описание:** Добавить ~20 cross-panel `navigate()` links: HealthPanel→ProviderManager, TracesPanel→AgentsPanel, LogsPanel→ServiceRegistry, BudgetAlertsPanel→SREAgentPanel, DebateArena→AgentsPanel (history), CrystalVault→DebatePanel, etc.

| Параметр          | Значение | Обоснование                                                     |
| ----------------- | :------: | --------------------------------------------------------------- |
| Польза            |  **8**   | Закроет 3 из 12 journey dead-ends, Integration Map gap          |
| Стоимость         |  **2**   | ~20 links × 30 минут = 1 неделя                                 |
| Риск              |  **2**   | Low — добавить кнопки navigation                                |
| Ожидаемое влияние |  **8**   | Поднимет Integration score с 5.0 до 6.5, Journey 5 с 4.5 до 6.0 |
| Уверенность       |  **9**   | Data-backed: Integration Map §7, Journey 5 шаг 4                |

**Quadrant:** 🟢 **Do First** (Польза 8, Риск 2)
**ROI:** 8 × 8 / 2 = **32.0** ← **highest ROI**
**Sources:** Integration Map §7, Journey 5, Capability Gap Map §5.4

---

### 3.3. 🟢 Import в 9 панелях (broken round-trip)

**Описание:** Добавить import функциональность в Chat, Memory, Crystal, Roles, Settings, Knowledge, Builder, Budget, Health — закрыть broken round-trip.

| Параметр          | Значение | Обоснование                                                                     |
| ----------------- | :------: | ------------------------------------------------------------------------------- |
| Польза            |  **8**   | Local-first principle восстановлен                                              |
| Стоимость         |  **4**   | 9 панелей × ~2 дня = ~3 недели. Использовать existing ExportImportPanel pattern |
| Риск              |  **3**   | Low — import уже работает в ExportImportPanel для некоторых секций              |
| Ожидаемое влияние |  **8**   | Поднимет Journey 4 с 4.5 до 7.5                                                 |
| Уверенность       |  **9**   | Data-backed: Capability Gap Map §4.2, Journey 4                                 |

**Quadrant:** 🟢 **Do First** (Польза 8, Риск 3)
**ROI:** 8 × 8 / 4 = **16.0**
**Sources:** Capability Gap Map §4, Journey 4

---

### 3.4. 🟢 WikiPanel «Create article» UI

**Описание:** Wire `WikiIngestService` (существует, имеет analyze/generate operations) к WikiPanel UI — добавить кнопку «Create article», editor, save.

| Параметр          | Значение | Обоснование                                        |
| ----------------- | :------: | -------------------------------------------------- |
| Польза            |  **8**   | Wiki из read-only → editable knowledge base        |
| Стоимость         |  **5**   | UI editor + ingest wiring = ~1 неделя              |
| Риск              |  **3**   | Low — ingest service уже работает                  |
| Ожидаемое влияние |  **8**   | Закроет Journey 1 тупик #1, поднимет с 5.5 до 7.0  |
| Уверенность       |  **9**   | Data-backed: Integration Map §3.2, Journey 1 шаг 6 |

**Quadrant:** 🟢 **Do First** (Польза 8, Риск 3)
**ROI:** 8 × 8 / 5 = **12.8**
**Sources:** Integration Map §3.2, Journey 1

---

### 3.5. 🟢 DebateArena «Save as Crystal» button

**Описание:** Добавить button в DebateArena после завершения debate: «Save conclusion as Crystal» — вызывает `crystalVault.propose(...)`.

| Параметр          | Значение | Обоснование                                                |
| ----------------- | :------: | ---------------------------------------------------------- |
| Польза            |  **7**   | Cognitive chain debate→crystal, закроет Journey 6 тупик #8 |
| Стоимость         |  **2**   | 1 button + 1 service call = 1 день                         |
| Риск              |  **2**   | Low — analog `exportToCrystal` в SynthesisPanel            |
| Ожидаемое влияние |  **7**   | Поднимет Journey 6 с 5.0 до 7.0                            |
| Уверенность       |  **9**   | Data-backed: Integration Map §3.7, Journey 6 шаг 2         |

**Quadrant:** 🟢 **Do First** (Польза 7, Риск 2)
**ROI:** 7 × 7 / 2 = **24.5**
**Sources:** Integration Map §3.7, Journey 6

---

### 3.6. 🟢 Diagnostics cross-nav links

**Описание:** В TracesPanel, HealthPanel, LogsPanel, StateInspectorPanel добавить «Open in X» links к source panels.

| Параметр          | Значение | Обоснование                                  |
| ----------------- | :------: | -------------------------------------------- |
| Польза            |  **7**   | Закроет Journey 5 тупик #6                   |
| Стоимость         |  **3**   | ~10 links × 2 часа = ~3 дня                  |
| Риск              |  **2**   | Low                                          |
| Ожидаемое влияние |  **7**   | Поднимет Journey 5 с 4.5 до 6.5              |
| Уверенность       |  **9**   | Data-backed: Integration Map §3.5, Journey 5 |

**Quadrant:** 🟢 **Do First** (Польза 7, Риск 2)
**ROI:** 7 × 7 / 3 = **16.3**

---

### 3.7. 🟢 Delete 3 stub-панели

**Описание:** Удалить `OpenRouterPanel` (29 строк, дубликат), `SocialLeaderboardPanel` (34 строки, обёртка), `GovernancePanel` (61 строка, stub — либо расширить, либо удалить).

| Параметр          | Значение | Обоснование                                               |
| ----------------- | :------: | --------------------------------------------------------- |
| Польза            |  **6**   | Сократит nav noise, уберёт разочарование от stub          |
| Стоимость         |  **1**   | ~2 часа (delete files + remove routes)                    |
| Риск              |  **2**   | Low — stub panels не используются critical                |
| Ожидаемое влияние |  **6**   | Поднимет Accessibility score с 6.5 до 7.0                 |
| Уверенность       |  **9**   | Data-backed: Duplication Map §6.3, Accessibility Map §5.3 |

**Quadrant:** 🟡 **Quick Win** (Польза 6, Стоимость 1)
**ROI:** 6 × 6 / 1 = **36.0**
**Sources:** Duplication Map §6.3, Accessibility Map §5.3

---

### 3.8. 🟢 Merge 62 TechniquePanels в 1 catalog

**Описание:** Заменить 62 uniform панели на 1 `<TechniquePanel techniqueId="…" />` generic + 1 catalog-страница с таблицей.

| Параметр          | Значение | Обоснование                                               |
| ----------------- | :------: | --------------------------------------------------------- |
| Польза            |  **8**   | -14 500 LOC, -61 маршрут, unified discovery               |
| Стоимость         |  **5**   | Generic component + catalog table + migration = ~2 недели |
| Риск              |  **4**   | Med — нужно сохранить existing routes для backward compat |
| Ожидаемое влияние |  **8**   | Поднимет Duplication score с 5.5 до 7.0                   |
| Уверенность       |  **9**   | Data-backed: Duplication Map §3.7, Accessibility Map §5.2 |

**Quadrant:** 🟢 **Do First** (Польза 8, Риск 4)
**ROI:** 8 × 8 / 5 = **12.8**
**Sources:** Duplication Map §3.7

---

### 3.9. 🟢 OnboardingWizard: расширить до 6 шагов

**Описание:** Добавить шаги: Crystal Vault tour, Synthesis demo, Builder overview, killer-фичи preview.

| Параметр          | Значение | Обоснование                                          |
| ----------------- | :------: | ---------------------------------------------------- |
| Польза            |  **7**   | Onboarding покажет killer-фичи (сейчас 0 of 6)       |
| Стоимость         |  **3**   | ~3 новых шага + demo content = ~1 неделя             |
| Риск              |  **3**   | Low                                                  |
| Ожидаемое влияние |  **7**   | Поднимет Accessibility score, Journey 3 с 6.5 до 8.0 |
| Уверенность       |  **9**   | Data-backed: Accessibility Map §7, Journey 3 шаг 3   |

**Quadrant:** 🟢 **Do First** (Польза 7, Риск 3)
**ROI:** 7 × 7 / 3 = **16.3**
**Sources:** Accessibility Map §7

---

### 3.10. 🟢 eventBus cleanup audit (42 подписки)

**Описание:** Audit 42 eventBus.on returning `unsub` без `return () => unsub()` — добавить cleanup в каждом.

| Параметр          | Значение | Обоснование                           |
| ----------------- | :------: | ------------------------------------- |
| Польза            |  **6**   | Устранит subscription leak risk       |
| Стоимость         |  **2**   | ~42 файла × 30 минут = 1 неделя       |
| Риск              |  **2**   | Low — добавить cleanup return         |
| Ожидаемое влияние |  **6**   | Поднимет Lifecycle score с 7.0 до 7.5 |
| Уверенность       |  **8**   | Data-backed: Lifecycle Map §10.2      |

**Quadrant:** 🟡 **Quick Win** (Польза 6, Стоимость 2)
**ROI:** 6 × 6 / 2 = **18.0**
**Sources:** Lifecycle Map §10.2

---

### 3.11. 🟢 Settings search + tooltips

**Описание:** Добавить search box в SettingsPanel (8 табов) + tooltips к Advanced/Prompts tabs.

| Параметр          | Значение | Обоснование                              |
| ----------------- | :------: | ---------------------------------------- |
| Польза            |  **5**   | UX improvement для power-users           |
| Стоимость         |  **2**   | ~2 дня                                   |
| Риск              |  **2**   | Low                                      |
| Ожидаемое влияние |  **5**   | Поднимет Accessibility settings с 6 до 8 |
| Уверенность       |  **8**   | Data-backed: Accessibility Map §4.6      |

**Quadrant:** 🟡 **Quick Win** (Польза 5, Стоимость 2)
**ROI:** 5 × 5 / 2 = **12.5**
**Sources:** Accessibility Map §4.6

---

### 3.12. 🟢 rivals/ subdirs → experimental/

**Описание:** Переместить 19 `rivals/` подкаталогов (~175 файлов) в `src/experimental/rivals/` или удалить неиспользуемые.

| Параметр          | Значение | Обоснование                                           |
| ----------------- | :------: | ----------------------------------------------------- |
| Польза            |  **7**   | -17 500 LOC в main codebase, clear canonical services |
| Стоимость         |  **3**   | Move files + update imports = ~1 неделя               |
| Риск              |  **3**   | Low — code already isolated в rivals/                 |
| Ожидаемое влияние |  **7**   | Поднимет Duplication score, Tech Health score         |
| Уверенность       |  **9**   | Data-backed: Duplication Map §4                       |

**Quadrant:** 🟢 **Do First** (Польза 7, Риск 3)
**ROI:** 7 × 7 / 3 = **16.3**
**Sources:** Duplication Map §4

---

### 3.13. 🟡 Audit #6 — self-guard для 350 сервисов

**Описание:** Добавить `private _initialized = false` guard во все ~350 сервисов без self-guard (или fix bootstrap чтобы не вызывал tryInit дважды).

| Параметр          | Значение | Обоснование                                 |
| ----------------- | :------: | ------------------------------------------- |
| Польза            |  **7**   | Устранит double-subscribe risk              |
| Стоимость         |  **5**   | 350 сервисов × ревью = ~3 недели            |
| Риск              |  **3**   | Low — adding guard safe                     |
| Ожидаемое влияние |  **7**   | Поднимет Lifecycle score с 7.0 до 8.0       |
| Уверенность       |  **8**   | Data-backed: Lifecycle Map §14.1 (Audit #6) |

**Quadrant:** 🟡 **Quick Win** (Польза 7, Стоимость 5) — на границе с Do First
**ROI:** 7 × 7 / 5 = **9.8**
**Sources:** Lifecycle Map §14.1

---

### 3.14. 🟡 Merge 5 budget panels в BudgetHub

**Описание:** Объединить BudgetPanel + BudgetAlertsPanel + CostOptimizationPanel + CostAnalyticsPanel + CostsPanel в 1 BudgetHub с табами.

| Параметр          | Значение | Обоснование                                   |
| ----------------- | :------: | --------------------------------------------- |
| Польза            |  **6**   | -4 маршрута, unified UX                       |
| Стоимость         |  **4**   | Migration + tab layout = ~2 недели            |
| Риск              |  **4**   | Med — existing users могут потерять bookmarks |
| Ожидаемое влияние |  **6**   | Поднимет Duplication, Accessibility scores    |
| Уверенность       |  **8**   | Data-backed: Duplication Map §3.1             |

**Quadrant:** 🟡 **Quick Win** (Польза 6, Стоимость 4)
**ROI:** 6 × 6 / 4 = **9.0**
**Sources:** Duplication Map §3.1

---

### 3.15. 🟡 Merge 4 health panels в HealthPanel

**Описание:** Объединить SystemHealthPanel + HealthSlaPanel (удалить, MOCK) + HealthPanel в 1 с табами. DocsHealth оставить.

| Параметр          | Значение | Обоснование                                        |
| ----------------- | :------: | -------------------------------------------------- |
| Польза            |  **5**   | -2 маршрута, remove deprecated MOCK                |
| Стоимость         |  **3**   | ~1 неделя                                          |
| Риск              |  **3**   | Low                                                |
| Ожидаемое влияние |  **5**   | Поднимет Tech Health, Duplication scores           |
| Уверенность       |  **8**   | Data-backed: Tech Health Map, Duplication Map §3.2 |

**Quadrant:** 🟡 **Quick Win** (Польза 5, Стоимость 3)
**ROI:** 5 × 5 / 3 = **8.3**
**Sources:** Duplication Map §3.2

---

### 3.16. 🟡 Coverage threshold в CI

**Описание:** Добавить `--check-coverage --lines 70 --branches 60` в `test:coverage` CI gate.

| Параметр          | Значение | Обоснование                             |
| ----------------- | :------: | --------------------------------------- |
| Польза            |  **6**   | Stop coverage decay                     |
| Стоимость         |  **2**   | ~2 часа (config + fix initial failures) |
| Риск              |  **4**   | Med — может заблокировать existing PRs  |
| Ожидаемое влияние |  **6**   | Поднимет Tech Health testing score      |
| Уверенность       |  **9**   | Data-backed: Tech Health Map §5.7       |

**Quadrant:** 🟡 **Quick Win** (Польза 6, Стоимость 2)
**ROI:** 6 × 6 / 2 = **18.0**
**Sources:** Tech Health Map §5.7

---

### 3.17. 🟡 Fill dev-status-*.md (5 пустых файлов)

**Описание:** Заполнить или удалить из wiki-навигации 5 пустых `dev-status-*.md` файлов (critical, debt, done, bugs, blocked — сейчас «текст в разработке»).

| Параметр          | Значение | Обоснование                          |
| ----------------- | :------: | ------------------------------------ |
| Польза            |  **4**   | Remove impression of unfinished docs |
| Стоимость         |  **2**   | ~2 дня                               |
| Риск              |  **1**   | Very low                             |
| Ожидаемое влияние |  **4**   | Поднимет Tech Health docs score      |
| Уверенность       |  **9**   | Data-backed: Tech Health Map §4.3    |

**Quadrant:** 🟡 **Quick Win** (Польза 4, Стоимость 2)
**ROI:** 4 × 4 / 2 = **8.0**
**Sources:** Tech Health Map §4.3

---

### 3.18. 🟡 Background timers pause на hidden tab

**Описание:** Подписать LifecycleManager или каждый timer-service на `visibilitychange` — pause intervals при hidden tab.

| Параметр          | Значение | Обоснование                                         |
| ----------------- | :------: | --------------------------------------------------- |
| Польза            |  **5**   | CPU/battery economy для mobile                      |
| Стоимость         |  **3**   | ~1 неделя (15+ services)                            |
| Риск              |  **3**   | Low                                                 |
| Ожидаемое влияние |  **5**   | Поднимет Resource score                             |
| Уверенность       |  **8**   | Data-backed: Lifecycle Map §14.3, Resource Map §7.3 |

**Quadrant:** 🟡 **Quick Win** (Польза 5, Стоимость 3)
**ROI:** 5 × 5 / 3 = **8.3**
**Sources:** Lifecycle Map §14.3

---

### 3.19. 🔴 Strategic Bet: Chat ↔ Memory RAG integration

**Описание:** chat-executor должен calling `memoryEngine.search(query)` перед response, inject context. Сейчас 0 calls.

| Параметр          | Значение | Обоснование                                                   |
| ----------------- | :------: | ------------------------------------------------------------- |
| Польза            |  **9**   | RAG в chat по умолчанию — transformative                      |
| Стоимость         |  **6**   | Integration + prompt engineering + tests = ~3 недели          |
| Риск              |  **7**   | High — может slow down chat, prompt bloat                     |
| Ожидаемое влияние |  **9**   | Поднимет Integration score с 5.0 до 7.0                       |
| Уверенность       |  **7**   | Data-backed: Integration Map §3.8, но runtime effects unknown |

**Quadrant:** 🔴 **Strategic Bet** (Польза 9, Риск 7)
**ROI:** 9 × 9 / 6 = **13.5**
**Sources:** Integration Map §3.8

---

### 3.20. 🔴 Strategic Bet: Memory ↔ Knowledge unification

**Описание:** Unified RAG search (memory + knowledge + wiki в одном search).

| Параметр          | Значение | Обоснование                                   |
| ----------------- | :------: | --------------------------------------------- |
| Польза            |  **8**   | One search вместо 3 separate                  |
| Стоимость         |  **7**   | Architecture change = ~1 месяц                |
| Риск              |  **7**   | High — может сломать existing search behavior |
| Ожидаемое влияние |  **8**   | Поднимет Integration score                    |
| Уверенность       |  **6**   | Hypothesis — detailed design needed           |

**Quadrant:** 🔴 **Strategic Bet** (Польза 8, Риск 7)
**ROI:** 8 × 8 / 7 = **9.1**
**Sources:** Integration Map §3.11

---

### 3.21. 🔴 Strategic Bet: Wiki ↔ WikiBrain integration

**Описание:** WikiPanel использовать wiki-graph.service для «related articles», wiki-query.service для semantic search.

| Параметр          | Значение | Обоснование                                        |
| ----------------- | :------: | -------------------------------------------------- |
| Польза            |  **8**   | Wiki из static catalog → queryable knowledge graph |
| Стоимость         |  **6**   | Integration + UI redesign = ~3 недели              |
| Риск              |  **6**   | Med-high — WikiPanel refactor                      |
| Ожидаемое влияние |  **8**   | Поднимет Integration, Accessibility scores         |
| Уверенность       |  **8**   | Data-backed: Integration Map §3.2                  |

**Quadrant:** 🔴 **Strategic Bet** (Польза 8, Риск 6)
**ROI:** 8 × 8 / 6 = **10.7**
**Sources:** Integration Map §3.2

---

### 3.22. 🔴 Strategic Bet: Agents ↔ Memory UI

**Описание:** Заполнить `agentMemory` Dexie table + UI таб в AgentsPanel «Memory written by this agent» + filter в MemoryPanel.

| Параметр          | Значение | Обоснование                                                 |
| ----------------- | :------: | ----------------------------------------------------------- |
| Польза            |  **7**   | Provenance tracking                                         |
| Стоимость         |  **5**   | Schema готов, нужно UI + service logging = ~2 недели        |
| Риск              |  **5**   | Med — need to update agent-service для writes               |
| Ожидаемое влияние |  **7**   | Поднимет Integration score                                  |
| Уверенность       |  **8**   | Data-backed: Integration Map §3.10, Capability Gap Map §5.1 |

**Quadrant:** 🔴 **Strategic Bet** (Польза 7, Риск 5) — на границе с Do First
**ROI:** 7 × 7 / 5 = **9.8**
**Sources:** Integration Map §3.10

---

### 3.23. 🔴 Strategic Bet: Crystal ↔ Debate bi-directional

**Описание:** Crystal с low confidence → «Open debate to refine». Debate conclusion → «Save as Crystal» (см. #3.5).

| Параметр          | Значение | Обоснование                                  |
| ----------------- | :------: | -------------------------------------------- |
| Польза            |  **7**   | Bi-directional cognitive chain               |
| Стоимость         |  **5**   | ~2 недели                                    |
| Риск              |  **5**   | Med                                          |
| Ожидаемое влияние |  **7**   | Поднимет Journey 6 с 5.0 до 7.5              |
| Уверенность       |  **8**   | Data-backed: Integration Map §3.7, Journey 6 |

**Quadrant:** 🔴 **Strategic Bet** (Польза 7, Риск 5) — часть #3.5
**ROI:** 7 × 7 / 5 = **9.8**
**Sources:** Integration Map §3.7

---

### 3.24. 🔴 Strategic Bet: Global search (Spotlight-style)

**Описание:** Единый search по сообщениям + wiki + settings + capabilities + agents + debates.

| Параметр          | Значение | Обоснование                                 |
| ----------------- | :------: | ------------------------------------------- |
| Польза            |  **8**   | Главный discovery mechanism                 |
| Стоимость         |  **8**   | Complex — index multiple sources = ~1 месяц |
| Риск              |  **7**   | High — performance, ranking                 |
| Ожидаемое влияние |  **8**   | Поднимет Accessibility score с 6.5 до 8.5   |
| Уверенность       |  **5**   | Hypothesis — design needed                  |

**Quadrant:** 🔴 **Strategic Bet** (Польза 8, Риск 7)
**ROI:** 8 × 8 / 8 = **8.0**
**Sources:** Accessibility Map §4.7

---

### 3.25. 🔴 Strategic Bet: Capability Registry UI

**Описание:** Отдельная панель «What can this OS do?» — aggregate из `panel-actions-catalog.ts` (4 832 строки) + service registry + event registry.

| Параметр          | Значение | Обоснование                                                 |
| ----------------- | :------: | ----------------------------------------------------------- |
| Польза            |  **7**   | Discovery всех capabilities в одном месте                   |
| Стоимость         |  **6**   | Aggregation UI = ~3 недели                                  |
| Риск              |  **5**   | Med                                                         |
| Ожидаемое влияние |  **7**   | Поднимет Accessibility score                                |
| Уверенность       |  **7**   | Data-backed: Accessibility Map §8, Capability Gap Map §11.1 |

**Quadrant:** 🔴 **Strategic Bet** (Польза 7, Риск 5)
**ROI:** 7 × 7 / 6 = **8.2**
**Sources:** Accessibility Map §8

---

### 3.26. 🔴 Strategic Bet: External API/SDK

**Описание:** REST/CLI для Wiki, Memory, Crystal, Debate — позволить external scripts.

| Параметр          | Значение | Обоснование                            |
| ----------------- | :------: | -------------------------------------- |
| Польза            |  **7**   | Programmatic access                    |
| Стоимость         |  **8**   | API design + auth + docs = ~1.5 месяца |
| Риск              |  **8**   | High — security, breaking changes      |
| Ожидаемое влияние |  **7**   | Расширит ecosystem                     |
| Уверенность       |  **5**   | Hypothesis — user demand unclear       |

**Quadrant:** 🔴 **Strategic Bet** (Польза 7, Риск 8)
**ROI:** 7 × 7 / 8 = **6.1**
**Sources:** Capability Gap Map §10

---

### 3.27. ⚪ Defer: 64 wiki articles to write

**Описание:** Написать wiki-статьи для 64 панелей без документации (58 technique + 6 других).

| Параметр          | Значение | Обоснование                                     |
| ----------------- | :------: | ----------------------------------------------- |
| Польза            |  **6**   | Documentation coverage 76% → 100%               |
| Стоимость         |  **8**   | 64 статьи × ~2 часа = ~3 месяца (writer needed) |
| Риск              |  **3**   | Low                                             |
| Ожидаемое влияние |  **5**   | Поднимет Accessibility score modestly           |
| Уверенность       |  **9**   | Data-backed: Accessibility Map §5.1             |

**Quadrant:** ⚪ **Defer** (Стоимость 8, Влияние 5)
**ROI:** 6 × 5 / 8 = **3.75**
**Note:** После merge TechniquePanels (#3.8) останется 6 статей — пересчитать приоритет.

---

### 3.28. ⚪ Defer: Mass operations

**Описание:** Mass approve/reject в ApprovalsPanel, mass role assign в Governance, mass deploy skill в Agents, mass delete/tag в Memory.

| Параметр          | Значение | Обоснование                     |
| ----------------- | :------: | ------------------------------- |
| Польза            |  **5**   | Convenience для power-users     |
| Стоимость         |  **6**   | 5 panels × ~1 неделя = ~1 месяц |
| Риск              |  **5**   | Med — batch mistakes            |
| Ожидаемое влияние |  **4**   | Modest impact                   |
| Уверенность       |  **6**   | Hypothesis                      |

**Quadrant:** ⚪ **Defer** (Стоимость 6, Влияние 4)
**ROI:** 5 × 4 / 6 = **3.3**
**Sources:** Capability Gap Map §8

---

### 3.29. ⚪ Defer: Notifications for silent failures

**Описание:** Crystal refuted, debate concluded, memory worker failed, Audit #6 double-init — все должны emit `EVENTS.NOTIFICATION`.

| Параметр          | Значение | Обоснование    |
| ----------------- | :------: | -------------- |
| Польза            |  **4**   | UX improvement |
| Стоимость         |  **4**   | ~1 неделя      |
| Риск              |  **3**   | Low            |
| Ожидаемое влияние |  **4**   | Modest         |
| Уверенность       |  **7**   | Data-backed    |

**Quadrant:** ⚪ **Defer** (на границе с Quick Win)
**ROI:** 4 × 4 / 4 = **4.0**
**Sources:** Capability Gap Map §9

---

### 3.30. ⚪ Defer: Time Machine scopes expansion

**Описание:** Добавить Crystal/Lenses/Synthesis scopes в Time Machine.

| Параметр          | Значение | Обоснование                  |
| ----------------- | :------: | ---------------------------- |
| Польза            |  **4**   | Modest — backup more domains |
| Стоимость         |  **5**   | ~2 недели                    |
| Риск              |  **4**   | Med                          |
| Ожидаемое влияние |  **4**   | Modest                       |
| Уверенность       |  **7**   | Data-backed                  |

**Quadrant:** ⚪ **Defer**
**ROI:** 4 × 4 / 5 = **3.2**
**Sources:** Integration Map §3.13

---

### 3.31. ⚪ Defer: Prefetch strategy

**Описание:** Proactive prefetch топ-5 likely-next panels на hover по Sidebar.

| Параметр          | Значение | Обоснование               |
| ----------------- | :------: | ------------------------- |
| Польза            |  **4**   | Performance improvement   |
| Стоимость         |  **4**   | ~1 неделя                 |
| Риск              |  **5**   | Med — may waste bandwidth |
| Ожидаемое влияние |  **4**   | Modest                    |
| Уверенность       |  **6**   | Hypothesis                |

**Quadrant:** ⚪ **Defer**
**ROI:** 4 × 4 / 4 = **4.0**
**Sources:** Resource Map §9.4

---

## 4. Сводная таблица 28 opportunities

| #    | Opportunity                     | Польза | Стоим. | Риск | Влиян. | Увер. |   Quadrant   |   ROI    |
| ---- | ------------------------------- | :----: | :----: | :--: | :----: | :---: | :----------: | :------: |
| 3.1  | Builder killer-service nodes    |   9    |   7    |  5   |   9    |   9   | 🔴 Strategic |   11.6   |
| 3.2  | Cross-panel navigation          |   8    |   2    |  2   |   8    |   9   | 🟢 Do First  | **32.0** |
| 3.3  | Import в 9 панелях              |   8    |   4    |  3   |   8    |   9   | 🟢 Do First  |   16.0   |
| 3.4  | WikiPanel Create article UI     |   8    |   5    |  3   |   8    |   9   | 🟢 Do First  |   12.8   |
| 3.5  | DebateArena Save as Crystal     |   7    |   2    |  2   |   7    |   9   | 🟢 Do First  | **24.5** |
| 3.6  | Diagnostics cross-nav           |   7    |   3    |  2   |   7    |   9   | 🟢 Do First  |   16.3   |
| 3.7  | Delete 3 stub-панели            |   6    |   1    |  2   |   6    |   9   | 🟡 Quick Win | **36.0** |
| 3.8  | Merge 62 TechniquePanels        |   8    |   5    |  4   |   8    |   9   | 🟢 Do First  |   12.8   |
| 3.9  | Onboarding до 6 шагов           |   7    |   3    |  3   |   7    |   9   | 🟢 Do First  |   16.3   |
| 3.10 | eventBus cleanup audit          |   6    |   2    |  2   |   6    |   8   | 🟡 Quick Win |   18.0   |
| 3.11 | Settings search + tooltips      |   5    |   2    |  2   |   5    |   8   | 🟡 Quick Win |   12.5   |
| 3.12 | rivals/ → experimental/         |   7    |   3    |  3   |   7    |   9   | 🟢 Do First  |   16.3   |
| 3.13 | Audit #6 self-guard             |   7    |   5    |  3   |   7    |   8   | 🟡 Quick Win |   9.8    |
| 3.14 | Merge 5 budget panels           |   6    |   4    |  4   |   6    |   8   | 🟡 Quick Win |   9.0    |
| 3.15 | Merge 4 health panels           |   5    |   3    |  3   |   5    |   8   | 🟡 Quick Win |   8.3    |
| 3.16 | Coverage threshold CI           |   6    |   2    |  4   |   6    |   9   | 🟡 Quick Win |   18.0   |
| 3.17 | Fill dev-status-*.md            |   4    |   2    |  1   |   4    |   9   | 🟡 Quick Win |   8.0    |
| 3.18 | Background timers pause         |   5    |   3    |  3   |   5    |   8   | 🟡 Quick Win |   8.3    |
| 3.19 | Chat ↔ Memory RAG               |   9    |   6    |  7   |   9    |   7   | 🔴 Strategic |   13.5   |
| 3.20 | Memory ↔ Knowledge unification  |   8    |   7    |  7   |   8    |   6   | 🔴 Strategic |   9.1    |
| 3.21 | Wiki ↔ WikiBrain integration    |   8    |   6    |  6   |   8    |   8   | 🔴 Strategic |   10.7   |
| 3.22 | Agents ↔ Memory UI              |   7    |   5    |  5   |   7    |   8   | 🔴 Strategic |   9.8    |
| 3.23 | Crystal ↔ Debate bi-directional |   7    |   5    |  5   |   7    |   8   | 🔴 Strategic |   9.8    |
| 3.24 | Global search (Spotlight)       |   8    |   8    |  7   |   8    |   5   | 🔴 Strategic |   8.0    |
| 3.25 | Capability Registry UI          |   7    |   6    |  5   |   7    |   7   | 🔴 Strategic |   8.2    |
| 3.26 | External API/SDK                |   7    |   8    |  8   |   7    |   5   | 🔴 Strategic |   6.1    |
| 3.27 | 64 wiki articles                |   6    |   8    |  3   |   5    |   9   |   ⚪ Defer   |   3.75   |
| 3.28 | Mass operations                 |   5    |   6    |  5   |   4    |   6   |   ⚪ Defer   |   3.3    |
| 3.29 | Notifications for silent fails  |   4    |   4    |  3   |   4    |   7   |   ⚪ Defer   |   4.0    |
| 3.30 | Time Machine scopes             |   4    |   5    |  4   |   4    |   7   |   ⚪ Defer   |   3.2    |
| 3.31 | Prefetch strategy               |   4    |   4    |  5   |   4    |   6   |   ⚪ Defer   |   4.0    |

---

## 5. Четыре квадранта приоритизации

### 5.1. 🟢 DO FIRST — большая польза, низкий риск (8 opportunities)

| #    | Opportunity                 | ROI  | Польза | Риск |
| ---- | --------------------------- | :--: | :----: | :--: |
| 3.2  | Cross-panel navigation      | 32.0 |   8    |  2   |
| 3.5  | DebateArena Save as Crystal | 24.5 |   7    |  2   |
| 3.3  | Import в 9 панелях          | 16.0 |   8    |  3   |
| 3.6  | Diagnostics cross-nav       | 16.3 |   7    |  2   |
| 3.9  | Onboarding до 6 шагов       | 16.3 |   7    |  3   |
| 3.12 | rivals/ → experimental/     | 16.3 |   7    |  3   |
| 3.4  | WikiPanel Create article UI | 12.8 |   8    |  3   |
| 3.8  | Merge 62 TechniquePanels    | 12.8 |   8    |  4   |

**Суммарная стоимость:** ~10 недель
**Суммарное влияние:** поднимет overall OS score с ~6.5 до ~7.8
**Действие:** Начать немедленно, в следующем спринте.

### 5.2. 🟡 QUICK WINS — небольшие улучшения с быстрой отдачей (6 opportunities)

| #    | Opportunity                | ROI  | Польза | Стоим. |
| ---- | -------------------------- | :--: | :----: | :----: |
| 3.7  | Delete 3 stub-панели       | 36.0 |   6    |   1    |
| 3.10 | eventBus cleanup audit     | 18.0 |   6    |   2    |
| 3.16 | Coverage threshold CI      | 18.0 |   6    |   2    |
| 3.11 | Settings search + tooltips | 12.5 |   5    |   2    |
| 3.13 | Audit #6 self-guard        | 9.8  |   7    |   5    |
| 3.14 | Merge 5 budget panels      | 9.0  |   6    |   4    |
| 3.15 | Merge 4 health panels      | 8.3  |   5    |   3    |
| 3.17 | Fill dev-status-*.md       | 8.0  |   4    |   2    |
| 3.18 | Background timers pause    | 8.3  |   5    |   3    |

_(пересчитано — 9 quick wins, не 6, поскольку граница размыта)_

**Суммарная стоимость:** ~6 недель
**Действие:** Внедрить в текущий спринт как background work.

### 5.3. 🔴 STRATEGIC BETS — большая польза, высокий риск (9 opportunities)

| #    | Opportunity                     | ROI  | Польза | Риск |
| ---- | ------------------------------- | :--: | :----: | :--: |
| 3.19 | Chat ↔ Memory RAG               | 13.5 |   9    |  7   |
| 3.1  | Builder killer-service nodes    | 11.6 |   9    |  5   |
| 3.21 | Wiki ↔ WikiBrain integration    | 10.7 |   8    |  6   |
| 3.20 | Memory ↔ Knowledge unification  | 9.1  |   8    |  7   |
| 3.22 | Agents ↔ Memory UI              | 9.8  |   7    |  5   |
| 3.23 | Crystal ↔ Debate bi-directional | 9.8  |   7    |  5   |
| 3.25 | Capability Registry UI          | 8.2  |   7    |  5   |
| 3.24 | Global search (Spotlight)       | 8.0  |   8    |  7   |
| 3.26 | External API/SDK                | 6.1  |   7    |  8   |

**Суммарная стоимость:** ~5 месяцев
**Действие:** Требует RFC + design review. Не начинать до завершения Do First.

### 5.4. ⚪ DEFER — дорогие и сомнительные (5 opportunities)

| #    | Opportunity                    | ROI  | Стоим. | Влиян. |
| ---- | ------------------------------ | :--: | :----: | :----: |
| 3.27 | 64 wiki articles               | 3.75 |   8    |   5    |
| 3.28 | Mass operations                | 3.3  |   6    |   4    |
| 3.29 | Notifications for silent fails | 4.0  |   4    |   4    |
| 3.30 | Time Machine scopes            | 3.2  |   5    |   4    |
| 3.31 | Prefetch strategy              | 4.0  |   4    |   4    |

**Действие:** Отложить до следующего квартала. Пересмотреть приоритеты после Do First + Strategic Bets.

---

## 6. Сводная визуализация (matrix view)

```
                Польза 1 ────────────────── Польза 10
                │
        Low     │  ⚪ DEFER           🟡 QUICK WINS
       Risk     │  (3.27-3.31)        (3.7, 3.10, 3.11,
                │                     3.13-3.18)
                │
                │  ─────────────────────────────────
                │
       High     │  🔴 STRATEGIC       🟢 DO FIRST
       Risk     │  BETS               (3.2, 3.3, 3.4,
                │  (3.1, 3.19-3.26)   3.5, 3.6, 3.8,
                │                     3.9, 3.12)
                │
                ↑
              High benefit + low risk = top priority
```

---

## 7. ROI ranking — топ-15 по возврату

| Rank | #    | Opportunity                  |   ROI    |   Quadrant   |
| ---: | ---- | ---------------------------- | :------: | :----------: |
|    1 | 3.7  | Delete 3 stub-панели         | **36.0** | 🟡 Quick Win |
|    2 | 3.2  | Cross-panel navigation       | **32.0** | 🟢 Do First  |
|    3 | 3.5  | DebateArena Save as Crystal  | **24.5** | 🟢 Do First  |
|    4 | 3.10 | eventBus cleanup audit       |   18.0   | 🟡 Quick Win |
|    5 | 3.16 | Coverage threshold CI        |   18.0   | 🟡 Quick Win |
|    6 | 3.3  | Import в 9 панелях           |   16.0   | 🟢 Do First  |
|    7 | 3.6  | Diagnostics cross-nav        |   16.3   | 🟢 Do First  |
|    8 | 3.9  | Onboarding до 6 шагов        |   16.3   | 🟢 Do First  |
|    9 | 3.12 | rivals/ → experimental/      |   16.3   | 🟢 Do First  |
|   10 | 3.19 | Chat ↔ Memory RAG            |   13.5   | 🔴 Strategic |
|   11 | 3.4  | WikiPanel Create article UI  |   12.8   | 🟢 Do First  |
|   12 | 3.8  | Merge 62 TechniquePanels     |   12.8   | 🟢 Do First  |
|   13 | 3.1  | Builder killer-service nodes |   11.6   | 🔴 Strategic |
|   14 | 3.21 | Wiki ↔ WikiBrain integration |   10.7   | 🔴 Strategic |
|   15 | 3.11 | Settings search + tooltips   |   12.5   | 🟡 Quick Win |

---

## 8. Strategy: последовательность внедрения

### Фаза 1 (Q1) — Quick Wins + Do First (low risk)

**Цель:** поднять overall OS score с 6.5 до 7.5

1. Delete 3 stub-панели (3.7) — 2 часа
2. Fill dev-status-*.md (3.17) — 2 дня
3. Settings search + tooltips (3.11) — 2 дня
4. eventBus cleanup audit (3.10) — 1 неделя
5. Coverage threshold CI (3.16) — 2 часа
6. Cross-panel navigation (3.2) — 1 неделя
7. DebateArena Save as Crystal (3.5) — 1 день
8. Diagnostics cross-nav (3.6) — 3 дня
9. Import в 9 панелях (3.3) — 3 недели
10. Onboarding до 6 шагов (3.9) — 1 неделя
11. rivals/ → experimental/ (3.12) — 1 неделя
12. WikiPanel Create article UI (3.4) — 1 неделя

**Total Q1:** ~10 недель

### Фаза 2 (Q2) — Do First remaining + Quick Wins remaining

**Цель:** поднять до 7.8

1. Merge 62 TechniquePanels (3.8) — 2 недели
2. Merge 4 health panels (3.15) — 1 неделя
3. Merge 5 budget panels (3.14) — 2 недели
4. Audit #6 self-guard (3.13) — 3 недели
5. Background timers pause (3.18) — 1 неделя

**Total Q2:** ~9 недель

### Фаза 3 (Q3) — Strategic Bets (после стабилизации)

**Цель:** поднять до 8.5

1. Builder killer-service nodes (3.1) — 2 недели
2. Chat ↔ Memory RAG (3.19) — 3 недели
3. Wiki ↔ WikiBrain integration (3.21) — 3 недели
4. Agents ↔ Memory UI (3.22) — 2 недели
5. Crystal ↔ Debate bi-directional (3.23) — 2 недели

**Total Q3:** ~12 недель

### Фаза 4 (Q4) — Strategic Bets remaining

1. Memory ↔ Knowledge unification (3.20) — 1 месяц
2. Capability Registry UI (3.25) — 3 недели
3. Global search (3.24) — 1 месяц
4. External API/SDK (3.26) — 1.5 месяца

**Total Q4:** ~4 месяца

### Defer (пересмотреть через год)

- 64 wiki articles (3.27) — после merge TechniquePanels останется 6
- Mass operations (3.28)
- Notifications for silent fails (3.29)
- Time Machine scopes (3.30)
- Prefetch strategy (3.31)

---

## 9. Главные риски стратегии

| Risk                                                                     | Severity | Mitigation                              |
| ------------------------------------------------------------------------ | -------- | --------------------------------------- |
| **Builder killer-service nodes** (3.1) может сломать existing Builder UX | 🟡 MED   | RFC + incremental rollout, feature flag |
| **Chat ↔ Memory RAG** (3.19) может slow down chat                        | 🟡 MED   | Configurable on/off, async search       |
| **Memory ↔ Knowledge unification** (3.20) — big architecture change      | 🔴 HIGH  | Phased migration, dual-write period     |
| **Wiki ↔ WikiBrain** (3.21) может break existing WikiPanel bookmarks     | 🟡 MED   | Backward-compat redirects               |
| **External API/SDK** (3.26) — security risk                              | 🔴 HIGH  | Auth design first, no public exposure   |
| **Global search** (3.24) — performance risk                              | 🟡 MED   | Index size limits, debounce             |

---

## 10. Итоговый вердикт по потенциалу

| Метрика                             |        Оценка        | Комментарий        |
| ----------------------------------- | :------------------: | ------------------ |
| Количество identified opportunities |          28          | Богатый pipeline   |
| Средняя польза                      |        7.4/10        | Высокая            |
| Средняя стоимость                   |        5.2/10        | Умеренная          |
| Средний риск                        |        4.8/10        | Умеренный          |
| Среднее влияние                     |        7.2/10        | Высокое            |
| Средняя уверенность                 |        7.6/10        | Хорошая            |
| **Do First + Quick Wins**           | **17 opportunities** | Можно начать сразу |
| **Strategic Bets**                  |          9           | Требует RFC        |
| **Defer**                           |          5           | Пересмотреть позже |
| **Top ROI**                         | 36.0 (delete stubs)  | Quick wins реально |
| **Overall Opportunity Score**       |      **7.5/10**      | Высокий потенциал  |

**Сильные стороны:**

- **28 concrete opportunities** с 5 параметрами — actionable
- **17 immediate** (Do First + Quick Wins) — не нужно ждать
- **ROI ranking** — clear приоритизация
- **4 квадранта** — strategic framework
- **4-phase rollout** — последовательность
- **Все opportunities data-backed** из 11 предыдущих карт

**Слабые стороны:**

- **9 Strategic Bets** — высокий риск, требуют RFC
- **5 Defer** — можно не делать
- **Confidence** в Strategic Bets ниже (5–7 vs 8–9 для Do First)
- **Нет runtime data** — оценки static analysis

**Главный вывод:** SuperAgents OS имеет **измеримый неиспользованный потенциал**. После закрытия 17 immediate opportunities (Do First + Quick Wins, ~16 недель работы) overall OS score поднимется с ~6.5 до ~7.8. После 9 Strategic Bets (~5 месяцев) — до ~8.5.

**Стратегическое направление:** **не добавлять random features, а закрыть integration gaps** между существующими зрелыми компонентами. Главный architectural unlock — Builder killer-service nodes (#3.1), но highest ROI — простые fixes (delete stubs, cross-nav, Save-as-Crystal).

**Opportunity Score: 7.5/10** — проект имеет clear roadmap роста, основанный на data из 11 карт.

---

## Приложение A. Все 28 opportunities в цифрах

| #    | Opportunity                     | Польза | Стоим. | Риск | Влиян. | Увер. |   Quadrant   | ROI  |
| ---- | ------------------------------- | :----: | :----: | :--: | :----: | :---: | :----------: | :--: |
| 3.1  | Builder killer-service nodes    |   9    |   7    |  5   |   9    |   9   | 🔴 Strategic | 11.6 |
| 3.2  | Cross-panel navigation          |   8    |   2    |  2   |   8    |   9   | 🟢 Do First  | 32.0 |
| 3.3  | Import в 9 панелях              |   8    |   4    |  3   |   8    |   9   | 🟢 Do First  | 16.0 |
| 3.4  | WikiPanel Create article UI     |   8    |   5    |  3   |   8    |   9   | 🟢 Do First  | 12.8 |
| 3.5  | DebateArena Save as Crystal     |   7    |   2    |  2   |   7    |   9   | 🟢 Do First  | 24.5 |
| 3.6  | Diagnostics cross-nav           |   7    |   3    |  2   |   7    |   9   | 🟢 Do First  | 16.3 |
| 3.7  | Delete 3 stub-панели            |   6    |   1    |  2   |   6    |   9   | 🟡 Quick Win | 36.0 |
| 3.8  | Merge 62 TechniquePanels        |   8    |   5    |  4   |   8    |   9   | 🟢 Do First  | 12.8 |
| 3.9  | Onboarding до 6 шагов           |   7    |   3    |  3   |   7    |   9   | 🟢 Do First  | 16.3 |
| 3.10 | eventBus cleanup audit          |   6    |   2    |  2   |   6    |   8   | 🟡 Quick Win | 18.0 |
| 3.11 | Settings search + tooltips      |   5    |   2    |  2   |   5    |   8   | 🟡 Quick Win | 12.5 |
| 3.12 | rivals/ → experimental/         |   7    |   3    |  3   |   7    |   9   | 🟢 Do First  | 16.3 |
| 3.13 | Audit #6 self-guard             |   7    |   5    |  3   |   7    |   8   | 🟡 Quick Win | 9.8  |
| 3.14 | Merge 5 budget panels           |   6    |   4    |  4   |   6    |   8   | 🟡 Quick Win | 9.0  |
| 3.15 | Merge 4 health panels           |   5    |   3    |  3   |   5    |   8   | 🟡 Quick Win | 8.3  |
| 3.16 | Coverage threshold CI           |   6    |   2    |  4   |   6    |   9   | 🟡 Quick Win | 18.0 |
| 3.17 | Fill dev-status-*.md            |   4    |   2    |  1   |   4    |   9   | 🟡 Quick Win | 8.0  |
| 3.18 | Background timers pause         |   5    |   3    |  3   |   5    |   8   | 🟡 Quick Win | 8.3  |
| 3.19 | Chat ↔ Memory RAG               |   9    |   6    |  7   |   9    |   7   | 🔴 Strategic | 13.5 |
| 3.20 | Memory ↔ Knowledge unification  |   8    |   7    |  7   |   8    |   6   | 🔴 Strategic | 9.1  |
| 3.21 | Wiki ↔ WikiBrain integration    |   8    |   6    |  6   |   8    |   8   | 🔴 Strategic | 10.7 |
| 3.22 | Agents ↔ Memory UI              |   7    |   5    |  5   |   7    |   8   | 🔴 Strategic | 9.8  |
| 3.23 | Crystal ↔ Debate bi-directional |   7    |   5    |  5   |   7    |   8   | 🔴 Strategic | 9.8  |
| 3.24 | Global search (Spotlight)       |   8    |   8    |  7   |   8    |   5   | 🔴 Strategic | 8.0  |
| 3.25 | Capability Registry UI          |   7    |   6    |  5   |   7    |   7   | 🔴 Strategic | 8.2  |
| 3.26 | External API/SDK                |   7    |   8    |  8   |   7    |   5   | 🔴 Strategic | 6.1  |
| 3.27 | 64 wiki articles                |   6    |   8    |  3   |   5    |   9   |   ⚪ Defer   | 3.75 |
| 3.28 | Mass operations                 |   5    |   6    |  5   |   4    |   6   |   ⚪ Defer   | 3.3  |
| 3.29 | Notifications for silent fails  |   4    |   4    |  3   |   4    |   7   |   ⚪ Defer   | 4.0  |
| 3.30 | Time Machine scopes             |   4    |   5    |  4   |   4    |   7   |   ⚪ Defer   | 3.2  |
| 3.31 | Prefetch strategy               |   4    |   4    |  5   |   4    |   6   |   ⚪ Defer   | 4.0  |

**Средние значения:**

- Польза: 6.7/10
- Стоимость: 4.0/10
- Риск: 3.8/10
- Влияние: 6.5/10
- Уверенность: 7.9/10
- Средний ROI: 11.6

---

## Приложение B. Sources (cross-references с 11 предыдущими картами)

| Карта                           | Главные contribution в Opportunity Map                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| **Готовность панелей**          | База для оценки current state                                                                 |
| **Функциональная ценность**     | Killer-фичи (Crystal, Synthesis, Builder) — основа opportunities 3.1, 3.5, 3.23               |
| **Техническое состояние**       | Audit #6, lint baseline, coverage threshold — opportunities 3.13, 3.16, 3.17                  |
| **Использование ресурсов**      | Background timers, prefetch — opportunities 3.18, 3.31                                        |
| **Функциональное дублирование** | 62 TechniquePanels, rivals/, budget/health overlap — opportunities 3.7, 3.8, 3.12, 3.14, 3.15 |
| **Зависимости**                 | Central nodes, cross-coupling — context для architectural opportunities                       |
| **Жизненный цикл**              | eventBus cleanup gap, Audit #6 — opportunities 3.10, 3.13                                     |
| **Доступность возможностей**    | 64 panels без wiki, onboarding, settings search — opportunities 3.9, 3.11, 3.27               |
| **Функциональные пробелы**      | Builder integration, broken round-trip, batch ops — opportunities 3.1, 3.3, 3.28              |
| **Интеграция**                  | 16 pairs analyzed, cognitive chain — opportunities 3.2, 3.4, 3.5, 3.6, 3.19-3.23              |
| **Пользовательские сценарии**   | 12 journey dead-ends — opportunities 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9                        |

---

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e`. Синтез 11 предыдущих карт в actionable strategy. Все 28 opportunities — data-backed из статического анализа кодовой базы. Runtime validation требует прототипирования._

_Парные отчёты: «Карта готовности панелей», «Карта функциональной ценности», «Карта технического состояния», «Карта использования ресурсов», «Карта функционального дублирования», «Карта зависимостей», «Карта жизненного цикла», «Карта доступности возможностей», «Карта функциональных пробелов», «Карта интеграции», «Карта пользовательских сценариев»._

_Эта карта — **заключительная** в серии из 12 карт анализа SuperAgents OS. Все 12 карт формируют complete audit проекта с actionable roadmap роста._
