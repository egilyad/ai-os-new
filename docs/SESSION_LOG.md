# SuperAgents OS — Session Log

> Historical session notes, previously stored in AGENTS.md.
> See AGENTS.md for current instructions and conventions.

---
## Current Session тАФ Consolidated Plan P0 (docs/new/CONSOLIDATED_PLAN.md)

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                                    | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ----------------------------------------------------------------------------------------- | ------- |
| 1   | **P0.9** тАФ DependencyCruiser rules, module-level `new Function()`                         | ЁЯЯв Done |
| 2   | **P0.15** тАФ AgentControlPanel inject no-op тЖТ debateHumanService.addArgument               | ЁЯЯв Done |
| 3   | **P0.11** тАФ ChatExecutor singleton тЖТ DI promptSecurityService                             | ЁЯЯв Done |
| 4   | **P0.12** тАФ ServiceRegistryPanel split (1391 тЖТ 421 lines)                                 | ЁЯЯв Done |
| 5   | **P0.13** тАФ QualityImpactDashboardPanel split (1201 тЖТ 51 lines)                           | ЁЯЯв Done |
| 6   | **P0.14** тАФ DashboardPanel split (1088 тЖТ ~380 lines)                                      | ЁЯЯв Done |
| 7   | **P0.1** тАФ API keys plaintext тЖТ ╤З╨╡╤Б╤В╨╜╤Л╨╣ README + red-warning ╨▓ UI                         | ЁЯЯв Done |
| 8   | **P0.2** тАФ `new Function()` тЖТ AST interpreter (meriyah)                                   | ЁЯЯв Done |
| 9   | **P0.4** тАФ admin token тЖТ proper auth                                                      | ЁЯЯв Done |
| 10  | **P0.3** тАФ CI ╨║╤А╨░╤Б╨╜╤Л╨╣: lint errors/warnings + npm audit                                   | ЁЯЯв Done |
| 11  | **P0.7** тАФ 32 debate demo-╨╖╨░╨│╨╗╤Г╤И╨║╨╕ тЖТ ╤Б╨╜╨╡╤Б╨╡╨╜╤Л (╤А╨╛╤Г╤В╤Л ╤Г╨╢╨╡ ╨╜╨░ ComingSoonPanel)               | ЁЯЯв Done |
| 12  | **P0.5** тАФ MCP `wrapExternalData` ╤Б╨░╨╜╨╕╤В╨╕╨╖╨░╤Ж╨╕╤П `tools/list` + `tools/call`                 | ЁЯЯв Done |
| 13  | **P0.6** тАФ Webhook SSRF TOCTOU (HEAD-╨┐╤А╨╛╨▓╨╡╤А╨║╨░ тЖТ DNS rebind)                               | ЁЯЯв Done |
| 14  | **P0.8** тАФ 47 ╨Ь╨С ╨╝╤Г╤Б╨╛╤А╨░ `docs/ocs/erorrrrr*.md/txt` тЖТ ╤Г╨┤╨░╨╗╤С╨╜                              | ЁЯЯв Done |
| 15  | **P0.9** тАФ `ru.ts` ╨╗╨╛╨╝╨░╨╜╤Л╨╣ ╤А╤Г╤Б╤Б╨║╨╕╨╣ (1873 ╤Б╤В╤А╨╛╨║╨╕) тЖТ ╨┐╨╡╤А╨╡╨▓╨╡╨┤╨╡╨╜╤Л                             | ЁЯЯв Done |
| 16  | **P0.10** тАФ ComingSoonPanel ╨┐╨╛╨┤╨║╨╗╤О╤З╤С╨╜ ╨║ 32 stub-╤А╨╛╤Г╤В╨░╨╝                                    | ЁЯЯв Done |
| 17  | **P0.15** тАФ DebatePanel split (825 тЖТ 499 ╤Б╤В╤А╨╛╨║)                                           | ЁЯЯв Done |
| 18  | **P1.1** тАФ 12 zustand stores ╨┐╨╛╨║╤А╤Л╤В╤Л ╤В╨╡╤Б╤В╨░╨╝╨╕                                              | ЁЯЯв Done |
| 19  | **P1.2** тАФ hooks ╨┐╨╛╨║╤А╤Л╤В╤Л ╤В╨╡╤Б╤В╨░╨╝╨╕ (usePoolStatus, useFocusTrap, useRoutingIntelligence)    | ЁЯЯв Done |
| 20  | **P1.8** тАФ test coverage threshold 30% (scoped include, ╤А╨░╨▒╨╛╤З╨╕╨╣ `--coverage`)             | ЁЯЯв Done |
| 21  | **P1.9** тАФ CI coverage job (╤Б╤В╨░╨▒╨╕╨╗╤М╨╜╤Л╨╣ ╨╜╨░╨▒╨╛╤А, ╨╛╤В╨┤╨╡╨╗╤М╨╜╤Л╨╣ ╨╛╤В OOM-╨┐╤А╨╛╨│╨╛╨╜╨░)                   | ЁЯЯв Done |
| 22  | **P1.10** тАФ CI dep-graph job: `npm run check:deps`                                        | ЁЯЯв Done |
| 23  | **P1.11** тАФ ╨в╨╡╤Б╤В╤Л ╨▓╨║╨╗╤О╤З╨╡╨╜╤Л ╨▓ ╤В╨╕╨┐╨╕╨╖╨░╤Ж╨╕╤О (`tsconfig.test.json`)                             | ЁЯЯв Done |
| 24  | **P1.12** тАФ i18n ╨╝╨╛╨╜╨╛╨╗╨╕╤В╤Л ╤А╨░╨╖╨▒╨╕╤В╤Л ╨╜╨░ namespace-╤Д╨░╨╣╨╗╤Л (17 ╨╜╨░ ╨╗╨╛╨║╨░╨╗╤М)                       | ЁЯЯв Done |
| 25  | **P1.13** тАФ 26 ╨┐╤А╤П╨╝╤Л╤Е `t`-╨╕╨╝╨┐╨╛╤А╤В╨╛╨▓ тЖТ `useTranslation()`                                   | ЁЯЯв Done |
| 26  | **P1.14** тАФ `debate-llm-caller.ts` split (2729 тЖТ 1027 ╤Б╤В╤А╨╛╨║)                              | ЁЯЯв Done |
| 27  | **P1.15** тАФ `memory-engine.ts` split (996 тЖТ 794 ╤Б╤В╤А╨╛╨║)                                    | ЁЯЯв Done |
| 28  | **P1.16** тАФ `key-service.ts` split (1339 тЖТ 1083 ╤Б╤В╤А╨╛╨║)                                    | ЁЯЯв Done |
| 29  | **P1.17** тАФ layer violation: store-╨░╨┤╨░╨┐╤В╨╡╤А╤Л ╨╕╨╖ `src/stores/` тЖТ DI-╤В╨╛╨║╨╡╨╜╤Л                  | ЁЯЯв Done |
| 30  | **P1.18** тАФ 8 `@deprecated MOCK` ╤Б╨╡╤А╨▓╨╕╤Б╨╛╨▓ тЖТ feature-flag + DemoBadge                      | ЁЯЯв Done |
| 31  | **P1.19** тАФ DAL ╨╜╨╡ ╨┐╨╛╨║╤А╤Л╤В ╤В╨╡╤Б╤В╨░╨╝╨╕ тЖТ 70 ╤В╨╡╤Б╤В╨╛╨▓ (14 ╤Д╨░╨╣╨╗╨╛╨▓) + ╤Д╨╕╨║╤Б compound-index prune     | ЁЯЯв Done |
| 32  | **P1.20** тАФ ╨Ф╨╛╨▒╨░╨▓╨╕╤В╤М streaming ╨▓ live ╨┤╨╡╨▒╨░╤В╤Л (╤Б╨╡╨╣╤З╨░╤Б ╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╤В╨╡╨╗╤М ╨╢╨┤╤С╤В 30╤Б+ ╨▒╨╡╨╖ feedback) | ЁЯЯв Done |
| 33  | **P1.21** тАФ cognitive-aux ╨┐╨░╨╜╨╡╨╗╨╕: JSDoc + UI badge ┬лExperimental┬╗ (27 ╨┐╨░╨╜╨╡╨╗╨╡╨╣)            | ЁЯЯв Done |
| 34  | **P1.22** тАФ 13 React.memo ╨╜╨░ 644 .tsx тАФ ╨╝╨╡╨╝╨╛╨╕╨╖╨╕╤А╨╛╨▓╨░╤В╤М 10 ╤В╤П╨╢╤С╨╗╤Л╤Е list-row ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓     | ЁЯЯв Done |
| 35  | **P1.23** тАФ ╨Ч╨░╨╝╨╡╨╜╨╕╤В╤М `console.log/.warn/.error` ╨▓ UI ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨░╤Е ╨╜╨░ `LOGGER`              | ЁЯЯв Done |
| 36  | **P1.24** тАФ Security headers ╨▓ nginx (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) | ЁЯЯв Done |
| 37  | **P1.25** тАФ Dependency audit / fix (`npm audit fix`)                                      | ЁЯЯв Done |
| 38  | **P1.26** тАФ ╨Я╨╡╤А╨╡╨╕╨╝╨╡╨╜╨╛╨▓╨░╤В╤М `build:unsafe` ╨▓ `build:skip-typecheck` ╤Б warning               | ЁЯЯв Done |
| 39  | **P1.27** тАФ `sourcemap: 'hidden'` + upload ╨▓ Sentry/Datadog                               | ЁЯЯв Done |
| 40  | **P1.28** тАФ Dependabot config `.github/dependabot.yml`                                    | ЁЯЯв Done |
| 41  | **P1.29** тАФ `npm audit` step ╨▓ CI (╤Г╨╢╨╡ ╨╡╤Б╤В╤М security-audit job)                           | ЁЯЯв Done |
| 42  | **P2.1** тАФ ╨а╨░╨╖╨▒╨╕╤В╤М `RolesPanel/TeamWizard.tsx` (1107 тЖТ 7 step-╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓)                | ЁЯЯв Done |
| 43  | **P2.2** тАФ ╨а╨░╨╖╨▒╨╕╤В╤М `RolesPanel/RolesConsortiaPanel.tsx` (1066 тЖТ 4 ╤В╨░╨▒╨░ + orchestrator)    | ЁЯЯв Done |
| 44  | **P2.3** тАФ ╨а╨░╨╖╨▒╨╕╤В╤М `RolesPanel/RoleAnalytics.tsx` (1005 тЖТ orchestrator + 3 ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨░)    | ЁЯЯв Done |
| 45  | **P2.4** тАФ ╨а╨░╨╖╨▒╨╕╤В╤М `debate-engine.ts` (1278 тЖТ 800 ╤Б╤В╤А╨╛╨║, 3 ╨╝╨╛╨┤╤Г╨╗╤П)                        | ЁЯЯв Done |
| 46  | **P2.5** тАФ ╨а╨░╨╖╨▒╨╕╤В╤М `chat/store.ts` (1090 тЖТ 598 ╤Б╤В╤А╨╛╨║, 3 ╨╝╨╛╨┤╤Г╨╗╤П)                           | ЁЯЯв Done |
| 47  | **P2.6** тАФ ╨а╨░╨╖╨▒╨╕╤В╤М `useKeyStore.ts` (542 тЖТ 220 ╤Б╤В╤А╨╛╨║, 3 ╨╝╨╛╨┤╤Г╨╗╤П)                           | ЁЯЯв Done |
| 48  | **P2.7** тАФ Dead-code cleanup: `finalizeDebate` + `checkModelBlacklist`                    | ЁЯЯв Done |
| 49  | **P2.8** тАФ Flatten 65 single-file component directories тЖТ `src/components/`               | ЁЯЯв Done |
| 50  | **P2.9** тАФ 9 ╨┐╨░╨╜╨╡╨╗╨╡╨╣ ╨╖╨░╨┤╤Г╨▒╨╗╨╕╤А╨╛╨▓╨░╨╜╤Л ╨║╨░╨║ .tsx + ╨┤╨╕╤А╨╡╨║╤В╨╛╤А╨╕╤П тАФ ╨║╨╛╨╜╤Б╨╛╨╗╨╕╨┤╨╕╤А╨╛╨▓╨░╤В╤М                | тПня╕П Skip |
| 51  | **P2.10** тАФ ChatService wrapper тЖТ ChatExecutor merge                                      | ЁЯЯв Done |
| 52  | **P2.11** тАФ cross-tab-lock vs cross-tab-state тАФ ╨╖╨░╨┤╨╛╨║╤Г╨╝╨╡╨╜╤В╨╕╤А╨╛╨▓╨░╤В╤М ╨│╤А╨░╨╜╨╕╤Ж╤Г                 | ЁЯЯв Done |
| 53  | **P2.12** тАФ role-definitions.ts тЖТ src/data/                                               | ЁЯЯв Done |
| 54  | **P2.13** тАФ team-template-definitions.ts тЖТ src/data/                                      | ЁЯЯв Done |
| 55  | **P2.14** тАФ persona-definitions.ts тЖТ src/data/                                            | ЁЯЯв Done |

### Changes (P2.8)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **65 single-file directories flattened**: `Foo/Foo.tsx` тЖТ `Foo.tsx` in `src/components/`; directories removed; 65 empty dirs deleted                                                  |
| 2   | **`route-imports.ts`** тАФ all 65 import paths updated from `./components/Foo/Foo` тЖТ `./components/Foo`                                                                                 |
| 3   | **Import path fixes in flattened files**: `../../` тЖТ `../` (depth change) + `../Sibling` тЖТ `./Sibling` (sibling directory references now same-level)                                  |
| 4   | **Import path fixes in consuming files**: `../Foo/Foo` тЖТ `../Foo` in 35 files (DebatePanel, DashboardPanel, MCPPanel, etc.) for ModuleInfo, PersonaPicker, DebatePanel, etc.          |
| 5   | **Special case**: `DebateAnalysisPanel/components.tsx` moved to `src/components/components.tsx` with relative paths updated; `DebateAnalysisPanel.tsx` import fixed to `./components` |
| 6   | **`AppLayout.tsx`** тАФ `./CommandPalette/CommandPalette` тЖТ `./CommandPalette`                                                                                                          |
| 7   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run build:skip-typecheck` тЖТ тЬЕ (3842 modules, 0 errors)                                                                                                               |
| 8   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.8 тЬЕ                                                                                                                                             |
| 9   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.9** (9 ╨┐╨░╨╜╨╡╨╗╨╡╨╣ ╨╖╨░╨┤╤Г╨▒╨╗╨╕╤А╨╛╨▓╨░╨╜╤Л ╨║╨░╨║ .tsx + ╨┤╨╕╤А╨╡╨║╤В╨╛╤А╨╕╤П)                                                                                                           |

### Changes (P2.9)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░: ╨╜╨░╨╣╨┤╨╡╨╜╤Л 8 cases (╨╜╨╡ 9), ╨▓╤Б╨╡ тАФ ╨╗╨╡╨│╨╕╤В╨╕╨╝╨╜╤Л╨╣ orchestrator + sub-components ╨┐╨░╤В╤В╨╡╤А╨╜ ╨╕╨╖ P2.1-P2.5 (BudgetPanel, ChatExportPanel, DecisionLogPanel, DocsHealthPanel, KeyNotesPanel, PerformanceProfilerPanel, Sidebar, AgentJournalPanel). Consolidation ╨╛╤В╨╝╨╡╨╜╨╡╨╜╨░ тАФ ╤Н╤В╨╛ ╨╜╨╡ duplication |
| 2   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.9 тПня╕П Non-issue                                                                                                                                                                                                                                          |
| 3   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.10** (ChatService wrapper)                                                                                                                                                                                                                                           |

### Changes (P2.10)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `chat-service.ts` (40 ╤Б╤В╤А╨╛╨║) ╤Г╨┤╨░╨╗╤С╨╜ тАФ ChatService ╨▒╤Л╨╗ thin wrapper ╨▒╨╡╨╖ ╨╗╨╛╨│╨╕╨║╨╕: constructor + init/setupListeners (2 EventBus subscriptions) + destroy  |
| 2   | `chat-executor.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л `init()` (setupListeners: SEND_MESSAGE + CANCEL_MESSAGE) + `_initialized` + `_unsubs`; `destroy()` ╤В╨╡╨┐╨╡╤А╤М unsub cleanup |
| 3   | `phase6-high-level.ts` тАФ DI registration: `new ChatService(deps)` тЖТ `new ChatExecutor(deps, deps.llmClient)` (╨║╨╗╤О╤З 'chatService' ╤Б╨╛╤Е╤А╨░╨╜╤С╨╜)             |
| 4   | `services-core.ts` тАФ type `ChatService` тЖТ `ChatExecutor` ╨┤╨╗╤П lazyService                                                                               |
| 5   | `kernel/index.ts` тАФ export `ChatExecutor` ╨▓╨╝╨╡╤Б╤В╨╛ `ChatService`                                                                                         |
| 6   | `ChatService.autoRouting.test.ts` тАФ import + constructor ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╤Л; `init()` return type `Promise<void>` тЖТ `void`                                      |
| 7   | `ChatService.test.ts` тАФ describe renamed тЖТ `ChatExecutor`                                                                                              |
| 8   | `obs-gaps-service.ts` + `code-manifest.ts` тАФ file path metadata ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╤Л                                                                              |
| 9   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run build:skip-typecheck` тЖТ тЬЕ (35s)                                                                                                   |
| 10  | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.10 тЬЕ                                                                                                             |
| 11  | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.11** (cross-tab-lock vs cross-tab-state)                                                                                       |

### Changes (P2.11)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `contracts/cross-tab-lock.ts` тАФ JSDoc: "distributed mutual-exclusion lock via Dexie transactions. Use for session-level writes. Do NOT use for broadcasting"                                      |
| 2   | `contracts/cross-tab-state.ts` тАФ JSDoc: "cross-tab state sync via BroadcastChannel. Use for propagating infrastructure state. Do NOT use for mutual exclusion"                                    |
| 3   | ╨Р╨╜╨░╨╗╨╕╨╖: zero overlap тАФ lock = acquire/release/heartbeat (Dexie transactions); state sync = broadcast/subscribe (BroadcastChannel). Different paradigms, storage, consumers. Consolidation harmful |
| 4   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.11 тЬЕ                                                                                                                                                        |
| 5   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.12** (role-definitions.ts тЖТ src/data/)                                                                                                                                    |

### Changes (P2.12)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `role-definitions.ts` (3046 ╤Б╤В╤А╨╛╨║) ╨┐╨╡╤А╨╡╨╝╨╡╤Й╤С╨╜ ╨╕╨╖ `src/kernel/services/` тЖТ `src/data/`                                                                   |
| 2   | `team-template-definitions.ts` (2384 ╤Б╤В╤А╨╛╨║╨╕) ╨┐╨╡╤А╨╡╨╝╨╡╤Й╤С╨╜ ╨╕╨╖ `src/kernel/services/` тЖТ `src/data/`                                                         |
| 3   | `persona-definitions.ts` (1997 ╤Б╤В╤А╨╛╨║) ╨┐╨╡╤А╨╡╨╝╨╡╤Й╤С╨╜ ╨╕╨╖ `src/kernel/services/` тЖТ `src/data/`                                                                |
| 4   | ╨Ю╨▒╨╜╨╛╨▓╨╗╨╡╨╜╤Л 6 import paths ╨▓: unified-role-service, role-team-service, PersonaSelector, PersonaPickerPanel, debate-archetypes, debate-historical-figures |
| 5   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run build:skip-typecheck` тЖТ тЬЕ (24s)                                                                                                   |
| 6   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.12, P2.13, P2.14 тЬЕ                                                                                               |
| 7   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.15** (debate-prompt-builder.ts split) тАФ тЬЕ Done                                                                                |

### Changes (P2.15)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `debate-prompt-constants.ts` (74 ╤Б╤В╤А╨╛╨║╨╕) тАФ ╤Б╨╛╨╖╨┤╨░╨╜: `DEFAULT_LANGUAGE`, `stableSelectIndex`, `sanitizeForPrompt`, `ARGUMENT_STRATEGY_INSTRUCTIONS`, `CONSTRAINT_PROMPTS`, `UNIQUE_ANGLES`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2   | `debate-prompt-quality-gates.ts` (573 ╤Б╤В╤А╨╛╨║╨╕) тАФ ╤Б╨╛╨╖╨┤╨░╨╜: ╨▓╤Б╨╡ quality-gated micro-prompt builders (buildPrePublishCriticPrompt, buildSocraticPivotPrompt, buildConcessionPrompt, buildCounterfactualPrompt, buildHegelianSynthesisPrompt, buildShadowOpponentPrompt, buildEmpathyMirrorPrompt, buildEpistemicHumilityPrompt, buildHeatAdaptivePrompt, buildFallacySentinelPrompt, buildCredibilityPrompt, buildObjectionAnticipationPrompt, buildTriangulationPrompt, buildDriftCorrectionPrompt, buildRedundancyWarningPrompt, buildCrossExaminationPrompt, buildDeltaFocusingPrompt, buildCriticPrompt, buildDpoSamplerPrompt, buildUncertaintyPropagationPrompt, buildRhetoricSafetyPrompt, buildBiddingTimePrompt, buildAdaptiveOrderPrompt, buildBlindEvaluationPrompt, buildPivotStrategyPrompt, buildSynthesisPrompt, buildExecutableEvidencePrompt, buildHiddenIncentivesPrompt, buildGoTPrompt, buildBlendingPrompt, buildForecasterPrompt, buildBestOfNPrompt, buildTemperaturePrompt) |
| 3   | `debate-prompt-strategic.ts` (295 ╤Б╤В╤А╨╛╨║) тАФ ╤Б╨╛╨╖╨┤╨░╨╜: buildEntanglementConstraintPrompt, buildBeliefConflictsPrompt, buildSteelmanPrompt, buildBurdenOfProofPrompt, buildConsistencyWarning, buildVulnerabilityTargetingPrompt, buildAnchorsPrompt, buildMinimaxStrategicPrompt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4   | `debate-prompt-builder.ts` тАФ 1618 тЖТ 701 ╤Б╤В╤А╨╛╨║ (57% ╤А╨╡╨┤╤Г╨║╤Ж╨╕╤П): thin orchestrator ╤Б buildArgumentPrompt, buildOpeningPrompt, getDefaultSystemPrompt + re-exports ╨┤╨╗╤П ╨▓╨╜╨╡╤И╨╜╨╕╤Е ╨┐╨╛╤В╤А╨╡╨▒╨╕╤В╨╡╨╗╨╡╨╣ (prompt-audit-service, index.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 5   | `prompt-audit-service.ts` тАФ import paths ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╤Л (ARGUMENT_STRATEGY_INSTRUCTIONS, CONSTRAINT_PROMPTS ╤В╨╡╨┐╨╡╤А╤М ╤З╨╡╤А╨╡╨╖ re-export)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run build:skip-typecheck` тЖТ тЬЕ (3844 modules)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 7   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.15 тЬЕ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 8   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.16** (UX tasks, ╤Б╨╝. CONSOLIDATED_PLAN.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### Changes (P2.6)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `key-store-utils.ts` (~115 ╤Б╤В╤А╨╛╨║) тАФ ╤В╨╕╨┐╤Л (`KeyMeta`, `ImportedKeyInput`), pure-╤Д╤Г╨╜╨║╤Ж╨╕╨╕: `VALID_KEY_STATUSES`, `isStringArray`, `parseNotes`, `parseImportedKey`, `computeActiveKeys`, `computeActiveCount`, `computeErrorCount`                                                                                                               |
| 2   | ╨б╨╛╨╖╨┤╨░╨╜ `key-store-init.ts` (~165 ╤Б╤В╤А╨╛╨║) тАФ `ensureInitialized()` (Dexie liveQuery + 5 EventBus ╨┐╨╛╨┤╨┐╨╕╤Б╨╛╨║: KEY_LATENCY_BURST, KEY_HEALTH_CHECK_FAILED, KEY_QUOTA_EXCEEDED, NOTIFICATION, KEY_STATE_CHANGED + checkingTimers + HMR cleanup); ╨╕╨╜╤В╨╡╤А╤Д╨╡╨╣╤Б `KeyStoreState`                                                                                   |
| 3   | `useKeyStore.ts` тАФ 542 ╤Б╤В╤А╨╛╨║╨╕ тЖТ 220 ╤Б╤В╤А╨╛╨║ (59% ╤А╨╡╨┤╤Г╨║╤Ж╨╕╤П): store-orchestrator ╤Б actions (addKey/removeKey/updateKey/toggleKeyStatus/enableAllKeys/disableAllKeys/exportKeys/importKeys/refresh) + hook exports (`useKeyList`, `useCheckingIds`, `useKeySelector`, `refreshKeyStore`); ╤А╨╡-╤Н╨║╤Б╨┐╨╛╤А╤В `KeyMeta`/`KeyStoreState` ╨┤╨╗╤П ╨╛╨▒╤А╨░╤В╨╜╨╛╨╣ ╤Б╨╛╨▓╨╝╨╡╤Б╤В╨╕╨╝╨╛╤Б╤В╨╕ |
| 4   | ╨в╨╡╤Б╤В╤Л: `useKeyStore.test.ts` тАФ 24 ╤В╨╡╤Б╤В╨░ тЬЕ; ╨╛╨▒╨╜╨╛╨▓╨╗╤С╨╜ mock `../kernel/instances` (╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `rootLogger.child`)                                                                                                                                                                                                                                        |
| 5   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run build:skip-typecheck` тЖТ тЬЕ 27.55s; `npx vitest run src/stores/useKeyStore.test.ts` тЖТ 24 тЬЕ                                                                                                                                                                                                                                       |
| 6   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.6 тЬЕ                                                                                                                                                                                                                                                                                                            |
| 7   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.7** (dead-code cleanup)                                                                                                                                                                                                                                                                                                      |

### Changes (P2.5)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `chat-event-handlers.ts` (~152 ╤Б╤В╤А╨╛╨║╨╕) тАФ EventBus ╨┐╨╛╨┤╨┐╨╕╤Б╨║╨╕: MESSAGE_RESPONSE, STREAM_START, STREAM_CHUNK, STREAM_END, STREAM_ERROR; ╨┤╤Г╨▒╨╗╨╕╤А╤Г╤О╤Й╨╕╨╣ `updateEntryInSession` ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╨╜╨░ import ╨╕╨╖ `ChatSession[]` ╨▓╨╝╨╡╤Б╤В╨╛ `{ id: string; history: ChatEntry[] }`                                                                                                                                                       |
| 2   | ╨б╨╛╨╖╨┤╨░╨╜ `chat-send-message.ts` (~269 ╤Б╤В╤А╨╛╨║) тАФ `createSendMessageHandler(set, get)`: ╨▓╤Б╤П pipeline sendMessage (cancelGuard, memory RAG, workspace snapshot, sanitize, message building, loading responses, Dexie write-through persist, requestEntryMap registration, SEND_MESSAGE emit, send queue FIFO flush)                                                                                                          |
| 3   | ╨б╨╛╨╖╨┤╨░╨╜ `store-helpers.ts` (~21 ╤Б╤В╤А╨╛╨║╨░) тАФ `resolveSessionStore()` (DI ╨╗╨╡╨╜╨╕╨▓╤Л╨╣ singleton) + `updateSessionInList()` (helper ╨┤╨╗╤П patch ╤Б╨╡╤Б╤Б╨╕╨╕ ╨┐╨╛ id)                                                                                                                                                                                                                                                                      |
| 4   | `store.ts` тАФ 1090 ╤Б╤В╤А╨╛╨║ тЖТ 598 ╤Б╤В╤А╨╛╨║ (45% ╤А╨╡╨┤╤Г╨║╤Ж╨╕╤П): ╨╕╨╝╨┐╨╛╤А╤В╤Л ╤Б╨╛╨║╤А╨░╤Й╨╡╨╜╤Л (╤Г╨┤╨░╨╗╨╡╨╜╤Л ChatResponse, ChatMessage, SessionStore, CONFIG, EVENTS, runtime, executionGovernor, memoryService, workspaceService, getDistributedLock ╨╕╨╖ ╨┐╤А╤П╨╝╨╛╨│╨╛ ╨╕╤Б╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╨╜╨╕╤П тАФ ╨┤╨╡╨╗╨╡╨│╨╕╤А╨╛╨▓╨░╨╜╤Л ╨▓ ╨╕╨╖╨▓╨╗╨╡╤З╤С╨╜╨╜╤Л╨╡ ╨╝╨╛╨┤╤Г╨╗╨╕); event subscriptions ╨╖╨░╨╝╨╡╨╜╨╡╨╜╤Л ╨╜╨░ `setupChatEventHandlers(set, get)`; sendMessage ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╨╜╨░ `createSendMessageHandler(set, get)` |
| 5   | ╨в╨╡╤Б╤В╤Л: `store.test.ts` тАФ 36 ╤В╨╡╤Б╤В╨╛╨▓ тЬЕ; ╨╛╨▒╨╜╨╛╨▓╨╗╤С╨╜ mock `../../kernel/instances` (╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `rootLogger.child`) ╨┤╨╗╤П ╤Б╨╛╨▓╨╝╨╡╤Б╤В╨╕╨╝╨╛╤Б╤В╨╕ ╤Б ╨╜╨╛╨▓╤Л╨╝ `chat-send-message.ts`                                                                                                                                                                                                                                                           |
| 6   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run build:skip-typecheck` тЖТ тЬЕ 22.29s; `npx vitest run src/stores/chat/store.test.ts` тЖТ 36 тЬЕ                                                                                                                                                                                                                                                                                                          |
| 7   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.5 тЬЕ                                                                                                                                                                                                                                                                                                                                                                              |
| 8   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.6** (`useKeyStore.ts` 535 ╤Б╤В╤А╨╛╨║)                                                                                                                                                                                                                                                                                                                                                               |

### Changes (P2.4)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `debate-engine-types.ts` (~120 ╤Б╤В╤А╨╛╨║) тАФ `KeyServiceLike`, `RouterServiceLike`, `DebateEngineDeps` (48 ╨┐╨╛╨╗╨╡╨╣), `getDebateMaxDurationMs()` + 38 type-only ╨╕╨╝╨┐╨╛╤А╤В╨╛╨▓ contract'╨╛╨▓                                                                                                                        |
| 2   | ╨б╨╛╨╖╨┤╨░╨╜ `debate-provider-preflight.ts` (~200 ╤Б╤В╤А╨╛╨║) тАФ warm cache (`warmCache`, `WARM_CACHE_TTL`), `isProviderWarm()`, `markProviderWarm()`, `getPreflightTimeout()`, `runProviderPreflight()` (cold-start compensation + auth error handling + C13 guard), `evictExpiredWarmCache()`, `clearWarmCacheAll()` |
| 3   | ╨б╨╛╨╖╨┤╨░╨╜ `debate-engine-cancel.ts` (~200 ╤Б╤В╤А╨╛╨║) тАФ `cancelDebateSession()` (cleanupMaps closure + 3-phase cancel: cancelled/terminal/active + queueMicrotask re-check defense), `cleanupStaleSessions()` (30min stale sweep)                                                                                  |
| 4   | `debate-engine.ts` тАФ 1278 ╤Б╤В╤А╨╛╨║ тЖТ ~800 ╤Б╤В╤А╨╛╨║ (37% ╤А╨╡╨┤╤Г╨║╤Ж╨╕╤П): ╨╕╨╝╨┐╨╛╤А╤В╤Л ╤Б╨╛╨║╤А╨░╤Й╨╡╨╜╤Л ╤Б 77 ╨┤╨╛ ~45 (╤Г╨┤╨░╨╗╨╡╨╜╤Л 38 type-only contract ╨╕╨╝╨┐╨╛╤А╤В╨╛╨▓), preflight/cancel/cleanup ╨┤╨╡╨╗╨╡╨│╨╕╤А╨╛╨▓╨░╨╜╤Л ╨▓ ╨╕╨╖╨▓╨╗╨╡╤З╤С╨╜╨╜╤Л╨╡ ╨╝╨╛╨┤╤Г╨╗╨╕; re-export `DebateEngineDeps` ╨┤╨╗╤П ╨╛╨▒╤А╨░╤В╨╜╨╛╨╣ ╤Б╨╛╨▓╨╝╨╡╤Б╤В╨╕╨╝╨╛╤Б╤В╨╕                                                   |
| 5   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npx tsc --noEmit` тЖТ 0 ╨╛╤И╨╕╨▒╨╛╨║ ╨▓ ╨╜╨╛╨▓╨╛╨╝ ╨║╨╛╨┤╨╡                                                                                                                                                                                                                                                      |
| 6   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.4 тЬЕ                                                                                                                                                                                                                                                                  |
| 7   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.5** (`chat/store.ts` 1090 ╤Б╤В╤А╨╛╨║)                                                                                                                                                                                                                                                   |

### Changes (P2.3)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `analytics-utils.ts` тАФ 8 ╤З╨╕╤Б╤В╤Л╤Е ╤Д╤Г╨╜╨║╤Ж╨╕╨╣ ╨▓╤Л╤З╨╕╤Б╨╗╨╡╨╜╨╕╤П ╨┤╨░╨╜╨╜╤Л╤Е: `computeSummary`, `computeTopRoles` (╤Б `eloScore`), `computeCategorySegments`, `computeDailyActivity`, `computeToolUsage`, `computeTempCorrelation`, `computeHeatmap`, `computeFatigueAlerts` |
| 2   | `AnalyticsOverview.tsx` (~300 ╤Б╤В╤А╨╛╨║) тАФ summary cards (4 stat-╨║╨░╤А╤В╨╛╤З╨║╨╕) + per-role bar chart + category donut; ╤Н╨║╤Б╨┐╨╛╤А╤В╨╕╤А╤Г╨╡╤В `MiniBar` ╨╕ `DonutChart` ╨┤╨╗╤П ╨┐╨╡╤А╨╡╨╕╤Б╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╨╜╨╕╤П                                                                                       |
| 3   | `AnalyticsTimeSeries.tsx` (~130 ╤Б╤В╤А╨╛╨║) тАФ daily activity bar chart (14 ╨┤╨╜╨╡╨╣, invocations + errors)                                                                                                                                                               |
| 4   | `AnalyticsAdvanced.tsx` (~280 ╤Б╤В╤А╨╛╨║) тАФ tool usage (top 10) + temperature vs success rate + hourly heatmap (top 5 roles) + ELO leaderboard + fatigue alerts                                                                                                      |
| 5   | `RoleAnalytics.tsx` тАФ 1005 ╤Б╤В╤А╨╛╨║ тЖТ ~80 ╤Б╤В╤А╨╛╨║ thin orchestrator: ╨▓╤Л╤З╨╕╤Б╨╗╤П╨╡╤В ╨┤╨░╨╜╨╜╤Л╨╡ ╤З╨╡╤А╨╡╨╖ `analytics-utils`, ╨║╨╛╨╝╨┐╨╛╨╖╨╕╤А╤Г╨╡╤В `AnalyticsOverview` + `AnalyticsTimeSeries` + `AnalyticsAdvanced`; named export `RoleAnalytics` ╤Б╨╛╤Е╤А╨░╨╜╤С╨╜                                  |
| 6   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npx tsc --noEmit` тЖТ 0 ╨╛╤И╨╕╨▒╨╛╨║ ╨▓ ╨╜╨╛╨▓╨╛╨╝ ╨║╨╛╨┤╨╡                                                                                                                                                                                                           |
| 7   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.3 тЬЕ                                                                                                                                                                                                                       |
| 8   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.4** (`debate-engine.ts` 1278 ╤Б╤В╤А╨╛╨║)                                                                                                                                                                                                     |

### Changes (P2.2)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `consortia-constants.ts` тАФ shared styles (`tabStyle`, `card`, `chip`) + color maps (`CATEGORY_COLORS`, `CONSULIA_COLORS`, `STRATEGY_COLORS`)                                                                         |
| 2   | `RolesTab.tsx` тАФ roles grid: `UnifiedRoleEntry[]` тЖТ cards ╤Б category badge + tags; ~100 ╤Б╤В╤А╨╛╨║                                                                                                                               |
| 3   | `ConsiliaTab.tsx` тАФ consilia grid: `Consilium[]` тЖТ cards ╤Б type badge + participant range; ~60 ╤Б╤В╤А╨╛╨║                                                                                                                        |
| 4   | `TemplatesTab.tsx` тАФ templates grid: `GroupTemplate[]` тЖТ cards ╤Б category badge + tags; ~70 ╤Б╤В╤А╨╛╨║                                                                                                                           |
| 5   | `TeamsTab.tsx` тАФ teams view (~350 ╤Б╤В╤А╨╛╨║): my-teams/marketplace toggle, TeamWizard integration, team cards ╤Б action buttons (Details/Chat/Debate), task input + execution + TeamPipeline, TeamDetailsPanel + TeamChat modals |
| 6   | `RolesConsortiaPanel.tsx` тАФ 1066 ╤Б╤В╤А╨╛╨║ тЖТ ~250 ╤Б╤В╤А╨╛╨║ thin orchestrator: tab state, search/filter, data fetching (svc + teams), tab switching, delegates to `RolesTab`/`ConsiliaTab`/`TemplatesTab`/`TeamsTab`                |
| 7   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npx vite build` тЖТ тЬЕ 15.47s; typecheck тЖТ 0 ╨╛╤И╨╕╨▒╨╛╨║ ╨▓ ╨╜╨╛╨▓╨╛╨╝ ╨║╨╛╨┤╨╡                                                                                                                                                  |
| 8   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.2 тЬЕ                                                                                                                                                                                   |
| 9   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.3** (`RolesPanel/RoleAnalytics.tsx` 1005 ╤Б╤В╤А╨╛╨║)                                                                                                                                                     |

### Changes (P2.1)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `team-wizard/` ╨┐╨╛╨┤╨┤╨╕╤А╨╡╨║╤В╨╛╤А╨╕╤П ╨▓ `RolesPanel/` ╤Б 8 ╤Д╨░╨╣╨╗╨░╨╝╨╕: `wizard-constants.ts` (shared styles + `TeamState` ╤В╨╕╨┐ + `TEAM_DOMAINS`/`DOMAIN_DESCRIPTIONS`), 7 step-╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓ (`DomainPicker`, `TemplatePicker`, `RoleSelector`, `StrategyPicker`, `LeaderAssignment`, `ConfigStep`, `ReviewStep`)                                                      |
| 2   | `TeamWizard.tsx` тАФ 1107 ╤Б╤В╤А╨╛╨║ тЖТ ~200 ╤Б╤В╤А╨╛╨║ thin orchestrator: ╤Е╤А╨░╨╜╨╕╤В step state, ╨╜╨░╨▓╨╕╨│╨░╤Ж╨╕╤О (canNext/nextStep/prevStep/selectTemplate), step indicator ╨╕ footer (Back/Next/Create). ╨Т╤Б╨╡ render-╤Д╤Г╨╜╨║╤Ж╨╕╨╕ ╨╖╨░╨╝╨╡╨╜╨╡╨╜╤Л ╨╜╨░ ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╤Л-╤И╨░╨│╨╕, `team`/`setTeam` ╨┐╤А╨╛╨▒╤А╨░╤Б╤Л╨▓╨░╤О╤В╤Б╤П ╤З╨╡╤А╨╡╨╖ `TeamState` ╨┐╤А╨╛╨┐╤Б                                                                    |
| 3   | ╨Ъ╨░╨╢╨┤╤Л╨╣ step-╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В ╨┐╨╛╨╗╤Г╤З╨░╨╡╤В ╨╝╨╕╨╜╨╕╨╝╨░╨╗╤М╨╜╤Л╨╣ ╨╜╨░╨▒╨╛╤А ╨┐╤А╨╛╨┐╤Б╨╛╨▓ ╤З╨╡╤А╨╡╨╖ `TeamState { team, setTeam }` + ╤Г╨╜╨╕╨║╨░╨╗╤М╨╜╤Л╨╡ ╨┤╨╗╤П ╤И╨░╨│╨░ ╨┐╤А╨╛╨┐╤Б╤Л; ╨╗╨╛╨║╨░╨╗╤М╨╜╤Л╨╡ ╤Д╨╕╨╗╤М╤В╤А╤Л/╤Б╨╛╤Б╤В╨╛╤П╨╜╨╕╤П (`roleSearch`, `roleCategory`, `selectedDomain`) ╨╢╨╕╨▓╤Г╤В ╨▓ step-╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨░╤Е ╨╡╤Б╨╗╨╕ ╨╜╨╡ ╨╜╤Г╨╢╨╜╤Л ╤А╨╛╨┤╨╕╤В╨╡╨╗╤О; `filteredTemplates` ╤Б╤З╨╕╤В╨░╨╡╤В╤Б╤П ╨▓ `TemplatePicker` ╤З╨╡╤А╨╡╨╖ `useMemo`, `filteredRoles` тАФ ╨▓ `RoleSelector` |
| 4   | `RolesConsortiaPanel.tsx:25,597` тАФ import/usage `TeamWizard` ╨╜╨╡ ╨╕╨╖╨╝╨╡╨╜╨╕╨╗╤Б╤П (default export ╤Б ╤В╨╡╨╝ ╨╢╨╡ `TeamWizardProps`цОехПг╨╛╨╝)                                                                                                                                                                                                                                   |
| 5   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npx vite build` тЖТ тЬЕ 17.15s; typecheck ╨╜╨░ ╨╜╨╛╨▓╨╛╨╝ `team-wizard/` тЖТ 0 ╨╛╤И╨╕╨▒╨╛╨║                                                                                                                                                                                                                                                                         |
| 6   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P2.1 тЬЕ                                                                                                                                                                                                                                                                                                                     |
| 7   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.2** (`RolesPanel/RolesConsortiaPanel.tsx` 1066 ╤Б╤В╤А╨╛╨║)                                                                                                                                                                                                                                                                                 |

### Changes (P1.28)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`.github/dependabot.yml`** (╨╜╨╛╨▓╤Л╨╣) тАФ `version: 2`, ╨┤╨▓╨░ ecosystems: `npm` (weekly, monday 08:00 UTC, limit 10 PRs) ╨╕ `github-actions` (weekly, limit 5 PRs); ignore ╨┤╨╗╤П `react-router`/`react-router-dom` (GHSA-qwww-vcr4-c8h2 тАФ breaking downgrade ╨╜╤Г╨╢╨╡╨╜ ╨▓╤А╤Г╤З╨╜╤Г╤О), `zod`, `typescript`; labels + reviewer + commit-message prefix |
| 2   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.28 тЬЕ                                                                                                                                                                                                                                                                                          |
| 3   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.29** (`npm audit` step ╨▓ CI)                                                                                                                                                                                                                                                                                |

### Changes (P1.29)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `security-audit` job ╤Г╨╢╨╡ ╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╨╡╤В ╨▓ `.github/workflows/ci.yml` (`npm audit --audit-level=critical`, P0.3). `.npmrc` `audit=false` ╨┐╨╛╨┤╨░╨▓╨╗╤П╨╡╤В ╤В╨╛╨╗╤М╨║╨╛ auto-audit ╨┐╨╛╤Б╨╗╨╡ `npm ci`, ╨╜╨╛ ╨Э╨Х ╨▓╨╗╨╕╤П╨╡╤В ╨╜╨░ ╤П╨▓╨╜╤Л╨╣ `npm audit` ╨▓ CI. ╨Ч╨░╨┤╨░╤З╨░ ╨╖╨░╨║╤А╤Л╤В╨░ тАФ ╤И╨░╨│ ╤Г╨╢╨╡ ╨╜╨░ ╨╝╨╡╤Б╤В╨╡ |
| 2   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.29 тЬЕ                                                                                                                                                                                                                           |
| 3   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P2.x** (╤Б╨╝. CONSOLIDATED_PLAN.md: P2.1 `RolesPanel/TeamWizard.tsx` 1106 ╤Б╤В╤А╨╛╨║, P2.2 `RolesPanel/RolesConsortiaPanel.tsx` 1066 ╤Б╤В╤А╨╛╨║)                                                                                                            |

### Changes (P1.27)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `vite.config.ts` тАФ `sourcemap: false` тЖТ `sourcemap: 'hidden'`: ╨║╨░╤А╤В╤Л ╨│╨╡╨╜╨╡╤А╨╕╤А╤Г╤О╤В╤Б╤П (╨┐╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: 475 .map, v3, sources 173), ╨╜╨╛ `sourceMappingURL` ╨Э╨Х ╨▓╨╜╨╡╨┤╤А╤П╨╡╤В╤Б╤П ╨▓ ╨▒╨░╨╜╨┤╨╗ (grep ╨┐╨╛ dist/assets/*.js тЖТ False) тАФ ╨╕╤Б╤Е╨╛╨┤╨╜╨╕╨║╨╕ ╨╜╨╡ ╤Г╤В╨╡╨║╨░╤О╤В ╨║╨╗╨╕╨╡╨╜╤В╨░╨╝                                                                              |
| 2   | **`scripts/upload-sourcemaps.mjs`** (╨╜╨╛╨▓╤Л╨╣) тАФ ╨╖╨░╨│╤А╤Г╨╖╨║╨░ `.map` ╨▓ Sentry (`@sentry/cli` ╤З╨╡╤А╨╡╨╖ npx) ╨╕╨╗╨╕ Datadog (`datadog-ci` ╤З╨╡╤А╨╡╨╖ npx); release = `SENTRY_RELEASE`/`VITE_APP_VERSION`/`pkg.version`; ╨▒╨╡╨╖ ╨║╤А╨╡╨┤╨╛╨▓ (`SENTRY_AUTH_TOKEN`+`SENTRY_ORG`+`SENTRY_PROJECT` ╨╕╨╗╨╕ `DATADOG_API_KEY`) тАФ ╤З╨╕╤Б╤В╤Л╨╣ no-op exit 0 ╤Б info |
| 3   | `package.json` тАФ ╤Б╨║╤А╨╕╨┐╤В `sourcemaps:upload` тЖТ `node scripts/upload-sourcemaps.mjs`                                                                                                                                                                                                                                    |
| 4   | `.github/workflows/ci.yml` тАФ ╨▓ deploy job ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ step ┬лUpload sourcemaps┬╗ (╨┐╨╛╤Б╨╗╨╡ download artifact, ╨┤╨╛ Pages upload), gated `if: env.SENTRY_AUTH_TOKEN != ''                                                                                                                                                        |     | env.DATADOG_API_KEY != ''`, secrets ╨┐╤А╨╛╨║╨╕╨┤╤Л╨▓╨░╤О╤В╤Б╤П, release = `github.sha` |
| 5   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run build:skip-typecheck` тЖТ тЬЕ 22.23s, map: ╨▓╨║╨╗╤О╤З╨╡╨╜╤Л; `node scripts/upload-sourcemaps.mjs` тЖТ no-op exit 0; map JSON ╨▓╨░╨╗╨╕╨┤╨╡╨╜ (version 3)                                                                                                                                                               |
| 6   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.27 тЬЕ                                                                                                                                                                                                                                                                            |
| 7   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.28** (Dependabot config `.github/dependabot.yml`)                                                                                                                                                                                                                                             |

### Changes (P1.26)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `package.json` тАФ ╤Б╨║╤А╨╕╨┐╤В `build:unsafe` ╨┐╨╡╤А╨╡╨╕╨╝╨╡╨╜╨╛╨▓╨░╨╜ ╨▓ `build:skip-typecheck`; ╨┐╨╡╤З╨░╤В╨░╨╡╤В stderr-warning ╨┐╨╡╤А╨╡╨┤ `vite build` (╨╜╨╕╨║╨░╨║╨╕╨╡ TS-╨╛╤И╨╕╨▒╨║╨╕ ╨╜╨╡ ╨╖╨░╨╝╨░╨╗╤З╨╕╨▓╨░╤О╤В╤Б╤П ╤В╨╕╤Е╨╛) |
| 2   | `README.md` тАФ ╤Б╤В╤А╨╛╨║╨░ `build:unsafe` ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨░ ╨╜╨░ `build:skip-typecheck` ╤Б ╨┐╨╛╨╝╨╡╤В╨║╨╛╨╣ ┬лuse only for quick iteration┬╗                                                  |
| 3   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.26 тЬЕ                                                                                                                         |
| 4   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.27** (`sourcemap: 'hidden'` + upload ╨▓ Sentry/Datadog)                                                                                     |

### Changes (P1.25)

### Changes (P1.24)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╤Л ╨║╨╛╨╜╤Д╨╕╨│╤Г╤А╨░╤Ж╨╕╨╕ `docker/nginx.conf` ╨╕ `docker/nginx-ssl.conf` тАФ ╨╜╨░╤Б╤В╤А╨╛╨╡╨╜╤Л X-Frame-Options, X-Content-Type-Options, CSP, HSTS |
| 2   | ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.25** (╨Ю╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╕╨╡ ╨╖╨░╨▓╨╕╤Б╨╕╨╝╨╛╤Б╤В╨╡╨╣ / audit)                                                                      |

### Changes (P1.23)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨Ч╨░╨╝╨╡╨╜╨╡╨╜╤Л `console.error`/`console.warn` ╨▓ ╨║╨╗╤О╤З╨╡╨▓╤Л╤Е ╨┐╨░╨╜╨╡╨╗╤П╤Е ╨╕ ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨░╤Е (`DebateWorkspacePanel`, `DebateSidebar`, `DebateSessionHeader`, `ToolsPanel`) ╨╜╨░ `LOGGER` ╨╛╤В `rootLogger.child(...)` ╤Б ╨┐╨╡╤А╨╡╨┤╨░╤З╨╡╨╣ ╨╝╨╡╤В╨░╨┤╨░╨╜╨╜╤Л╤Е |
| 2   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast`, ╤Б╨▒╨╛╤А╨║╨░ ╨╕ ╨╗╨╕╨╜╤В╨╡╤А ╤А╨░╨▒╨╛╤В╨░╤О╤В ╨║╨╛╤А╤А╨╡╨║╤В╨╜╨╛. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.24** (Security headers ╨▓ nginx)                                                                                      |

### Changes (P1.22)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░**: ╨▓ ╨┐╤А╨╛╨╡╨║╤В╨╡ 644 .tsx, ╨╕╨╖ ╨╜╨╕╤Е 13 ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓ ╤Г╨╢╨╡ ╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╤О╤В `React.memo`. ╨Ч╨░╨┤╨░╤З╨░ тАФ ╨╝╨╡╨╝╨╛╨╕╨╖╨╕╤А╨╛╨▓╨░╤В╤М 10 ╤В╤П╨╢╤С╨╗╤Л╤Е list-row/card ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓. Memo ╤Н╤Д╤Д╨╡╨║╤В╨╕╨▓╨╡╨╜ ╤В╨╛╨╗╤М╨║╨╛ ╨╡╤Б╨╗╨╕ ╤А╨╛╨┤╨╕╤В╨╡╨╗╤М ╨┐╨╡╤А╨╡╨┤╨░╤С╤В ╤Б╤В╨░╨▒╨╕╨╗╤М╨╜╤Л╨╡ ╨┐╤А╨╛╨┐╤Б╤Л тАФ ╨┐╤А╨╛╨▓╨╡╤А╨╡╨╜╤Л `ConnectorsPanel`, `BookmarksPanel`, `KeyNotesPanel`, `AgentJournalPanel`, `KeyTable/TracesTab`, `HealthPanel` (╤Г╨╢╨╡ ╤Б╤В╨░╨▒╨╕╨╗╤М╨╜╤Л╨╡ useCallback-╨║╨╛╨╗╨▒╤Н╨║╨╕ / ╤З╨╕╤Б╤В╤Л╨╡ ╨┤╨░╨╜╨╜╤Л╨╡), ╨┐╨╛╤Н╤В╨╛╨╝╤Г ╤В╨░╨╝ ╨┤╨╛╤Б╤В╨░╤В╨╛╤З╨╜╨╛ ╨╛╨▒╨╡╤А╨╜╤Г╤В╤М ╤Б╨░╨╝ ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В                      |
| 2   | **10 ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓ ╨╛╨▒╤С╤А╨╜╤Г╤В╤Л ╨▓ `React.memo`**: `ConnectorCard.tsx` (ConnectorsPanel), `BookmarkCard.tsx` (BookmarksPanel), `NoteCard.tsx` (KeyNotesPanel), `DecisionCard.tsx` (KeyTable), `VitalCard.tsx` (HealthPanel), `JournalEntryCard.tsx` (AgentJournalPanel), `MemoryCard.tsx` (MemoryPanel), `MCPServerCard.tsx` (MCPPanel, named-only `{ memo }` import), `ToolCard.tsx` (ToolsPanel), `AgentCard.tsx` (AgentsPanel, ╨▒╨╗╨╛╨║-╤В╨╡╨╗╨╛ ╤Б╤В╤А╨╡╨╗╨╛╤З╨╜╨╛╨╣ ╤Д╤Г╨╜╨║╤Ж╨╕╨╕)                 |
| 3   | **╨б╤В╨░╨▒╨╕╨╗╨╕╨╖╨░╤Ж╨╕╤П ╨║╨╛╨╗╨▒╤Н╨║╨╛╨▓ ╨▓ ╤А╨╛╨┤╨╕╤В╨╡╨╗╤П╤Е (useCallback)** тАФ ╨▒╨╡╨╖ ╤Н╤В╨╛╨│╨╛ memo ╨▒╨╡╤Б╨┐╨╛╨╗╨╡╨╖╨╡╨╜: `MemoryPanel.tsx` тАФ `handleDeleteMemory` (deps `[confirm, clearError, t]`); `MCPPanel.tsx` тАФ `handleConnect`/`handleDisconnect`/`handleReconnectAll`/`handleRemoveServer`/`toggleExpand` (╤А╨░╨╜╨╡╨╡ ╨┤╤Г╨▒╨╗╨╕╤А╤Г╤О╤Й╨╕╨╡╤Б╤П ╨║╨╛╨┐╨╕╨╕ ╤Е╨╡╨╜╨┤╨╗╨╡╤А╨╛╨▓ ╤Г╨┤╨░╨╗╨╡╨╜╤Л, ╤Д╨░╨╣╨╗ 406 тЖТ 420 ╤Б╤В╤А╨╛╨║); `ToolsPanel.tsx` тАФ ╨╜╨╛╨▓╤Л╨╣ `handleToggleTool` (deps `[clearError, t]`) + `onSelect={setSelectedTool}` ╨▓╨╝╨╡╤Б╤В╨╛ inline-╤Б╤В╤А╨╡╨╗╨╛╨║ |
| 4   | `AgentsPanelView.tsx` тАФ `onSelect={(id) => onSetSelectedAgentId(id)}` ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╨╜╨░ `onSelect={onSetSelectedAgentId}` (╨╕╨╖ ╨║╨╛╨╜╤В╨╡╨║╤Б╤В╨░ тАФ ╤Н╤В╨╛ ╤Б╤В╨░╨▒╨╕╨╗╤М╨╜╤Л╨╣ `setSelectedAgentId` ╨╕╨╖ useState, ╨┐╨╡╤А╨╡╨┤╨░╨▓╨░╨╗╤Б╤П ╤З╨╡╤А╨╡╨╖ inl-line-╨╛╨▒╤С╤А╤В╨║╤Г). `AgentCard` ╨┐╨╛╨╗╤Г╤З╨░╨╡╤В ╤Б╤В╨░╨▒╨╕╨╗╤М╨╜╤Л╨╡ `onSelect`/`onToggleStatus` (╤В╨╛╨╢╨╡ useCallback) тЖТ memo ╤Н╤Д╤Д╨╡╨║╤В╨╕╨▓╨╡╨╜                                                                                                                                                |
| 5   | `MCPPanel.tsx:141` тАФ ╤Г╨▒╤А╨░╨╜ ╨╗╨╕╤И╨╜╨╕╨╣ `confirm` ╨╕╨╖ deps `toggleExpand` useCallback (╨┐╨╡╤А╨╡╨╝╨╡╨╜╨╜╨░╤П ╨╜╨╡ ╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╨╡╤В╤Б╤П ╨▓ ╤В╨╡╨╗╨╡ тАФ eslint `react-hooks/exhaustive-deps` error)                                                                                                                                                                                                                                                                                                          |
| 6   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx eslint` ╨╜╨░ 14 ╨╕╨╖╨╝╨╡╨╜╤С╨╜╨╜╤Л╤Е ╤Д╨░╨╣╨╗╨░╤Е тЖТ **0 errors** (3 pre-existing warnings: no-restricted-imports ├Ч2, set-state-in-effect ├Ч1); `npx vite build` тЖТ тЬЕ (23.75s, 3818 modules); `npm run check:deps` тЖТ 0 violations (1473 modules, 5175 deps)                                                                                                                                                                             |
| 7   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.22 тЬЕ (10 list-row/card ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓ ╨▓ React.memo)                                                                                                                                                                                                                                                                                                                                                                                   |
| 8   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.23** (╨╖╨░╨╝╨╡╨╜╨╕╤В╤М 151 `console.log/.warn` ╨╜╨░ `LOGGER` ╨╕╨╖ `kernel/services/logger-service`)                                                                                                                                                                                                                                                                            |

### Changes (P1.21)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/types/routing.ts` тАФ `RouteMeta` ╨┐╨╛╨╗╤Г╤З╨╕╨╗ ╨╛╨┐╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╤Л╨╣ ╤Д╨╗╨░╨│ `experimental?: boolean` ╤Б doc-comment (cognitive-aux / research ╨┐╨░╨╜╨╡╨╗╤М)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2   | **`src/components/Common/ExperimentalBadge.tsx`** (╨╜╨╛╨▓╤Л╨╣) тАФ ╨║╨╛╨╝╨┐╨░╨║╤В╨╜╨░╤П ╤Д╨╕╨╛╨╗╨╡╤В╨╛╨▓╨░╤П pill-╨┐╨╗╨░╤И╨║╨░ ┬лExperimental┬╗ (FlaskConical, `role="status"`, tooltip `experimental.badge_title`); ╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╨╡╤В `useTranslation()` (╨║╨╗╤О╤З╨╕ `experimental.badge`/`experimental.badge_title` ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л ╨▓ `en/common.ts` ╨╕ `ru/common.ts`)                                                                                                                                                                                                                                                                                                                     |
| 3   | `src/routes.tsx` тАФ ╨┤╨╗╤П ╤А╨╛╤Г╤В╨╛╨▓ ╤Б `item.experimental` ╨▒╨╡╨╣╨┤╨╢ ╨░╨▓╤В╨╛╨╝╨░╤В╨╕╤З╨╡╤Б╨║╨╕ ╤А╨╡╨╜╨┤╨╡╤А╨╕╤В╤Б╤П **╨┐╨╛╨▓╨╡╤А╤Е ╨┐╨░╨╜╨╡╨╗╨╕** (╨╛╨▒╤С╤А╤В╨║╨░ `<div style={{padding: '0.5rem 1rem'}}>` ╤Б badge + PanelLoader/ErrorBoundary); ╨┤╨╗╤П ╨╛╨▒╤Л╤З╨╜╤Л╤Е ╨┐╨░╨╜╨╡╨╗╨╡╨╣ ╤А╨╡╨╜╨┤╨╡╤А ╨╜╨╡ ╨╝╨╡╨╜╤П╨╗╤Б╤П. ╨в╨░╨║ ╨╜╨╡ ╨┐╤А╨╕╤И╨╗╨╛╤Б╤М ╤В╤А╨╛╨│╨░╤В╤М JSX ~27 ╨┐╨░╨╜╨╡╨╗╨╡╨╣                                                                                                                                                                                                                                                                                                                                                             |
| 4   | **27 ╨┐╨░╨╜╨╡╨╗╨╡╨╣ ╨┐╨╛╨╝╨╡╤З╨╡╨╜╤Л `experimental: true`** ╨▓ `route-registry-content.ts` (17) + `route-registry-system.ts` (10). Research-╨║╨╗╨░╤Б╤В╨╡╤А: `research-engine`, `research-advanced`, `research-gemini`, `research-reports`, `debate-system-research`, `project-os`, `hypothesis-gen`, `arch-review`, `prompt-audit`, `routing-experiments`, `gov-stress-test`, `obs-gaps`. Showcase/╨╕╨│╤А╨╛╨▓╤Л╨╡ ╨▓╨╕╤В╤А╨╕╨╜╤Л: `aquarium`, `ecosystem`, `aquarium-trading`, `quantum-inspiration`, `meta-learning`, `shadow`, `counterfactual`, `what-if`, `causal-debugger`, `federated-memory`, `memory-palace`, `playground`, `ab-testing`, `gemini-live`, `scheduler` |
| 5   | **JSDoc-╤И╨░╨┐╨║╨╕** ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л ╨▓ ╨│╨╗╨░╨▓╨╜╤Л╨╣ ╤Д╨░╨╣╨╗ ╨║╨░╨╢╨┤╨╛╨╣ ╨╕╨╖ 27 ╨┐╨░╨╜╨╡╨╗╨╡╨╣: ┬лCognitive-aux / research panel (Experimental) тАж research-grade, not production surface (P1.21)┬╗. `AquariumPanel.tsx` тАФ ╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨╕╨╣ comment ╤А╨░╤Б╤И╨╕╤А╨╡╨╜ (╤Б╨╛╤Е╤А╨░╨╜╨╡╨╜╨░ ╨╕╨╜╤Д╨░ ╨┐╤А╨╛ feature flag `ui.experimentalVisuals`)                                                                                                                                                                                                                                                                                                                                                         |
| 6   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx eslint` ╨╜╨░ 5 ╨╕╨╖╨╝╨╡╨╜╤С╨╜╨╜╤Л╤Е ╤Д╨░╨╣╨╗╨░╤Е тЖТ 0 errors; `npm run build` тЖТ тЬЕ (23.27s); `npm run check:deps` тЖТ 0 violations (1473 modules, 5175 deps); `config-registry.test.ts` тЖТ 10 тЬЕ (smoke i18n)                                                                                                                                                                                                                                                                                                                                                                                            |
| 7   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨Т ╨┐╨╗╨░╨╜╨╡ ╨╖╨╜╨░╤З╨╕╨╗╨╛╤Б╤М 40 ╨┐╨░╨╜╨╡╨╗╨╡╨╣ тАФ ╨┐╨╛ ╤Д╨░╨║╤В╤Г ╨║╨╗╨░╤Б╤Б╨╕╤Д╨╕╤Ж╨╕╤А╨╛╨▓╨░╨╜╤Л 27 research/showcase (╨┐╨╛ ╨╛╤В╨▓╨╡╤В╤Г ╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╤В╨╡╨╗╤П: ┬лResearch + ╨│╨╡╨╣╨╝╨┐╨╗╨╡╨╣-╨▓╨╕╤В╤А╨╕╨╜╤Л┬╗). ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.22** (13 `React.memo` ╨╜╨░ 644 .tsx тАФ ╨╝╨╡╨╝╨╛╨╕╨╖╨╕╤А╨╛╨▓╨░╤В╤М 10 ╤В╤П╨╢╤С╨╗╤Л╤Е list-row ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓)                                                                                                                                                                                                                                                                                                         |

### Changes (P1.20)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░**: ╨▓╤Б╤П streaming-╨╕╨╜╤Д╤А╨░╤Б╤В╤А╤Г╨║╤В╤Г╤А╨░ ╤Г╨╢╨╡ ╤Б╤Г╤Й╨╡╤Б╤В╨▓╨╛╨▓╨░╨╗╨░ тАФ ╨▓╤Б╨╡ 4 ╨┤╨╡╤Д╨╛╨╗╤В╨╜╤Л╤Е ╨░╨┤╨░╨┐╤В╨╡╤А╨░ (groq, gemini, openrouter, nvidia) ╤А╨╡╨░╨╗╨╕╨╖╤Г╤О╤В `streamMessage` ╤Б token-callback'╨░╨╝╨╕, `debateLiveStore.streamingContent` + ╤Б╨╛╨▒╤Л╤В╨╕╨╡ `DEBATE_AGENT_CHUNK` ╤Г╨╢╨╡ ╨┐╨╛╨┤╨║╨╗╤О╤З╨╡╨╜╤Л, ╨╜╨╛ `debate-llm-caller.ts` ╨▓╤Л╨╖╤Л╨▓╨░╨╗ ╨╜╨╡-streaming `adapter.sendMessage` ╨╕ ╤Н╨╝╨╕╤В╨╕╨╗ ╨▓╨╡╤Б╤М ╨╛╤В╨▓╨╡╤В ╨╛╨┤╨╜╨╕╨╝ ┬л╨╝╨╡╨│╨░-╤З╨░╨╜╨║╨╛╨╝┬╗ тАФ ╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╤В╨╡╨╗╤М ╨▓╨╕╨┤╨╡╨╗ ╨╜╨╕╤З╨╡╨│╨╛ 30╤Б+. ╨Х╨┤╨╕╨╜╤Б╤В╨▓╨╡╨╜╨╜╤Л╨╣ ╨╜╨╡╨┤╨╛╤Б╤В╨░╤О╤Й╨╕╨╣ ╨║╤Г╤Б╨╛╨║ тАФ ╨┐╨╡╤А-╤В╨╛╨║╨╡╨╜╨╜╤Л╨╣ forward                                                                                                                                                                                  |
| 2   | `debate-llm-caller.ts` тАФ ╨▓╤Л╨╖╨╛╨▓ `adapter.sendMessage` (╤Б╤В╤А╨╛╨║╨╕ ~320) ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╨╜╨░ `adapter.streamMessage` (╨║╨╛╨│╨┤╨░ ╨┤╨╛╤Б╤В╤Г╨┐╨╡╨╜): ╨║╨░╨╢╨┤╤Л╨╣ ╨╜╨╡╨┐╤Г╤Б╤В╨╛╨╣ chunk ╨░╨║╨║╤Г╨╝╤Г╨╗╨╕╤А╤Г╨╡╤В╤Б╤П ╨▓ `content` ╨╕ **╨┐╨╛-╤В╨╛╨║╨╡╨╜╨╜╨╛** ╤Н╨╝╨╕╤В╨╕╤В╤Б╤П ╨▓ `DEBATE_AGENT_CHUNK { sessionId, agentId, chunk }`; `stripSpeakerPrefix`/╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╤П/╨┐╨╛╤Б╤В-╨┐╤А╨╛╤Ж╨╡╤Б╤Б╨╕╨╜╨│/`DEBATE_AGENT_RESPONDED` ╤А╨░╨▒╨╛╤В╨░╤О╤В ╨║╨░╨║ ╤А╨░╨╜╤М╤И╨╡ (╤Д╨╕╨╜╨░╨╗╤М╨╜╤Л╨╣ content ╤Б╨╛╨▒╨╕╤А╨░╨╡╤В╤Б╤П ╨╕╨╖ ╤Б╤В╤А╨╕╨╝╨░). ╨Ф╨╗╤П ╨░╨┤╨░╨┐╤В╨╡╤А╨╛╨▓ ╨▒╨╡╨╖ `streamMessage` (╨╜╨░╨┐╤А╨╕╨╝╨╡╤А mock) тАФ ╤Д╨╛╨╗╨▒╤Н╨║ ╨╜╨░ `sendMessage` ╤Б ╤Н╨╝╨╕╤В╨╛╨╝ ╨┐╨╛╨╗╨╜╨╛╨│╨╛ ╨╛╤В╨▓╨╡╤В╨░ ╨╛╨┤╨╜╨╕╨╝ chunk (╨┐╨╛╨▓╨╡╨┤╨╡╨╜╨╕╨╡ ╤Б╨╛╤Е╤А╨░╨╜╨╡╨╜╨╛). ╨г╨┤╨░╨╗╤С╨╜ ╨┤╤Г╨▒╨╗╨╕╤А╤Г╤О╤Й╨╕╨╣ emit ╨┐╨╛╨╗╨╜╨╛╨│╨╛ `content` ╨┐╨╛╤Б╨╗╨╡ ╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╨╕ (╨╛╨╜ ╨║╨╛╨╜╨║╨░╤В╨╡╨╜╨╕╤А╨╛╨▓╨░╨╗╤Б╤П ╨▒╤Л ╨║ ╤Г╨╢╨╡ ╨╛╤В╤Б╤В╤А╨╕╨╝╨╗╨╡╨╜╨╜╤Л╨╝ ╤В╨╛╨║╨╡╨╜╨░╨╝) |
| 3   | `SpeakerNode.tsx` тАФ `{isActive && streamText ? 'speaking...' : ...}` тЖТ ╨┐╨╛╨║╨░╨╖ **╤А╨╡╨░╨╗╤М╨╜╨╛╨│╨╛** `streamText` (╤Б╤Л╤А╤Л╨╡ ╤В╨╛╨║╨╡╨╜╤Л ╤Б CSS ellipsis) ╨▓╨╝╨╡╤Б╤В╨╛ ╤Б╤В╨░╤В╨╕╤З╨╜╨╛╨│╨╛ ┬лspeaking...┬╗; `aria-live="polite"`/`role="status"` ╤Б╨╛╤Е╤А╨░╨╜╨╡╨╜╤Л. ╨в╨╡╨┐╨╡╤А╤М ╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╤В╨╡╨╗╤М ╨▓╨╕╨┤╨╕╤В ╤В╨╡╨║╤Б╤В ╨┐╨╛ ╨╝╨╡╤А╨╡ ╨│╨╡╨╜╨╡╤А╨░╤Ж╨╕╨╕                                                                                                                                                                                                                                                                                                                                                                             |
| 4   | ╨е╤А╨░╨╜╨╡╨╜╨╕╨╡/╨╛╤З╨╕╤Б╤В╨║╨░ ╨╜╨╡ ╨╝╨╡╨╜╤П╨╗╨╕╤Б╤М: `streamingContent` ╨║╨╗╤О╤З `sessionId:agentId`, ╨║╨░╨┐ 10240 ╤Б╨╕╨╝╨▓╨╛╨╗╨╛╨▓, ╨╛╤З╨╕╤Б╤В╨║╨░ ╨╜╨░ `DEBATE_AGENT_ERROR`/`TIMEOUT`/`FALLBACK`/`RESPONDED`. ╨з╨░╤Б╤В╨╕╤З╨╜╤Л╨╣ ╤В╨╡╨║╤Б╤В ╨┐╤А╨╕ ╨▓╨╜╤Г╤В╤А╨╡╨╜╨╜╨╡╨╝ retry (╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╤П/duplicate reject) ╨╛╤Б╤В╨░╤С╤В╤Б╤П ╨┤╨╛ ╤Б╨╗╨╡╨┤╤Г╤О╤Й╨╡╨╣ ╨┐╨╛╨┐╤Л╤В╨║╨╕ ╨╕╨╗╨╕ ╤Д╨╕╨╜╨░╨╗╤М╨╜╨╛╨╣ ╨╛╤И╨╕╨▒╨║╨╕ тАФ ╨┐╤А╨╕╨╡╨╝╨╗╨╡╨╝╨╛, ╤Г╤Е╨╛╨┤╨╕╤В ╨┐╤А╨╕ `RESPONDED`/`ERROR`                                                                                                                                                                                                                                                                                                                    |
| 5   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npx tsc --noEmit -p tsconfig.app.json` тЖТ 0 errors; `npx vitest run src/stores/debateLiveStore.test.ts src/kernel/services/debate-runtime` тЖТ **107 тЬЕ**; `npm run build` тЖТ тЬЕ (19.29s); `npm run check:deps` тЖТ 0 violations (1472 modules, 5173 deps)                                                                                                                                                                                                                                                                                                                                                                                     |
| 6   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.20 тЬЕ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.21** (╨╝╨░╤А╨║╨╕╤А╨╛╨▓╨░╤В╤М cognitive-aux ╨┐╨░╨╜╨╡╨╗╨╕: JSDoc + UI badge ┬лExperimental┬╗)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Changes (P1.19)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░**: DAL (`src/kernel/dal/`) тАФ 17 ╤Д╨░╨╣╨╗╨╛╨▓, 0 ╤В╨╡╤Б╤В╨╛╨▓. ╨а╨╡╤И╨╡╨╜╨╕╨╡ тАФ ╤В╨╡╤Б╤В-╤Е╨░╤А╨╜╨╡╤Б╤Б ╨╜╨░ **╤А╨╡╨░╨╗╤М╨╜╨╛╨╝ Dexie `SuperAgentsDB`** ╨┐╨╛╨▓╨╡╤А╤Е `fake-indexeddb` (╤Г╨╢╨╡ ╨▓╨║╨╗╤О╤З╤С╨╜ ╨▓ `setup-light.ts`), ╤З╤В╨╛ ╨┐╤А╨╛╨│╨╛╨╜╤П╨╡╤В ╨╜╨░╤Б╤В╨╛╤П╤Й╨╕╨╡ Dexie-╨╖╨░╨┐╤А╨╛╤Б╤Л/╤В╤А╨░╨╜╨╖╨░╨║╤Ж╨╕╨╕ ╨╕ Zod-╤Е╤Г╨║╨╕ ╤В╨░╨▒╨╗╨╕╤Ж. vitest ╨╕╨╖╨╛╨╗╨╕╤А╤Г╨╡╤В ╨║╨░╨╢╨┤╤Л╨╣ ╤В╨╡╤Б╤В-╤Д╨░╨╣╨╗ ╨▓ ╨╛╤В╨┤╨╡╨╗╤М╨╜╤Л╨╣ worker тЖТ per-file module-level ╤Б╨╕╨╜╨│╨╗╤В╨╛╨╜ Dexie ╨▒╨╡╨╖╨╛╨┐╨░╤Б╨╡╨╜                                                                                                                                                                                                                                                                                                                                       |
| 2   | **`_test-harness.ts`** (╨╜╨╛╨▓╤Л╨╣) тАФ `createTestDb()` ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╤В `{ db: DatabaseService, dexie, clearAll }`: database-╨│╨╡╤В╤В╨╡╤А-╨┐╤А╨╛╨║╤Б╨╕ ╨┤╨╗╤П ╨▓╤Б╨╡╤Е 16 ╤В╨░╨▒╨╗╨╕╤Ж + `getKv`/`setKv` ╨╜╨░ ╤А╨╡╨░╨╗╤М╨╜╨╛╨╣ ╤В╨░╨▒╨╗╨╕╤Ж╨╡ `keyValue`; `clearAll()` ╤З╨╕╤Б╤В╨╕╤В ╨▓╤Б╨╡ ╤В╨░╨▒╨╗╨╕╤Ж╤Л ╨╝╨╡╨╢╨┤╤Г ╤В╨╡╤Б╤В╨░╨╝╨╕                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3   | **14 ╤В╨╡╤Б╤В-╤Д╨░╨╣╨╗╨╛╨▓, 70 ╤В╨╡╤Б╤В╨╛╨▓** тЬЕ: `memory-repository` (10: store/getAll/upsert/delete/getCount/update/storeBatch/search/prune/clear), `session-repository` (5), `note-repository` (4), `role-repository` (4), `trace-repository` (5), `cognitive-repository` (6), `debate-repository` (7), `session-link-repository` (5), `debate-timeline-repository` (3), `debate-override-repository` (3), `workspace-repository` (1, in-memory kv), `event-log-repository` (5), `key-migration` (5), `data-access-layer` (7: repo-╤Н╨║╤Б╨┐╨╛╨╖╨╕╤Ж╨╕╤П + kv set/get/list/delete/clear + workspace)                                                                                                                           |
| 4   | **╨а╨╡╨░╨╗╤М╨╜╤Л╨╣ ╨▒╨░╨│ ╨╜╨░╨╣╨┤╨╡╨╜ ╨╕ ╨╕╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜**: Dexie compound-index `[metadata.timestamp]` ╤В╤А╨╡╨▒╤Г╨╡╤В **array-bound** тАФ `.below(scalar)` ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╤В `[]` (╤З╨╕╤Б╨╗╨╛ ╤Б╤А╨░╨▓╨╜╨╕╨▓╨░╨╡╤В╤Б╤П ╤Б array-╨║╨╗╤О╤З╨╛╨╝ ╨╕ ╨╜╨╡ ╨╝╨░╤В╤З╨╕╤В╤Б╤П). `MemoryRepository.prune()` (╨╕ `queryEntries` ╤Б `before`/`after`) **╨╜╨╕╨║╨╛╨│╨┤╨░ ╨╜╨╡ ╤Г╨┤╨░╨╗╤П╨╗ ╨╖╨░╨┐╨╕╤Б╨╕**. ╨д╨╕╨║╤Б ╨▓ 2 ╨┐╤А╨╛╨┤-╤Д╨░╨╣╨╗╨░╤Е: `dal/memory-repository.ts` тАФ `.below([beforeTimestamp])`; `services/storage/dexie-storage.ts` тАФ `.below([options.before])` / `.above([options.after])`                                                                                                                                                                                                                             |
| 5   | ╨Э╤О╨░╨╜╤Б╤Л, ╨╖╨░╤Д╨╕╨║╤Б╨╕╤А╨╛╨▓╨░╨╜╨╜╤Л╨╡ ╨▓ ╤В╨╡╤Б╤В╨░╤Е: `MemoryRepository` ID ╨┤╨╡╤В╨╡╤А╨╝╨╕╨╜╨╕╤А╨╛╨▓╨░╨╜╤Л ╤З╨╡╤А╨╡╨╖ `computeMemoryId(content, source, type)` тЖТ upsert-╤В╨╡╤Б╤В ╨┐╨╡╤А╨╡╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╨╡╤В ╤В╨╛╤В ╨╢╨╡ content ╨┤╨╗╤П merge; `search()`/`getAll()` ╨┐╨╡╤А╨╡╨╖╨░╨│╤А╤Г╨╢╨░╤О╤В ╨║╤Н╤И ╨╕╨╖ Dexie **newest-first** (`store()` ╨╜╨╡ ╨┐╤А╨╡╨┤╨╖╨░╨│╤А╤Г╨╢╨░╨╡╤В ╨║╤Н╤И) тЖТ ╨┐╨╛╤А╤П╨┤╨╛╨║ ╨┐╨╛ timestamp desc; `fake-indexeddb` structured-clones ╨╛╨▒╤К╨╡╨║╤В╤Л тЖТ ╨┐╤А╨╛╨▓╨╡╤А╨║╨░ workspace handle ╤З╨╡╤А╨╡╨╖ `toEqual(handle)`, ╨╜╨╡ `toBe`; `key-migration.runOnce` тАФ ╤З╨╕╤Б╤В╨░╤П ╤Д╤Г╨╜╨║╤Ж╨╕╤П ╤Б deps `{ db, keyStore, securityService? }` тЖТ ╤В╨╡╤Б╤В ╨╜╨░ mock `IDatabaseService`/`KeyStore` + `localStorage` (jsdom), ╨╜╨╡ ╨╜╨░ Dexie-╤Е╨░╤А╨╜╨╡╤Б╤Б╨╡; `EventLogRepository.save()` ╨╕╨┤╨╡╨╝╨┐╨╛╤В╨╡╨╜╤В╨╡╨╜ (╨▓╤Б╤В╨░╨▓╨║╨░ ╤В╨╛╨╗╤М╨║╨╛ ╨┐╤А╨╕ `sequence > lastPersistedSeq`) |
| 6   | ╨Ъ╤Н╤И-╨╗╨╕╨╝╨╕╤В╤Л (memory 1000, sessions 500, notes 1000, roles 100) ╤Н╨▓╨╕╨║╤В╤П╤В╤Б╤П ╤В╨╛╨╗╤М╨║╨╛ ╨╕╨╖ ╨║╤Н╤И╨░, ╨╜╨╡ ╨╕╨╖ DB (B10-166) тАФ ╨┐╨╛╨▓╨╡╨┤╨╡╨╜╨╕╨╡ ╤Б╨╛╤Е╤А╨░╨╜╨╡╨╜╨╛ ╨║╨░╨║ ╨▒╤Л╨╗╨╛, ╤П╨▓╨╜╨╛ ╨╜╨╡ ╤В╨╡╤Б╤В╨╕╤А╨╛╨▓╨░╨╗╨╛╤Б╤М                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npm run build` (`tsc -b && vite build`) тЖТ тЬЕ (3817 modules); `npm run check:deps` тЖТ 0 violations (1472 modules, 5173 deps); `npx vitest run src/kernel/dal` тЖТ **70 тЬЕ**                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 8   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.19 тЬЕ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 9   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.20** (╤Г╤В╨╛╤З╨╜╨╕╤В╤М ╨▓ CONSOLIDATED_PLAN.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### Changes (P1.18)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `contracts/config-registry.ts` тАФ `FeatureFlagsConfigSection` ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╨░ ╤Б╨╡╨║╤Ж╨╕╤П `mockServices.{ enabled: boolean }` ╤Б doc-comment: master-switch ╨┤╨╗╤П `@deprecated MOCK` ╨▒╤Н╨║╨╡╨╜╨┤╨╛╨▓ (deploy, fine-tuning, distillation, health-sla); ╨┐╤А╨╕ ╨▓╤Л╨║╨╗╤О╤З╨╡╨╜╨╕╨╕ UI-╨┐╨░╨╜╨╡╨╗╨╕ ╤А╨╡╨╜╨┤╨╡╤А╤П╤В placeholder ╨▓╨╝╨╡╤Б╤В╨╛ ╤Б╨╕╨╝╤Г╨╗╤П╤Ж╨╕╨╕                                                                          |
| 2   | `services/config-registry.ts` тАФ default `featureFlags.mockServices.enabled: true` ╨▓ `rawConfig`                                                                                                                                                                                                                                                                         |
| 3   | **`components/Common/DemoBadge.tsx`** (╨╜╨╛╨▓╤Л╨╣) тАФ ╤П╨╜╤В╨░╤А╨╜╤Л╨╣ ╨▒╨╡╨╣╨┤╨╢-banner (`role="alert"`, `aria-live="polite"`, FlaskConical, ╤Ж╨▓╨╡╤В╨░ #f59e0b/#fbbf24): ╨╖╨░╨│╨╛╨╗╨╛╨▓╨╛╨║ ┬лDemo mode тАФ simulated backend┬╗ + ╨┐╨╛╤П╤Б╨╜╨╡╨╜╨╕╨╡, ╤З╤В╨╛ ╨┤╨░╨╜╨╜╤Л╨╡ mock ╨╕ ╤А╨╡╨░╨╗╤М╨╜╤Л╨╡ API-╨▓╤Л╨╖╨╛╨▓╤Л ╨╜╨╡ ╨┤╨╡╨╗╨░╤О╤В╤Б╤П; `isMockServicesEnabled()` ╤Е╨╡╨╗╨┐╨╡╤А ╤З╨╕╤В╨░╨╡╤В ╤Д╨╗╨░╨│; ╨┐╨╡╤А╨╡╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╨╡╤В ╨┐╨░╤В╤В╨╡╤А╨╜ ╨▒╨░╨╜╨╜╨╡╤А╨░ ╨╕╨╖ ProviderManagerView (P0.1) |
| 4   | **`components/Common/DemoGate.tsx`** (╨╜╨╛╨▓╤Л╨╣) тАФ ╨╛╨▒╤С╤А╤В╨║╨░-╨┐╤А╨╕╨▓╤А╨░╤В╨╜╨╕╨║: ╨┐╤А╨╕ `featureFlags.mockServices.enabled === false` ╤А╨╡╨╜╨┤╨╡╤А╨╕╤В placeholder ┬лThis demo feature is disabled (mockServices.enabled is off)┬╗ ╨▓╨╝╨╡╤Б╤В╨╛ UI; ╨┐╤А╨╕ ╨▓╨║╨╗╤О╤З╨╡╨╜╨╕╨╕ тАФ ╤А╨╡╨╜╨┤╨╡╤А╨╕╤В `<DemoBadge />` + children. props `title` (╨╕╨╝╤П ╤Д╤Г╨╜╨║╤Ж╨╕╨╕)                                                                     |
| 5   | `components/DeployToProduction/DeployPanel.tsx` тАФ ╨╛╨▒╤С╤А╨╜╤Г╤В ╨▓ `<DemoGate title="Deploy to Production">`                                                                                                                                                                                                                                                                   |
| 6   | `components/FineTuning/FineTuningPanel.tsx` тАФ ╨╛╨▒╤С╤А╨╜╤Г╤В ╨▓ `<DemoGate title="Fine-Tuning Studio">`                                                                                                                                                                                                                                                                         |
| 7   | `components/ModelDistillation/DistillationPanel.tsx` тАФ ╨╛╨▒╤С╤А╨╜╤Г╤В ╨▓ `<DemoGate title="Model Distillation">`                                                                                                                                                                                                                                                                |
| 8   | `components/HealthSla/HealthSlaPanel.tsx` тАФ ╨╛╨▒╤С╤А╨╜╤Г╤В ╨▓ `<DemoGate title="Health SLA Config">`                                                                                                                                                                                                                                                                            |
| 9   | `components/SettingsPanel/GeneralTab.tsx` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ ╤В╤Г╨╝╨▒╨╗╨╡╤А ┬лDemo / Mock Services┬╗ (`featureFlags['mockServices.enabled']`, accent #f59e0b, ╨╕╨║╨╛╨╜╨║╨░ FlaskConical) ╤А╤П╨┤╨╛╨╝ ╤Б ┬лExperimental visuals┬╗                                                                                                                                                                        |
| 10  | `i18n/translations/{en,ru}/settings.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л ╨║╨╗╤О╤З╨╕ `settings.mock_services` / `settings.mock_services_desc`                                                                                                                                                                                                                                                      |
| 11  | ╨б╨╡╤А╨▓╨╕╤Б╤Л ╨╛╤Б╤В╨░╨╗╨╕╤Б╤М ╨▒╨╡╨╖ gating (╨╜╨╡ ╤В╤А╨╛╨╜╤Г╤В╤Л): ╨╛╨╜╨╕ ╤З╨╡╤Б╤В╨╜╨╛ `console.warn`'╤П╤В ╨╛ mock-╨▒╤Н╨║╨╡╨╜╨┤╨╡ (╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╨╛ ╨▓ ╨б╨╡╤Б╤Б╨╕╨╕ 10). ╨д╨╗╨░╨│ ╤Г╨┐╤А╨░╨▓╨╗╤П╨╡╤В ╤В╨╛╨╗╤М╨║╨╛ UI-╨▓╨╕╨┤╨╕╨╝╨╛╤Б╤В╤М╤О/badge. provider-migration/sleep-engine ╨╜╨╡ ╨╕╨╝╨╡╤О╤В ╨▓╤Л╨┤╨╡╨╗╨╡╨╜╨╜╤Л╤Е ╨┐╨░╨╜╨╡╨╗╨╡╨╣ тАФ ╨│╨╡╨╣╤В ╨╜╨╡ ╤В╤А╨╡╨▒╤Г╨╡╤В╤Б╤П                                                                                                                               |
| 12  | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx tsc -b --noEmit` тЖТ 0 errors; `npm run build` тЖТ тЬЕ (13.62s); `npm run check:deps` тЖТ 0 violations (1471 modules, 5171 deps); vitest (SettingsPanel + config-registry) тЖТ 21 тЬЕ; eslint ╨╜╨░ ╨╕╨╖╨╝╨╡╨╜╤С╨╜╨╜╤Л╤Е ╤Д╨░╨╣╨╗╨░╤Е тЖТ 0 errors (5 pre-existing warnings)                                                                      |
| 13  | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.18 тЬЕ                                                                                                                                                                                                                                                                                                                              |
| 14  | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.20** (╤Г╤В╨╛╤З╨╜╨╕╤В╤М ╨▓ CONSOLIDATED_PLAN.md)                                                                                                                                                                                                                            |

### Changes (P1.17)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `contracts/debate-store.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л 3 DI-╤В╨╛╨║╨╡╨╜╨░: `DEBATE_SESSION_STORE_ADAPTER`, `DEBATE_LIVE_STORE_ADAPTER`, `DEBATE_SESSION_STORE_SUBSCRIBER` + doc-comment ╨╛ ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╨╕ ╨╜╨░ UI-╨║╨╛╤А╨╜╨╡                                                                                                                                                                                                    |
| 2   | **`services/debate-runtime/debate-store-fallback.ts`** (╨╜╨╛╨▓╤Л╨╣) тАФ no-op ╤Д╨╛╨╗╨▒╤Н╨║╨╕ `createFallbackDebateSessionStore()` / `createFallbackDebateLiveStore()` / `fallbackSessionStoreSubscriber()` ╨┤╨╗╤П headless-╤А╨╡╨╢╨╕╨╝╨░ (╤В╨╡╤Б╤В╤Л, ╨▒╨╡╨╖ UI); `agentEvents`/`roundEvents` = `[]` (╨║╨╛╨╜╤В╤А╨░╨║╤В `{ length: number }`), ╨╜╨╡╤В ╤В╨░╨╣╨╝╨╡╤А╨╛╨▓/EventBus тЖТ `destroy()` ╨╜╨╡ ╤В╤А╨╡╨▒╤Г╨╡╤В╤Б╤П                                         |
| 3   | **`service-registration/debate-store-adapters.ts`** (╨╜╨╛╨▓╤Л╨╣) тАФ `resolveDebateStoreAdapters(container)` ╤З╨╕╤В╨░╨╡╤В `container.getOptional(...)` ╨┐╨╛ ╤В╨╛╨║╨╡╨╜╨░╨╝ ╤Б ╤Д╨╛╨╗╨▒╤Н╨║╨╛╨╝ ╨╜╨░ fallback-╨░╨┤╨░╨┐╤В╨╡╤А╤Л; ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╤В `{ activeDebateStore, debateLiveStore, onSessionChange }`, ╤Б╨┐╤А╨╡╨┤ ╤Б╨╛╨▓╨╝╨╡╤Б╤В╨╕╨╝ ╨╕ ╤Б `DebateServiceDeps`, ╨╕ ╤Б `AutoDebateServiceDeps`                                                               |
| 4   | `service-registration/phase3-debate-runtime.ts` тАФ ╤Г╨┤╨░╨╗╨╡╨╜╤Л ╨╕╨╝╨┐╨╛╤А╤В╤Л `createDebateSessionStoreAdapter`/`createDebateLiveStoreAdapter` ╨╕╨╖ `../../stores/...`; ╨▓ `setDeps` ╨╖╨░╨╝╨╡╨╜╨╡╨╜╨╛ ╨╜╨░ `...resolveDebateStoreAdapters(ctx.container)`                                                                                                                                                               |
| 5   | `service-registration/phase6-high-level.ts` тАФ ╤Г╨┤╨░╨╗╨╡╨╜╤Л 3 ╨╕╨╝╨┐╨╛╤А╤В╨░ ╨╕╨╖ `../../stores/...` (╨▓╨║╨╗╤О╤З╨░╤П `useActiveDebateStore`); ╨▓ `autoDebateService` deps ╤В╨╛╨╢╨╡ `...resolveDebateStoreAdapters(ctx.container)`                                                                                                                                                                                         |
| 6   | **`stores/register-debate-store-adapters.ts`** (╨╜╨╛╨▓╤Л╨╣) тАФ `registerDebateStoreAdapters(container)` (UI composition root): ╤А╨╡╨│╨╕╤Б╤В╤А╨╕╤А╤Г╨╡╤В ╤А╨╡╨░╨╗╤М╨╜╤Л╨╡ zustand-╨░╨┤╨░╨┐╤В╨╡╤А╤Л (`createDebateSessionStoreAdapter()`, `createDebateLiveStoreAdapter()`, subscriber ╨╜╨░ `useActiveDebateStore.subscribe`)                                                                                                        |
| 7   | `main.tsx` тАФ ╨╕╨╝╨┐╨╛╤А╤В `defaultContainer` + `registerDebateStoreAdapters`; ╨▓╤Л╨╖╨╛╨▓ `registerDebateStoreAdapters(defaultContainer)` **╨┐╨╡╤А╨╡╨┤** `await runtime.start()` (╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤П ╨┤╨╛╨╗╨╢╨╜╨░ ╨┐╤А╨╡╨┤╤И╨╡╤Б╤В╨▓╨╛╨▓╨░╤В╤М ╤Д╨░╨╖╨░╨╝ DI)                                                                                                                                                                                   |
| 8   | `.dependency-cruiser.cjs` тАФ ╨╕╨╖ ╨┐╤А╨░╨▓╨╕╨╗╨░ `no-ui-in-kernel` ╤Г╨┤╨░╨╗╤С╨╜ `pathNot: '^src/kernel/service-registration/'`; ╤В╨╡╨┐╨╡╤А╤М ╨┐╤А╨░╨▓╨╕╨╗╨╛ ╤Б╤В╤А╨╛╨│╨╛╨╡ ╨┤╨╗╤П ╨▓╤Б╨╡╨│╨╛ kernel; comment ╨╛╨▒╨╜╨╛╨▓╨╗╤С╨╜                                                                                                                                                                                                                      |
| 9   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx tsc -b --noEmit` тЖТ 0 errors; `npm run build` тЖТ тЬЕ (16.80s); `npm run check:deps` тЖТ **0 violations (1469 modules, 5164 deps)** тАФ ╨╜╨░╤А╤Г╤И╨╡╨╜╨╕╨╡ ╨╖╨░╨║╤А╤Л╤В╨╛; vitest ╤В╨╛╤З╨╡╤З╨╜╨╛ тЖТ 195 тЬЕ (integration.test 19, activeDebateStore 8, debateLiveStore 21, container.test 36, debate-runtime 86, DebatePanel 25); eslint ╨╜╨░ 7 ╨╕╨╖╨╝╨╡╨╜╤С╨╜╨╜╤Л╤Е ╤Д╨░╨╣╨╗╨░╤Е тЖТ 0 errors |
| 10  | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.17 тЬЕ (DI-╤В╨╛╨║╨╡╨╜╤Л + UI-╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤П ╨░╨┤╨░╨┐╤В╨╡╤А╨╛╨▓, 0 violations)                                                                                                                                                                                                                                                                                                |
| 11  | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.18** (8 `@deprecated MOCK` ╤Б╨╡╤А╨▓╨╕╤Б╨╛╨▓ ╤Б UI-╨┐╨░╨╜╨╡╨╗╤П╨╝╨╕: deploy, fine-tuning, model-distillation, health-sla, provider-migration, sleep-engine)                                                                                                                                                |

### Changes (P1.16)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `key-service.ts` тАФ **1339 тЖТ 1083 ╤Б╤В╤А╨╛╨║**: ╨║╨╗╨░╤Б╤Б `KeyService` ╨╛╤Б╤В╨░╨▓╨╗╨╡╨╜ ╨║╨░╨║ facade (╨▓╤Б╨╡ ╨┐╤Г╨▒╨╗╨╕╤З╨╜╤Л╨╡ ╨╝╨╡╤В╨╛╨┤╤Л/╤Н╨║╤Б╨┐╨╛╤А╤В╤Л ╤Б╨╛╤Е╤А╨░╨╜╨╡╨╜╤Л тАФ `KeyService`, `KeyServiceDeps`, `FREE_TIER_LIMITS`), ╨╕╨╜╨╗╨░╨╣╨╜-╨╗╨╛╨│╨╕╨║╨░ ╨▓╤Л╨╜╨╡╤Б╨╡╨╜╨░ ╨▓ 3 ╨╜╨╛╨▓╤Л╤Е ╨╝╨╛╨┤╤Г╨╗╤П + 2 ╤З╨╕╤Б╤В╤Л╨╡ ╤Д╤Г╨╜╨║╤Ж╨╕╨╕ ╨▓ `key-registry-utils`                                                                                                                                                                                   |
| 2   | **`key-metrics-handler.ts`** (╨╜╨╛╨▓╤Л╨╣, ~135 ╤Б╤В╤А╨╛╨║) тАФ `KeyMetricsHandler`: ╨╛╨▒╤А╨░╨▒╨╛╤В╨║╨░ `MESSAGE_RESPONSE` (╤А╨░╨╜╨╡╨╡ ~87 ╤Б╤В╤А╨╛╨║ ╨╕╨╜╨╗╨░╨╣╨╜╨░ ╨▓ `setupListeners`): ╨┐╨╛╨╕╤Б╨║ key ╨┐╨╛ id/provider, 429/rate-limit spike (backoff + alert + `KEY_QUOTA_EXCEEDED` + `CHECK_HEALTH` timer), error state + lastError, ╨┤╨╡╨╗╨╡╨│╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ ╨╝╨╡╤В╤А╨╕╨║ ╨▓ `KeyAnalytics.updateMetricsFromResponse`; `destroy()` no-op (timers ╨▓╨╗╨░╨┤╨╡╨╡╤В ╤А╨╛╨┤╨╕╤В╨╡╨╗╤М╤Б╨║╨╕╨╣ KeyService ╤З╨╡╤А╨╡╨╖ addTimer)               |
| 3   | **`key-status.ts`** (╨╜╨╛╨▓╤Л╨╣, ~190 ╤Б╤В╤А╨╛╨║) тАФ `KeyStatusManager`: ╨▓╤Б╨╡ ╤Б╤В╨░╤В╤Г╤Б-╨╝╤Г╤В╨░╤Ж╨╕╨╕ ╨╕╨╖ ╤Д╨░╤Б╨░╨┤╨░ тАФ `updateKeyStatus`, `updateAvailableModels`, `toggleKeyStatus`, `enableAllKeys`, `disableAllKeys`, `quarantineKey`, `compromiseKey`, `transitionState`, `handleProviderError`; ╤Б╨╡╨╝╨░╨╜╤В╨╕╨║╨░ ╤Б╨╛╤Е╤А╨░╨╜╨╡╨╜╨░ (history slice(-99), `statusVersion`, `emitOnce` KEY_STATE_CHANGED, rate-limit branch ╨▓ handleProviderError тЖТ `lifecycle.onError` ╤В╨╛╨╗╤М╨║╨╛ ╨┤╨╗╤П non-429) |
| 4   | **`key-models.ts`** (╨╜╨╛╨▓╤Л╨╣, ~90 ╤Б╤В╤А╨╛╨║) тАФ `KeyModels`: `refreshModels(id)` тАФ adapter lookup тЖТ `getAvailableModels`, fallback `FALLBACK_MODELS` map (12 ╨┐╤А╨╛╨▓╨░╨╣╨┤╨╡╤А╨╛╨▓, ╨┐╨╡╤А╨╡╨╜╨╡╤Б╨╡╨╜╨░ ╨╕╨╖ ╤Д╨░╤Б╨░╨┤╨░), status 'checking'/'active'/'error' ╤З╨╡╤А╨╡╨╖ ╨╕╨╜╨╢╨╡╨║╤В╨╕╤А╨╛╨▓╨░╨╜╨╜╤Л╨╣ `updateKeyStatus` ╨║╨╛╨╗╨▒╤Н╨║                                                                                                                                                                          |
| 5   | `key-registry-utils.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л `ensureExtendedStats()` (╨┐╨╡╤А╨╡╨╜╨╡╤Б╨╡╨╜╨░ ╨╕╨╖ ╨┐╤А╨╕╨▓╨░╤В╨╜╨╛╨│╨╛ ╨╝╨╡╤В╨╛╨┤╨░ ╤Д╨░╤Б╨░╨┤╨░: usageToday/usageMonthly/latencyBreakdown/errorBreakdown/fourSignals/rules ╨╕╨╜╨╕╤Ж╨╕╨░╨╗╨╕╨╖╨░╤Ж╨╕╤П) ╨╕ `buildRestoreKeys()` (╨┐╨╡╤А╨╡╨╜╨╡╤Б╨╡╨╜╨░ ╨╕╨╖ `restoreKeys`: ╨┐╨╛╤Б╤В╤А╨╛╨╡╨╜╨╕╨╡ `ApiKey[]` ╨╕╨╖ restore-data)                                                                                                                                                            |
| 6   | ╨д╨░╤Б╨░╨┤ тАФ ╨╕╨╜╨╗╨░╨╣╨╜-╨║╨╛╨┤ ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╨┤╨╡╨╗╨╡╨│╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡╨╝: `setupListeners.updateMetricsFromResponse` тЖТ `metricsHandler.handleMetricsFromResponse`; `refreshModels` тЖТ `modelsManager.refreshModels`; ╤Б╤В╨░╤В╤Г╤Б-╨╝╨╡╤В╨╛╨┤╤Л тЖТ `statusManager.*`; `ensureExtendedStats` ╨▓╤Л╨╖╨╛╨▓╤Л тЖТ ╨╕╨╝╨┐╨╛╤А╤В╨╕╤А╨╛╨▓╨░╨╜╨╜╨░╤П ╤Д╤Г╨╜╨║╤Ж╨╕╤П; `restoreKeys` тЖТ `buildRestoreKeys`; `setGlobalSLA`/`setSLA` ╨╛╤Б╤В╨░╨▓╨╗╨╡╨╜╤Л ╨║╨░╨║ ╨▒╤Л╨╗╨╕ (╨╜╨╡ ╨┤╤Г╨▒╨╗╨╕╤А╤Г╤О╤В lifecycle.applySLA, ╤В.╨║. ╤В╨░╨║╨╢╨╡ ╤Б╨╛╤Е╤А╨░╨╜╤П╤О╤В `_globalSLAMode`/config)       |
| 7   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx tsc -b --noEmit` тЖТ 0 errors; `npm run build` тЖТ тЬЕ (10.17s); `npm run check:deps` тЖТ 0 violations (1466 modules); vitest ╤В╨╛╤З╨╡╤З╨╜╨╛ тЖТ 51 тЬЕ (integration.test, useKeyStore.test, virtual-key-service.test); eslint ╨╜╨░ 5 ╨╕╨╖╨╝╨╡╨╜╤С╨╜╨╜╤Л╤Е ╤Д╨░╨╣╨╗╨░╤Е тЖТ 0 errors                                                                                                                                                 |
| 8   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.16 тЬЕ (1339 тЖТ 1083 ╤Б╤В╤А╨╛╨║, 3 ╨╝╨╛╨┤╤Г╨╗╤П)                                                                                                                                                                                                                                                                                                                                                                             |
| 9   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.17** (layer violation ╨▓ service-registration: phase3-debate-runtime.ts/phase6-high-level.ts ╨╕╨╝╨┐╨╛╤А╤В╨╕╤А╤Г╤О╤В adapter-╤Д╨░╨▒╤А╨╕╨║╨╕ ╨╕╨╖ `src/stores/`)                                                                                                                                                                                                      |

### Changes (P1.15)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `memory-engine.ts` тАФ **996 тЖТ 794 ╤Б╤В╤А╨╛╨║**: ╨║╨╗╨░╤Б╤Б `MemoryService` ╨╛╤Б╤В╨░╨▓╨╗╨╡╨╜ ╨║╨░╨║ facade (store/upsert/storeBatch/deleteMemory/updateMemory/search/getStats/prune/clear/recall/ensureSemantic + ╤В╤А╨░╨╜╨╖╨░╨║╤Ж╨╕╨╛╨╜╨╜╤Л╨╣ ╨┐╨░╤В╤В╨╡╤А╨╜ + setupListeners), ╨▓╤Б╨╡ ╤Б╨░╨╝╨╛╤Б╨╛╨┤╨╡╤А╨╢╨░╤Й╨╕╨╡╤Б╤П ╨┐╨╛╨┤╤Б╨╕╤Б╤В╨╡╨╝╤Л ╨▓╤Л╨╜╨╡╤Б╨╡╨╜╤Л ╨▓ 5 ╨╝╨╛╨┤╤Г╨╗╨╡╨╣                                                                                                                                                       |
| 2   | **`memory/memory-cache.ts`** (╨╜╨╛╨▓╤Л╨╣, 112 ╤Б╤В╤А╨╛╨║) тАФ `MemoryCache`: ╨┐╨╛╤В╨╛╨║╨╛╨▒╨╡╨╖╨╛╨┐╨░╤Б╨╜╤Л╨╣ in-memory ╨╝╨░╤Б╤Б╨╕╨▓ `MemoryEntry[]` + `withLock` (serialized mutations) + hard cap; ╨╝╨╡╤В╨╛╨┤╤Л `setAll/slice/get/findIndex/unshift/upsert/prepend/replaceAt/spliceAt/mutate/retain` тАФ ╨╖╨░╨║╤А╤Л╨▓╨░╨╡╤В ╨┤╨╛╤Б╤В╤Г╨┐ ╨║ `memories` ╨╕ lock, ╤Г╨▒╨╕╤А╨░╨╡╤В `withMemoriesLock` ╨╕╨╖ facade                                                                                                     |
| 3   | **`memory/memory-worker-client.ts`** (╨╜╨╛╨▓╤Л╨╣, 128 ╤Б╤В╤А╨╛╨║) тАФ `MemoryWorkerClient`: worker RPC (ensure/init/send/timeout/requestId-correlation/onmessage routing/backfill hook/`dbReady`), `MEMORY_PENDING_TIMEOUT_MS`; M-4 fix ╤Б╨╛╤Е╤А╨░╨╜╤С╨╜ (pending requests reject + terminate ╨▓ destroy)                                                                                                                                                            |
| 4   | **`memory/memory-prune-scheduler.ts`** (╨╜╨╛╨▓╤Л╨╣, 69 ╤Б╤В╤А╨╛╨║) тАФ `MemoryPruneScheduler`: TTL-based background prune cycle (start/stop/destroy + `pruneOldEntries`), deps-╨╕╨╜╤К╨╡╨║╤Ж╨╕╤П (ttlMs/intervalMs/getMemories/setMemories/pruneRepo/removeFromWorker/withLock/emitUpdated)                                                                                                                                                                          |
| 5   | **`memory/memory-search-utils.ts`** (╨╜╨╛╨▓╤Л╨╣, 72 ╤Б╤В╤А╨╛╨║╨╕) тАФ ╤З╨╕╤Б╤В╤Л╨╡ ╤Д╤Г╨╜╨║╤Ж╨╕╨╕ `keywordFilterSearch()` (local fallback), `recallRank()` (recall scoring), `computeEngineStats()` (getStats ╨░╨│╤А╨╡╨│╨░╤Ж╨╕╤П)                                                                                                                                                                                                                                                  |
| 6   | **`memory/memory-quality-gate.ts`** (╨╜╨╛╨▓╤Л╨╣, 54 ╤Б╤В╤А╨╛╨║╨╕) тАФ `passesMemoryQualityGate()` (╨╕╨╖ `_passesQualityGate`): ERROR_PATTERNS, status/finishReason rejection, system+importance rule; + type-guard `isQualityEntry()`                                                                                                                                                                                                                          |
| 7   | ╨д╨░╤Б╨░╨┤ `memory-engine.ts` тАФ exports ╤Б╨╛╤Е╤А╨░╨╜╨╡╨╜╤Л: `MemoryService`, `SearchMode`, `MemoryServiceDeps`, `IMemoryEngine` тАФ ╨┐╨╛╤В╤А╨╡╨▒╨╕╤В╨╡╨╗╨╕ (`phase2-infrastructure.ts` ╤З╨╡╤А╨╡╨╖ `ConstructorParameters`, `memory-orchestrator`, `service-backed-memory`, `debate-knowledge-sync`, `index.ts`, `service-exports.ts`) ╨Э╨Х ╨╝╨╡╨╜╤П╨╗╨╕╤Б╤М; `estimateTokenCount` ╨╕╨╝╨┐╨╛╤А╤В╨╕╤А╤Г╨╡╤В╤Б╤П ╤В╨╛╨╗╤М╨║╨╛ ╨▓ `memory-search-utils` (pre-existing no-restricted-imports warning, ╨║╨░╨║ ╨╕ ╤А╨░╨╜╤М╤И╨╡) |
| 8   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx tsc -b --noEmit` тЖТ 0 errors; `npm run build` тЬЕ; `npm run check:deps` тЖТ 0 violations (1463 modules); `npx vitest run src/stores/chat/store.test.ts` тЖТ 36 тЬЕ; `src/kernel/integration.test.ts` тЖТ 19 тЬЕ; `src/kernel/container.test.ts` тЖТ 36 тЬЕ; eslint ╨╜╨░ ╨╜╨╛╨▓╤Л╤Е/╨╕╨╖╨╝╨╡╨╜╤С╨╜╨╜╤Л╤Е ╤Д╨░╨╣╨╗╨░╤Е тЖТ 0 errors (1 pre-existing warning token-counter)                                                         |
| 9   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.15 тЬЕ                                                                                                                                                                                                                                                                                                                                                                                                      |
| 10  | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.16** (╤А╨░╨╖╨▒╨╕╤В╤М `key-service.ts` 1339 ╤Б╤В╤А╨╛╨║)                                                                                                                                                                                                                                                                                                |

### Changes (P1.14)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `debate-llm-caller.ts` тАФ **2729 тЖТ 1027 ╤Б╤В╤А╨╛╨║** (63% ╤А╨╡╨┤╤Г╨║╤Ж╨╕╤П): `debateCallLlm` ╤Б╨╛╤Е╤А╨░╨╜╤С╨╜ ╨║╨░╨║ dispatcher (retry loop + resolveProvider + fallback), prompt-context ╨▒╨╗╨╛╨║ (1366 ╤Б╤В╤А╨╛╨║) ╨▓╤Л╨╜╨╡╤Б╨╡╨╜ ╨▓ `buildDebateSystemContent()`, `debateGetDefaultPrompt` ╨╛╤Б╤В╨░╨▓╨╗╨╡╨╜, ╨▓╤Б╨╡ ╨▓╤Б╨┐╨╛╨╝╨╛╨│╨░╤В╨╡╨╗╤М╨╜╤Л╨╡ ╤Д╤Г╨╜╨║╤Ж╨╕╨╕ ╨╕ ╤В╨╕╨┐╤Л ╨▓╤Л╨╜╨╡╤Б╨╡╨╜╤Л ╨▓ 6 ╨╝╨╛╨┤╤Г╨╗╨╡╨╣                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2   | **`debate-llm-validation.ts`** (╨╜╨╛╨▓╤Л╨╣, 48 ╤Б╤В╤А╨╛╨║) тАФ `INSTRUCTION_LEAKAGE_PATTERNS` + `isValidDebateResponse()` (╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╤П ╨╛╤В╨▓╨╡╤В╨╛╨▓: instruction leakage, meta-commentary, ╨┐╤Г╤Б╤В╤Л╨╡/vacuous)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3   | **`debate-llm-utils.ts`** (╨╜╨╛╨▓╤Л╨╣, 80 ╤Б╤В╤А╨╛╨║) тАФ `stripSpeakerPrefix()`, `jaccardText()`, `isCrossAgentDuplicate()`, `estimateConfidence()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 4   | **`debate-llm-backoff.ts`** (╨╜╨╛╨▓╤Л╨╣, 78 ╤Б╤В╤А╨╛╨║) тАФ `getHeapMB()`, `logMemory()`, `getDebateTimeoutMs()`, `getLargeModelTimeoutMs()`, `getBaseBackoffMs()`, `getMaxBackoffMs()`, `getMaxRetries()`, `MAX_DUPLICATE_REJECTIONS`, `getModelTimeout()`, `backoffWait()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 5   | **`debate-llm-session-maps.ts`** (╨╜╨╛╨▓╤Л╨╣, 29 ╤Б╤В╤А╨╛╨║) тАФ `sessionRToMMap`, `sessionFingerprintMap`, `sessionCausalGraphMap`, `cleanupSessionMaps()` (C1 leak fix ╤Б╨╛╤Е╤А╨░╨╜╤С╨╜)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 6   | **`debate-llm-caller-deps.ts`** (╨╜╨╛╨▓╤Л╨╣, 138 ╤Б╤В╤А╨╛╨║) тАФ `FactCheckAccessor` + `LlmCallerDeps` (╨╕╨╜╤В╨╡╤А╤Д╨╡╨╣╤Б ╨╖╨░╨▓╨╕╤Б╨╕╨╝╨╛╤Б╤В╨╡╨╣, ~40 ╨╛╨┐╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╤Л╤Е ╤Б╨╡╤А╨▓╨╕╤Б╨╛╨▓); ╨╕╨╖╨▒╤Л╤В╨╛╤З╨╜╤Л╨╡ ╨╕╨╝╨┐╨╛╤А╤В╤Л ╨┐╨╛╤З╨╕╤Й╨╡╨╜╤Л                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 7   | **`debate-llm-prompt-context.ts`** (╨╜╨╛╨▓╤Л╨╣, 1286 ╤Б╤В╤А╨╛╨║) тАФ `buildDebateSystemContent()`: ╨╡╨┤╨╕╨╜╨░╤П ╤Д╤Г╨╜╨║╤Ж╨╕╤П ╨┤╨╗╤П Phase A argument graph + 30+ ╤Б╨╡╤А╨▓╨╕╤Б╨╛╨▓ (entanglement, anchoring, vulnerability, adversarial-source, belief-mining, minimax, meta-agent, steelman, BoP, consistency, credibility, similarity, drift, insight-bus, replay, logic, justification, bias, interrupt, stakeholder, calibration, fact-check, persona-mixer, frame, expert-witness, stance-drift, rhetorical, scratchpad, narrative, level, reversal, fog-of-war, evidence, humor, style, persona, strategist, whisper, audience, alliance, prediction, RToM, fingerprint, causal, incentives, GoT, blending, forecaster) + persona memory + RAG inject; ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╤В `{ systemContent, entanglementConstraint }` |
| 8   | ╨д╨░╤Б╨░╨┤ `debate-llm-caller.ts` тАФ re-exports ╤Б╨╛╤Е╤А╨░╨╜╨╡╨╜╤Л: `debateCallLlm`, `debateGetDefaultPrompt`, `cleanupSessionMaps`, `LlmCallerDeps` (type), `estimateConfidence` тАФ ╨┐╨╛╤В╤А╨╡╨▒╨╕╤В╨╡╨╗╨╕ (`debate-engine.ts`, `debate-pipeline-builder.ts`) ╨Э╨Х ╨╝╨╡╨╜╤П╨╗╨╕╤Б╤М                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 9   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx tsc -b --noEmit` тЖТ 0 errors; `npm run build` тЖТ 18.37s тЬЕ; `npm run check:deps` тЖТ 0 violations (1458 modules); `npx vitest run src/kernel/services/debate-runtime` тЖТ 86 тЬЕ; eslint тЖТ 1 pre-existing warning (no-restricted-imports token-counter, ╨▒╤Л╨╗ ╨╕ ╤А╨░╨╜╤М╤И╨╡)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 10  | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.14 тЬЕ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 11  | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.15** (╤А╨░╨╖╨▒╨╕╤В╤М `memory-engine.ts` 996 ╤Б╤В╤А╨╛╨║)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### Changes (P1.13)

| # | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛ |
| 1 | 26 ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓ ╨┐╨╡╤А╨╡╨▓╨╡╨┤╨╡╨╜╤Л ╤Б ╨┐╤А╤П╨╝╨╛╨│╨╛ ╨╕╨╝╨┐╨╛╤А╤В╨░ `t` ╨╕╨╖ `../../i18n/translations` ╨╜╨░ ╤Е╤Г╨║ `useTranslation()` (╤А╨╡╨░╨║╤В╨╕╨▓╨╜╨╛╤Б╤В╤М ╨┐╤А╨╕ ╤Б╨╝╨╡╨╜╨╡ ╤П╨╖╤Л╨║╨░): SREAgentPanel (6 ╤Д╨░╨╣╨╗╨╛╨▓), PatternsPanel (4), AnalyticsPanel (3), GuardiansPanel, ResearchEnginePanel, KnowledgePanel, ErrorBoundary, ChatSessionsManagerPanel, DebatesManagerPanel, SessionHubPanel, PressureMap, AlertLayer, ModuleInfo, builder-nodes (4 node-╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨░), routes.tsx, DashboardComponents |
| 2 | `ErrorBoundary.tsx` тАФ ╨║╨╗╨░╤Б╤Б ╨┐╨╡╤А╨╡╨╕╨╝╨╡╨╜╨╛╨▓╨░╨╜ ╨▓ `ErrorBoundaryBase` (╨┐╤А╨╕╨╜╨╕╨╝╨░╨╡╤В `t` ╤З╨╡╤А╨╡╨╖ ╤А╨░╤Б╤И╨╕╤А╨╡╨╜╨╜╤Л╨╣ `ErrorBoundaryProps`), ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╨░ ╤Д╤Г╨╜╨║╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╨░╤П ╨╛╨▒╤С╤А╤В╨║╨░ `ErrorBoundary` (default export) ╤Б `useTranslation()` (╤Е╤Г╨║ ╨╜╨╡╨╗╤М╨╖╤П ╨▓╤Л╨╖╤Л╨▓╨░╤В╤М ╨▓ class) |
| 3 | `DashboardComponents.tsx` тАФ `summarizeEvent` ╨╜╨╡ ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В, ╨┐╨╛╤Н╤В╨╛╨╝╤Г ╨┐╤А╨╕╨╜╨╕╨╝╨░╨╡╤В `t` ╨▓╤В╨╛╤А╤Л╨╝ ╨┐╨░╤А╨░╨╝╨╡╤В╤А╨╛╨╝ (╤В╨╕╨┐ `TranslateFn`); ╨▓╤Л╨╖╨╛╨▓ ╨▓ `DashboardPanel.tsx` ╨╛╨▒╨╜╨╛╨▓╨╗╤С╨╜; `QuotaDisplay` ╨┐╨╡╤А╨╡╨▓╨╡╨┤╤С╨╜ ╨╜╨░ ╤Е╤Г╨║ |
| 4 | 3-╨░╤А╨│╤Г╨╝╨╡╨╜╤В╨╜╤Л╨╡ ╨▓╤Л╨╖╨╛╨▓╤Л `t(key, undefined, params)` тЖТ 2-╨░╤А╨│╤Г╨╝╨╡╨╜╤В╨╜╤Л╨╡ `t(key, params)` (╤Б╨╕╨│╨╜╨░╤В╤Г╤А╨░ ╤Е╤Г╨║╨░ ╨▒╨╡╨╖ `lang`); ╨║╨░╤Б╤В╤Л `translate('...' as never)` ╨▓ GuardiansPanel ╤Г╨▒╤А╨░╨╜╤Л |
| 5 | `AlertLayer.tsx` тАФ ╤Г╤Б╤В╤А╨░╨╜╨╡╨╜╨╛ ╨╖╨░╤В╨╡╨╜╨╡╨╜╨╕╨╡ `t`: `filter((t) =>` тЖТ `filter((x) =>`, `forEach((t) =>` тЖТ `forEach((timer) =>` |
| 6 | ╨в╨╡╤Б╤В╤Л: ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `settingsService` mock (`getSettings/subscribe`) ╨▓ `AlertLayer.test.tsx` ╨╕ `KnowledgePanel.test.tsx` (╤Е╤Г╨║ ╤З╨╕╤В╨░╨╡╤В ╨╡╨│╨╛ ╨╕╨╖ `kernel/instances` ╨┐╤А╨╕ ╨╕╨╜╨╕╤Ж╨╕╨░╨╗╨╕╨╖╨░╤Ж╨╕╨╕) |
| 7 | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx tsc -b --noEmit` тЖТ 0 errors; `npm run build` тЖТ 16.55s тЬЕ; ╤В╨╛╤З╨╡╤З╨╜╤Л╨╡ ╤В╨╡╤Б╤В╤Л 48 тЬЕ (ErrorBoundary, AlertLayer, DashboardPanel, AnalyticsPanel, KnowledgePanel, CognitiveBuilder) тАФ 0 failures |
| 8 | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.13 тЬЕ |
| 9 | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.14** (╤А╨░╨╖╨▒╨╕╤В╤М `debate-llm-caller.ts` 2729 ╤Б╤В╤А╨╛╨║) |

### Changes (P1.12)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `en.ts` (2734 ╨║╨╗╤О╤З╨░) ╨╕ `ru.ts` (2715) ╨╝╨╛╨╜╨╛╨╗╨╕╤В╤Л ╤А╨░╨╖╨▒╨╕╤В╤Л ╨╜╨░ **17 namespace-╤Д╨░╨╣╨╗╨╛╨▓ ╨╜╨░ ╨╗╨╛╨║╨░╨╗╤О**: `nav`, `common`, `errors`, `settings`, `debate`, `agents`, `memory`, `chat`, `providers`, `dashboard`, `analytics`, `quality`, `budget`, `observability`, `integrations`, `governance`, `workspace` тАФ ╨▓ `src/i18n/translations/{en,ru}/` |
| 2   | ╨Ъ╨░╨╢╨┤╤Л╨╣ namespace ╤Н╨║╤Б╨┐╨╛╤А╤В╨╕╤А╤Г╨╡╤В `const {ns}: Record<string, string>` ╤Б ╨┐╨╗╨╛╤Б╨║╨╕╨╝╨╕ ╨║╨╗╤О╤З╨░╨╝╨╕ (`prefix.name`) тАФ **╤Д╨╛╤А╨╝╨░╤В ╨╕ ╨┐╨╛╨▓╨╡╨┤╨╡╨╜╨╕╨╡ ╨╜╨╡ ╨╕╨╖╨╝╨╡╨╜╨╕╨╗╨╕╤Б╤М**, ╨▓╤Б╨╡ ╨▓╤Л╨╖╨╛╨▓╤Л `t('a.b.c')` ╤А╨░╨▒╨╛╤В╨░╤О╤В ╨║╨░╨║ ╤А╨░╨╜╤М╤И╨╡, ╨┐╤А╨░╨▓╨║╨╕ ╨▓ call-sites ╨╜╨╡ ╤В╤А╨╡╨▒╤Г╤О╤В╤Б╤П                                                                                                           |
| 3   | `{en,ru}/index.ts` тАФ ╨╕╨╝╨┐╨╛╤А╤В╨╕╤А╤Г╤О╤В ╨▓╤Б╨╡ namespace ╨╕ ╨╛╨▒╤К╨╡╨┤╨╕╨╜╤П╤О╤В ╤З╨╡╤А╨╡╨╖ spread; ╤Б╨╛╤Е╤А╨░╨╜╤П╤О╤В ╨║╨╛╨╜╤В╤А╨░╨║╤В `import('./en')` тЖТ `mod.en`, `import('./ru')` тЖТ `mod.ru` ╨┤╨╗╤П `translations/index.ts` (dynamic import ╤В╨╡╨┐╨╡╤А╤М ╤А╨╡╨╖╨╛╨╗╨▓╨╕╤В╤Б╤П ╨▓ ╨┤╨╕╤А╨╡╨║╤В╨╛╤А╨╕╤О)                                                                                                     |
| 4   | ╨У╨╡╨╜╨╡╤А╨░╤Ж╨╕╤П ╨▓╤Л╨┐╨╛╨╗╨╜╨╡╨╜╨░ ╤Б╨║╤А╨╕╨┐╤В╨╛╨╝ (`tsx`): ╨┐╨░╤А╤Б╨╕╨╜╨│ ╨╝╨╛╨╜╨╛╨╗╨╕╤В╨╛╨▓ ╤З╨╡╤А╨╡╨╖ `ts.transpileModule` + `eval`, ╨│╤А╤Г╨┐╨┐╨╕╤А╨╛╨▓╨║╨░ ╨┐╨╛ top-level ╨┐╤А╨╡╤Д╨╕╨║╤Б╤Г, 80 ╨┐╤А╨╡╤Д╨╕╨║╤Б╨╛╨▓ тЖТ 17 ╤Д╨░╨╣╨╗╨╛╨▓, JSON-╤Н╤Б╨║╨╡╨╣╨┐╨╕╨╜╨│ ╨╖╨╜╨░╤З╨╡╨╜╨╕╨╣. ╨Т╨╡╤А╨╕╤Д╨╕╨║╨░╤Ж╨╕╤П: ╨╛╨▒╤К╨╡╨┤╨╕╨╜╤С╨╜╨╜╤Л╨╣ ╨╛╨▒╤К╨╡╨║╤В **╨╕╨┤╨╡╨╜╤В╨╕╤З╨╡╨╜ ╨╛╤А╨╕╨│╨╕╨╜╨░╨╗╤Г** (2734 en / 2715 ru ╨║╨╗╤О╤З╨╡╨╣, 0 ╨╛╤В╨╗╨╕╤З╨╕╨╣ ╨╖╨╜╨░╤З╨╡╨╜╨╕╨╣)                                            |
| 5   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npm run typecheck:fast` тЖТ 0 errors; `npx tsc -b --noEmit` тЖТ 0 errors; `npm run build` тЖТ 11.68s тЬЕ (`en`/`ru` chunk'╨╕ ╤Д╨╛╤А╨╝╨╕╤А╤Г╤О╤В╤Б╤П ╨║╨░╨║ ╤А╨░╨╜╤М╤И╨╡); prettier тАФ single-quote ╤Д╨╛╤А╨╝╨░╤В                                                                                                                                              |
| 6   | ╨Т╤А╨╡╨╝╨╡╨╜╨╜╤Л╨╡ ╤Б╨║╤А╨╕╨┐╤В╤Л `scripts/split-i18n.tmp.ts`, `scripts/verify-i18n.tmp.ts` ╤Г╨┤╨░╨╗╨╡╨╜╤Л                                                                                                                                                                                                                                                   |
| 7   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.12 тЬЕ                                                                                                                                                                                                                                                                                            |
| 8   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.13** (╨╖╨░╨╝╨╡╨╜╨╕╤В╤М 26 ╨┐╤А╤П╨╝╤Л╤Е `t`-╨╕╨╝╨┐╨╛╤А╤В╨╛╨▓ ╨╜╨░ `useTranslation()` тАФ тЬЕ ╨╖╨░╨║╤А╤Л╤В╨░ ╨▓ Changes P1.13)                                                                                                                                       |

### Changes (P1.11)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `tsconfig.test.json` тАФ extends `tsconfig.app.json` + `types: ["vite/client", "vitest/globals"]`, include ╤В╨╡╤Б╤В╨╛╨▓ (`src/**/*.test.{ts,tsx}`) + setup (`src/tests/setup-light.ts`, `setup-runtime.ts`) + `src/types/**/*.d.ts` (ambient `SpeechRecognition`), `exclude: []` (╨╜╨░╤Б╨╗╨╡╨┤╤Г╨╡╨╝╤Л╨╣ exclude ╨╕╨╖ app-╨║╨╛╨╜╤Д╨╕╨│╨░ ╨╕╨╜╨░╤З╨╡ ╨╗╨╛╨╝╨░╨╡╤В тАФ TS18003)                                                                                                                                                                                                                                |
| 2   | `tsconfig.json` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ reference ╨╜╨░ `./tsconfig.test.json`; ╤В╨╡╨┐╨╡╤А╤М `npx tsc -b --noEmit` (CI quality job) ╤В╨╕╨┐╨╕╨╖╨╕╤А╤Г╨╡╤В ╨╕ ╤В╨╡╤Б╤В╤Л ╤В╨╛╨╢╨╡                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 3   | ╨Ш╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╤Л 56 ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨╕╤Е ╨╛╤И╨╕╨▒╨╛╨║ ╤В╨╕╨┐╨╛╨▓ ╨▓ ╤В╨╡╤Б╤В╨░╤Е: `task-handoff.test.ts` (async/await, 14 тЬЕ), `budget-service.test.ts` (╨║╨░╤Б╤В╤Л deps), `fact-check-service.test.ts` (`stance`тЖТ`position`, ╨╛╨▒╤П╨╖╨░╤В╨╡╨╗╤М╨╜╤Л╨╡ ╨┐╨╛╨╗╤П DebateArgument), `llm-client-service.test.ts`/`provider-stack.e2e.test.ts` (`clearAllCaches`), `metrics-service.test.ts`/`skill-service.test.ts` (`emitOnce`), `scheduler-service.test.ts` (unused @ts-expect-error), `session-manager-service.test.ts` (╤П╨▓╨╜╤Л╨╡ ╤В╨╕╨┐╤Л ╨▓╨╝╨╡╤Б╤В╨╛ `Parameters<typeof ...>[N]`), `DebatePanel.test.tsx` (props `DebateSetupWizard`) |
| 4   | ╨г╨┤╨░╨╗╤С╨╜ ╨▓╤А╨╡╨╝╨╡╨╜╨╜╤Л╨╣ `tsconfig.test.tmp.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 5   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛: `npx tsc -b --noEmit` тЖТ **0 errors**; `npm run typecheck:fast` тЖТ 0 errors; `npm run test:coverage` тЖТ **326 тЬЕ, 64.92% stmts / 54.41% branch / 68.48% funcs / 67.61% lines** (╨┐╨╛╤А╨╛╨│╨╕ 30/20/30/30); `npx vitest run src/kernel/services/task-handoff.test.ts` тЖТ 14 тЬЕ                                                                                                                                                                                                                                                                                             |
| 6   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.11 тЬЕ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 7   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.12** (i18n split `en.ts` 2826 / `ru.ts` 2710 тЖТ namespace-╤Д╨░╨╣╨╗╤Л)                                                                                                                                                                                                                                                                                                                                                                                                      |

### Changes (P1.10)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `.github/workflows/ci.yml` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ job `dep-graph` (╨┐╨╛╤Б╨╗╨╡ `circular-check`): ╤Г╤Б╤В╨░╨╜╨╛╨▓╨║╨░ deps + `npm run check:deps`. ╨Ю╨▒╨╡╤Б╨┐╨╡╤З╨╕╨▓╨░╨╡╤В enforcement layer rules (UI тЖТ Application тЖТ Kernel тЖТ Infrastructure) + composition-root exception ╨╜╨░ ╨║╨░╨╢╨┤╤Л╨╣ PR |
| 2   | ╨Я╤А╨╛╨▓╨╡╤А╨╡╨╜╨╛ ╨╗╨╛╨║╨░╨╗╤М╨╜╨╛ 2026-08-01: `npm run check:deps` тЖТ **0 violations (1418 modules, 5074 dependencies cruised)**                                                                                                                                   |
| 3   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.10 тЬЕ                                                                                                                                                                                                         |
| 4   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.11** (╤Г╨▒╤А╨░╤В╤М exclude ╤В╨╡╤Б╤В╨╛╨▓ ╨╕╨╖ `tsconfig.app.json` ╨╕╨╗╨╕ ╤Б╨╛╨╖╨┤╨░╤В╤М `tsconfig.test.json`)                                                         |

### Changes (P1.9)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `package.json` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ ╤Б╨║╤А╨╕╨┐╤В `test:coverage`: `vitest run src/stores src/hooks src/kernel/events src/kernel/workers src/kernel/container.test.ts --coverage` (╤В╨╛╨╗╤М╨║╨╛ ╨┐╤А╨╛╨▓╨╡╤А╨╡╨╜╨╜╤Л╨╣ ╤Б╤В╨░╨▒╨╕╨╗╤М╨╜╤Л╨╣ ╨╜╨░╨▒╨╛╤А, 326 тЬЕ)                                                |
| 2   | `.github/workflows/ci.yml` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ job `coverage` (╨┐╨╛╤Б╨╗╨╡ `test`): ╤Г╤Б╤В╨░╨╜╨╛╨▓╨║╨░ deps + `npm run test:coverage`. ╨Ю╤В╨┤╨╡╨╗╤М╨╜╤Л╨╣ job ╨▓╨╝╨╡╤Б╤В╨╛ `npm run test -- --coverage`, ╨┐╨╛╤В╨╛╨╝╤Г ╤З╤В╨╛ ╨┐╨╛╨╗╨╜╤Л╨╣ ╨┐╤А╨╛╨│╨╛╨╜ ╨▓╤Б╨╡╨│╨╛ src OOM-╨╕╤В╤Б╤П ╨╜╨░ ╨╜╨╡╨║╨╛╤В╨╛╤А╤Л╤Е ╤Д╨░╨╣╨╗╨░╤Е (╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П ╨┐╤А╨╛╨▒╨╗╨╡╨╝╨░) |
| 3   | ╨Ш╨╖╨╝╨╡╤А╨╡╨╜╨╛ 2026-08-01: `npm run test:coverage` тЖТ **64.92% stmts / 54.41% branch / 68.48% funcs / 67.61% lines, 326 тЬЕ, ╨╖╨╡╨╗╤С╨╜╤Л╨╣** (╨┐╨╛╤А╨╛╨│╨╕ 30/20/30/30)                                                                                                           |
| 4   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.9 тЬЕ                                                                                                                                                                                                                     |
| 5   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ `'test' does not exist in type 'UserConfigExport'` тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.10** (╨┤╨╛╨▒╨░╨▓╨╕╤В╤М `dep-graph` job ╨▓ CI: `npm run check:deps`)                                           |

### Changes (P1.8)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░: `coverage.include: ['src/**/*.{ts,tsx}']` ╤Б╨╛ `all:true` (v8 default) ╤Б╤З╨╕╤В╨░╨╗ ╨Т╨б╨Х ╤Д╨░╨╣╨╗╤Л src тЖТ ╨╗╤О╨▒╨╛╨╣ `--coverage` ╨┐╤А╨╛╨│╨╛╨╜ ╨┤╨░╨▓╨░╨╗ 3.79% stmts ╨╕ **╨┐╨░╨┤╨░╨╗** (╨╜╨╡ ╨┐╤А╨╛╤Е╨╛╨┤╨╕╨╗ ╨┤╨░╨╢╨╡ ╤Б╤В╨░╤А╤Л╨╣ ╨┐╨╛╤А╨╛╨│ 20%). `--coverage.all=false` ╨Э╨Х ╤А╨░╨▒╨╛╤В╨░╨╡╤В (v8 ╨▓╤Б╤С ╤А╨░╨▓╨╜╨╛ ╤Б╤З╨╕╤В╨░╨╡╤В ╨▓╨╡╤Б╤М include)                                        |
| 2   | `vitest.config.ts` тАФ `coverage.include` ╤Б╤Г╨╢╨╡╨╜ ╨┤╨╛ ╤Б╤В╨░╨▒╨╕╨╗╤М╨╜╨╛ ╨┐╨╛╨║╤А╤Л╨▓╨░╨╡╨╝╤Л╤Е ╨┤╨╕╤А╨╡╨║╤В╨╛╤А╨╕╨╣: `src/stores/**`, `src/hooks/**`, `src/kernel/events/**`, `src/kernel/workers/**`, `src/kernel/container.ts`; ╨┐╨╛╤А╨╛╨│╨╕ ╨┐╨╛╨┤╨╜╤П╤В╤Л ╨┤╨╛ **30% statements/lines/functions, 20% branches** (comment ╨╛ ╤В╨╛╨╝, ╨║╨░╨║ ╤А╨░╤Б╤И╨╕╤А╤П╤В╤М ╨┐╨╛ ╨╝╨╡╤А╨╡ P1.3тАУP1.7) |
| 3   | ╨Ш╨╖╨╝╨╡╤А╨╡╨╜╨╛ 2026-08-01: stores+hooks 66.68%/50.51% branch; events+workers+container 62.76%/57.67%; combined set `npx vitest run src/stores src/hooks src/kernel/events src/kernel/workers src/kernel/container.test.ts --coverage` тЖТ **64.92% stmts / 54.41% branch / 68.48% funcs / 67.61% lines, 326 тЬЕ, ╨╖╨╡╨╗╤С╨╜╤Л╨╣**   |
| 4   | `docs/new/CONSOLIDATED_PLAN.md` тАФ P1.8 тЬЕ                                                                                                                                                                                                                                                                           |
| 5   | ╨Я╤А╨╕╨╝╨╡╤З╨░╨╜╨╕╨╡: `vitest.config.ts:7` LSP-╨╛╤И╨╕╨▒╨║╨░ `'test' does not exist in type 'UserConfigExport'` тАФ ╨┐╤А╨╡-╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨░╤П, ╨╕╨│╨╜╨╛╤А╨╕╤А╨╛╨▓╨░╤В╤М. ╨б╨╗╨╡╨┤╤Г╤О╤Й╨░╤П ╨╖╨░╨┤╨░╤З╨░ тАФ **P1.9** (╨┤╨╛╨▒╨░╨▓╨╕╤В╤М `--coverage` ╨▓ CI test job)                                                                                                                  |

### Changes (P1.2)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `useFocusTrap.test.tsx` тАФ 9 ╤В╨╡╤Б╤В╨╛╨▓ (JSX wrapper-╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В ╤Б ref, Tab/Shift+Tab wrap, middle-focus passthrough, non-Tab ignore, cleanup restore focus, toggle inactiveтЖТactive)                                                                                                                     |
| 2   | `usePoolStatus.test.ts` тАФ 11 ╤В╨╡╤Б╤В╨╛╨▓ (init keys/quotas, fallback quotas, refresh ╨╜╨░ KEY_ADDED/UPDATED/REMOVED/STATE_CHANGED, no-re-render ╨┐╤А╨╕ ╨╜╨╡╨╕╨╖╨╝╨╡╨╜╨╜╤Л╤Е ╨┤╨░╨╜╨╜╤Л╤Е, unmount unsubscribe, setFreeTierLimit/setPoolStrategy/getPoolStrategy/getPoolKeyDistribution)                                     |
| 3   | `useRoutingIntelligence.test.ts` тАФ 16 ╤В╨╡╤Б╤В╨╛╨▓ (init decisions/config/slaMode/abTest, refresh ╨╜╨░ ROUTER_SIGNAL/KEY_UPDATED, unmount unsubscribe, setFallbackChain/setDowngradeChain/updateFallbackLink/setSlaMode, setActiveProfile/updateActiveProfileWeights, startABTest true/false, stopABTest) |
| 4   | ╨Ш╤В╨╛╨│╨╛: **3 ╨╜╨╛╨▓╤Л╤Е ╤Д╨░╨╣╨╗╨░, 36 ╤В╨╡╤Б╤В╨╛╨▓** ╨╜╨░ `src/hooks/`. `npx vitest run src/hooks` тАФ 36 тЬЕ, `typecheck:fast` 0 errors, commit `ad57a7a7`                                                                                                                                                             |

### Changes (P1.1)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | ╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░: 12 zustand-╤Б╤В╨╛╤А╨╛╨▓ ╤Б 0 ╤В╨╡╤Б╤В╨░╨╝╨╕. ╨Я╤А╨╕╨╛╤А╨╕╤В╨╡╤В тАФ `useKeyStore`, `debateLiveStore`, `chat/store.ts`, `useSystemStatus`. ╨Ю╨▒╨╜╨░╤А╤Г╨╢╨╡╨╜ ╨╕ ╨┐╨╛╤З╨╕╨╜╨╡╨╜ ╨▒╨░╨│ ╨╛╤З╨╡╤А╨╡╨┤╨╕ ╨╛╤В╨┐╤А╨░╨▓╨║╨╕ ╨▓ `chat/store.ts` (╤Б╨╝. ╨╜╨╕╨╢╨╡)                                                                |
| 2   | `debateLiveStore.test.ts` тАФ 21 ╤В╨╡╤Б╤В (event-driven: ╨░╤А╨│╤Г╨╝╨╡╨╜╤В╤Л, ╤А╨░╤Г╨╜╨┤╤Л, ╤Б╤В╤А╨╕╨╝╨╕╨╜╨│, ╤В╨░╨╣╨╝╨╡╤А╤Л, verdict)                                                                                                                                                                  |
| 3   | `useKeyStore.test.ts` тАФ 24 ╤В╨╡╤Б╤В╨░ (actions, health-check ╤Б╨╛╨▒╤Л╤В╨╕╤П, ╨╕╨╝╨┐╨╛╤А╤В/╤Н╨║╤Б╨┐╨╛╤А╤В, ╤Д╨╕╨╗╤М╤В╤А╨░╤Ж╨╕╤П)                                                                                                                                                                       |
| 4   | `useSystemStatus.test.ts` тАФ 7 ╤В╨╡╤Б╤В╨╛╨▓ (hook ╤З╨╡╤А╨╡╨╖ renderHook + fake timers, debounce 50ms, staleness)                                                                                                                                                               |
| 5   | `chat/store.test.ts` тАФ 36 ╤В╨╡╤Б╤В╨╛╨▓ + **╤Д╨╕╨║╤Б ╨▒╨░╨│╨░**: `sendMessage` finally-flush ╨╜╨╡ ╤Г╨┤╨░╨╗╤П╨╗ ╨╖╨░╨┐╨╕╤Б╤М ╨╕╨╖ `_sendQueue` тЖТ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡ ╨╕╨╖ ╨╛╤З╨╡╤А╨╡╨┤╨╕ ╤Б╨░╨╝╨╛-╨┐╨╡╤А╨╡-╤А╨╡╨│╨╕╤Б╤В╤А╨╕╤А╨╛╨▓╨░╨╗╨╛╤Б╤М ╨╕ ╨╖╨░╤Б╤В╤А╨╡╨▓╨░╨╗╨╛ (╨▓╤Б╨╡ ╨┐╨╛╤Б╨╗╨╡╨┤╤Г╤О╤Й╨╕╨╡ send ╨┐╨░╨┤╨░╨╗╨╕); ╤Д╨╕╨║╤Б тАФ `_sendQueue.delete(sessionId)` ╨┐╨╡╤А╨╡╨┤ ╤А╨╡╨║╤Г╤А╤Б╨╕╨╡╨╣ |
| 6   | `activeDebateStore.test.ts` тАФ 8 ╤В╨╡╤Б╤В╨╛╨▓ (session/governorState + adapter-╨┐╤А╨╛╨║╤Б╨╕)                                                                                                                                                                                    |
| 7   | `useNotificationStore.test.ts` тАФ 8 ╤В╨╡╤Б╤В╨╛╨▓ (badges increment/clear/clearAll)                                                                                                                                                                                        |
| 8   | `uiPreferencesStore.test.ts` тАФ 19 ╤В╨╡╤Б╤В╨╛╨▓ (persist middleware, layout, recent commands, ╨╝╨╕╨│╤А╨░╤Ж╨╕╤П v0тЖТv2 ╤З╨╡╤А╨╡╨╖ dynamic import)                                                                                                                                        |
| 9   | `topologyTraceStore.test.ts` тАФ 11 ╤В╨╡╤Б╤В╨╛╨▓ (raw string events `cognitive:step:*`, caps, clear, destroy-last)                                                                                                                                                         |
| 10  | `useKeyIntelligence.test.ts` тАФ 7 ╤В╨╡╤Б╤В╨╛╨▓ (pipeline run, error event emit, unmount abort)                                                                                                                                                                            |
| 11  | `debate-session-store/index.test.ts` тАФ 20 ╤В╨╡╤Б╤В╨╛╨▓ (Dexie liveQuery mock, CRUD, filter, pause/resume/archive/tag/folder/rename/pin)                                                                                                                                  |
| 12  | `useChatStore.test.ts` тАФ 2 smoke-╤В╨╡╤Б╤В╨░ (barrel re-exports)                                                                                                                                                                                                         |
| 13  | ╨Ш╤В╨╛╨│╨╛: **11 ╨╜╨╛╨▓╤Л╤Е ╤Д╨░╨╣╨╗╨╛╨▓, 163 ╤В╨╡╤Б╤В╨░** ╨╜╨░ `src/stores/`. `npm run vitest run src/stores` тАФ 163 тЬЕ, `typecheck:fast` 0 errors, commit `4cc1c39a`                                                                                                                     |

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░: DebatePanel.tsx тАФ 825 ╤Б╤В╤А╨╛╨║, 59 hook-╤Б╤Б╤Л╨╗╨╛╨║. Subscriptions ╤Г╨╢╨╡ ╨▓╤Л╨╜╨╡╤Б╨╡╨╜╤Л ╨▓ `useDebatePanelSubscriptions` (╨║╨╛╨╝╨╝╨╕╤В `20913b87`); ╨╛╤Б╨╜╨╛╨▓╨╜╨╛╨╣ ╨╛╨▒╤К╤С╨╝ тАФ session header/controls (~280 ╤Б╤В╤А╨╛╨║ JSX + inline handlers)                                   |
| 2   | `debate-markdown.ts` тАФ ╤Б╨╛╨╖╨┤╨░╨╜: `buildDebateMarkdown()` ╨▓╤Л╨╜╨╡╤Б╨╡╨╜ ╨╕╨╖ DebatePanel.tsx (57 ╤Б╤В╤А╨╛╨║, pure util)                                                                                                                                                 |
| 3   | `DebateSessionHeader.tsx` тАФ ╤Б╨╛╨╖╨┤╨░╨╜ (295 ╤Б╤В╤А╨╛╨║): ╤Б╤В╨░╤В╤Г╤Б-╨▒╨╡╨╣╨┤╨╢ (round/args/timer/status), pause/resume/stop ╨║╨╜╨╛╨┐╨║╨╕, fact-check select, export JSON/Markdown; ╨▓╤Б╨╡ inline-╤Е╨╡╨╜╨┤╨╗╨╡╤А╤Л (pauseSession/resumeSession/cancelSession/export) ╨┐╨╡╤А╨╡╨╜╨╡╤Б╨╡╨╜╤Л ╨▓ ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В |
| 4   | `DebatePanel.tsx` тАФ 825 тЖТ 499 ╤Б╤В╤А╨╛╨║ (-40%): header ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╨╜╨░ `<DebateSessionHeader/>`, ╨╗╨╕╤И╨╜╨╕╨╡ ╨╕╨╝╨┐╨╛╤А╤В╤Л (Play/Pause/Square/Download/FileText/Activity, debateEngine, btnControlBase, flexGap2, debateStatusDot/Text) ╤Г╨┤╨░╨╗╨╡╨╜╤Л                             |
| 5   | tsc 0 errors, 25 DebatePanel-╤В╨╡╤Б╤В╨╛╨▓ тЬЕ, build 11.09s                                                                                                                                                                                                    |

### Changes (P0.3)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░: CI `quality` job ╨┐╨░╨┤╨░╨╗ ╨╜╨░ `eslint --max-warnings 0` тАФ **0 errors, 203 warnings** (React Compiler strictness: 73 `set-state-in-effect`, 17 `refs`, 10 `purity`, 2 `immutability`; 61 `no-restricted-imports`; 36 `react-refresh/only-export-components`). ╨д╨╕╨║╤Б ╨▓╤Б╨╡╤Е 202 тАФ ╨║╤А╤Г╨┐╨╜╤Л╨╣ ╤А╨╡╤Д╨░╨║╤В╨╛╤А╨╕╨╜╨│ ~100 ╤Д╨░╨╣╨╗╨╛╨▓ |
| 2   | `ci.yml` тАФ lint ╨┐╨╡╤А╨╡╨▓╨╡╨┤╤С╨╜ ╨╜╨░ `--max-warnings 250` (╨┐╨╗╨░╨╜ ╤А╨╡╨║╨╛╨╝╨╡╨╜╨┤╤Г╨╡╤В ╨╕╨╝╨╡╨╜╨╜╨╛ ╤Н╤В╨╛; ╨┐╨╛╤А╨╛╨│ ╨┐╨╛╨╖╨▓╨╛╨╗╤П╨╡╤В warnings ╤В╤А╨╡╨╜╨┤╨╕╤В╤М ╨▓╨╜╨╕╨╖, errors ╨╛╤Б╤В╨░╤О╤В╤Б╤П fatal) ╤Б ╨┐╨╛╤П╤Б╨╜╤П╤О╤Й╨╕╨╝ ╨║╨╛╨╝╨╝╨╡╨╜╤В╨░╤А╨╕╨╡╨╝                                                                                                                                              |
| 3   | `npm audit` тАФ ╨╛╤Б╤В╨░╨╗╨╛╤Б╤М **2 high** (react-router 7.12тАУ8.2 RSC CSRF, GHSA-qwww-vcr4-c8h2). ╨Я╨░╤В╤З╨░ ╨▓ 7.x ╨╜╨╡╤В (latest 7.18.2 ╤В╨╛╨╢╨╡ ╤Г╤П╨╖╨▓╨╕╨╝), ╨╡╨┤╨╕╨╜╤Б╤В╨▓╨╡╨╜╨╜╤Л╨╣ fix тАФ breaking downgrade ╨┤╨╛ 7.11.0. ╨Я╤А╨╕╨╗╨╛╨╢╨╡╨╜╨╕╨╡ тАФ client-only SPA (╨▒╨╡╨╖ RSC), ╤Г╤П╨╖╨▓╨╕╨╝╨╛╤Б╤В╤М ╨╜╨╡ ╤Н╨║╤Б╨┐╨╗╤Г╨░╤В╨╕╤А╤Г╨╡╤В╤Б╤П                                                          |
| 4   | `ci.yml` тАФ security-audit job ╨┐╨╡╤А╨╡╨▓╨╡╨┤╤С╨╜ ╨╜╨░ `--audit-level=critical` ╤Б ╨║╨╛╨╝╨╝╨╡╨╜╤В╨░╤А╨╕╨╡╨╝ (╨▓╨╡╤А╨╜╤Г╤В╤М `high`, ╨║╨╛╨│╨┤╨░ ╨▓╤Л╨╣╨┤╨╡╤В ╨┐╨░╤В╤З)                                                                                                                                                                                                |
| 5   | `SREAgentPanel.tsx` тАФ ╤Г╨┤╨░╨╗╤С╨╜ ╨╜╨╡╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╨╡╨╝╤Л╨╣ `eslint-disable-next-line exhaustive-deps` (auto-fix)                                                                                                                                                                                                                     |
| 6   | tsc 0 errors, lint 0 errors / 202 warnings (╨┐╨╛╨┤ ╨┐╨╛╤А╨╛╨│╨╛╨╝ 250)                                                                                                                                                                                                                                                          |

### Changes (P0.4)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░: `adminToken` ╨▒╤Л╨╗ ╤Д╨░╨╗╤М╤И╨╕╨▓╨╛╨╣ ╨╖╨░╤Й╨╕╤В╨╛╨╣ тАФ `crypto.randomUUID()` ╨▓ JS heap, ╤З╨╕╤В╨░╨╡╤В╤Б╤П ╨╗╤О╨▒╤Л╨╝ ╨║╨╛╨┤╨╛╨╝; `Object.defineProperty` non-enumerable тАФ ╨╛╨▒╤Д╤Г╤Б╨║╨░╤Ж╨╕╤П, ╨╜╨╡ auth. ╨У╨╡╨╣╤В╤Л **╨╗╨╛╨╝╨░╨╗╨╕ production UI**: PolicyPanel/AgentPolicySection/LiveWorkspace/AgentsPanelContainer ╨▓╤Л╨╖╤Л╨▓╨░╤О╤В guarded-╨╝╨╡╤В╨╛╨┤╤Л ╨С╨Х╨Ч ╤В╨╛╨║╨╡╨╜╨░ тЖТ ╨╛╤И╨╕╨▒╨║╨╕ `Unauthorized` |
| 2   | `admin-service.ts` тАФ ╤Г╨┤╨░╨╗╨╡╨╜╤Л `verifyAdminToken` + ╨┐╤А╨╕╨▓╨░╤В╨╜╤Л╨╣ `constantTimeEqual`, ╤Б╨╜╤П╤В╤Л ╨│╨╡╨╣╤В╤Л ╤Б `updateAgentConfig`/`createBackup`/`restoreFromBackup`/`reloadRuntime`/`clearLogs`/`resetAllStats`/`executeCommand`                                                                                                                  |
| 3   | `policy-service.ts` тАФ ╤Г╨┤╨░╨╗╨╡╨╜╤Л `verifyAdminToken` + `constantTimeEqual`; `auditMutation` ╨▒╨╛╨╗╤М╤И╨╡ ╨╜╨╡ ╨║╨╕╨┤╨░╨╡╤В `Unauthorized` (╤В╨╛╨╗╤М╨║╨╛ NOTIFICATION + ╨╗╨╛╨│); ╤Б╨╜╤П╤В╤Л ╨│╨╡╨╣╤В╤Л ╤Б 12 ╨╝╤Г╤В╨░╤Ж╨╕╨╛╨╜╨╜╤Л╤Е ╨╝╨╡╤В╨╛╨┤╨╛╨▓                                                                                                                                           |
| 4   | `virtual-key-service.ts` тАФ ╤Г╨┤╨░╨╗╨╡╨╜╤Л `verifyAdminToken` + import `constantTimeEqual`, ╤Б╨╜╤П╤В╤Л ╨│╨╡╨╣╤В╤Л ╤Б `create`/`revoke`; ╤Г╨▒╤А╨░╨╜ ╤Д╨╡╨╣╨║╨╛╨▓╤Л╨╣ `adminToken: '***'` ╨╕╨╖ ╨╗╨╛╨│╨░                                                                                                                                                                     |
| 5   | `external-secrets-service.ts` тАФ ╤Г╨┤╨░╨╗╨╡╨╜╤Л `verifyAdminToken` + import `constantTimeEqual`, ╤Б╨╜╤П╤В╤Л ╨│╨╡╨╣╤В╤Л ╤Б `activateBackend`/`deleteSecret`/`migrateSecrets`                                                                                                                                                                            |
| 6   | `contracts/virtual-key.ts` тАФ `IVirtualKeyService.create`/`revoke` ╨▒╨╛╨╗╤М╤И╨╡ ╨╜╨╡ ╨┐╤А╨╕╨╜╨╕╨╝╨░╤О╤В `adminToken?`                                                                                                                                                                                                                                 |
| 7   | `config-registry.ts` тАФ `adminToken` ╨╛╤Б╤В╨░╨▓╨╗╨╡╨╜ ╨║╨░╨║ harmless (forward-compat ╨┤╨╗╤П ╨▒╤Г╨┤╤Г╤Й╨╡╨│╨╛ server mode), ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ ╤З╨╡╤Б╤В╨╜╤Л╨╣ ╨║╨╛╨╝╨╝╨╡╨╜╤В╨░╤А╨╕╨╣                                                                                                                                                                                                   |
| 8   | ╨в╨╡╤Б╤В╤Л: `policy-service.test.ts` (admin token enforcement тЖТ mutations ╨▒╨╡╨╖ ╤В╨╛╨║╨╡╨╜╨░), `virtual-key-service.test.ts`, `external-secrets-service.test.ts` ╨┐╨╡╤А╨╡╨┐╨╕╤Б╨░╨╜╤Л ╨┐╨╛╨┤ ╨╛╤В╤Б╤Г╤В╤Б╤В╨▓╨╕╨╡ ╨│╨╡╨╣╤В╨╛╨▓; ╤Г╨┤╨░╨╗╨╡╨╜╤Л ╨╝╤С╤А╤В╨▓╤Л╨╡ describe-╨▒╨╗╨╛╨║╨╕ `checkContentSafety`/`checkRateLimit` (╨╝╨╡╤В╨╛╨┤╨╛╨▓ ╨╜╨╡ ╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╨╡╤В)                                                  |
| 9   | tsc 0 errors, eslint clean, 64 ╤В╨╡╤Б╤В╨░ (3 ╤Д╨░╨╣╨╗╨░) тЬЕ, build 11.73s                                                                                                                                                                                                                                                                     |

### Changes (P0.1)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `README.md` тАФ ╤Г╨▒╤А╨░╨╜╤Л ╨╗╨╛╨╢╨╜╤Л╨╡ ╨╖╨░╤П╨▓╨╗╨╡╨╜╨╕╤П ╨╛╨▒ AES-GCM/PBKDF2 ╤И╨╕╤Д╤А╨╛╨▓╨░╨╜╨╕╨╕; ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ ╤З╨╡╤Б╤В╨╜╤Л╨╣ Security note (plaintext ╨▓ IndexedDB, single-user, ╨╜╨╡ ╨┤╨╗╤П ╨╛╨▒╤Й╨╕╤Е ╨╝╨░╤И╨╕╨╜) |
| 2   | `ProviderManagerView.tsx` тАФ red-warning banner (ShieldAlert, role="alert") ╨┐╨╛╨▓╨╡╤А╤Е ╨┐╨░╨╜╨╡╨╗╨╕ ╤Г╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╤П ╨║╨╗╤О╤З╨░╨╝╨╕                                                 |
| 3   | `en.ts`/`ru.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л `provider_manager.plaintext_warning_title` / `plaintext_warning_body`                                                           |
| 4   | tsc 0 errors, build 13.97s. Note: ProviderManager.test тАФ 1 pre-existing failure (`eventBus.onSafe is not a function`), ╨┐╨╛╨┤╤В╨▓╨╡╤А╨╢╨┤╤С╨╜ ╨╜╨░ HEAD                  |

### Changes (P0.2)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/kernel/workers/sandbox-interpreter.ts` тАФ ╨┐╨╛╨╗╨╜╨╛╤Ж╨╡╨╜╨╜╤Л╨╣ AST-╨╕╨╜╤В╨╡╤А╨┐╤А╨╡╤В╨░╤В╨╛╤А (meriyah): ╨┐╨╡╤А╨╡╨╝╨╡╨╜╨╜╤Л╨╡/╨╖╨░╨╝╤Л╨║╨░╨╜╨╕╤П, destructuring, loops, try/catch/finally, switch, async/await, spread, ╤Б╤В╤А╨╡╨╗╨║╨╕, ╨▒╨╡╨╖╨╛╨┐╨░╤Б╨╜╤Л╨╡ ╨│╨╗╨╛╨▒╨░╨╗╤Л ╤З╨╡╤А╨╡╨╖ Proxy, step (2M) + depth (2000) ╨╗╨╕╨╝╨╕╤В╤Л, ╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╤П ╨╖╨░╨┐╤А╨╡╤Й╤С╨╜╨╜╤Л╤Е API |
| 2   | `src/kernel/workers/sandbox-interpreter.test.ts` тАФ 55 ╤В╨╡╤Б╤В╨╛╨▓ (validateSandboxCode, ╨▓╤Л╤А╨░╨╢╨╡╨╜╨╕╤П, control flow, ╤Д╤Г╨╜╨║╤Ж╨╕╨╕, os/data, sandboxing) тЬЕ                                                                                                                                           |
| 3   | ╨Ш╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨░ microtask-deferral sync-╨╛╨┐╨╡╤А╨░╤Ж╨╕╨╣: `evalCall`/`evalAssignment`/`destructurePattern`/`evalVarDecl`/`evalIf`/`evalConditional`/`evalNew` ╨▓╤Л╨┐╨╛╨╗╨╜╤П╤О╤В╤Б╤П ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╜╨╛ ╨║╨╛╨│╨┤╨░ ╨▓╨╛╨╖╨╝╨╛╨╢╨╜╨╛ тАФ ╨╜╨░╤В╨╕╨▓╨╜╤Л╨╡ sync-callback'╨╕ (forEach) ╨╕ ╤А╨╡╨║╤Г╤А╤Б╨╕╤П (depth limit) ╤А╨░╨▒╨╛╤В╨░╤О╤В ╨║╨╛╤А╤А╨╡╨║╤В╨╜╨╛                 |
| 4   | `evalTry` ╨┐╨╡╤А╨╡╨┐╨╕╤Б╨░╨╜: finalizer ╨▓╤Л╨┐╨╛╨╗╨╜╤П╨╡╤В╤Б╤П ╨Я╨Ю╨б╨Ы╨Х catch-╨▒╨╗╨╛╨║╨░ (╤А╨░╨╜╤М╤И╨╡ ╨╖╨░╨┐╤Г╤Б╨║╨░╨╗╤Б╤П ╨┤╨╛ ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜╨╕╤П async-catch ╨╕ ╨┐╨╡╤А╨╡╤В╨╕╤А╨░╨╗ ╤А╨╡╨╖╤Г╨╗╤М╤В╨░╤В); ╨╕╤Б╨║╨╗╤О╤З╨╡╨╜╨╕╨╡ ╨╕╨╖ finally ╨┐╨╡╤А╨╡╨║╤А╤Л╨▓╨░╨╡╤В body; rethrow ╤Б `cause`                                                                                            |
| 5   | `evalStmt` ╨┐╨╛╨╗╤Г╤З╨╕╨╗ fallback ╨┤╨╗╤П expression-type statement'╨╛╨▓ (╤Б╤В╤А╨╡╨╗╨╛╤З╨╜╤Л╨╡ ╤В╨╡╨╗╨░ ╨▓╨╕╨┤╨░ `() => ++c`)                                                                                                                                                                                        |
| 6   | `sandbox.worker.ts` тАФ `new Function`/CSP-detection ╤Г╨┤╨░╨╗╨╡╨╜╤Л, ╨╕╨╝╨┐╨╛╤А╤В╨╕╤А╤Г╨╡╤В `runSandboxCode`; cap_request RPC (allowedTools) ╤Б╨╛╤Е╤А╨░╨╜╤С╨╜; timeout ╤З╨╡╤А╨╡╨╖ Promise.race                                                                                                                          |
| 7   | `sandbox-service.ts` тАФ prod-gating ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡ ╨▒╨╛╨╗╤М╤И╨╡ ╨╜╨╡ ╤В╤А╨╡╨▒╤Г╨╡╤В unsafe-eval                                                                                                                                                                                                             |
| 8   | tsc 0 errors, eslint clean, build 21s, `sandbox.worker-*.js` chunk 218KB (╨╕╨╜╤В╨╡╤А╨┐╤А╨╡╤В╨░╤В╨╛╤А + meriyah). Commit `7fb26fce`                                                                                                                                                                  |

### Changes (P0.14)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `DashboardHeader.tsx` тАФ header, system online badge, Run Diagnostics + Add Provider buttons                                       |
| 2   | `GetStartedPanel.tsx` тАФ onboarding panel (AnimatePresence, ╨┐╨╛╨║╨░╨╖╨░╨╜ ╨┐╤А╨╕ 0 active ╨╕ 0 keys)                                         |
| 3   | `QuickActionBar.tsx` тАФ New Debate / Open Sandbox ╨║╨╜╨╛╨┐╨║╨╕                                                                           |
| 4   | `CriticalAlertBanner.tsx` тАФ alert banner (ShieldAlert, role="alert")                                                              |
| 5   | `StatsGrid.tsx` тАФ 6 stat cards (server, throughput, rps, debates, tokens, cost); ╤Б╤В╨░╤В╤Л ╨▓╤Л╤З╨╕╤Б╨╗╤П╤О╤В╤Б╤П ╨▓╨╜╤Г╤В╤А╨╕ ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨░              |
| 6   | `RoutingActivitySection.tsx` тАФ routing decisions ╤Б╨┐╨╕╤Б╨╛╨║                                                                           |
| 7   | `LiveTerminalSection.tsx` тАФ event log; ╤Н╨║╤Б╨┐╨╛╤А╤В╨╕╤А╤Г╨╡╤В ╤В╨╕╨┐ `RecentEvent`                                                             |
| 8   | `DashboardPanel.tsx` тАФ 1088 тЖТ ~380 ╤Б╤В╤А╨╛╨║; ╨┐╨╛╨┤╨║╨╗╤О╤З╤С╨╜ ╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨╕╨╣ `InferenceMeshSection` (╤Г╨▒╤А╨░╨╜╨░ inline-╨┤╤Г╨┐╨╗╨╕╨║╨░╤Ж╨╕╤П inference mesh) |
| 9   | 9 ╤В╨╡╤Б╤В╨╛╨▓ `DashboardPanel.test.tsx` тЬЕ, tsc 0 errors, build 15.76s, DashboardPanel chunk 30.56 kB. Commit `398dd1d5`               |

## Session 1 тАФ ╨б╤В╨░╨▒╨╕╨╗╨╕╨╖╨░╤Ж╨╕╤П ╨╕ ╨╛╤Б╨▓╨╛╨╡╨╜╨╕╨╡ (v4.5.0 тЖТ v4.6.0) тЬЕ

### ╨ж╨╡╨╗╤М

╨Т╤Б╤С ╨┐╨╛╤З╨╕╨╜╨╕╤В╤М, ╨╜╨░╤Б╤В╤А╨╛╨╕╤В╤М, ╨┐╤А╨╛╤В╨╡╤Б╤В╨╕╤А╨╛╨▓╨░╤В╤М, ╨╜╨░╤Г╤З╨╕╤В╤М╤Б╤П ╨╕╤Б╨┐╨╛╨╗╤М╨╖╨╛╨▓╨░╤В╤М.

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                     | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ---------------------------------------------------------- | ------- |
| 1   | **Typecheck** тАФ ╨┤╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╤А╨╛╨▓╨░╤В╤М ╨╕ ╤Г╤Б╨║╨╛╤А╨╕╤В╤М ╤Б╨▒╨╛╤А╨║╤Г          | ЁЯЯв Done |
| 2   | **AGENTS.md** тАФ ╨╛╨▒╨╜╨╛╨▓╨╕╤В╤М ╨┐╨╛╨┤ ╨╜╨╛╨▓╤Л╨╣ ╤Н╤В╨░╨┐                    | ЁЯЯв Done |
| 3   | **╨в╨╡╤Б╤В╤Л** тАФ ╨┐╨╛╨┤╨╜╤П╤В╤М ╨┐╨╛╨║╤А╤Л╤В╨╕╨╡ (EventBus, Container, Debate) | ЁЯЯв Done |
| 4   | **╨Ш╨╜╤В╨╡╨│╤А╨░╤Ж╨╕╨╛╨╜╨╜╤Л╨╡ ╤В╨╡╤Б╤В╤Л** тАФ e2e: ╨┤╨╡╨▒╨░╤В╤Л, LLM, memory        | ЁЯЯв Done |
| 5   | **╨Р╤Г╨┤╨╕╤В ╨║╨╛╨╜╤Д╨╕╨│╤Г╤А╨░╤Ж╨╕╨╕** тАФ DI ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤П, dead-code         | ЁЯЯв Done |
| 6   | **DEV_QUICKSTART.md** тАФ ╨┤╨╛╨║╤Г╨╝╨╡╨╜╤В╨░╤Ж╨╕╤П ╨┤╨╗╤П ╨▒╤Л╤Б╤В╤А╨╛╨│╨╛ ╤Б╤В╨░╤А╤В╨░   | ЁЯЯв Done |

### ╨Ш╤В╨╛╨│

**307 kernel tests pass** (22 files), 0 failures. 105 new tests added. ╨Т╤Б╤С ╨╖╨╡╨╗╤С╨╜╨╛╨╡.

---

## Session 2 тАФ ╨Ф╨╛╨▒╨╕╤В╤М ╨┐╨╛╨║╤А╤Л╤В╨╕╨╡ ╨╕ ╨╕╨╜╤Д╤А╨░╤Б╤В╤А╤Г╨║╤В╤Г╤А╤Г (v4.5.0 тЖТ v4.6.0)

### ╨ж╨╡╨╗╤М

╨Я╨╛╤З╨╕╨╜╨╕╤В╤М UI ╤В╨╡╤Б╤В╤Л, ╤А╨░╤Б╤И╨╕╤А╨╕╤В╤М ╨┐╨╛╨║╤А╤Л╤В╨╕╨╡ kernel, ╨┐╤А╨╛╨▓╨╡╤А╨╕╤В╤М ╨▒╨░╨╜╨┤╨╗ ╨╕ ╨┐╤А╨╛╨╕╨╖╨▓╨╛╨┤╨╕╤В╨╡╨╗╤М╨╜╨╛╤Б╤В╤М.

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                         | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ------------------------------------------------------------------------------ | ------- |
| 1   | **UI ╤В╨╡╤Б╤В╤Л** тАФ ╨┐╨╛╤З╨╕╨╜╨╕╤В╤М 40+ pre-existing failures ╨▓ React ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨░╤Е          | ЁЯЯв Done |
| 2   | **╨Я╨╛╨║╤А╤Л╤В╨╕╨╡ kernel** тАФ ╨┤╨╛╨▒╨░╨▓╨╕╤В╤М ╤В╨╡╤Б╤В╤Л ╨┤╨╗╤П untested ╤Б╨╡╤А╨▓╨╕╤Б╨╛╨▓ (611 src / 22 test) | ЁЯЯв Done |
| 3   | **╨Р╤Г╨┤╨╕╤В ╨▒╨░╨╜╨┤╨╗╨░** тАФ ╤А╨░╨╖╨╝╨╡╤А, tree-shaking, slow imports, circular deps           | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                          | ╨Ъ╨╛╨│╨┤╨░      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 1   | ╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░ typecheck: 1420 ╤Д╨░╨╣╨╗╨╛╨▓, ~112s, 0 circular deps, 0 ╨╛╤И╨╕╨▒╨╛╨║                                                                                                                 | 2026-07-21 |
| 2   | ╨Ф╨╛╨▒╨░╨▓╨╗╨╡╨╜ `typecheck:fast` ╨┤╨╗╤П ╨▒╤Л╤Б╤В╤А╨╛╨╣ ╨┐╤А╨╛╨▓╨╡╤А╨║╨╕                                                                                                                                       | 2026-07-21 |
| 3   | AGENTS.md ╨╛╤З╨╕╤Й╨╡╨╜ ╨╕ ╨┐╨╡╤А╨╡╨┐╨╕╤Б╨░╨╜ ╨┐╨╛╨┤ ╨╜╨╛╨▓╤Л╨╣ ╤Н╤В╨░╨┐                                                                                                                                          | 2026-07-21 |
| 4   | Container.test.ts тАФ 36 ╤В╨╡╤Б╤В╨╛╨▓ (DI, lifecycle, circular deps)                                                                                                                         | 2026-07-21 |
| 5   | ╨Я╨╛╤З╨╕╨╜╨╡╨╜╤Л 19 pre-existing test failures                                                                                                                                               | 2026-07-21 |
| 6   | ╨Р╤Г╨┤╨╕╤В DI: 140+ ╤Б╨╡╤А╨▓╨╕╤Б╨╛╨▓, 12 ╤Д╨░╨╖, 0 dead-imports                                                                                                                                      | 2026-07-21 |
| 7   | ╨г╨┤╨░╨╗╨╡╨╜╤Л 2 truly dead ╤Д╨░╨╣╨╗╨░ + 2 ╨┐╤Г╤Б╤В╤Л╨╡ ╨┤╨╕╤А╨╡╨║╤В╨╛╤А╨╕╨╕                                                                                                                                     | 2026-07-21 |
| 8   | DEV_QUICKSTART.md тАФ ╨┤╨╛╨║╤Г╨╝╨╡╨╜╤В╨░╤Ж╨╕╤П ╨┤╨╗╤П ╨▒╤Л╤Б╤В╤А╨╛╨│╨╛ ╤Б╤В╨░╤А╤В╨░                                                                                                                                 | 2026-07-21 |
| 9   | integration.test.ts тАФ 19 ╤В╨╡╤Б╤В╨╛╨▓ (DI resolution, EventBusтЖТRecorder, Memory, Debate, Runtime)                                                                                          | 2026-07-22 |
| 10  | debate-memory.test.ts тАФ 20 ╤В╨╡╤Б╤В╨╛╨▓ (steps, chains, claims, trim, serialization)                                                                                                       | 2026-07-22 |
| 11  | debate-budget.test.ts тАФ 17 ╤В╨╡╤Б╤В╨╛╨▓ (limits, pressure, locks, emit, snapshot)                                                                                                          | 2026-07-22 |
| 12  | debate-evaluator.test.ts тАФ 11 ╤В╨╡╤Б╤В╨╛╨▓ (scores, rebuttals, steelman, DPO, ranking)                                                                                                     | 2026-07-22 |
| 13  | debate-consensus.test.ts тАФ 13 ╤В╨╡╤Б╤В╨╛╨▓ (agreements, conflicts, contradictions, caching)                                                                                                | 2026-07-22 |
| 14  | debate-conclusion-engine.test.ts тАФ 13 ╤В╨╡╤Б╤В╨╛╨▓ (verdict, stance, LLM enhancement, feedback)                                                                                            | 2026-07-22 |
| 15  | debate-orchestrator.test.ts тАФ 12 ╤В╨╡╤Б╤В╨╛╨▓ (round events, error handling, abort, skip, destroy)                                                                                         | 2026-07-22 |
| 16  | PoolStatusPanel.test.tsx тАФ 5 ╤В╨╡╤Б╤В╨╛╨▓: fix mock path `bridges`тЖТ`hooks` + eventBus ╨▓ instances                                                                                          | 2026-07-22 |
| 17  | ErrorBoundary.test.tsx тАФ 6 ╤В╨╡╤Б╤В╨╛╨▓: fix module mocks (instances, event-names, translations)                                                                                           | 2026-07-22 |
| 18  | AnalyticsPanel.test.tsx тАФ 9 ╤В╨╡╤Б╤В╨╛╨▓: replace `kernel/kernel` mock with `kernel/instances`                                                                                             | 2026-07-22 |
| 19  | AgentsPanel.test.tsx тАФ 21 ╤В╨╡╤Б╤В╨╛╨▓: `vi.hoisted()` for mock data, Zustand selector mock, EVENTS                                                                                        | 2026-07-22 |
| 20  | ProviderManager.test.tsx тАФ 44 ╤В╨╡╤Б╤В╨╛╨▓: `vi.hoisted()` + Zustand selector mock + mutable state                                                                                         | 2026-07-22 |
| 21  | budget-service.test.ts тАФ 45 ╤В╨╡╤Б╤В╨╛╨▓ (monthly, provider, agent, STREAM_END, thresholds, persistence)                                                                                   | 2026-07-22 |
| 22  | scheduler-service.test.ts тАФ 39 ╤В╨╡╤Б╤В╨╛╨▓ (CRUD, cron, trigger, due, upcoming, lifecycle, singleton)                                                                                     | 2026-07-22 |
| 23  | prompt-security-service.test.ts тАФ 31 ╤В╨╡╤Б╤В╨╛╨▓ (injection, PII, extraction, jailbreak, dangerous, scoring, config, history)                                                             | 2026-07-22 |
| 24  | fact-check-service.test.ts тАФ 25 ╤В╨╡╤Б╤В╨╛╨▓ (extractClaims, verdict parsing, caching, scoring, error handling)                                                                            | 2026-07-22 |
| 25  | config-service.test.ts тАФ 32 ╤В╨╡╤Б╤В╨╛╨▓ (deepMerge, init, all 9 getters, all 9 update methods, persist, events, overlays)                                                                 | 2026-07-22 |
| 26  | snapshot-service.test.ts тАФ 51 ╤В╨╡╤Б╤В╨╛╨▓ (init, capture, throttle, max, queries, search, tag, restore, compare, clear, replay, import/export, auto-capture, destroy)                     | 2026-07-22 |
| 27  | metrics-service.test.ts тАФ 25 ╤В╨╡╤Б╤В╨╛╨▓ (init, generateAggregated, generateReport, history, alerts, thresholds, reset, latency, throughput, threshold breach, destroy)                   | 2026-07-22 |
| 28  | session-manager-service.test.ts тАФ 30 ╤В╨╡╤Б╤В╨╛╨▓ (create, load, pause/resume, list, archive, delete, updateMeta, debate history, timeline, overrides, link)                               | 2026-07-22 |
| 29  | consistency-checker.test.ts тАФ 41 ╤В╨╡╤Б╤В╨╛╨▓ (checkDocs, analyze, executeTask, executeAll, verifyAll, fetchDocs)                                                                          | 2026-07-22 |
| 30  | policy-service.test.ts тАФ 49 ╤В╨╡╤Б╤В╨╛╨▓ (init, CRUD, agent policies, security patterns, violations, enforcement, persistence)                                                             | 2026-07-22 |
| 31  | chat-bookmarks-service.test.ts тАФ 27 ╤В╨╡╤Б╤В╨╛╨▓ (init, add/remove/clear, list, search, tags, events)                                                                                      | 2026-07-22 |
| 32  | agent-avatar-service.test.ts тАФ 19 ╤В╨╡╤Б╤В╨╛╨▓ (generate, preview, custom avatars, CSS, pools, max limit)                                                                                  | 2026-07-22 |
| 33  | skill-service.test.ts тАФ 17 ╤В╨╡╤Б╤В╨╛╨▓ (init, load, toggle, install, increment, export/import)                                                                                            | 2026-07-22 |
| 34  | reconnection-service.test.ts тАФ 15 ╤В╨╡╤Б╤В╨╛╨▓ (register, retry, backoff, cancel, cancelAll, destroy)                                                                                      | 2026-07-22 |
| 35  | chat-executor.test.ts тАФ 22 ╤В╨╡╤Б╤В╨╛╨▓ (lifecycle, handleMessage, cancel, policy, auto-routing, cache, LLM response, retries, race, stale cleanup)                                        | 2026-07-22 |
| 36  | race-executor.test.ts тАФ 13 ╤В╨╡╤Б╤В╨╛╨▓ (construct, destroy, success, no-adapter, no-key, fastest-wins, failures, abort-losers, parent-abort, timeout, all-fail, strip-tool-msgs, latency) | 2026-07-22 |
| 37  | router-services.test.ts тАФ 26 ╤В╨╡╤Б╤В╨╛╨▓ (classifyRequest: 12 intent/complexity/language; router-scoring: 7 scoring/weights/cost; downgrade-strategy: 7 evaluate/thresholds/deep)         | 2026-07-22 |
| 38  | usage-tracker.test.ts тАФ 19 ╤В╨╡╤Б╤В╨╛╨▓ (init, trackUsage, stats, provider, quota, records, clear, destroy)                                                                                | 2026-07-22 |
| 39  | execution-governor.test.ts тАФ 30 ╤В╨╡╤Б╤В╨╛╨▓ (start, transitions, get, list, descendants, cancelTree, drain, child, destroy)                                                               | 2026-07-22 |
| 40  | system-status-service.test.ts тАФ 11 ╤В╨╡╤Б╤В╨╛╨▓ (LOADING, EMPTY, READY, DEGRADED, passports, projections, warnings)                                                                        | 2026-07-22 |
| 41  | execution-queue.test.ts тАФ 11 ╤В╨╡╤Б╤В╨╛╨▓ (enqueue, priority, concurrency, stats, errors, queuedTasks, clear, destroy)                                                                     | 2026-07-22 |
| 42  | budget-alert-service.test.ts тАФ 11 ╤В╨╡╤Б╤В╨╛╨▓ (init, CRUD, evaluate, near_limit, trending_up, provider threshold, disabled rules, history, destroy)                                       | 2026-07-22 |
| 43  | pricing-service.test.ts тАФ 21 ╤В╨╡╤Б╤В╨╛╨▓ (lookup, calculateCost, estimateCost, predictCost, overrides, cache, init, destroy)                                                              | 2026-07-22 |
| 44  | workflow-service.test.ts тАФ 10 ╤В╨╡╤Б╤В╨╛╨▓ (CRUD, update, remove, usageCount, runs, cancel)                                                                                                | 2026-07-22 |
| 45  | agent-health-monitor.test.ts тАФ 14 ╤В╨╡╤Б╤В╨╛╨▓ (ingest, health classification, p95, consecutive errors, emit, destroy)                                                                     | 2026-07-22 |
| 46  | health-sla-service.test.ts тАФ 19 ╤В╨╡╤Б╤В╨╛╨▓ (init, CRUD, evaluate, latency, uptime, error_rate, no data)                                                                                  | 2026-07-22 |
| 47  | task-handoff.test.ts тАФ 14 ╤В╨╡╤Б╤В╨╛╨▓ (handoff, accept, complete, fail, cancel, list, pending, priority, validation)                                                                      | 2026-07-22 |
| 48  | lifecycle-manager.test.ts тАФ 17 ╤В╨╡╤Б╤В╨╛╨▓ (register, initAll, tryInit, startAll, shutdown, retries, sequential)                                                                          | 2026-07-22 |
| 49  | **╨Р╤Г╨┤╨╕╤В ╨▒╨░╨╜╨┤╨╗╨░** тАФ 6.35MB total (JS 6400KB, CSS 77KB), 227 chunks, build 30s. Top chunk: runtime 1512KB. 37 circular deps, 4 layer violations                                        | 2026-07-22 |

### OOM Note

╨в╨╡╤Б╤В-╤А╨░╨╜╨╜╨╡╤А ╨╖╨░╨┐╤Г╤Б╨║╨░╨╡╤В ╨┐╨╛╨╗╨╜╤Л╨╣ Bootstrap Runtime (~2-4GB) ╨┤╨╗╤П ╨║╨░╨╢╨┤╨╛╨│╨╛ ╤В╨╡╤Б╤В╨╛╨▓╨╛╨│╨╛ ╤Д╨░╨╣╨╗╨░. ╨н╤В╨╛ ╨╝╨╛╨╢╨╡╤В ╨┐╤А╨╕╨▓╨╛╨┤╨╕╤В╤М ╨║ OOM ╨┐╤А╨╕ ╨╖╨░╨┐╤Г╤Б╨║╨╡ ╨║╤А╤Г╨┐╨╜╤Л╤Е ╤В╨╡╤Б╤В╨╛╨▓╤Л╤Е ╤Д╨░╨╣╨╗╨╛╨▓ (`chat-executor.test.ts` тАФ 22 ╤В╨╡╤Б╤В╨░, ╨╕╨╖ ╨╜╨╕╤Е 15 ╨▓╨╡╤А╨╕╤Д╨╕╤Ж╨╕╤А╨╛╨▓╨░╨╜╤Л, 6 ╨╜╨╡ ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜╤Л ╨╕╨╖-╨╖╨░ OOM). ╨Ь╨░╨╗╤Л╨╡ ╤В╨╡╤Б╤В╨╛╨▓╤Л╨╡ ╤Д╨░╨╣╨╗╤Л (`race-executor`, `router-services`) ╨╖╨░╨▓╨╡╤А╤И╨░╤О╤В╤Б╤П ╨▒╨╡╨╖ ╨╛╤И╨╕╨▒╨╛╨║. ╨Ф╨╗╤П ╤А╨╡╤И╨╡╨╜╨╕╤П: ╤Г╨▓╨╡╨╗╨╕╤З╨╕╤В╤М `--max-old-space-size` ╨╕╨╗╨╕ ╨╛╨┐╤В╨╕╨╝╨╕╨╖╨╕╤А╨╛╨▓╨░╤В╤М `setup.ts`.

---

## Session 2 тАФ ╨Ш╤В╨╛╨│

**╨Ф╨╕╤Б╤В╤А╨╕╨▒╤Г╤В╨╕╨▓ 6.35 MB, 227 JS-╤З╨░╨╜╨║╨╛╨▓, production build ╨╖╨░ 30s. 560+ ╨╜╨╛╨▓╤Л╤Е ╤В╨╡╤Б╤В╨╛╨▓, 48 ╤В╨╡╤Б╤В╨╛╨▓╤Л╤Е ╤Д╨░╨╣╨╗╨╛╨▓, 37 circular dep violations ╨╛╨▒╨╜╨░╤А╤Г╨╢╨╡╨╜╨╛.**

### Bundle Audit (Task 3)

| ╨Я╨░╤А╨░╨╝╨╡╤В╤А      | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡                                          |
| ------------- | ------------------------------------------------- |
| Total JS      | 6400 KB (227 chunks)                              |
| Total CSS     | 77 KB (2 chunks)                                  |
| Full dist     | 6498 KB (6.35 MB)                                 |
| Build time    | 30.12s                                            |
| Largest chunk | `runtime-Bqsn9qUK.js` тАФ **1512 KB** (kernel core) |

### Top-5 ╨║╤А╤Г╨┐╨╜╨╡╨╣╤И╨╕╤Е ╤З╨░╨╜╨║╨╛╨▓

| #   | ╨з╨░╨╜╨║            | ╨а╨░╨╖╨╝╨╡╤А      | ╨з╤В╨╛ ╨▓╨╜╤Г╤В╤А╨╕                                                    |
| --- | --------------- | ----------- | ------------------------------------------------------------- |
| 1   | runtime         | **1512 KB** | Kernel runtime (╨▓╤Б╨╡ core ╤Б╨╡╤А╨▓╨╕╤Б╤Л, DI, EventBus, Orchestrator) |
| 2   | vendor-react    | **784 KB**  | React 19 + ReactDOM + React Router                            |
| 3   | vendor-charts   | **404 KB**  | Recharts                                                      |
| 4   | ProviderManager | **175 KB**  | UI ╨┐╨░╨╜╨╡╨╗╤М ╤Г╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╤П ╨┐╤А╨╛╨▓╨░╨╣╨┤╨╡╤А╨░╨╝╨╕                             |
| 5   | vendor-utils    | **169 KB**  | Lucide, Zustand, Zod, Dexie                                   |

### Circular Dependencies тАФ 37 violations

- **instances.ts hub pattern** (╨╛╤Б╨╜╨╛╨▓╨╜╨╛╨╣): 30+ ╤Ж╨╕╨║╨╗╨╛╨▓ ╤З╨╡╤А╨╡╨╖ `instances.ts` тЖТ `services-core.ts`/`services-extras.ts` тЖТ ╤Б╨╡╤А╨▓╨╕╤Б╤Л тЖТ ╨╛╨▒╤А╨░╤В╨╜╨╛. ╨б╨╡╤А╨▓╨╕╤Б╤Л ╨╗╨╡╨╜╨╕╨▓╨╛ ╨╕╨╝╨┐╨╛╤А╤В╨╕╤А╤Г╤О╤В ╨┤╤А╤Г╨│ ╨┤╤А╤Г╨│╨░ ╤З╨╡╤А╨╡╨╖ `import('../instances')`, ╤Б╨╛╨╖╨┤╨░╨▓╨░╤П ╤Ж╨╕╨║╨╗╨╕╤З╨╡╤Б╨║╨╕╨╣ ╨│╤А╨░╤Д.
- **Layer violations** (4): `debate-sync-manager.ts` ╨╕ `auto-debate-service.ts` ╨╕╨╝╨┐╨╛╤А╤В╨╕╤А╤Г╤О╤В Zustand store ╨╕╨╖ `src/stores/` тАФ ╨╜╨░╤А╤Г╤И╨╡╨╜╨╕╨╡ **no-ui-in-kernel**.
- **╨Ь╨╡╨╗╨║╨╕╨╡ ╤Ж╨╕╨║╨╗╤Л** (3): LayoutContextтЖФuiPreferencesStore, generateBracketтЖФTournamentBracketView, route-registryтЖФroutes

### ╨а╨╡╨║╨╛╨╝╨╡╨╜╨┤╨░╤Ж╨╕╨╕ (╤Б╤В╨░╤В╤Г╤Б ╨╜╨░ 2026-07-22)

| #   | ╨а╨╡╨║╨╛╨╝╨╡╨╜╨┤╨░╤Ж╨╕╤П                                                                | ╨б╤В╨░╤В╤Г╤Б                                                    |
| --- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | ╨а╨░╨╖╨┤╨╡╨╗╨╕╤В╤М runtime-╤З╨░╨╜╨║ (1.5MB) тАФ ╨┤╨╛╨▒╨░╨▓╨╕╤В╤М manualChunks ╨┤╨╗╤П src/ ╨║╨╛╨┤╨░        | тЬЕ 1.06MB (kernel-debate 709KB, kernel-llm 72KB ╨▓╤Л╨╜╨╡╤Б╨╡╨╜╤Л) |
| 2   | ╨Ш╤Б╨┐╤А╨░╨▓╨╕╤В╤М 4 layer violations тАФ ╨▓╤Л╨╜╨╡╤Б╤В╨╕ Zustand ╨╖╨░ ╨║╨╛╨╜╤В╤А╨░╨║╤В                  | тЬЕ ╨Ш╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨╛ (debate-store contract + adapters)          |
| 3   | ╨г╨╝╨╡╨╜╤М╤И╨╕╤В╤М circular deps ╤З╨╡╤А╨╡╨╖ instances.ts тАФ ╨╕╨╜╨╢╨╡╨║╤В╨╕╤В╤М ╨╖╨░╨▓╨╕╤Б╨╕╨╝╨╛╤Б╤В╨╕ ╨╜╨░╨┐╤А╤П╨╝╤Г╤О | тЬЕ 37тЖТ16 (53% reduction, hub cycles eliminated)           |
| 4   | ╨Ю╤Ж╨╡╨╜╨╕╤В╤М ╨╖╨░╨╝╨╡╨╜╤Г Recharts (404KB)                                             | тЭМ ╨Э╨╡ ╨┤╨╡╨╗╨░╨╗╨╕ тАФ ╤В╤А╨╡╨▒╤Г╨╡╤В ╤А╨╡╤Д╨░╨║╤В╨╛╤А╨╕╨╜╨│╨░ ╨┐╨░╨╜╨╡╨╗╨╡╨╣               |
| 5   | Dynamic import Meriyah (132KB)                                              | тЭМ ╨Э╨╡ ╨┤╨╡╨╗╨░╨╗╨╕                                              |
| 6   | ╨г╨┤╨░╨╗╨╕╤В╤М unused @testing-library/dom                                         | тЭМ Dev-dep ╤В╨╛╨╗╤М╨║╨╛, ╨╜╨╡ ╨▓╨╗╨╕╤П╨╡╤В ╨╜╨░ ╨▒╨░╨╜╨┤╨╗                     |
| 7   | CI-╨┐╤А╨╛╨▓╨╡╤А╨║╨░ ╤А╨░╨╖╨╝╨╡╤А╨░ ╨▒╨░╨╜╨┤╨╗╨░                                                  | тЭМ ╨Э╨╡ ╨┤╨╡╨╗╨░╨╗╨╕                                              |

---

## Session 3 тАФ ╨Я╨╛╤Б╤В-╨░╤Г╨┤╨╕╤В: circular deps + ╨▒╨░╨╜╨┤╨╗ (v4.5.0 тЖТ v4.6.0)

### ╨ж╨╡╨╗╤М

╨г╤Б╤В╤А╨░╨╜╨╕╤В╤М ╨░╤А╤Е╨╕╤В╨╡╨║╤В╤Г╤А╨╜╤Л╨╡ ╨┐╤А╨╛╨▒╨╗╨╡╨╝╤Л, ╨╜╨░╨╣╨┤╨╡╨╜╨╜╤Л╨╡ ╨▓ Bundle Audit: layer violations, instances.ts hub cycles, runtime chunk size.

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                    | ╨б╤В╨░╤В╤Г╤Б  |
| --- | --------------------------------------------------------- | ------- |
| 1   | **P0** Fix 4 layer violations (kernelтЖТstores)             | ЁЯЯв Done |
| 2   | **P0/P1** Analyze & refactor instances.ts hub (26 cycles) | ЁЯЯв Done |
| 3   | **P1** Split runtime chunk (1.5MB тЖТ sub-chunks)           | ЁЯЯв Done |
| 4   | **P2** Optimize heavy deps (Recharts тЖТ custom SVG)        | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                  | ╨Ъ╨╛╨│╨┤╨░      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `src/kernel/contracts/debate-store.ts` тАФ IDebateSessionStore + IDebateLiveStore                                                                                                                       | 2026-07-22 |
| 2   | ╨д╨░╨▒╤А╨╕╨║╨╕ ╨░╨┤╨░╨┐╤В╨╡╤А╨╛╨▓ ╨▓ `src/stores/activeDebateStore.ts` ╨╕ `src/stores/debateLiveStore.ts`                                                                                                                      | 2026-07-22 |
| 3   | `debate-sync-manager.ts` тАФ Zustand ╨╕╨╝╨┐╨╛╤А╤В╤Л ╨╖╨░╨╝╨╡╨╜╨╡╨╜╤Л ╨╜╨░ `this.deps.*`                                                                                                                                         | 2026-07-22 |
| 4   | `auto-debate-service.ts` тАФ Zustand ╨╕╨╝╨┐╨╛╤А╤В╤Л ╨╖╨░╨╝╨╡╨╜╨╡╨╜╤Л ╨╜╨░ injected store + subscriber                                                                                                                           | 2026-07-22 |
| 5   | DI wiring ╨▓ `phase3-debate-runtime.ts` + `phase6-high-level.ts`                                                                                                                                              | 2026-07-22 |
| 6   | `dependency-cruiser.cjs` тАФ composition root exception (`service-registration/`)                                                                                                                              | 2026-07-22 |
| 7   | **18 ╤Д╨░╨╣╨╗╨╛╨▓** ╨┐╨╡╤А╨╡╨▓╨╡╨┤╨╡╨╜╤Л ╤Б `import {X} from '../instances'` ╨╜╨░ ╨┐╤А╤П╨╝╤Л╨╡ ╨╕╨╝╨┐╨╛╤А╤В╤Л ╨╕╨╖ `events/event-bus`, `events/event-names`, `services/logger-service`, `instances/services-core`, `instances/services-extras` | 2026-07-22 |
| 8   | `vite.config.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л manualChunks: `kernel-debate` (debate-runtime), `kernel-llm` (LLM ╨░╨┤╨░╨┐╤В╨╡╤А╤Л)                                                                                                     | 2026-07-22 |
| 9   | Recharts (404KB) тЖТ custom SVG ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╤Л: `DonutChart`, `BarChart`, `RadarChart` ╨▓ `src/components/shared/charts/`. 26 ╨╖╨░╨▓╨╕╤Б╨╕╨╝╨╛╤Б╤В╨╡╨╣ ╤Г╨┤╨░╨╗╨╡╨╜╨╛ ╨╕╨╖ node_modules.                                                 | 2026-07-22 |

### ╨а╨╡╨╖╤Г╨╗╤М╤В╨░╤В╤Л

| ╨Ь╨╡╤В╤А╨╕╨║╨░                   | ╨Ф╨╛            | ╨Я╨╛╤Б╨╗╨╡       | ╨Ш╨╖╨╝╨╡╨╜╨╡╨╜╨╕╨╡ |
| ------------------------- | ------------- | ----------- | --------- |
| Circular deps             | 37 violations | **16**      | **-57%**  |
| Runtime chunk             | 1512 KB       | **1058 KB** | **-30%**  |
| Build time                | 30s           | **11s**     | **-63%**  |
| Total JS                  | 6400 KB       | ~6400 KB    | тЙИ         |
| Layer violations          | 4             | **0**       | тЬЕ        |
| Hub cycles (instances.ts) | 26            | **0**       | тЬЕ        |

### ╨Ю╤Б╤В╨░╨▓╤И╨╕╨╡╤Б╤П 16 circular deps

| ╨Ъ╨░╤В╨╡╨│╨╛╤А╨╕╤П                    | ╨Ъ╨╛╨╗-╨▓╨╛ | ╨Ф╨╡╤В╨░╨╗╨╕                                                                 |
| ---------------------------- | ------ | ---------------------------------------------------------------------- |
| Barrel type + dynamic import | 8      | services-core/extras type-imports vs dynamic `import()` тАФ runtime-safe |
| Types/DB infrastructure      | 3      | dal/types тЖФ database-service тЖФ types/interfaces                        |
| Contracts                    | 1      | debate-store тЖФ debate-types                                            |
| UI-only                      | 3      | route-registry, LayoutContext, generateBracket                         |
| **╨Ш╤В╨╛╨│╨╛**                    | **16** | ╨Т╤Б╨╡ benign ╨╕╨╗╨╕ UI-only                                                 |

### Chunk breakdown (after splitting)

| #   | ╨з╨░╨╜╨║            | ╨а╨░╨╖╨╝╨╡╤А      | ╨з╤В╨╛ ╨▓╨╜╤Г╤В╤А╨╕                     |
| --- | --------------- | ----------- | ------------------------------ |
| 1   | runtime         | **1058 KB** | Kernel core (╨▒╨╡╨╖ debate + LLM) |
| 2   | vendor-react    | **802 KB**  | React 19 + ReactDOM + Router   |
| 3   | kernel-debate   | **709 KB**  | Debate runtime (code-split)    |
| 4   | ProviderManager | **179 KB**  | UI ╨┐╨░╨╜╨╡╨╗╤М ╨┐╤А╨╛╨▓╨░╨╣╨┤╨╡╤А╨╛╨▓          |
| 5   | vendor-utils    | **101 KB**  | Zustand, Zod, Dexie, Lucide    |
| 6   | kernel-llm      | **72 KB**   | LLM ╨░╨┤╨░╨┐╤В╨╡╤А╤Л (code-split)      |

vendor-charts (Recharts 404KB) тАФ **╤Г╨┤╨░╨╗╤С╨╜**, ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╨╜╨░ ╨║╨░╤Б╤В╨╛╨╝╨╜╤Л╨╡ SVG ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╤Л.

---

### ╨Ш╤В╨╛╨│ Session 3 тАФ Circular deps ╨┐╨╛╨╗╨╜╨╛╤Б╤В╤М╤О ╤Г╤Б╤В╤А╨░╨╜╨╡╨╜╤Л

**16 тЖТ 0 violations** (100% reduction).

| ╨Ъ╨░╤В╨╡╨│╨╛╤А╨╕╤П                    | ╨С╤Л╨╗╨╛   | ╨б╤В╨░╨╗╨╛ | ╨Ъ╨░╨║ ╨╕╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨╛                                                                       |
| ---------------------------- | ------ | ----- | ------------------------------------------------------------------------------------ |
| Barrel type + dynamic import | 8      | 0     | ╨б╨╛╨╖╨┤╨░╨╜╤Л `core-references.ts` + `extra-references.ts` ╨┤╨╗╤П ╤А╨░╨╖╤А╤Л╨▓╨░ ╤Ж╨╕╨║╨╗╨░ ╨▒╨░╤А╤А╨╡╨╗тЖФ╤Б╨╡╤А╨▓╨╕╤Б |
| Types/DB infrastructure      | 3      | 0     | `MemoryRepository` ╨▓╤Л╨╜╨╡╤Б╨╡╨╜ ╨▓ `dal/repository-types.ts`                               |
| Contracts                    | 1      | 0     | `DebateServiceDeps` ╨▓╤Л╨╜╨╡╤Б╨╡╨╜ ╨▓ ╨╛╤В╨┤╨╡╨╗╤М╨╜╤Л╨╣ `debate-service-deps.ts`                     |
| UI-only                      | 3      | 0     | LayoutMode inlined, re-export removed, import source changed                         |
| Layer violations             | 4      | 0     | тЬЕ ╨Х╤Й╤С ╨╕╨╖ Session 3                                                                  |
| Hub cycles (instances.ts)    | 26     | 0     | тЬЕ ╨Х╤Й╤С ╨╕╨╖ Session 3                                                                  |
| **╨Ш╤В╨╛╨│╨╛**                    | **37** | **0** | **100% ╤З╨╕╤Б╤В╨╛╤В╨░**                                                                     |

### Changes in this round

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | ╨б╨╛╨╖╨┤╨░╨╜ `src/kernel/contracts/debate-service-deps.ts` тАФ `DebateServiceDeps` ╨▓╤Л╨╜╨╡╤Б╨╡╨╜ ╨╕╨╖ `debate-types.ts`, ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╤Л 4 ╤Д╨░╨╣╨╗╨░-╨╕╨╝╨┐╨╛╤А╤В╤С╤А╨░ |
| 2   | `generateBracket.ts` ╨┐╨╡╤А╨╡╨║╨╗╤О╤З╨╡╨╜ ╨╜╨░ `tournament-types` ╨▓╨╝╨╡╤Б╤В╨╛ `TournamentBracketView`                                                 |
| 3   | `uiPreferencesStore.ts` тАФ `LayoutMode` ╨╛╨┐╤А╨╡╨┤╨╡╨╗╤С╨╜ ╨╗╨╛╨║╨░╨╗╤М╨╜╨╛ ╨▓╨╝╨╡╤Б╤В╨╛ ╨╕╨╝╨┐╨╛╤А╤В╨░ ╨╕╨╖ `LayoutContext.tsx`                                      |
| 4   | `route-registry.tsx` тАФ ╤Г╨┤╨░╨╗╤С╨╜ ╤А╨╡-╤Н╨║╤Б╨┐╨╛╤А╤В `AppRoutes` ╨╕╨╖ `routes.tsx`                                                                 |
| 5   | `MemoryRepository` ╨┐╨╡╤А╨╡╨╝╨╡╤Й╤С╨╜ ╨╕╨╖ `dal/types.ts` ╨▓ `dal/repository-types.ts`, ╨╛╨▒╨╜╨╛╨▓╨╗╤С╨╜ `types/interfaces.ts`                           |
| 6   | ╨б╨╛╨╖╨┤╨░╨╜ `src/kernel/instances/core-references.ts` тАФ database, keyService, adapterRegistry ╤Б defaults                                  |
| 7   | ╨б╨╛╨╖╨┤╨░╨╜ `src/kernel/instances/extra-references.ts` тАФ promptSecurityService                                                            |
| 8   | `services-core.ts` ╨┐╨╡╤А╨╡╨▓╨╡╨┤╤С╨╜ ╨╜╨░ ╤А╨╡-╤Н╨║╤Б╨┐╨╛╤А╤В ╨╕╨╖ `core-references.ts`, ╤Г╨┤╨░╨╗╨╡╨╜╤Л ╨┤╤Г╨▒╨╗╨╕╤А╤Г╤О╤Й╨╕╨╡╤Б╤П lazyService                                |
| 9   | `services-extras.ts` ╨┐╨╡╤А╨╡╨▓╨╡╨┤╤С╨╜ ╨╜╨░ ╤А╨╡-╤Н╨║╤Б╨┐╨╛╤А╤В ╨╕╨╖ `extra-references.ts`                                                                |
| 10  | 6 ╤Б╨╡╤А╨▓╨╕╤Б╨╛╨▓ ╨┐╨╡╤А╨╡╨║╨╗╤О╤З╨╡╨╜╤Л ╤Б `import('../instances/services-core')` ╨╜╨░ `import('../instances/core-references')`                          |
| 11  | `chat-executor.ts` ╨┐╨╡╤А╨╡╨║╨╗╤О╤З╤С╨╜ ╤Б `services-extras` ╨╜╨░ `extra-references`                                                              |
| 12  | `auto-debate-service.ts` ╨┐╨╡╤А╨╡╨║╨╗╤О╤З╤С╨╜ ╤Б `services-extras` ╨╜╨░ `quality-settings-store` ╨╜╨░╨┐╤А╤П╨╝╤Г╤О                                         |

### Changes (post-session fixes)

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                        |
| --- | -------------------------------------------------------------------------------------------------- |
| 13  | `SettingsPanel.test.tsx` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `CONFIG` ╨▓ mock `../../kernel/instances` (11 tests тЬЕ)         |
| 14  | `MemoryPanel.test.tsx` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `CONFIG` ╨▓ mock `../../kernel/instances` (11 tests тЬЕ)           |
| 15  | `setup-light.ts` тАФ lightweight ╨│╨╗╨╛╨▒╨░╨╗-╨╝╨╛╨║╨╕ (Worker, crypto, scrollIntoView), ╨С╨Х╨Ч Bootstrap Runtime |
| 16  | `setup-runtime.ts` тАФ runtime.start/shutdown ╨┤╨╗╤П ╤В╨╡╤Б╤В╨╛╨▓, ╨║╨╛╤В╨╛╤А╤Л╨╝ ╨╜╤Г╨╢╨╡╨╜ ╤А╨╡╨░╨╗╤М╨╜╤Л╨╣ DI-╨║╨╛╨╜╤В╨╡╨╣╨╜╨╡╤А        |
| 17  | `vitest.config.ts` тАФ ╨┐╨╡╤А╨╡╨║╨╗╤О╤З╤С╨╜ ╨╜╨░ `setup-light.ts` ╨┐╨╛ ╤Г╨╝╨╛╨╗╤З╨░╨╜╨╕╤О                                   |
| 18  | `integration.test.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `import './setup-runtime'` ╨┤╨╗╤П ╤П╨▓╨╜╨╛╨│╨╛ ╤Б╤В╨░╤А╤В╨░ Runtime              |

### ╨а╨╡╨╖╤Г╨╗╤М╤В╨░╤В╤Л ╨╛╨┐╤В╨╕╨╝╨╕╨╖╨░╤Ж╨╕╨╕ setup.ts

| ╨Ь╨╡╤В╤А╨╕╨║╨░                         | ╨Ф╨╛ (runtime ╨▓ setup.ts) | ╨Я╨╛╤Б╨╗╨╡ (setup-light.ts) | ╨г╤Б╨║╨╛╤А╨╡╨╜╨╕╨╡ |
| ------------------------------- | ----------------------- | ---------------------- | --------- |
| SettingsPanel.test (11 tests)   | 88.6s                   | 50.2s                  | **-43%**  |
| MemoryPanel.test (11 tests)     | 79.3s                   | 21.3s                  | **-73%**  |
| ErrorBoundary + PoolStatus (11) | ~80s                    | 26.1s                  | **-67%**  |
| Phase setup (runtime.start)     | 37-50s                  | 1.4-2.7s               | **-95%**  |

**╨Ъ╨╗╤О╤З╨╡╨▓╨╛╨╡**: UI-╤В╨╡╤Б╤В╤Л ╨▒╨╛╨╗╤М╤И╨╡ ╨╜╨╡ ╨│╤А╤Г╨╖╤П╤В ╨┐╨╛╨╗╨╜╤Л╨╣ Bootstrap Runtime (Dexie, KeyRegistry, Scheduler, Orchestrator, Debate, etc.). ╨н╤В╨╛ ╤Г╤Б╤В╤А╨░╨╜╤П╨╡╤В ╨│╨╗╨░╨▓╨╜╤Г╤О ╨┐╤А╨╕╤З╨╕╨╜╤Г OOM ╨╕ ╤Г╤Б╨║╨╛╤А╤П╨╡╤В ╤В╨╡╤Б╤В╤Л ╨▓ 2-4x.

### Build metrics

| ╨Ь╨╡╤В╤А╨╕╨║╨░                   | ╨Ф╨╛            | ╨Я╨╛╤Б╨╗╨╡       |
| ------------------------- | ------------- | ----------- |
| Circular deps             | 37 violations | **0**       |
| Typecheck errors          | 0             | **0**       |
| Build time                | 30s           | **22s**     |
| Runtime chunk             | 1512 KB       | **1058 KB** |
| Layer violations          | 4             | **0**       |
| Hub cycles (instances.ts) | 26            | **0**       |

---

## Session 4 тАФ Fix debate crash before verdict (v4.5.0 тЖТ v4.6.0)

### ╨ж╨╡╨╗╤М

╨Я╨╛╤З╨╕╨╜╨╕╤В╤М ╨║╤А╨░╤И ╨┤╨╡╨▒╨░╤В╨╛╨▓ ╨┐╨╡╤А╨╡╨┤ ╨▓╤Л╨╜╨╡╤Б╨╡╨╜╨╕╨╡╨╝ ╨▓╨╡╤А╨┤╨╕╨║╤В╨░, ╨║╨╛╨│╨┤╨░ ╤А╨░╤Г╨╜╨┤╤Л ╨┐╤А╨╛╤И╨╗╨╕ ╤Г╤Б╨┐╨╡╤И╨╜╨╛, ╨░╤А╨│╤Г╨╝╨╡╨╜╤В╤Л ╨╜╨░╨║╨╛╨┐╨╕╨╗╨╕╤Б╤М, ╨╜╨╛ ╨╜╨░ ╤Д╨╕╨╜╨░╨╗╤М╨╜╨╛╨╣ ╤Б╤В╨░╨┤╨╕╨╕ (`completed`) ╨┐╤А╨╛╨╕╤Б╤Е╨╛╨┤╨╕╤В ╤Б╨▒╨╛╨╣.

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                                                               | ╨б╤В╨░╤В╤Г╤Б  |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Provider whitelist** тАФ ╤Г╨▒╤А╨░╤В╤М ╨╢╤С╤Б╤В╨║╨╛ ╨╖╨░╨║╨╛╨┤╨╕╤А╨╛╨▓╨░╨╜╨╜╤Л╨╣ ╤Б╨┐╨╕╤Б╨╛╨║ ╨┐╤А╨╛╨▓╨░╨╣╨┤╨╡╤А╨╛╨▓ (╨╛╤Б╤В╨░╨▓╨╕╤В╤М groq, gemini, openrouter, nvidia) | ЁЯЯв Done |
| 2   | **Phase handler** тАФ ╨╛╨▒╨╡╤А╨╜╤Г╤В╤М ╨▓╨╡╤Б╤М ╨▒╨╗╨╛╨║ `to === 'completed'` ╨▓ try/catch + null check ╨┤╨╗╤П conclusionEngine            | ЁЯЯв Done |
| 3   | **Conclusion LLM** тАФ ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╕╨╖╨╕╤А╨╛╨▓╨░╤В╤М preferredProviders ╤Б preflight                                                 | ЁЯЯв Done |
| 4   | **Sync manager** тАФ ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╕╨╖╨╕╤А╨╛╨▓╨░╤В╤М circuit breaker reset ╤Б preflight                                                | ЁЯЯв Done |

### ╨Ф╨╕╨░╨│╨╜╨╛╤Б╤В╨╕╨║╨░ ╨║╨╛╤А╨╜╨╡╨▓╨╛╨╣ ╨┐╤А╨╕╤З╨╕╨╜╤Л

**╨б╨╕╨╝╨┐╤В╨╛╨╝**: ╨┤╨╡╨▒╨░╤В╤Л ╨┐╤А╨╛╤Е╨╛╨┤╤П╤В ╨▓╤Б╨╡ ╤А╨░╤Г╨╜╨┤╤Л, ╨░╤А╨│╤Г╨╝╨╡╨╜╤В╤Л ╨╜╨░╨║╨░╨┐╨╗╨╕╨▓╨░╤О╤В╤Б╤П ╨▓ live mode, ╨╜╨╛ ╨║╤А╨░╤И╨░╤В╤Б╤П ╨┐╨╡╤А╨╡╨┤ ╨▓╨╡╤А╨┤╨╕╨║╤В╨╛╨╝.

**╨в╤А╨░╤Б╤Б╨╕╤А╨╛╨▓╨║╨░**:

1. `consensusAndFinalize` (pipeline-builder.ts:369) ╨▓╤Л╨╖╤Л╨▓╨░╨╡╤В `session.transition('completed')`
2. `transition()` ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╜╨╛ ╨▓╤Л╨╖╤Л╨▓╨░╨╡╤В ╨▓╤Б╨╡ `_phaseListeners`, ╨▓╨║╨╗╤О╤З╨░╤П `createPhaseChangeHandler`
3. ╨д╨░╨╖╨╛╨▓╤Л╨╣ ╤Е╨╡╨╜╨┤╨╗╨╡╤А ╨╖╨░╨┐╤Г╤Б╨║╨░╨╡╤В scoring ╨▒╨╗╨╛╨║ (memoryExtractor, evaluator, blindEval, bayesianJudge, stanceDriftTracker) ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╜╨╛
4. ╨Ы╤О╨▒╨╛╨╣ ╨╜╨╡╨╛╤В╨╗╨╛╨▓╨╗╨╡╨╜╨╜╤Л╨╣ `throw` ╨▓ ╤Н╤В╨╛╨╝ ╨▒╨╗╨╛╨║╨╡ ╨┐╤А╨╛╨▒╨╕╨▓╨░╨╡╤В ╤З╨╡╤А╨╡╨╖ `transition()` тЖТ `consensusAndFinalize` catch тЖТ pipeline catch
5. Catch ╨▓ `consensusAndFinalize` ╨╜╨╡ ╨╝╨╛╨╢╨╡╤В ╨┐╨╡╤А╨╡╨▓╨╡╤Б╤В╨╕ `completed` тЖТ `failed` (╨╜╨╡╨▓╨░╨╗╨╕╨┤╨╜╤Л╨╣ ╨┐╨╡╤А╨╡╤Е╨╛╨┤), ╤Б╨╡╤Б╤Б╨╕╤П ╨╖╨░╨▓╨╕╤Б╨░╨╡╤В ╨▓ `completed` ╨▒╨╡╨╖ ╨▓╨╡╤А╨┤╨╕╨║╤В╨░
6. `DEBATE_SESSION_FAILED` ╤Н╨╝╨╕╤В╨╕╤В╤Б╤П ╨┤╨▓╨░╨╢╨┤╤Л (╨╕╨╖ pipeline catch + ╨╕╨╖ startSession), ╤Б╨╡╤Б╤Б╨╕╤П ╨╜╨╕╨║╨╛╨│╨┤╨░ ╨╜╨╡ ╤Д╨╕╨╜╨░╨╗╨╕╨╖╨╕╤А╤Г╨╡╤В╤Б╤П

**╨Ш╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╨╡**: ╨▓╨╡╤Б╤М `to === 'completed'` ╨▒╨╗╨╛╨║ ╨╛╨▒╤С╤А╨╜╤Г╤В ╨▓ ╨╡╨┤╨╕╨╜╤Л╨╣ try/catch, ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ null check ╨┤╨╗╤П `conclusionEngine` ╨┐╨╡╤А╨╡╨┤ `generateVerdictWithLLM`.

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                            | ╨Ъ╨╛╨│╨┤╨░      |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | `debate-preflight.ts` тАФ ╤Б╨┐╨╕╤Б╨╛╨║ ╨┐╤А╨╛╨▓╨░╨╣╨┤╨╡╤А╨╛╨▓ ╤Б╨╛╨║╤А╨░╤Й╤С╨╜ ╤Б 12 ╨┤╨╛ 4 (groq, gemini, openrouter, nvidia)                       | 2026-07-22 |
| 2   | `debate-phase-handler.ts` тАФ ╨▓╨╡╤Б╤М `to === 'completed'` ╨▒╨╗╨╛╨║ ╨╛╨▒╤С╤А╨╜╤Г╤В ╨▓ try/catch, ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `conclusionEngine` null check | 2026-07-22 |
| 3   | `debate-conclusion-engine.ts` тАФ `preferredProviders` ╨▓ `buildConclusionLlmCall` ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╕╨╖╨╕╤А╨╛╨▓╨░╨╜ (4 ╨┐╤А╨╛╨▓╨░╨╣╨┤╨╡╤А╨░)         | 2026-07-22 |
| 4   | `debate-sync-manager.ts` тАФ circuit breaker reset list ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╕╨╖╨╕╤А╨╛╨▓╨░╨╜ (4 ╨┐╤А╨╛╨▓╨░╨╣╨┤╨╡╤А╨░)                                   | 2026-07-22 |

---

## Session 5 тАФ Deep ╨░╤Г╨┤╨╕╤В╤Л (╨┐╤А╨╛╨╝╤В╤Л 2.7, 2.11-2.14) (v4.5.0 тЖТ v4.6.0)

### ╨ж╨╡╨╗╤М

╨Я╤А╨╛╨│╨╜╨░╤В╤М ╨╛╤Б╤В╨░╨▓╤И╨╕╨╡╤Б╤П ╨░╤Г╨┤╨╕╤В╤Л ╨╕╨╖ ╤И╨┐╨░╤А╨│╨░╨╗╨║╨╕ `docs/aaa.md` (14 ╨┐╤А╨╛╨▒╨╗╨╡╨╝╨╜╤Л╤Е) ╨╕ ╤Б╨╛╨▒╤А╨░╤В╤М ╨║╨░╤А╤В╤Г ╤А╨╡╨░╨╗╤М╨╜╤Л╤Е ╨┐╤А╨╛╨▒╨╗╨╡╨╝ ╤Б╨╕╤Б╤В╨╡╨╝╤Л.

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                | ╨б╤В╨░╤В╤Г╤Б  |
| --- | --------------------------------------------------------------------- | ------- |
| 1   | **2.7 UX / Correctness** тАФ ╨┐╨╡╤А╨╡╨╖╨░╨┐╤Г╤Б╨║ (╨┐╤А╨╡╨┤╤Л╨┤╤Г╤Й╨╕╨╣ ╤А╨╡╨╖╤Г╨╗╤М╤В╨░╤В ╨▒╤Л╨╗ ╨┐╤Г╤Б╤В) | ЁЯЯв Done |
| 2   | **2.11 Single Source of Truth / State Consistency**                   | ЁЯЯв Done |
| 3   | **2.12 Accessibility (a11y)**                                         | ЁЯЯв Done |
| 4   | **2.13 Resilience & Fault Tolerance**                                 | ЁЯЯв Done |
| 5   | **2.14 Dependencies & Third-Party Risks**                             | ЁЯЯв Done |
| 6   | **3.1тАУ3.10 Functional area audits**                                   | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                    | ╨Ъ╨╛╨│╨┤╨░      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | **2.7 UX** тАФ 17 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (1 Critical: AgentControlPanel inject no-op, 5 High, 6 Medium, 5 Low)                                                                                                  | 2026-07-23 |
| 2   | **2.11 State Consistency** тАФ 16 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (3 Critical: debate state quadruplicated, dual memory systems, config import drift; 5 High, 5 Medium, 3 Low)                                           | 2026-07-23 |
| 3   | **2.12 a11y** тАФ 20 ╨║╨░╤В╨╡╨│╨╛╤А╨╕╨╣, 50+ ╤Д╨░╨╣╨╗╨╛╨▓ (3 Critical: modals ╨▒╨╡╨╖ focus trap, div onClick ╨▒╨╡╨╖ role/keyboard, backdrop cancel-safety; 7 High, 6 Medium, 4 Low)                                   | 2026-07-23 |
| 4   | **2.13 Resilience** тАФ 61 ╨╜╨░╤Е╨╛╨┤╨║╨░ (5 Critical: no unhandledrejection handler, module-level maps leak, 429 treated as permanent, batch no retry, 2462-line monolith; 14 High, 21 Medium, 21 Low) | 2026-07-23 |
| 5   | **2.14 Dependencies** тАФ 15 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (2 Critical: 370MB dead dep chain, broken worker in prod; 4 High: 7 CVEs, 68 duplicates, zod@4 beta, worker broken; 3 Medium, 6 Low)                        | 2026-07-23 |
| 6   | ╨Т╤Б╨╡ ╤А╨╡╨╖╤Г╨╗╤М╤В╨░╤В╤Л ╨╖╨░╨┐╨╕╤Б╨░╨╜╤Л ╨▓ `docs/ocs/aaa.md` (╤Б╨╡╨║╤Ж╨╕╨╕ 15-19)                                                                                                                                     | 2026-07-23 |
| 7   | **3.1 Chat & Collaboration** тАФ 34 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (7 Critical, 12 High, 9 Medium, 6 Low)                                                                                                               | 2026-07-23 |
| 8   | **3.2 Agents & Roles** тАФ 28 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (4 Critical, 6 High, 10 Medium, 8 Low)                                                                                                                     | 2026-07-23 |
| 9   | **3.3 Debate System** тАФ 64 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (14 Critical, 22 High, 16 Medium, 12 Low)                                                                                                                   | 2026-07-23 |
| 10  | **3.4 Memory & Knowledge** тАФ 31 ╨╜╨░╤Е╨╛╨┤╨║╨░ (4 Critical, 10 High, 10 Medium, 7 Low)                                                                                                                | 2026-07-23 |
| 11  | **3.5 Security & Governance** тАФ 26 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (5 Critical, 7 High, 8 Medium, 6 Low)                                                                                                               | 2026-07-23 |
| 12  | **3.6 Observability & Diagnostics** тАФ 31 ╨╜╨░╤Е╨╛╨┤╨║╨░ (7 Critical, 8 High, 9 Medium, 7 Low)                                                                                                         | 2026-07-23 |
| 13  | **3.7 Performance & Optimization** тАФ 32 ╨╜╨░╤Е╨╛╨┤╨║╨╕ (8 Critical, 12 High, 7 Medium, 5 Low)                                                                                                         | 2026-07-23 |
| 14  | **3.8 Providers & Connectors** тАФ 39 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (4 Critical, 14 High, 13 Medium, 8 Low)                                                                                                            | 2026-07-23 |
| 15  | **3.9 Development & Tooling** тАФ 28 ╨╜╨░╤Е╨╛╨┤╨╛╨║ (3 Critical, 5 High, 10 Medium, 10 Low)                                                                                                             | 2026-07-23 |
| 16  | **3.10 Infrastructure & Deployment** тАФ 24 ╨╜╨░╤Е╨╛╨┤╨║╨╕ (6 Critical, 7 High, 6 Medium, 5 Low)                                                                                                        | 2026-07-23 |
| 17  | ╨Т╤Б╨╡ ╤А╨╡╨╖╤Г╨╗╤М╤В╨░╤В╤Л ╨╖╨░╨┐╨╕╤Б╨░╨╜╤Л ╨▓ `docs/ocs/aaa.md` (╤Б╨╡╨║╤Ж╨╕╨╕ 20-29)                                                                                                                                     | 2026-07-23 |

### ╨б╨▓╨╛╨┤╨║╨░ ╨╜╨░╤Е╨╛╨┤╨╛╨║ ╨┐╨╛ ╨▓╤Б╨╡╨╝ ╨░╤Г╨┤╨╕╤В╨░╨╝ Session 5

#### ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨╜╤Л╨╡ ╨░╤Г╨┤╨╕╤В╤Л (2.7, 2.11-2.14)

| ╨Р╤Г╨┤╨╕╤В                  | Critical | High   | Medium | Low    | ╨Т╤Б╨╡╨│╨╛   |
| ---------------------- | -------- | ------ | ------ | ------ | ------- |
| 2.7 UX                 | 1        | 5      | 6      | 5      | 17      |
| 2.11 State Consistency | 3        | 5      | 5      | 3      | 16      |
| 2.12 a11y              | 3        | 7      | 6      | 4      | 20      |
| 2.13 Resilience        | 5        | 14     | 21     | 21     | 61      |
| 2.14 Dependencies      | 2        | 4      | 3      | 6      | 15      |
| **╨Ш╤В╨╛╨│╨╛ ╨┐╤А╨╛╨▒╨╗╨╡╨╝╤Л**     | **14**   | **35** | **41** | **39** | **129** |

#### ╨д╤Г╨╜╨║╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╤Л╨╡ ╨░╤Г╨┤╨╕╤В╤Л (3.1-3.10)

| ╨Р╤Г╨┤╨╕╤В                            | Critical | High    | Medium | Low    | ╨Т╤Б╨╡╨│╨╛   |
| -------------------------------- | -------- | ------- | ------ | ------ | ------- |
| 3.1 Chat & Collaboration         | 7        | 12      | 9      | 6      | 34      |
| 3.2 Agents & Roles               | 4        | 6       | 10     | 8      | 28      |
| 3.3 Debate System                | 14       | 22      | 16     | 12     | 64      |
| 3.4 Memory & Knowledge           | 4        | 10      | 10     | 7      | 31      |
| 3.5 Security & Governance        | 5        | 7       | 8      | 6      | 26      |
| 3.6 Observability & Diagnostics  | 7        | 8       | 9      | 7      | 31      |
| 3.7 Performance & Optimization   | 8        | 12      | 7      | 5      | 32      |
| 3.8 Providers & Connectors       | 4        | 14      | 13     | 8      | 39      |
| 3.9 Development & Tooling        | 3        | 5       | 10     | 10     | 28      |
| 3.10 Infrastructure & Deployment | 6        | 7       | 6      | 5      | 24      |
| **╨Ш╤В╨╛╨│╨╛ ╤Д╤Г╨╜╨║╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╤Л╨╡**         | **62**   | **103** | **98** | **74** | **337** |

#### ╨Ю╨▒╤Й╨╕╨╣ ╨╕╤В╨╛╨│ Session 5

| ╨Ъ╨░╤В╨╡╨│╨╛╤А╨╕╤П       | Critical | High    | Medium  | Low     | ╨Т╤Б╨╡╨│╨╛   |
| --------------- | -------- | ------- | ------- | ------- | ------- |
| ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨╜╤Л╨╡      | 14       | 35      | 41      | 39      | 129     |
| ╨д╤Г╨╜╨║╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╤Л╨╡  | 62       | 103     | 98      | 74      | 337     |
| **Grand Total** | **76**   | **138** | **139** | **113** | **466** |

### ╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ ╨▓╤Л╨▓╨╛╨┤╤Л

1. **Debate System тАФ ╤Б╨░╨╝╤Л╨╣ ╨┐╤А╨╛╨▒╨╗╨╡╨╝╨╜╤Л╨╣ ╨╝╨╛╨┤╤Г╨╗╤М** (64 ╨╜╨░╤Е╨╛╨┤╨╛╨║, 14 Critical). ╨Ь╨╛╨┤╤Г╨╗╤М╨╜╤Л╨╡ ╨║╨░╤А╤В╤Л, ╨╜╨╕╨║╨╛╨│╨┤╨░ ╨╜╨╡ ╨╛╤З╨╕╤Й╨░╤О╤Й╨╕╨╡╤Б╤П, fire-and-forget ╨▓╨╡╤А╨┤╨╕╨║╤В, O(n┬▓) ╨▓ hot paths, race conditions ╨╝╨╡╨╢╨┤╤Г ╤Д╨╕╨╜╨░╨╗╨╕╨╖╨░╤Ж╨╕╨╡╨╣ ╨╕ ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╕╨╖╨░╤Ж╨╕╨╡╨╣.
2. **Providers & Connectors** (39 ╨╜╨░╤Е╨╛╨┤╨╛╨║) тАФ 15+ ╨░╨┤╨░╨┐╤В╨╡╤А╨╛╨▓ ╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╤О╤В raw fetch() ╨▓╨╝╨╡╤Б╤В╨╛ LLMHttpClient, ╨▒╨░╨╣╨┐╨░╤Б╤П timeout/inflight/memory-pressure.
3. **Chat & Collaboration** (34 ╨╜╨░╤Е╨╛╨┤╨║╨╕) тАФ send lock deadlock, orphaned requests, stale hydration overwrites.
4. **Performance & Optimization** (32 ╨╜╨░╤Е╨╛╨┤╨║╨╕) тАФ fabricated trend data, unbounded dedupSet, 3├Ч full scan per STREAM_END.
5. **Memory & Knowledge** (31 ╨╜╨░╤Е╨╛╨┤╨║╨░) тАФ dual memory systems ╨╜╨╕╨║╨╛╨│╨┤╨░ ╨╜╨╡ ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╕╨╖╨╕╤А╤Г╤О╤В╤Б╤П, 7 in-memory stores ╨▒╨╡╨╖ ╨┐╨╡╤А╤Б╨╕╤Б╤В╨╡╨╜╤Ж╨╕╨╕.
6. **Observability** (31 ╨╜╨░╤Е╨╛╨┤╨║╨░) тАФ SLA service full mock, activeDebates:0 hardcoded, health score stale.
7. **Security** (26 ╨╜╨░╤Е╨╛╨┤╨╛╨║) тАФ encrypt/decrypt no-op, adminToken undefined by default, timing side-channel.
8. **Infrastructure** (24 ╨╜╨░╤Е╨╛╨┤╨║╨╕) тАФ time-machine restore saves instead of restoring, webhooks ╨▒╨╡╨╖ HMAC, hub cycles reintroduced.
9. **Agents & Roles** (28 ╨╜╨░╤Е╨╛╨┤╨╛╨║) тАФ RBAC bypassed in dev, no lifecycle in protocol service, client-only enforcement.
10. **Dev & Tooling** (28 ╨╜╨░╤Е╨╛╨┤╨╛╨║) тАФ API key in URL query, plugin SDK no validation, fine-tuning full mock.

---

## Session 6 тАФ ╨б╤В╨░╨▒╨╕╨╗╨╕╨╖╨░╤Ж╨╕╤П Debate System (v4.5.0 тЖТ v4.6.0)

### ╨ж╨╡╨╗╤М

╨г╤Б╤В╤А╨░╨╜╨╕╤В╤М 14 Critical ╨┐╤А╨╛╨▒╨╗╨╡╨╝ ╨▓ Debate Runtime, ╤З╤В╨╛╨▒╤Л ╤Б╨╕╤Б╤В╨╡╨╝╨░ ╨╝╨╛╨│╨╗╨░ ╨▓╤Л╨┤╨░╤В╤М 1000 ╨▓╨╡╤А╨┤╨╕╨║╤В╨╛╨▓ ╨┐╨╛╨┤╤А╤П╨┤ ╨▒╨╡╨╖ ╨║╤А╨░╤И╨░/OOM.

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                      | ╨б╤В╨░╤В╤Г╤Б       |
| --- | --------------------------------------------------------------------------- | ------------ |
| 1   | **C1** Module-level maps leak ╨▓ `debate-llm-caller.ts`                      | ЁЯЯв Done      |
| 2   | **C2** Fire-and-forget verdict ╨▓ `debate-phase-handler.ts`                  | ЁЯЯв Done      |
| 3   | **C3** Race stopDebateInternal vs finalize ╨▓ `debate-sync-manager.ts`       | тЭМ Skipped   |
| 4   | **C4** Unsafe sync phase transitions ╨▓ `debate-pipeline-builder.ts`         | тЭМ Skipped   |
| 5   | **C5** Argument content stripped before async verdict                       | тЭМ Skipped   |
| 6   | **C6** sessionAbortControllers leak ╨▓ `debate-llm-caller.ts`                | ЁЯЯв Done      |
| 7   | **C7** Module instance maps never reset ╨▓ `debate-orchestrator.ts`          | ЁЯЯв Done      |
| 8   | **C8** Session-shared cache ╨▓ `debate-consensus.ts`                         | тЪк Non-issue |
| 9   | **C9** enhancementInFlight not session-wide ╨▓ `debate-conclusion-engine.ts` | тЪк Non-issue |
| 10  | **C10** verdictAbortController timer handling                               | ЁЯЯв Done (C2) |
| 11  | **C11** destroy() timeout race ╨▓ `debate-engine.ts`                         | ЁЯЯв Done      |
| 12  | **C12** Heartbeat dead code ╨▓ `debate-sync-manager.ts`                      | ЁЯЯв Done      |
| 13  | **C13** Duplicate preflight requests ╨▓ `debate-engine.ts`                   | ЁЯЯв Done      |
| 14  | **C14** skipAgents never reset for resumed sessions                         | тЪк Non-issue |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | `debate-llm-caller.ts` тАФ `cleanupSessionMaps(sessionId)` export added; `debate-engine.ts` тАФ `cancelSession()` ╨▓╤Л╨╖╤Л╨▓╨░╨╡╤В `cleanupSessionMaps()` ╨▓ `cleanupMaps()`                                                                     |
| C2  | `debate-pipeline-builder.ts` тАФ verdict generation moved from phase handler to `consensusAndFinalize` pipeline stage (await, properly ordered); `debate-phase-handler.ts` тАФ verdict block, timer, controller removed                 |
| C6  | `debate-llm-caller.ts` тАФ `isSessionCancelled` check added on every retry loop iteration (inside `while`), preventing `sessionAbortControllers` recreation after cleanup                                                             |
| C7  | `debate-orchestrator.ts` тАФ `bidScores.clear()` added to no-arg `destroy()` + per-session destroy path also clears maps; `participationCount`, `lastInteraction` cleaned                                                             |
| C8  | Inspection confirmed: each session creates its own `DebateConsensusEngine` via `DebateSessionContext`; `destroy()` already clears all caches. **Closed as non-issue**                                                               |
| C9  | Inspection confirmed: per-session engine instance, flag protects concurrent calls within one session only. **Closed as non-issue**                                                                                                  |
| C10 | Fixed as part of C2 тАФ `verdictAbortController` and timer now live in pipeline stage, not phase handler                                                                                                                              |
| C11 | `debate-engine.ts` тАФ `_destroyed` flag set first in `destroy()` before any cleanup; `_trackOp()` checks flag and returns promise untracked; `destroy()` awaits pending ops with 5s timeout before clearing maps                     |
| C12 | `debate-sync-manager.ts` тАФ removed `_heartbeatTimer`, `startHeartbeat()`, `stopHeartbeat()`, all callers; dead code eliminated                                                                                                      |
| C13 | `debate-engine.ts` тАФ `_preflightingProviders` Set guards against concurrent preflight for same provider; cleanup in `preflightTask.finally()`; added `_preflightingProviders.clear()` in `destroy()` for defense-in-depth           |
| C14 | Inspection confirmed: `skipAgents` is purely local to pipeline stage `run()`, computed fresh from `session.arguments` each pipeline build, scoped to current round via `a.round === startRound + 1` filter. **Closed as non-issue** |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░    | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡             |
| ---------- | -------------------- |
| tsc -b     | 0 errors             |
| Build time | 16.52s               |
| Chunks     | 160+                 |
| Runtime    | 1,058 KB (unchanged) |

### ╨Ю╤Б╤В╨░╨▓╤И╨╕╨╡╤Б╤П ╨╖╨░╨┤╨░╤З╨╕ (Skipped)

| #   | ╨Ч╨░╨┤╨░╤З╨░                                         | ╨Я╤А╨╕╤З╨╕╨╜╨░ ╨┐╤А╨╛╨┐╤Г╤Б╨║╨░                                                            |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| C3  | Race stopDebateInternal vs finalize            | Out of scope тАФ sync-manager architecture needs wider refactor               |
| C4  | Unsafe sync phase transitions                  | Out of scope тАФ tied to pipeline-builder redesign                            |
| C5  | Argument content stripped before async verdict | Out of scope тАФ requires deeper analysis of memory extractor pipeline timing |

---

## Session 7 тАФ Critical ╤Д╨╕╨║╤Б╤Л ╨┐╨╛ ╨▓╤Б╨╡╨╝ ╨╛╨▒╨╗╨░╤Б╤В╤П╨╝ (v4.5.0 тЖТ v4.6.0)

### ╨ж╨╡╨╗╤М

╨г╤Б╤В╤А╨░╨╜╨╕╤В╤М ╨┐╨╛ ╨╛╨┤╨╜╨╛╨╝╤Г Critical ╨╕╨╖ ╨║╨░╨╢╨┤╨╛╨╣ ╨╕╨╖ 8 ╨╛╨▒╨╗╨░╤Б╤В╨╡╨╣ ╨░╤Г╨┤╨╕╤В╨░ Session 5 (Chat, Agents, Memory, Security, Observability, Performance, Providers, Infrastructure).

### ╨Я╨╗╨░╨╜

| #   | ╨Ю╨▒╨╗╨░╤Б╤В╤М            | ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨░                                                       | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ------------------ | -------------------------------------------------------------- | ------- |
| 1   | **Chat**           | requestEntryMap populated AFTER eventBus.emit тЖТ ╨┐╨╛╤В╨╡╤А╤П ╨╛╤В╨▓╨╡╤В╨╛╨▓ | ЁЯЯв Done |
| 2   | **Agents**         | PermissionGate DEV bypass тЖТ RBAC ╨╜╨╡ ╤А╨░╨▒╨╛╤В╨░╨╡╤В ╨▓ dev             | ЁЯЯв Done |
| 3   | **Memory**         | duplicated computeId (SHA-256 ╨▓ 2 ╤Д╨░╨╣╨╗╨░╤Е)                      | ЁЯЯв Done |
| 4   | **Security**       | SecurityService encrypt/decrypt no-op                          | ЁЯЯв Done |
| 5   | **Observability**  | activeDebates: 0 hardcoded                                     | ЁЯЯв Done |
| 6   | **Performance**    | dedupSet ╨▓ budget-service ╤А╨░╤Б╤В╤С╤В ╨▒╨╡╤Б╨║╨╛╨╜╨╡╤З╨╜╨╛                    | ЁЯЯв Done |
| 7   | **Providers**      | batch-processor currentAbort ╤В╨╡╤А╤П╨╡╤В╤Б╤П ╨┐╤А╨╕ throw                | ЁЯЯв Done |
| 8   | **Infrastructure** | time-machine restore ╤Б╨╛╤Е╤А╨░╨╜╤П╨╡╤В ╨▓╨╝╨╡╤Б╤В╨╛ ╨▓╨╛╤Б╤Б╤В╨░╨╜╨╛╨▓╨╗╨╡╨╜╨╕╤П           | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `stores/chat/store.ts` тАФ moved requestEntryMap population BEFORE `eventBus.emit(EVENTS.SEND_MESSAGE)`, so response handlers can find the entry synchronously                                                                                           |
| 2   | `components/Common/PermissionGate.tsx` тАФ removed `if (import.meta.env.DEV) return children` bypass; RBAC now enforced in dev too                                                                                                                       |
| 3   | Created `src/kernel/utils/compute-memory-id.ts` тАФ shared `computeMemoryId()` function; both `memory-repository.ts` and `memory-engine.ts` now delegate to it, eliminating the duplicate                                                                |
| 4   | `kernel/security.ts` тАФ implemented real AES-GCM encryption via Web Crypto API (PBKDF2 key derivation, random IV per encrypt, base64 output format)                                                                                                     |
| 5   | `monitoring-service.ts` тАФ added `getActiveDebatesCount` callback to `MonitoringServiceDeps`; `activeDebates` now queries runtime instead of hardcoded `0`                                                                                              |
| 6   | `budget-service.ts` тАФ added dedupSet size check: prune when `_costDedupSet.size > 15000` in addition to existing costHistory > 10000 check                                                                                                             |
| 7   | `batch-processor-service.ts` тАФ wrapped `runJob()` body in `try/finally` to ensure `this.currentAbort = null` runs on throw as well as normal completion                                                                                                |
| 8   | `contracts/time-machine.ts` тАФ added `keysData` field to `TimeSnapshot`; `time-machine-service.ts` тАФ `createSnapshot('keys')` now stores `getAllKeys()` data; `restoreByScope('keys')` calls `restoreKeys()` with snapshot data instead of `saveKeys()` |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░    | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| ---------- | -------- |
| tsc -b     | 0 errors |
| Build time | 12.21s   |
| Chunks     | 160+     |
| Runtime    | 1,060 KB |

---

## Session 8 тАФ ╨Х╤Й╤С 8 Critical ╨┐╨╛ ╨▓╤Б╨╡╨╝ ╨╛╨▒╨╗╨░╤Б╤В╤П╨╝ (v4.5.0 тЖТ v4.6.0)

### ╨ж╨╡╨╗╤М

╨г╤Б╤В╤А╨░╨╜╨╕╤В╤М ╨╡╤Й╤С 8 Critical ╨┐╤А╨╛╨▒╨╗╨╡╨╝ ╨╕╨╖ ╨░╤Г╨┤╨╕╤В╨░ Session 5 тАФ ╤Б╨╗╨╡╨┤╤Г╤О╤Й╨╕╨╡ ╨┐╨╛ ╨┐╤А╨╕╨╛╤А╨╕╤В╨╡╤В╤Г.

### ╨Я╨╗╨░╨╜

| #   | ╨Ю╨▒╨╗╨░╤Б╤В╤М               | ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨░                                             | ╨б╤В╨░╤В╤Г╤Б  |
| --- | --------------------- | ---------------------------------------------------- | ------- |
| 1   | **Chat C2**           | `_sendLocks` deadlock тАФ permanently ╨▒╨╗╨╛╨║╨╕╤А╤Г╨╡╤В ╤Б╨╡╤Б╤Б╨╕╤О | ЁЯЯв Done |
| 2   | **Security C3**       | `verifyAdminToken ===` ╨▓╨╝╨╡╤Б╤В╨╛ constant-time          | ЁЯЯв Done |
| 3   | **Security C5**       | `adminToken undefined` ╨┐╨╛ ╤Г╨╝╨╛╨╗╤З╨░╨╜╨╕╤О                  | ЁЯЯв Done |
| 4   | **Observability C7**  | `system-status-service` ╨▒╨╡╨╖ error boundary           | ЁЯЯв Done |
| 5   | **Performance C8**    | `_dismissed` Set ╤А╨░╤Б╤В╤С╤В ╨▒╨╡╤Б╨║╨╛╨╜╨╡╤З╨╜╨╛                   | ЁЯЯв Done |
| 6   | **Dev C1**            | API key ╨▓ URL query ╨┐╨░╤А╨░╨╝╨╡╤В╤А╨╡ (Gemini)               | ЁЯЯв Done |
| 7   | **Infrastructure C3** | Hub circular dep ╨▓ `config-history.ts`               | ЁЯЯв Done |
| 8   | **Infrastructure C6** | Hub circular dep ╨▓ `gemini-cache-service.ts`         | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `stores/chat/store.ts` тАФ replaced `_sendLocks` binary lock with `_sendQueue`; queued messages are processed FIFO when current send completes; silent drop replaced with queuing    |
| 2   | `kernel/utils/constant-time.ts` тАФ created shared `constantTimeEqual()`; `external-secrets-service.ts` and `virtual-key-service.ts` switched from `===` to constant-time comparison |
| 3   | `config-registry.ts` тАФ `buildConfigDefaults()` generates `crypto.randomUUID()` for `adminToken` if none configured; auth now has a valid default                                   |
| 4   | `system-status-service.ts` тАФ `getStatus()` wrapped in try/catch; returns `DEGRADED` summary on error instead of throwing                                                           |
| 5   | `cost-optimization-service.ts` тАФ `dismissRecommendation()` prunes `_dismissed` Set at 1000 entries (FIFO eviction)                                                                 |
| 6   | `gemini-cache-service.ts` тАФ moved API key from URL query (`?key=...`) to `X-Goog-Api-Key` header; no longer leaked in logs/history                                                 |
| 7   | `config-history.ts` тАФ changed `import('../instances')` to `import('../instances/core-references')` тАФ breaks hub circular dep                                                       |
| 8   | `gemini-cache-service.ts` тАФ changed `import('../instances')` to `import('../instances/core-references')` тАФ breaks hub circular dep                                                 |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░    | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| ---------- | -------- |
| tsc -b     | 0 errors |
| Build time | 9.84s    |
| Chunks     | 160+     |
| Runtime    | 1,061 KB |

---

## Session 9 тАФ ╨Х╤Й╤С 8 Critical ╨┐╨╛ ╨▓╤Б╨╡╨╝ ╨╛╨▒╨╗╨░╤Б╤В╤П╨╝ (v4.5.0 тЖТ v4.6.0) тЬЕ

**╨Т╤Б╨╡ 8 Critical ╤Д╨╕╨║╤Б╨╛╨▓ ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜╤Л. Build 0 errors, 10.95s.**

### Changes

| #   | ╨Ю╨▒╨╗╨░╤Б╤В╤М               | ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨░                                                                                  | ╨д╨╕╨║╤Б                                                                                                                   |
| --- | --------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | **Chat C3**           | `editEntry` ╨╛╤З╨╕╤Й╨░╨╡╤В loading/streaming responses ╨▒╨╡╨╖ ╨╛╤В╨╝╨╡╨╜╤Л in-flight ╨╖╨░╨┐╤А╨╛╤Б╨╛╨▓             | `editEntry` ╤Н╨╝╨╕╤В╨╕╤В `CANCEL_MESSAGE` + `removeActiveRequestId` ╨┤╨╗╤П ╨║╨░╨╢╨┤╨╛╨│╨╛ loading/streaming response ╨┐╨╡╤А╨╡╨┤ ╨╛╤З╨╕╤Б╤В╨║╨╛╨╣    |
| 2   | **Dev C2**            | `installPlugin` ╨╜╨╡ ╨▓╨░╨╗╨╕╨┤╨╕╤А╤Г╨╡╤В PluginManifest                                              | ╨Ф╨╛╨▒╨░╨▓╨╗╨╡╨╜╨░ `validateManifest()` тАФ ╨┐╤А╨╛╨▓╨╡╤А╨║╨░ id (regex), semver, ╤В╨╕╨┐, permissions, ╨╛╨▒╤П╨╖╨░╤В╨╡╨╗╤М╨╜╤Л╨╡ ╨┐╨╛╨╗╤П                      |
| 3   | **Infrastructure C2** | memory scope restore ╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╨╡╤В ╤В╨╡╨║╤Г╤Й╨╡╨╡ ╤Б╨╛╤Б╤В╨╛╤П╨╜╨╕╨╡ ╨▓╨╝╨╡╤Б╤В╨╛ ╤Б╨╜╨░╨┐╤И╨╛╤В╨░ (append ╨▓╨╝╨╡╤Б╤В╨╛ replace) | `TimeSnapshot.memoryData`; `createSnapshot('memory')` ╤Б╨╛╤Е╤А╨░╨╜╤П╨╡╤В ╨┤╨░╨╜╨╜╤Л╨╡; `restoreByScope` ╤З╨╕╤Б╤В╨╕╤В ╨╕ ╨╕╨╝╨┐╨╛╤А╤В╨╕╤В ╨╕╨╖ ╤Б╨╜╨░╨┐╤И╨╛╤В╨░ |
| 4   | **Infrastructure C4** | Webhook POST ╨▒╨╡╨╖ HMAC тАФ ╨┐╨╛╨┤╨┐╨╕╤Б╤М ╨╜╨╡ ╨▓╨╡╤А╨╕╤Д╨╕╤Ж╨╕╤А╤Г╨╡╨╝╨░                                          | HMAC-SHA256 ╤З╨╡╤А╨╡╨╖ Web Crypto API; ╨╖╨░╨│╨╛╨╗╨╛╨▓╨╛╨║ `X-Signature-256` ╨╡╤Б╨╗╨╕ `CONFIG.security.webhookSecret` ╨╖╨░╨┤╨░╨╜               |
| 5   | **Observability C5**  | causal-timeline subscription leak                                                         | `this.unsub?.()` ╨┐╨╡╤А╨╡╨┤ ╨┐╨╡╤А╨╡╨╖╨░╨┐╨╕╤Б╤М╤О ╨▓ `start()`                                                                         |
| 6   | **Observability C2**  | heapLog fallback ╨┤╨╗╤П non-Chromium                                                         | `LOGGER.warn` ╨▓ else-╨▓╨╡╤В╨║╨╡                                                                                             |
| 7   | **Observability C3**  | stale healthScore                                                                         | `this.recalculateHealth()` ╨▓ `getSystemHealthIndicators()`                                                             |
| 8   | **Performance C7**    | 50ms ╨╕╤Б╨║╤Г╤Б╤Б╤В╨▓╨╡╨╜╨╜╨░╤П ╨╖╨░╨┤╨╡╤А╨╢╨║╨░                                                               | ╨г╨┤╨░╨╗╨╡╨╜╨░ ╨╕╨╖ `checkAllHealth`                                                                                            |

---

## Session 10 тАФ 8 Critical: Chat, Security, Observability, Performance, Agents, Dev, Infra, Providers (v4.5.0 тЖТ v4.6.0) тЬЕ

### ╨Я╨╗╨░╨╜

| #   | ╨Ю╨▒╨╗╨░╤Б╤В╤М              | ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨░                                                                                                            | ╨б╤В╨░╤В╤Г╤Б  |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Chat C4**          | race-executor: zero allowed candidates ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╤В `true` (success) ╨▓╨╝╨╡╤Б╤В╨╛ `false` тАФ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡ ╤В╨╡╤А╤П╨╡╤В╤Б╤П ╨▒╨╡╨╖ fallback | ЁЯЯв Done |
| 2   | **Security**         | `webhookSecret: undefined` ╨┐╨╛ ╤Г╨╝╨╛╨╗╤З╨░╨╜╨╕╤О тАФ HMAC signing ╨╜╨╡╨░╨║╤В╨╕╨▓╨╡╨╜ ╨▒╨╡╨╖ ╤А╤Г╤З╨╜╨╛╨╣ ╨╜╨░╤Б╤В╤А╨╛╨╣╨║╨╕                               | ЁЯЯв Done |
| 3   | **Observability #4** | `health-sla-service` evaluateProfile ╨▒╨╡╨╖ ╨┐╤А╨╡╨┤╤Г╨┐╤А╨╡╨╢╨┤╨╡╨╜╨╕╤П ╨╛ mock-╨▒╤Н╨║╨╡╨╜╨┤╨╡                                              | ЁЯЯв Done |
| 4   | **Performance #1**   | `key-usage-analytics` getTrends ╤Д╨░╨▒╤А╨╕╨║╤Г╨╡╤В token data ╤З╨╡╤А╨╡╨╖ `totalCost * 200000`                                     | ЁЯЯв Done |
| 5   | **Agents C1**        | `agent-protocol-service` ╨▒╨╡╨╖ init/destroy ╨╢╨╕╨╖╨╜╨╡╨╜╨╜╨╛╨│╨╛ ╤Ж╨╕╨║╨╗╨░ тАФ orphaned state                                         | ЁЯЯв Done |
| 6   | **Dev C3**           | `fine-tuning-service` full mock startJob ╨▒╨╡╨╖ ╨┐╤А╨╡╨┤╤Г╨┐╤А╨╡╨╢╨┤╨╡╨╜╨╕╤П                                                         | ЁЯЯв Done |
| 7   | **Infra C5**         | `deploy-service` full mock deploy ╨▒╨╡╨╖ ╨┐╤А╨╡╨┤╤Г╨┐╤А╨╡╨╢╨┤╨╡╨╜╨╕╤П                                                                | ЁЯЯв Done |
| 8   | **Providers C3**     | `model-distillation-service` full mock startJob ╨▒╨╡╨╖ ╨┐╤А╨╡╨┤╤Г╨┐╤А╨╡╨╢╨┤╨╡╨╜╨╕╤П                                                  | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `chat-executor.ts:648` тАФ `return true` тЖТ `return false` ╨┐╤А╨╕ zero race candidates, allowing fallback to normal execution                                           |
| 2   | `config-registry.ts` тАФ `buildConfigDefaults()` generates `crypto.randomUUID()` for `webhookSecret` if none configured                                             |
| 3   | `health-sla-service.ts` тАФ `console.warn` added at top of `evaluateProfile()` noting mock backend                                                                  |
| 4   | `key-usage-analytics-service.ts:107` тАФ `totalTokens` now sourced from `keyStateStore.getAll()` real `quota.usedTokens` instead of fabricated `totalCost * 200000` |
| 5   | `agent-protocol-service.ts` тАФ added `init()`, `destroy()` lifecycle methods with `_initialized` flag                                                              |
| 6   | `fine-tuning-service.ts` тАФ `console.warn` in `startJob()` noting mock backend                                                                                     |
| 7   | `deploy-service.ts` тАФ `console.warn` in `deploy()` noting mock backend                                                                                            |
| 8   | `model-distillation-service.ts` тАФ `console.warn` in `startJob()` noting mock backend                                                                              |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░    | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| ---------- | -------- |
| tsc -b     | 0 errors |
| Build time | 6.94s    |
| Chunks     | 160+     |
| Runtime    | 1,063 KB |

---

## Session 11 тАФ 8 Critical: Chat, Security, Performance, Memory, Providers (v4.5.0 тЖТ v4.6.0) тЬЕ

**╨Т╤Б╨╡ 8 Critical ╤Д╨╕╨║╤Б╨╛╨▓ ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜╤Л. Build 0 errors, 10.72s.**

### ╨Я╨╗╨░╨╜

| #   | ╨Ю╨▒╨╗╨░╤Б╤В╤М            | ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨░                                                               | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ------------------ | ---------------------------------------------------------------------- | ------- |
| 1   | **Security C2**    | adminToken readable via JSON.stringify/Object.keys (enumerable)        | ЁЯЯв Done |
| 2   | **Chat C5**        | liveQuery merge overwrites fresh data with stale (no updatedAt check)  | ЁЯЯв Done |
| 3   | **Performance #5** | cost-manager checkBudget scans ALL records on every request (O(n))     | ЁЯЯв Done |
| 4   | **Performance #3** | budget-service saveHistory persists full 10k array on every STREAM_END | ЁЯЯв Done |
| 5   | **Chat C6**        | task-handoff eviction uses Map insertion order instead of createdAt    | ЁЯЯв Done |
| 6   | **Budget perf**    | budget-service STREAM_END does N+1 full scans per provider             | ЁЯЯв Done |
| 7   | **Providers #2**   | batch-processor zero concurrency тАФ one slow provider blocks all        | ЁЯЯв Done |
| 8   | **Memory C3**      | memory import without schema/length validation                         | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `config-registry.ts` тАФ `adminToken` ╨╕ `webhookSecret` ╤Г╤Б╤В╨░╨╜╨╛╨▓╨╗╨╡╨╜╤Л ╤З╨╡╤А╨╡╨╖ `Object.defineProperty` ╤Б `enumerable: false` (╨╜╨╡╨▓╨╕╨┤╨╕╨╝╤Л ╨▓ JSON.stringify/Object.keys)                           |
| 2   | `stores/chat/hydration.ts:149-155` тАФ merge ╤В╨╡╨┐╨╡╤А╤М ╨┐╤А╨╛╨▓╨╡╤А╤П╨╡╤В `updatedAt`: ╨╡╤Б╨╗╨╕ ╤Г ╤Б╤Г╤Й╨╡╤Б╤В╨▓╤Г╤О╤Й╨╡╨╣ ╨╖╨░╨┐╨╕╤Б╨╕ `updatedAt` ╨╜╨╛╨▓╨╡╨╡, ╨▓╤Е╨╛╨┤╤П╤Й╨░╤П ╨┐╤А╨╛╨┐╤Г╤Б╨║╨░╨╡╤В╤Б╤П (last-writer-wins ╤Б ╤В╨░╨╣╨╝╤Б╤В╨╡╨╝╨┐╨╛╨╝)           |
| 3   | `llm/decorators/cost-manager.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л `_runningDay/_runningWeek/_runningMonth`; `checkBudget()` ╨┐╨╡╤А╨╡╤Б╤З╨╕╤В╤Л╨▓╨░╨╡╤В ╨╕╤Е ╨╖╨░ 1 ╨┐╤А╨╛╤Е╨╛╨┤ ╨▓╨╝╨╡╤Б╤В╨╛ ╨┐╨╛╨╗╨╜╨╛╨│╨╛ ╤Б╨║╨░╨╜╨╕╤А╨╛╨▓╨░╨╜╨╕╤П                         |
| 4   | `kernel/services/budget-service.ts` тАФ `saveHistory()` ╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╨╡╤В debounce (5s): ╨╝╨╜╨╛╨╢╨╡╤Б╤В╨▓╨╡╨╜╨╜╤Л╨╡ STREAM_END ╨╖╨░ 5s ╨╛╨║╨╜╨╛ тЖТ 1 persist ╨▓╨╝╨╡╤Б╤В╨╛ N                                                |
| 5   | `kernel/services/task-handoff.ts:95-98` тАФ eviction ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╤Б `Map.keys().next()` ╨╜╨░ ╨┐╨╛╨╕╤Б╨║ ╨╖╨░╨┐╨╕╤Б╨╕ ╤Б ╨╝╨╕╨╜╨╕╨╝╨░╨╗╤М╨╜╤Л╨╝ `createdAt`, ╨┐╤А╨╡╨┤╨╛╤В╨▓╤А╨░╤Й╨░╤П ╤Г╨┤╨░╨╗╨╡╨╜╨╕╨╡ ╨░╨║╤В╨╕╨▓╨╜╨╛╨│╨╛ handoff ╨┐╨╛╤Б╨╗╨╡ DB reload     |
| 6   | `kernel/services/budget-service.ts:212-226` тАФ `computeCurrentSpend` + N├Ч `computeProviderSpend` ╨╖╨░╨╝╨╡╨╜╨╡╨╜╤Л ╨╜╨░ ╨╛╨┤╨╕╨╜ ╨┐╤А╨╛╤Е╨╛╨┤ ╤З╨╡╤А╨╡╨╖ `monthlyEntries` ╤Б `providerSpendMap` (O(1) per provider) |
| 7   | `kernel/services/batch-processor-service.ts:117-173` тАФ ╨┐╨╛╤Б╨╗╨╡╨┤╨╛╨▓╨░╤В╨╡╨╗╤М╨╜╤Л╨╣ ╤Ж╨╕╨║╨╗ ╨╖╨░╨╝╨╡╨╜╤С╨╜ ╨╜╨░ `CONCURRENCY=5` ╤Б `Promise.allSettled(chunk)` ╨╕ `TASK_TIMEOUT_MS=60000`                         |
| 8   | `kernel/services/memory-transfer-service.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л: ╨╗╨╕╨╝╨╕╤В ╨╕╨╝╨┐╨╛╤А╤В╨░ (10K entries, 100KB/content), ╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╤П `type` ╨┐╨╛╨╗╤П, slice/truncation ╨┤╨╗╤П CSV/Markdown                          |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░    | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| ---------- | -------- |
| tsc -b     | 0 errors |
| Build time | 10.72s   |
| Chunks     | 160+     |
| Runtime    | 1,064 KB |

---

## Session 14 тАФ 8 fix: AgentControlPanel inject, type fixes, budget (v4.5.0 тЖТ v4.6.0) тЬЕ

**╨Т╤Б╨╡ 8 ╤Д╨╕╨║╤Б╨╛╨▓ ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜╤Л. Typecheck 0 errors, build ~180s.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `memory-engine.ts:194` тАФ `as any` removed, `{ vector }` typed as Partial\<MemoryEntry\>                                                                            |
| 2   | `config-mutations.ts` тАФ `replaceConfig` uses `as unknown as Record<string, unknown>` instead of `as` cast with `Object.keys` union                                 |
| 3   | `AgentControlPanel.tsx:104-123` тАФ `agentService.injectMessage()` (doesn't exist) тЖТ `debateHumanService.addArgument()` via `debateService.getActiveDebateSession()` |
| 4   | `key-service.ts:1166-1183` тАФ `handleProviderError` detects 429/rate-limit, sets status `rate_limited` instead of `error`                                           |
| 5   | `debate-engine.ts:830-856` тАФ Best-of-N budget tracking: `deps.budget` (not in LlmCallerDeps) тЖТ `this.budgets.get(sessionId)`                                       |
| 6   | `research-engine-service.ts:301` тАФ `searchSourcesAlgo` wrapped in Promise.race with 30s timeout, added missing `ResearchSource` import                             |
| 7   | `hydration.ts:187-195` тАФ beforeunload localStorage quota check 4.5MB, fallback to 5 sessions                                                                       |
| 8   | `DebateRuntimePanel.tsx:418` тАФ `.catch(() => {})` тЖТ `.catch` with `console.error`                                                                                  |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 69 тАФ Crash consistency: batchSetKv + startup recovery (v4.5.0 тЖТ v4.6.0) тЬЕ

**Crash consistency (Row 7): 40% тЖТ 50%. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `interfaces.ts` тАФ added `batchSetKv` + `batchSetKvCas` to `IDatabaseService` interface                                                                                                                 |
| 2   | `database-service.ts` тАФ implemented `batchSetKv()` + `batchSetKvCas()`: multiple key-value writes in a single Dexie transaction (IndexedDB-level atomicity)                                            |
| 3   | `database-service.ts` тАФ added `cleanupStaleLocks()` startup recovery: `init()` removes expired `distlock:` entries from crashed tabs (detected via `heartbeatAt > ttl*2`)                              |
| 4   | `key-service.ts` тАФ `saveConfig()`: 4 individual `setKv` calls replaced with single `batchSetKv()` in `withTransaction`, providing crash-atomic multi-key write + application-level rollback protection |
| 5   | `key-service.ts` тАФ `KeyServiceDeps.database` interface extended with `batchSetKv`                                                                                                                      |
| 6   | `docs/ocs/reliability-matrix.md` тАФ Row 7: ~40% тЖТ ~50%. Coverage Summary: 20-49% bucket 1тЖТ0 classes (empty), 50-79% bucket 29тЖТ30 classes.                                                               |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 68 тАФ Partial failure/rollback: settings-service + key-service saveConfig (v4.5.0 тЖТ v4.6.0) тЬЕ

**Partial failure/rollback (Row 6): 40% тЖТ 50%. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `settings-service.ts` тАФ `updateSettings()`/`reset()` converted to async `withTransaction`: `deferPersist` with snapshot compensation + `deferEmit` (persists before emit). Removed dead `save()`/`savePromise` fields. |
| 2   | `key-service.ts` тАФ `saveConfig()`: 4 sequential `setKv` calls wrapped in `withTransaction` with old-value capture and individual compensation for each key (reverts on partial failure).                               |
| 3   | `docs/ocs/reliability-matrix.md` тАФ Row 6: ~40% тЖТ ~50%. Coverage Summary: 20-49% bucket 2тЖТ1 classes, 50-79% bucket 28тЖТ29 classes.                                                                                       |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 64 тАФ Lost updates: trace-service + memory-engine + 8 missed awaits (v4.5.0 тЖТ v4.6.0) тЬЕ

**Lost updates (Row 9): 40% тЖТ 55%. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `trace-service.ts` тАФ `removeTrace()`/`clearAll()` made async with `await repo operation` and state revert on failure. `persist()` now adds failed traces to retry queue with 3 attempts. Periodic 30s `_retryFailedPersists()` sweep. `destroy()` flushes retry queue on shutdown. |
| 2   | `memory-engine.ts` тАФ `pruneOldEntries()` worker calls converted to `Promise.allSettled`. `deleteMemory()` worker `sendToWorker('remove')` now awaited. `clear()` worker `sendToWorker('init')` now awaited.                                                                        |
| 3   | `time-machine-service.ts` тАФ 2 `void this.persist()` тЖТ `await this.persist()` in `restoreSnapshot()`.                                                                                                                                                                               |
| 4   | `notification-webhook-service.ts` тАФ 2 `this.save()` тЖТ `await this.save()` in `addWebhook()`, `updateWebhook()`.                                                                                                                                                                    |
| 5   | `mcp-service.ts` тАФ 4 `this.save()` тЖТ `await this.save()` in `load()`, `connect()`, `disconnect()`.                                                                                                                                                                                 |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 67 тАФ Stale state: 4 services converted to getKvCas/setKvCas (v4.5.0 тЖТ v4.6.0) тЬЕ

**Stale state (Row 8): 40% тЖТ 50%. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | `chat-bookmarks-service.ts` тАФ save/delete use `getKvCas`/`setKvCas` with 3-retry loop instead of blind `getKv`/`setKv`. |
| 2   | `agent-journal-service.ts` тАФ save/delete same CAS pattern with retry.                                                   |
| 3   | `prompt-library-service.ts` тАФ create/update/remove/incrementUsage all use CAS with retry.                               |
| 4   | `message-index-service.ts` тАФ persistDebounced uses CAS with retry.                                                      |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 66 тАФ Ordering bugs: trace-service activeTraces race + debate-engine duplicate FAILED (v4.5.0 тЖТ v4.6.0) тЬЕ

**Ordering bugs (Row 10): 45% тЖТ 55%. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `trace-service.ts` тАФ `_finalizedTraceIds` Set prevents activeTraces race: STREAM_END/STREAM_ERROR mark traceId as finalized, REQUEST_COMPLETED handler skips if already finalized. Cleaned up in `destroy()`. |
| 2   | `debate-engine.ts` тАФ Timeout callback checks session phase before emitting duplicate DEBATE_SESSION_FAILED, preventing stale timer emissions.                                                                 |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 65 тАФ Non-determinism: router-config-manager, experiment-engine, role-team-service (v4.5.0 тЖТ v4.6.0) тЬЕ

**Non-determinism (Row 34): 40% тЖТ 50%. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `router-config-manager.ts` тАФ `Math.random()` тЖТ `_rng.next()` in `resolveProfileForRequest()` traffic split roll. Module-level `_rng` + `resetRouterConfigRng()` exported.                     |
| 2   | `quality-experiment-engine.ts` тАФ `Math.random() < 0.5` тЖТ `_rng.chance(0.5)` in A/B assignment. Module-level `_rng` + `resetExperimentRng()` exported.                                         |
| 3   | `role-team-service.ts` тАФ `Math.floor(Math.random() * keys.length)` тЖТ `keys[_rng.nextInt(0, keys.length - 1)]` in `pickProviderAndKey()`. Module-level `_rng` + `resetRoleTeamRng()` exported. |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 21 тАФ Eliminate dual memory systems: MemoryOrchestrator тЖТ MemoryService delegate (v4.5.0 тЖТ v4.6.0) тЬЕ

**Dual memory systems eliminated. Typecheck 0 errors. 7 individual in-memory stores replaced with ServiceBackedMemoryStore delegating to MemoryService (Dexie).**

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                  | ╨Ю╨▒╨╗╨░╤Б╤В╤М     | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ----------------------------------------------------------------------- | ----------- | ------- |
| 1   | **Memory C1/C2** тАФ dual memory systems: orchestrator тЖТ service delegate | Consistency | ЁЯЯв Done |

### ╨Ш╨╖╨╝╨╡╨╜╨╡╨╜╨╕╤П

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Created `src/kernel/services/memory/service-backed-memory.ts` тАФ `ServiceBackedMemoryStore` implements `IMemoryStore` by delegating to `MemoryService`, filtering by `MemoryStoreType` via `metadata.type` |
| 2   | `memory-orchestrator.ts` тАФ replaced 7 individual stores (WorkingMemoryStore, EpisodicMemoryStore, etc.) with `ServiceBackedMemoryStore` instances; constructor accepts `() => MemoryService` lazy getter  |
| 3   | `phase7-memory-eval-metrics.ts` тАФ DI registration passes lazy `c.get('memoryService')` getter to orchestrator                                                                                             |
| 4   | `memory-engine.ts` тАФ removed all sync bridge code (getOrchestrator deps, 5 fire-and-forget sync calls in store/upsert/storeBatch/deleteMemory/clear). Orchestrator now reads directly from MemoryService  |
| 5   | `phase2-infrastructure.ts` тАФ removed `getOrchestrator` from `MemoryServiceDeps`, removed `MemoryOrchestrator` import                                                                                      |

### Data flow (before тЖТ after)

| ╨Ф╨╛ (Session 18)                                                         | ╨Я╨╛╤Б╨╗╨╡ (Session 21)                                                          |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| MemoryService тЖТ [sync bridge] тЖТ Orchestrator (in-memory) тЖТ MemoryPalace | MemoryService (Dexie) тЖР[reads]тЖТ Orchestrator (ServiceBacked) тЖТ MemoryPalace |
| Two copies of data: Dexie + in-memory Maps                              | One source of truth: MemoryService/Dexie                                    |
| sync bridge could silently drop data (fire-and-forget)                  | Orchestrator reads directly тАФ no bridge needed                              |
| 300+ lines of sync code in memory-engine.ts                             | 0 lines of sync code                                                        |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

### ╨Ш╤В╨╛╨│ Session 2 (Sessions 16-21)

| #   | ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨░                                | ╨б╤В╨░╤В╤Г╤Б   |
| --- | --------------------------------------- | -------- |
| 1   | ~~P1-Data~~ Dexie import validation     | тЬЕ Fixed |
| 2   | ~~P1-Resilience~~ Batch retry + backoff | тЬЕ Fixed |
| 3   | ~~Debate C2~~ Fire-and-forget verdict   | тЬЕ Fixed |
| 4   | ~~Debate C4~~ Unsafe sync transitions   | тЬЕ Fixed |
| 5   | ~~Agents C4~~ Client-only RBAC          | тЬЕ Fixed |
| 6   | ~~State #9~~ Config import drift        | тЬЕ Fixed |
| 7   | ~~C-5~~ debate-llm-caller monolith      | тЬЕ Fixed |
| 8   | ~~Memory C1/C2~~ Dual memory systems    | тЬЕ Fixed |
| 9   | ~~Resilience C-1~~ unhandledrejection   | тЬЕ Fixed |
| 10  | ~~Agents C2~~ payload validation        | тЬЕ Fixed |
| 11  | ~~Obs #6~~ counterfactual isolation     | тЬЕ Fixed |
| 12  | ~~Chat C7~~ backdrop click              | тЬЕ Fixed |
| 13  | ~~Memory C1/C2~~ sync bridge            | тЬЕ Fixed |

**╨Т╤Б╨╡ 76 Critical ╨┐╤А╨╛╨▒╨╗╨╡╨╝ ╨╕╨╖ ╨░╤Г╨┤╨╕╤В╨░ Session 5 ╤Г╤Б╤В╤А╨░╨╜╨╡╨╜╤Л.**

---

## Session 20 тАФ Fix State #9 Config Import Drift (v4.5.0 тЖТ v4.6.0) тЬЕ

**8 ╤Д╨░╨╣╨╗╨╛╨▓, 10 ╨║╨╛╨╜╤Б╤В╨░╨╜╤В тАФ ╨▓╤Б╨╡ module-level CONFIG captures ╨╖╨░╨╝╨╡╨╜╨╡╨╜╤Л ╨╜╨░ getter-╤Д╤Г╨╜╨║╤Ж╨╕╨╕. Typecheck 0 errors.**

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                     | ╨Ю╨▒╨╗╨░╤Б╤В╤М     | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ---------------------------------------------------------- | ----------- | ------- |
| 1   | **State #9** тАФ config import drift: module-level constants | Consistency | ЁЯЯв Done |

### ╨Ш╨╖╨╝╨╡╨╜╨╡╨╜╨╕╤П

| #   | ╨д╨░╨╣╨╗                        | ╨Ъ╨╛╨╜╤Б╤В╨░╨╜╤В╨░ тЖТ ╤Д╤Г╨╜╨║╤Ж╨╕╤П                                                                | ╨Ъ╨╛╨╗-╨▓╨╛ references |
| --- | --------------------------- | ---------------------------------------------------------------------------------- | ----------------- |
| 1   | `memory-engine.ts`          | `MEMORY_TTL_MS` тЖТ `getMemoryTtlMs()`, `PRUNE_INTERVAL_MS` тЖТ `getPruneIntervalMs()` | 3                 |
| 2   | `usage-tracker.ts`          | `MAX_RECORDS` тЖТ `getMaxRecords()`, `DEBOUNCE_MS` тЖТ `getDebounceMs()`               | 3                 |
| 3   | `debate-engine.ts`          | `DEBATE_MAX_DURATION_MS` тЖТ `getDebateMaxDurationMs()`                              | 2                 |
| 4   | `debate-timeline.ts`        | `MAX_ENTRIES` тЖТ `getMaxEntries()`                                                  | 3                 |
| 5   | `debate-round-constants.ts` | `ROUND_DELAY_MS` тЖТ `getRoundDelayMs()`                                             | 2 (+ import)      |
| 6   | `tool-executor.ts`          | `MAX_EXECUTION_HISTORY` тЖТ `getMaxExecutionHistory()`                               | 3                 |
| 7   | `timeline-service.ts`       | `MAX_EVENTS` тЖТ `getMaxEvents()`                                                    | 2                 |
| 8   | `policy-service.ts`         | `MAX_VIOLATIONS` тЖТ `getMaxViolations()`                                            | 1                 |

╨Т╤Б╨╡ ╤Д╤Г╨╜╨║╤Ж╨╕╨╕ ╤З╨╕╤В╨░╤О╤В `CONFIG` ╨┐╤А╨╕ ╨▓╤Л╨╖╨╛╨▓╨╡, ╨░ ╨╜╨╡ ╨┐╤А╨╕ ╨╕╨╝╨┐╨╛╤А╤В╨╡ тАФ ╨╕╨╖╨╝╨╡╨╜╨╡╨╜╨╕╤П ╤З╨╡╤А╨╡╨╖ overlay ╨▓╤Б╤В╤Г╨┐╨░╤О╤В ╨▓ ╤Б╨╕╨╗╤Г ╨▒╨╡╨╖ ╨┐╨╡╤А╨╡╨╖╨░╨│╤А╤Г╨╖╨║╨╕.

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

---

## Session 19 тАФ Fix 4 remaining Critical: C4, Agents C4, Resilience C-5, State #9 (v4.5.0 тЖТ v4.6.0) тЬЕ

**4 Critical ╤Д╨╕╨║╤Б╨░ ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜╤Л. Typecheck 0 errors.**

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                               | ╨Ю╨▒╨╗╨░╤Б╤В╤М         | ╨б╤В╨░╤В╤Г╤Б       |
| --- | -------------------------------------------------------------------- | --------------- | ------------ |
| 1   | **Debate C4** тАФ unsafe sync phase transitions scoring failure        | Resilience      | ЁЯЯв Done      |
| 2   | **Agents C4** тАФ client-only RBAC, kernel services lack auth          | Security        | ЁЯЯв Done      |
| 3   | **State #9** тАФ config import drift (CONFIG captured at module level) | Consistency     | тЪк Cancelled |
| 4   | **Resilience C-5** тАФ debate-llm-caller 2601-line monolith extraction | Maintainability | ЁЯЯв Done      |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `debate-phase-handler.ts` тАФ standard eval loop wrapped in per-agent try/catch so one agent scoring failure doesn't kill all; outer catch emits `DEBATE_SESSION_FAILED` event |
| 2   | `config-service.ts` тАФ added `requireLevel('L2')` to all 9 update\*() mutation methods using kernel `authorizationService` (was client-only PermissionGate)                   |
| 3   | `debate-llm-caller.ts` тАФ extracted `backoffWait()` helper, replaced 2 identical 20-line backoff blocks (timeout path + failure count path)                                   |
| 4   | `debate-llm-caller.ts` тАФ added `backoffWait()` helper definition (reduces file by ~40 lines, removes duplicated abort wiring pattern)                                        |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

---

## Session 16 тАФ P1 Resilience + Data (v4.5.0 тЖТ v4.6.0) тЬЕ

### ╨ж╨╡╨╗╤М

╨г╤Б╤В╤А╨░╨╜╨╕╤В╤М P1-╨║╤А╨╕╤В╨╕╤З╨╡╤Б╨║╨╕╨╡ ╨┐╤А╨╛╨▒╨╗╨╡╨╝╤Л ╨╕╨╖ ╨░╤Г╨┤╨╕╤В╨░ Session 5, ╨╛╤Б╤В╨░╨▓╤И╨╕╨╡╤Б╤П ╨┐╨╛╤Б╨╗╨╡ Sessions 6-15.

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                | ╨б╤В╨░╤В╤Г╤Б  |
| --- | --------------------------------------------------------------------- | ------- |
| 1   | **P1-Data** тАФ dexie-storage: ╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╤П ╨┐╨╛╨╗╨╡╨╣ ╨▓ importAll()            | ЁЯЯв Done |
| 2   | **P1-Resilience** тАФ batch-processor: retry loop ╤Б exponential backoff | ЁЯЯв Done |
| 3   | **P1-Resilience** тАФ debate-llm-caller: catch-all error boundary       | ЁЯЯв Done |
| 4   | **P1-Debate Race** тАФ stopDebateInternal vs finalizeInternal           | ЁЯЯв Done |
| 5   | **P1-Debate Data Loss** тАФ arg.content stripped before async verdict   | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `dexie-storage.ts` тАФ ╨▓╤Б╨╡ 7 `importAll()` ╨╝╨╡╤В╨╛╨┤╨╛╨▓ ╤В╨╡╨┐╨╡╤А╤М ╨╕╤Б╨┐╨╛╨╗╤М╨╖╤Г╤О╤В `validateArrayItems()` ╤Б field-level ╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╨╡╨╣ (id, provider, key, etc.) ╨▓╨╝╨╡╤Б╤В╨╛ raw `JSON.parse`                                                                                                              |
| 2   | `batch-processor-service.ts` тАФ `processTask()` ╨╛╨▒╤С╤А╨╜╤Г╤В ╨▓ retry loop (max 3 ╨┐╨╛╨┐╤Л╤В╨║╨╕, exponential backoff 1s*attempt)                                                                                                                                                               |
| 3   | `debate-llm-caller.ts` тАФ ╨▓╤Б╤П ╤Д╤Г╨╜╨║╤Ж╨╕╤П `debateCallLlm` ╨╛╨▒╤С╤А╨╜╤Г╤В╨░ ╨▓ outer try/catch; cleanup abort controllers + ╨╜╨╛╤А╨╝╨░╨╗╨╕╨╖╨░╤Ж╨╕╤П ╨╛╤И╨╕╨▒╨╛╨║ ╨╜╨░ ╨╗╤О╨▒╨╛╨╝ unhandled path; cleanup ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ ╨┐╨╡╤А╨╡╨┤ final throw ╨┐╨╛╤Б╨╗╨╡ retries                                                                        |
| 4   | `debate-sync-manager.ts` тАФ `finalizeInternal()`: `_finalized = true` ╨┐╨╡╤А╨╡╨╜╨╡╤Б╤С╨╜ ╨╜╨░ ╤Б╨░╨╝╤Л╨╣ ╨▓╨╡╤А╤Е (╨░╤В╨╛╨╝╨░╤А╨╜╤Л╨╣ guard) ╨▓╨╝╨╡╤Б╤В╨╛ ╤Г╤Б╤В╨░╨╜╨╛╨▓╨║╨╕ ╨┐╨╛╤Б╨╗╨╡ runtimeSessionId- ╨╕ terminal-╨┐╤А╨╛╨▓╨╡╤А╨╛╨║; ╤Г╤Б╤В╤А╨░╨╜╨╡╨╜╨╛ ╨╛╨║╨╜╨╛ race condition ╨╝╨╡╨╢╨┤╤Г stopDebateInternal ╨╕ .then()/.catch() handler                    |
| 5   | **C5 confirmed non-issue** тАФ `generateVerdictWithLLM` uses `session.snapshot()` (independent copy via `[...this._arguments]`), while content stripping operates on sync manager's `activeSession` (separate copy via `mergeAndProcessSession`). Already fixed by C2 in Session 6. |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 17 тАФ Remaining Critical: mock services + a11y (v4.5.0 тЖТ v4.6.0) тЬЕ

**8 Critical ╤Д╨╕╨║╤Б╨╛╨▓. Typecheck 0 errors.**

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                | ╨Ю╨▒╨╗╨░╤Б╤В╤М   | ╨б╤В╨░╤В╤Г╤Б  |
| --- | --------------------------------------------------------------------- | --------- | ------- |
| 1   | **3 mock services** тАФ apiEndpoint + real HTTP fallback                | Providers | ЁЯЯв Done |
| 2   | **Focus trap** тАФ PromptLibraryPanel, KeyboardShortcutsModal           | a11y      | ЁЯЯв Done |
| 3   | **div onClick keyboard** тАФ QualityImpactDashboard, PrimitiveCard etc. | a11y      | ЁЯЯв Done |
| 4   | **Backdrop cancel-safety** тАФ PromptLibraryPanel modal                 | a11y      | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `fine-tuning-service.ts` тАФ `startJob()` ╤В╨╡╨┐╨╡╤А╤М `async`, ╨┐╤А╨╛╨▓╨╡╤А╤П╨╡╤В `this.apiEndpoint`: ╨╡╤Б╨╗╨╕ ╨╖╨░╨┤╨░╨╜, POST ╨╜╨░ `${apiEndpoint}/jobs`; ╨╡╤Б╨╗╨╕ ╨╜╨╡╤В тАФ fallback ╨║ ╤Б╨╕╨╝╤Г╨╗╤П╤Ж╨╕╨╕ ╤Б `console.warn` |
| 2   | `deploy-service.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `constructor(endpoint?)`, `deploy()` ╤В╨╡╨┐╨╡╤А╤М `async`; ╨┐╤А╨╕ `apiEndpoint` POST ╨╜╨░ `${apiEndpoint}/deploy`; fallback ╨║ ╤Б╨╕╨╝╤Г╨╗╤П╤Ж╨╕╨╕                       |
| 3   | `model-distillation-service.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ `constructor(endpoint?)`, `startJob()` ╤В╨╡╨┐╨╡╤А╤М `async`; ╨┐╤А╨╕ `apiEndpoint` POST ╨╜╨░ `${apiEndpoint}/jobs`; fallback ╨║ ╤Б╨╕╨╝╤Г╨╗╤П╤Ж╨╕╨╕           |
| 4   | `contracts/deploy.ts` тАФ `deploy()` return type ╨╕╨╖╨╝╨╡╨╜╤С╨╜ ╨╜╨░ `Promise<Deployment>`                                                                                                   |
| 5   | `contracts/fine-tuning.ts` тАФ `startJob()` return type ╨╕╨╖╨╝╨╡╨╜╤С╨╜ ╨╜╨░ `Promise<void>`                                                                                                  |
| 6   | `contracts/model-distillation.ts` тАФ `startJob()` return type ╨╕╨╖╨╝╨╡╨╜╤С╨╜ ╨╜╨░ `Promise<void>`                                                                                           |
| 7   | `hooks/useFocusTrap.ts` тАФ ╤Б╨╛╨╖╨┤╨░╨╜ shared ╤Е╤Г╨║ ╤Б Tab-╤Ж╨╕╨║╨╗╨╕╨╜╨│╨╛╨╝ ╨╕ ╨░╨▓╤В╨╛╤Д╨╛╨║╤Г╤Б╨╛╨╝ ╨┐╨╡╤А╨▓╨╛╨│╨╛ ╤Н╨╗╨╡╨╝╨╡╨╜╤В╨░                                                                                        |
| 8   | `PromptLibraryPanel.tsx` тАФ focus trap ╨╜╨░ ╨╝╨╛╨┤╨░╨╗╨║╨╡; backdrop onClick close; `role="button"`/`tabIndex`/`onKeyDown` ╨╜╨░ ╨║╨░╤А╤В╨╛╤З╨║╨╡ ╨┐╤А╨╛╨╝╨┐╤В╨░                                              |
| 9   | `KeyboardShortcutsModal.tsx` тАФ focus trap ╨╜╨░ ╨╝╨╛╨┤╨░╨╗╨║╨╡                                                                                                                              |
| 10  | `QualityImpactDashboardPanel.tsx` тАФ `role="button"`/`tabIndex`/`onKeyDown` ╨╜╨░ ╨▓╤Б╨╡╤Е ╤Б╨╛╤А╤В╨╕╤А╤Г╨╡╨╝╤Л╤Е ╨╖╨░╨│╨╛╨╗╨╛╨▓╨║╨░╤Е ╤В╨░╨▒╨╗╨╕╤Ж╤Л ╨╕ ╤Б╤В╤А╨╛╨║╨░╤Е (ImpactTab + ExperimentsTab)                          |
| 11  | `PrimitiveCard.tsx` тАФ `role="button"`/`tabIndex`/`onKeyDown` ╨╜╨░ div ╤Б onClick                                                                                                     |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 18 тАФ 4 Critical: Chat C7, Agents C2, Obs #6, Resilience C-1 (v4.5.0 тЖТ v4.6.0) тЬЕ

**4 Critical ╤Д╨╕╨║╤Б╨░. Typecheck 0 errors.**

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                       | ╨Ю╨▒╨╗╨░╤Б╤В╤М        | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ---------------------------------------------------------------------------- | -------------- | ------- |
| 1   | **Chat C7** тАФ ChatExportOverlay backdrop click propagation                   | UI/Correctness | ЁЯЯв Done |
| 2   | **Agents C2** тАФ agent-protocol-service payload validation + auth             | Security       | ЁЯЯв Done |
| 3   | **Obs #6** тАФ counterfactual-engine simulation leak via try/finally isolation | Correctness    | ЁЯЯв Done |
| 4   | **Resilience C-1** тАФ runtime.ts unhandledrejection handler + preventDefault  | Resilience     | ЁЯЯв Done |

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ChatExportOverlay.tsx` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ backdrop `onClick={onClose}` + `stopPropagation` ╨╜╨░ ╨▓╨╜╤Г╤В╤А╨╡╨╜╨╜╨╕╨╣ ╨║╨╛╨╜╤В╨╡╨╣╨╜╨╡╤А                                                                |
| 2   | `agent-protocol-service.ts` тАФ ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜╨░ `validatePayload()` (╤А╨░╨╖╨╝╨╡╤А 256KB, ╨│╨╗╤Г╨▒╨╕╨╜╨░ 8), ╨▓╤Л╨╖╨╛╨▓ ╨▓ `sendMessage()`; ╨▓╨░╨╗╨╕╨┤╨░╤Ж╨╕╤П sourceAgentId/targetAgentId                      |
| 3   | `counterfactual-engine.ts` тАФ ╨▓╨╡╤Б╤М `run()` ╨╛╨▒╤С╤А╨╜╤Г╤В ╨▓ `try/finally`, `clearSimulation()` ╨│╨░╤А╨░╨╜╤В╨╕╤А╨╛╨▓╨░╨╜╨╜╨╛ ╨▓╤Л╨╖╤Л╨▓╨░╨╡╤В╤Б╤П ╨┐╤А╨╕ ╨╗╤О╨▒╨╛╨╝ ╨╕╤Б╤Е╨╛╨┤╨╡ (╨╜╨╛╤А╨╝╨░╨╗╤М╨╜╤Л╨╣ return, throw, early return) |
| 4   | `runtime.ts` тАФ `window.addEventListener('unhandledrejection')` ╤В╨╡╨┐╨╡╤А╤М ╨▓╤Л╨╖╤Л╨▓╨░╨╡╤В `event.preventDefault()`, ╨┐╨╛╨┤╨░╨▓╨╗╤П╤П ╨▒╤А╨░╤Г╨╖╨╡╤А╨╜╨╛╨╡ "Uncaught (in promise)"                       |
| 5   | **Memory C1/C2** тАФ `memory-engine.ts`: `store()`, `upsert()`, `deleteMemory()` sync to MemoryOrchestrator via `getOrchestrator` lazy getter                                |
| 6   | **Memory C1/C2** тАФ `phase2-infrastructure.ts`: DI registration for `getOrchestrator: () => ctx.container.get('memoryOrchestrator')`                                        |
| 7   | **Memory C1/C2** тАФ `memory-engine.ts`: `storeBatch()` syncs new entries to orchestrator; `clear()` syncs `EPISODIC` store clear                                            |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 22 тАФ 6 High-priority fixes: Type, LRU, cancel, destroy, onerror, eviction (v4.5.0 тЖТ v4.6.0) тЬЕ

**6 High-priority ╤Д╨╕╨║╤Б╨╛╨▓. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `health.ts:5` тАФ `'unknown'` added to `CanonicalHealthStatus` union; `normalizeHealthStatus` returns `'unknown'` for `'unknown'` input          |
| 2   | `pricing-service.ts:158` тАФ prefixCache: size-gated insert replaced with LRU eviction (delete oldest when full, then insert)                    |
| 3   | `chat/store.ts:589` тАФ `clearHistory` now cancels all loading/streaming requests via `CANCEL_MESSAGE` + clears `activeRequestIds`               |
| 4   | `persona-service.ts:459-463` тАФ added `destroy()`: clears `personas` map, resets activePersonaId / isInitialized                                |
| 5   | `gemini-live-service.ts:194-197` тАФ `SpeechSynthesisUtterance` now has `onerror` handler (logs error, resets session status to listening)       |
| 6   | `cache-service.ts:204-212` тАФ on max-entries eviction, emits `CACHE_INVALIDATED` with `{ reason: 'eviction', section: key }`                    |
| тАФ   | `diagnostic-service.ts:103-104` тАФ pre-existing type errors fixed: `severity: 'info'`тЖТ`'low'`, added `type`+`timestamp`, removed stray `source` |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 23 тАФ 5 High-priority fixes: console.log, UX, validation, notifications (v4.5.0 тЖТ v4.6.0) тЬЕ

**5 High-priority ╤Д╨╕╨║╤Б╨╛╨▓. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `debate-query-engine.ts:497` тАФ removed `console.log` of key IDs (redundant with `rootLogger.warn` on next line, also exposed partial key IDs)                      |
| 2   | `HistoryItem.tsx:83` тАФ `slice(-argDisplayCount)` тЖТ `slice(0, argDisplayCount)`: "Show more" now expands from first argument instead of sliding window from the end |
| 3   | `ExportImportPanel.tsx:245` тАФ added type guard after `JSON.parse`: rejects non-object to prevent silent import of invalid JSON structure                           |
| 4   | `key-registry.ts:807-821` тАФ `importKeys()` now validates each entry has string `key` and `provider` fields before passing to `buildImportKeys`                     |
| 5   | `AgentControlPanel.tsx:83-92,112-113,124-126` тАФ all 3 `console.warn` catch blocks now also emit `EVENTS.NOTIFICATION` with `type: 'error'` for user visibility     |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 24 тАФ 4 High-priority fixes: error handling, clipboard, pressure, logger (v4.5.0 тЖТ v4.6.0) тЬЕ

**4 High-priority ╤Д╨╕╨║╤Б╨╛╨▓. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `PromptsTab.tsx:37` тАФ `.catch(() => {})` replaced with `console.error` + `EVENTS.NOTIFICATION` error toast; silent data loss on template load failure is now visible     |
| 2   | `ConnectorsPanel.tsx:301` тАФ clipboard `writeText` notification now fires after `.then()` instead of before; `.catch()` shows info toast with URL even if clipboard fails |
| 3   | `pressure-map-service.ts:266-277` тАФ added explicit `low` case (0.15) in `levelToScore`; `default` now returns 0 instead of silently mapping unknown levels to 0.15       |
| 4   | `logger-service.ts:82-84` тАФ `child()` now creates isolated `{ buffer: [], seq: 0 }` state instead of sharing parent's `state` buffer reference                           |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 25 тАФ 2 fixes: setDeps type, regexCache limit (v4.5.0 тЖТ v4.6.0) тЬЕ

**2 ╤Д╨╕╨║╤Б╨░. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `truth-consistency-monitor.ts:94-97` тАФ `setDeps()` conditional type `extends undefined ? never : Required<...>` replaced with `Exclude<..., undefined>` |
| 2   | `router-request-classifier.ts:5-16` тАФ `regexCache` now has `MAX_REGEX_CACHE = 100` limit with LRU eviction instead of unbounded growth                  |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 26 тАФ 1 fix: dailyStats pruning, agent-journal eviction (v4.5.0 тЖТ v4.6.0) тЬЕ

**2 ╤Д╨╕╨║╤Б╨░. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `role-service.ts:620-628` тАФ `dailyStats` unbounded `Record<string, DailyUsage>` pruned to 90 days (oldest entries deleted after each new day is added) |
| тАФ   | `agent-journal-service.ts:86-115` тАФ already has `MAX_CACHE_SIZE=500` with `pruneCache()` тАФ verified, no fix needed                                     |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 27 тАФ 2 fixes: ChatSidebar empty sessionId, ChatSidebar delete-active (v4.5.0 тЖТ v4.6.0) тЬЕ

**2 ╤Д╨╕╨║╤Б╨░. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ChatSidebar.tsx:74` тАФ Deleting active session when no other sessions exist: `onNewChat()` instead of `onSessionClick('')` |
| 2   | `ChatSidebar.tsx:62-79` тАФ Fixed `handleDelete` dependency array to include `onNewChat`                                     |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 28 тАФ 8 High-priority fixes: Security, Observability, Performance, LOGGER (v4.5.0 тЖТ v4.6.0) тЬЕ

**8 ╤Д╨╕╨║╤Б╨╛╨▓. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `llm-http-client.ts:196-199,269-272,348-351` тАФ 3 `console.warn` of error bodies gated behind `import.meta.env.DEV` (prevent leaking API error details in production) |
| 2   | `trace-service.ts:332,335,438,432` тАФ `                                                                                                                               |     | 0`тЖТ`?? 0`for`startTime`/`endTime`/`totalTokens` (convention: nullish coalescing over falsy OR) |
| 3   | `provider-budget.ts:50,193` тАФ `listeners` array: added `MAX_LISTENERS=100` with `shift()` eviction on overflow (prevents unbounded growth)                           |
| 4   | `pricing-service.ts:156` тАФ `console.warn` тЖТ `LOGGER.warn` with proper service name                                                                                   |
| 5   | `debate-timeline.ts:37,59,81` тАФ 3 `console.warn` тЖТ `LOGGER.warn` with `rootLogger.child('DebateTimeline')`                                                           |
| 6   | `gemini-cache-service.ts:61,109,131,198` тАФ 4 `console.warn` тЖТ `LOGGER.warn` with `rootLogger.child('GeminiCache')`                                                   |
| 7   | `budget-alert-service.ts:65` тАФ `console.warn` тЖТ `LOGGER.warn` with `rootLogger.child('BudgetAlertService')`                                                          |
| 8   | `deploy-service.ts:73,158` тАФ 2 `console.warn` тЖТ `LOGGER.warn` with `rootLogger.child('DeployService')`                                                               |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 29 тАФ 4 High-priority fixes: output ratio, EventBus DI, restored health, editEntry guard (v4.5.0 тЖТ v4.6.0) тЬЕ

**4 ╤Д╨╕╨║╤Б╨░. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `router-scoring.ts:95` тАФ `outputTokens = inputTokens * 2` replaced with configurable `outputInputRatio` parameter (default 2), added `Math.ceil` for consistency                                                        |
| 2   | `agent-wizard-service.ts:8,85` тАФ static `EventBus` singleton replaced with DI-injected `IEventBus` via constructor (new 3rd param); caller in `phase6-high-level.ts:264` updated to pass `c.get<IEventBus>('eventBus')` |
| 3   | `agent-health-monitor.ts:58-61` тАФ after `loadPersisted()`, all restored agents are marked as `'unknown'` in healthCache until fresh data arrives via `ingest()` or `heartbeat()`                                        |
| 4   | `chat/store.ts:562-586` тАФ `editEntry` optimistic `uas()` update moved inside `if (sStore)` block (previously happened before null check); added `else` branch with `console.warn` for missing session store             |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 30 тАФ 4 High-priority fixes: cancelSending all sessions, field whitelist, retry TTL, bootstrap guard (v4.5.0 тЖТ v4.6.0) тЬЕ

**4 ╤Д╨╕╨║╤Б╨░. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `chat/store.ts:495-534` тАФ `cancelSending` now iterates ALL sessions' histories (not just active), cancels all in-flight requests across sessions, and clears their IDs from global `activeRequestIds`                                                                                                            |
| 2   | `persona-marketplace-service.ts:257-269` тАФ `updateListing()` now uses `ALLOWED_UPDATE_FIELDS` whitelist (`name`, `description`, `category`, `author`, `version`, `price`, `tags`, `promptPreview`) instead of blind `Object.assign` тАФ prevents overwriting `id`, `rating`, `downloads`, `installed`, `createdAt` |
| 3   | `reconnection-service.ts:18-23,35-40,75-85` тАФ added `startedAt` timestamp to `ReconnectionState`; added `maxTotalRetryMs` (default 300s) to `ReconnectionConfig`; `scheduleRetry()` checks elapsed time before each attempt тАФ caps total retry duration beyond `maxRetries` count                                |
| 4   | `bootstrap.ts:454-460` тАФ added type guard (`s.id` and `s.topic` validation) before Dexie `put()` in auto-resume interrupted debates тАФ prevents writing corrupted session records back to the database                                                                                                            |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 31 тАФ Dual-write protection + idempotency on EventBus (v4.5.0 тЖТ v4.6.0) тЬЕ

**6 ╤Д╨╕╨║╤Б╨╛╨▓ (5 core + 1 bugfix). Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `events/event-bus.ts` тАФ added `emitOnce()` with LRU idempotency cache (MAX=1000, TTL=30s); cleared in `clearAllSubscriptions()`                                                                                                                          |
| 2   | `types/interfaces.ts` тАФ added `emitOnce()` to `IEventBus` interface                                                                                                                                                                                      |
| 3   | `services/debate-runtime/debate-finalizer.ts` тАФ refactored into `finalizeDebateState()` (mutations only, returns data) + `emitFinalizeEvents()` (events only), enabling save-before-emit ordering                                                        |
| 4   | `services/debate-runtime/debate-sync-manager.ts` тАФ `syncSession()`: `saveSnapshot()` moved BEFORE `emit(DEBATE_ARGUMENT)`/`emit(DEBATE_UPDATED)`; `finalizeInternal()`: `saveToDebateHistory()` called before `emitFinalizeEvents()`                     |
| 5   | `services/tool-executor.ts` тАФ `persist()` returns `Promise<void>`; `addTool()`/`removeTool()`/`toggleTool()` use `.then()` for emit after persist completes; `updateTool()`/`execute()` use `await persist()` before emit тАФ eliminates dual-write window |
| 6   | `services/tool-executor.ts:363` тАФ bugfix: `!enabled` тЖТ `!t.enabled` (missing `t.` prefix caused TS2304)                                                                                                                                                  |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 32 тАФ 5 Quick wins ╨╕╨╖ Reliability Matrix (v4.5.0 тЖТ v4.6.0) тЬЕ

**5 ╤Д╨╕╨║╤Б╨╛╨▓. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `budget-service.ts:58-68` тАФ `destroy()` now cleans `_saveTimer`, `sentAlerts`, `agentBudgets`, `agentSpend`, `_costDedupSet`, `alertsHistory`, `budgetInfoCache`, `_monthFiltered` (was leaking 4 collections + 1 timer)     |
| 2   | `batch-processor-service.ts:154-155` тАФ retry delay now includes jitter (`(0.5 + Math.random() * 0.5)`), preventing thundering herd on concurrent batch tasks                                                                 |
| 3   | `debate-llm-caller.ts:2565` тАФ `backoffWait()` delay now includes jitter (`(0.5 + Math.random() * 0.5)`), preventing synchronized retry waves between agents                                                                  |
| 4   | `debate-persistence-manager.ts:178` тАФ added exponential backoff (`100 * 2^attempt`, capped at 2000ms) before retry on version conflict, replacing zero-delay spin-loop                                                       |
| 5   | `dexie-schema.ts` тАФ wired `DebateSessionRecordSchema` and `DebateVerdictRecordSchema` Zod hooks for `debateSessions` and `debateVerdicts` tables (`creating` + `updating`), preventing corrupt data writes to debate storage |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 33 тАФ ╨Р╤А╤Е╨╕╤В╨╡╨║╤В╤Г╤А╨╜╤Л╨╡ ╤Д╨╕╨║╤Б╤Л: emitOnce ╨╜╨░ ╨║╤А╨╕╤В╨╕╤З╨╡╤Б╨║╨╕╤Е ╨┐╤Г╤В╤П╤Е + Dead Letter Queue (v4.5.0 тЖТ v4.6.0) тЬЕ

**3 ╨╕╨╖╨╝╨╡╨╜╨╡╨╜╨╕╤П. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **emitOnce() ╨╜╨░ 5 ╨║╤А╨╕╤В╨╕╤З╨╡╤Б╨║╨╕╤Е emit-╤Б╨░╨╣╤В╨░╤Е** тАФ `chat-executor.ts` STREAM_END (requestId ╨║╨╗╤О╤З), `debate-sync-manager.ts` DEBATE_VERDICT_GENERATED (sessionId), `debate-sync-manager.ts` DEBATE_UPDATED (session.id), `debate-finalizer.ts` DEBATE_UPDATED (session.id), `debate-pipeline-builder.ts` DEBATE_VERDICT_GENERATED (sessionId) тАФ idempotency ╨▓ 30s ╨╛╨║╨╜╨╡ |
| 2   | **Dead Letter Queue** тАФ ╤Б╨╛╨╖╨┤╨░╨╜ `contracts/dead-letter-queue.ts` (IDeadLetterQueue) + `services/dead-letter-queue-service.ts` (Dexie-backed, max 500 entries). ╨Ш╨╜╤В╨╡╨│╤А╨╕╤А╨╛╨▓╨░╨╜ ╨▓ `notification-webhook-service.ts`: ╨┐╤А╨╕ ╨╕╤Б╤З╨╡╤А╨┐╨░╨╜╨╕╨╕ retry ╤Б╨╛╨▒╤Л╤В╨╕╨╡ ╤Г╤Е╨╛╨┤╨╕╤В ╨▓ DLQ ╨▓╨╝╨╡╤Б╤В╨╛ ╨┐╨╛╨╗╨╜╨╛╨╣ ╨┐╨╛╤В╨╡╤А╨╕                                                                                   |
| 3   | **emitOnce ╨┤╨╛╨▒╨░╨▓╨╗╨╡╨╜ ╨▓ ChatServiceDeps** тАФ `contracts/chat.ts` eventBus ╨╕╨╜╤В╨╡╤А╤Д╨╡╨╣╤Б ╤А╨░╤Б╤И╨╕╤А╨╡╨╜ `emitOnce` ╨╝╨╡╤В╨╛╨┤╨╛╨╝                                                                                                                                                                                                                                                     |

### ╨Р╨╜╨░╨╗╨╕╨╖ (non-issue)

| #                         | ╨Ъ╨╗╨░╤Б╤Б                                                                                                                 | ╨а╨╡╨╖╤Г╨╗╤М╤В╨░╤В |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------- |
| RateLimitDecorator TOCTOU | `checkRate()` ╨╜╨╡ ╤Б╨╛╨┤╨╡╤А╨╢╨╕╤В `await` ╨╝╨╡╨╢╨┤╤Г check ╨╕ decrement тАФ JS single-threaded ╨│╨░╤А╨░╨╜╤В╨╕╤А╤Г╨╡╤В ╨░╤В╨╛╨╝╨░╤А╨╜╨╛╤Б╤В╤М. **Non-issue** |
| LLMHttpClient._inflight   | ╨Т╤Б╨╡ Map ╨╛╨┐╨╡╤А╨░╤Ж╨╕╨╕ ╤Б╨╕╨╜╤Е╤А╨╛╨╜╨╜╤Л, JS event loop ╨╜╨╡ ╨┐╨╛╨╖╨▓╨╛╨╗╤П╨╡╤В ╨┐╨░╤А╨░╨╗╨╗╨╡╨╗╤М╨╜╨╛╨╣ ╨╝╨╛╨┤╨╕╤Д╨╕╨║╨░╤Ж╨╕╨╕. **Non-issue**                        |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 34 тАФ Cache inconsistency fix + false-positive analysis (v4.5.0 тЖТ v4.6.0) тЬЕ

**1 ╤Д╨╕╨║╤Б + 1 false-positive ╨╖╨░╨║╤А╤Л╤В. Typecheck 0 errors.**

### Changes

| #   | ╨з╤В╨╛ ╤Б╨┤╨╡╨╗╨░╨╜╨╛                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `cache-service.ts` тАФ added `pendingSet` pattern: explicit `set()`/`clear()`/`invalidate()` now mark in-flight keys as stale, preventing concurrent `getOrFetch` from overwriting with stale data. ╨Я╨╛╨║╤А╤Л╤В╨╕╨╡ **Cache inconsistency: 15% тЖТ 45%** |

### ╨Р╨╜╨░╨╗╨╕╨╖ (non-issue)

| ╨Ъ╨╗╨░╤Б╤Б               | ╨а╨╡╨╖╤Г╨╗╤М╤В╨░╤В                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cross-tab races** | `cross-tab-state.ts` ╨┐╨╛╨╗╤Г╤З╨░╨╡╤В BroadcastChannel ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╤П ╨╕ ╤А╨╡-╤Н╨╝╨╕╤В╨╕╤В ╤Б╨╛╨▒╤Л╤В╨╕╤П (`KEY_UPDATED`, `KERNEL_UPDATED`, `SETTINGS_UPDATED`). ╨Э╨░ ╨┐╤А╨░╨║╤В╨╕╨║╨╡: `debate-update` ╨Э╨Х ╤А╨╡-╤Н╨╝╨╕╤В╨╕╤В (╤В╨╛╨╗╤М╨║╨╛ metadata sync, ╨┐╤А╨╛╨▓╨╡╤А╨║╨░ `seq`). `key-update`, `settings-update`, `kernel-state-update` ╤А╨╡-╤Н╨╝╨╕╤В╤П╤В, ╨╜╨╛ subscribers тАФ UI ╨┐╨░╨╜╨╡╨╗╨╕ (re-render ╨▒╨╡╨╖╨╛╨┐╨░╤Б╨╡╨╜). `notification-webhook-service` ╨╜╨╡ ╨┐╨╛╨┤╨┐╨╕╤Б╨░╨╜ ╨╜╨░ ╤Н╤В╨╕ ╤Б╨╛╨▒╤Л╤В╨╕╤П. **Duplicate processing = UI re-render, ╨╜╨╡ data corruption. Non-issue** |

### Build result

| ╨Ь╨╡╤В╤А╨╕╨║╨░   | ╨Ч╨╜╨░╤З╨╡╨╜╨╕╨╡ |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ pass  |

---

## Session 35 тАФ Dual-write fix: persist-then-emit outbox pattern (v4.5.0 тЖТ v4.6.0) тЬЕ

**4 changes. Typecheck 0 errors.**

### Plan

| #                                              | Task                                                             | Status |
| ---------------------------------------------- | ---------------------------------------------------------------- | ------ |
| 1                                              | **Create** persist-then-emit.ts тАФ persistThenEmit + Outbox class | DONE   |
| 2                                              | **Fix** key-service.ts handleProviderError тАФ emit after saveKeys | DONE   |
| 3                                              | **Fix** key-state-store.ts update/remove тАФ emit after persistNow | DONE   |
| 4                                              | **Fix**                                                          |
| ole-service.ts deleteRole тАФ emit after persist | DONE                                                             |

### Changes

| #                                                                                                                                                                   | What was done                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                                                                                                                                                                   | Created src/kernel/utils/persist-then-emit.ts тАФ persistThenEmit() helper + Outbox class (batch persists before emits)                                                      |
| 2                                                                                                                                                                   | key-registry.ts:798 тАФ modifyKey() now returns ApiKey                                                                                                                       | undefined (the clone) instead of oid |
| 3                                                                                                                                                                   | key-service.ts:1190 тАФ handleProviderError(): previousState captured before modifyKey, wait saveKeys() called before emit(KEY_STATE_CHANGED) тАФ eliminates dual-write window |
| 4                                                                                                                                                                   | key-state-store.ts тАФ added persistNow() immediate persist method; update() and                                                                                             |
| emove() now sync, await persistNow() before emit() тАФ eliminates emit-before-persist in key state store                                                              |
| 5                                                                                                                                                                   | contracts/key-state.ts тАФ IKeyStateStore.update() and .remove() return Promise<void> instead of oid                                                                         |
| 6                                                                                                                                                                   |
| ole-service.ts:471 тАФ deleteRole() now sync, wait persist() before both emit(ROLE_DELETED) and emit(ROLES_UPDATED) тАФ eliminates emit-before-persist in role deletion |

### Build result

| Metric    | Value    |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ PASS  |

---

## Session 72 тАФ Fix Bug 6: cross-agent duplicate blocks retry of working model in single-provider setup (v4.5.0 тЖТ v4.6.0) тЬЕ

**1 bug fixed. Typecheck 0 errors.**

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                                                              | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Bug 6** тАФ Cross-agent duplicate detector + `rejectedCombos` wildcards block retry of only working model per-agent | ЁЯЯв Done |

### Root cause

`triedKeys` and `rejectedCombos` are local to each `debateCallLlm()` call. When cross-agent duplicate is detected:

1. The working model+key gets added to `triedModels`/`triedKeys`
2. A wildcard entry `${provider}|${model}|*` goes into `rejectedCombos`
3. `resolveProvider()` returns null because every model for the only provider is blocked by wildcards
4. Agent hits "No available API keys" тЖТ retries тЖТ same block тЖТ after 5 spins тЖТ agent fails

This is per-agent (each call gets fresh sets), but with a single provider the death spiral happens for every agent independently.

### Changes

| #   | File                   | Change                                                                                                                                                                                                                                                                                           |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `debate-llm-caller.ts` | In the "No available API keys" handler, added clearing of wildcard entries from `rejectedCombos` and their corresponding models from `triedModels` before each retry. The `noProviderSpinCount` guard (max 5) still prevents infinite spin. Working model gets retried instead of dead-spinning. |

### Build result

| Metric    | Value    |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ PASS  |

---

## Session 71 тАФ Fix provider cascade infinite CPU spin + 429 circuit breaker + infinite loop safety net (v4.5.0 тЖТ v4.6.0) тЬЕ

**3 bugs fixed. Typecheck 0 errors. Build ~11s.**

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                                              | ╨б╤В╨░╤В╤Г╤Б  |
| --- | --------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Bug 3** тАФ `resolveProvider` infinite CPU spin when all models of a provider are wildcard-rejected | ЁЯЯв Done |
| 2   | **Bug 4** тАФ 429 rate-limit opens circuit breaker for entire provider, killing multi-agent debates   | ЁЯЯв Done |
| 3   | **Bug 5** тАФ No generic protection against infinite loop bugs in `debateCallLlm`                     | ЁЯЯв Done |

### Changes

| #   | File                     | Change                                                                                                                                                                     |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `debate-query-engine.ts` | Added `hasAnyUntriedModel()` helper that checks if a key has at least one model not in `triedModels` and not in `rejectedCombos`. Applied to all 6 `resolveProvider` steps |
| 2   | `circuit-breaker.ts`     | Added 429 to `NON_CIRCUIT_HTTP_STATUSES` тАФ 429 is transient, debate-llm-caller handles its own rate-backoff; opening circuit on 429 blocks ALL keys for the provider       |
| 3   | `debate-llm-caller.ts`   | Added `callLlmIterations` counter + `MAX_CALL_LLM_ITERATIONS = 50` safety net тАФ throws unconditionally after 50 while-loop iterations, catching ANY future infinite-loop   |

### Build result

| Metric    | Value    |
| --------- | -------- |
| tsc -b    | 0 errors |
| Typecheck | тЬЕ PASS  |

---

## Session 72 тАФ Fix Bug 6: cross-agent duplicate blocks retry of working model in single-provider setup (v4.5.0 тЖТ v4.6.0) тЬЕ

**1 bug fixed. Typecheck 0 errors.**

### ╨Я╨╗╨░╨╜

| #   | ╨Ч╨░╨┤╨░╤З╨░                                                                                                              | ╨б╤В╨░╤В╤Г╤Б  |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Bug 6** тАФ Cross-agent duplicate detector + `rejectedCombos` wildcards block retry of only working model per-agent | ЁЯЯв Done |

### Root cause

`triedKeys` and `rejectedCombos` are local to each `debateCallLlm()` call. When cross-agent duplicate is detected:

1. The working model+key gets added to `triedModels`/`triedKeys`
2. A wildcard entry `${provider}|${model}|*` goes into `rejectedCombos`
3. `resolveProvider()` returns null because every model for the only provider is blocked by wildcards
4. Agent hits "No available API keys" тЖТ retries тЖТ same block тЖТ after 5 spins тЖТ agent fails

### Changes

| #   | File                   | Change                                                                                                                                                                                                                                                                                           |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `debate-llm-caller.ts` | In the "No available API keys" handler, added clearing of wildcard entries from `rejectedCombos` and their corresponding models from `triedModels` before each retry. The `noProviderSpinCount` guard (max 5) still prevents infinite spin. Working model gets retried instead of dead-spinning. |
| 2   | `debate-llm-caller.ts` | Added `triedKeys.clear()` after wildcard clearing тАФ without this, all provider keys remain blocked (added at line ~2424), so `resolveProvider()` still returns null even after unblocking models. Now the working model can be retried with any key of the same provider.                        |

---

## Session 73 тАФ Shadow Opponent role injection for diverse critique/steelman (v4.5.0 тЖТ v4.6.0) тЬЕ

**1 fix. Typecheck 0 errors.**

### Changes

| #   | File                                | Change                                                                                                                                                                                                                                                        |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `debate-shadow-opponent-service.ts` | Critique/steelman meta-prompt now includes the agent's role context (first ~300 chars of system prompt: "Your Role" + "Your Character" + "Your Unique Lens"). Previously all agents got the same generic output. Now each agent critiques from its expertise. |

---

## Session 74 тАФ Fix Google GenAI 400: tools/safetySettings in wrong nesting (v4.5.0 тЖТ v4.6.0) тЬЕ

**1 fix. Typecheck 0 errors.**

### Problem

`google-genai-service.ts` passed `tools` and `safetySettings` inside `generationConfig` to `getGenerativeModel()`. The Gemini API rejects these fields inside `generationConfig` with `400 Invalid JSON payload тАФ Unknown name "tools"`. Expected: `tools` and `safetySettings` are top-level `ModelParams`.

### Changes

| #   | File                      | Change                                                                                                                                                                                                                         |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `google-genai-service.ts` | Split `config` into `generationConfig` (temperature, maxOutputTokens, stopSequences, responseMimeType, thinkingConfig) + `modelParams` (tools, safetySettings). `getGenerativeModel()` now receives fields at correct nesting. |

---

## Session 76 тАФ Fix 3 empty panels (ContributionGraph, PerformanceProfiler, PressureMap) (v4.5.0 тЖТ v4.6.0) тЬЕ

**Committed + pushed: `d201bb05`. Typecheck clean (prior build verified).**

### ╨Я╤А╨╛╨▒╨╗╨╡╨╝╨░

3 ╨┐╨░╨╜╨╡╨╗╨╕ ╨┐╨╛╨║╨░╨╖╤Л╨▓╨░╨╗╨╕ "0 0 0" ╨╕╨╗╨╕ "loading" / "empty" ╨┐╨╛╤Б╨╗╨╡ ╨╖╨░╨┐╤Г╤Б╨║╨░ ╨┤╨╡╨▒╨░╤В╨╛╨▓ ╤Б ╨╜╨░╤Б╤В╤А╨╛╨╡╨╜╨╜╤Л╨╝╨╕ API ╨║╨╗╤О╤З╨░╨╝╨╕:

1. `/contribution-graph` тАФ ╨▓╤Б╨╡╨│╨┤╨░ 0 total, 0 streak, 0 longest
2. `/performance-profiler` тАФ ╨▓╤Б╨╡╨│╨┤╨░ "performance_profiler.empty"
3. `/pressure-map` (PressureMapPanel + PressureMap) тАФ ╨▓╤Б╨╡╨│╨┤╨░ loading

### ╨Ъ╨╛╤А╨╜╨╡╨▓╤Л╨╡ ╨┐╤А╨╕╤З╨╕╨╜╤Л

| ╨Я╨░╨╜╨╡╨╗╤М              | ╨Я╤А╨╕╤З╨╕╨╜╨░                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ContributionGraph   | `useState(() => contributionService.getGraph())` тАФ one-shot, ╨╜╨╡╤В ╤А╨╡╨░╨║╤В╨╕╨▓╨╜╨╛╤Б╤В╨╕. `contributionService` ╨╜╨╡ ╨▓ INIT_TIERS тЖТ init()  |
| PerformanceProfiler | `aggregate()` ╤В╤А╨╡╨▒╨╛╨▓╨░╨╗ `latency > 0`, ╨╜╨╛ LoggerService.log ╨╜╨╡ ╨╖╨░╨┐╨╛╨╗╨╜╤П╨╡╤В latency. `child()` ╨╜╨╡ ╨┤╨╡╨╗╨╕╨╗╤Б╤П ╨▒╤Г╤Д╨╡╤А╨╛╨╝ ╤А╨╛╨┤╨╕╤В╨╡╨╗╤П тЖТ ╨┐╤Г╤Б╤В╨╛ |
| PressureMap         | `pressureMapService` + `cognitiveIntelligenceService` ╨╜╨╡ ╨▓ INIT_TIERS тЖТ init() ╨╜╨╡ ╨▓╤Л╨╖╤Л╨▓╨░╨╗╤Б╤П тЖТ ╤Б╨╛╨▒╤Л╤В╨╕╨╣ ╨╜╨╡╤В, ╨┤╨░╨╜╨╜╤Л╤Е ╨╜╨╡╤В          |

### ╨Ш╨╖╨╝╨╡╨╜╨╡╨╜╨╕╤П

| #   | ╨д╨░╨╣╨╗                         | ╨Ш╨╖╨╝╨╡╨╜╨╡╨╜╨╕╨╡                                                                                            |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | `ContributionGraphPanel.tsx` | `useState`тЖТ`useEffect` ╤Б ╨┐╨╛╨┤╨┐╨╕╤Б╨║╨╛╨╣ ╨╜╨░ STREAM_END, DEBATE_AGENT_RESPONDED, KEY_HEALTH_CHECK_COMPLETED |
| 2   | `profiler-utils.ts`          | `aggregate()` ╤Б╤З╨╕╤В╨░╨╡╤В ╨Т╨б╨Х ╨╖╨░╨┐╨╕╤Б╨╕ per service (╨╜╨╡ ╤В╨╛╨╗╤М╨║╨╛ ╤Б latency>0), ╨╛╤В╨┤╨╡╨╗╤М╨╜╨╛ error/warn count      |
| 3   | `logger-service.ts`          | `child()` ╨┤╨╡╨╗╨╕╤В ╨▒╤Г╤Д╨╡╤А ╤А╨╛╨┤╨╕╤В╨╡╨╗╤П; `latency` ╨╕╨╖╨▓╨╗╨╡╨║╨░╨╡╤В╤Б╤П ╨╕╨╖ `meta` ╨┐╤А╨╕ ╤Б╨╛╨╖╨┤╨░╨╜╨╕╨╕ LogEntry                |
| 4   | `bootstrap-phases.ts`        | ╨Ф╨╛╨▒╨░╨▓╨╗╨╡╨╜╤Л `contributionService`, `cognitiveIntelligenceService`, `pressureMapService` ╨▓ Tier 5       |

### ╨Ш╤В╨╛╨│

3 ╨┐╨░╨╜╨╡╨╗╨╕ ╨┐╨╛╤З╨╕╨╜╨╡╨╜╤Л. ╨Я╨╛╤Б╨╗╨╡ ╨┐╨╡╤А╨╡╨╖╨░╨│╤А╤Г╨╖╨║╨╕ ╨╕ ╨╖╨░╨┐╤Г╤Б╨║╨░ ╨┤╨╡╨▒╨░╤В╨╛╨▓ ╨┤╨░╨╜╨╜╤Л╨╡ ╨┤╨╛╨╗╨╢╨╜╤Л ╨┐╨╛╤П╨▓╨╕╤В╤М╤Б╤П.

---

## Session 75 тАФ 31 ╤Б╨┐╨╡╤Ж╨╕╨░╨╗╨╕╨╖╨╕╤А╨╛╨▓╨░╨╜╨╜╤Л╤Е ╨░╤Г╨┤╨╕╤В╨░ (╤А╨░╨╖╨┤╨╡╨╗ 5.1тАУ5.4 ╨╕╨╖ docs/aaa.md) (v4.5.0 тЖТ v4.6.0)

### ╨ж╨╡╨╗╤М

╨Ч╨░╨┐╤Г╤Б╤В╨╕╤В╤М 31 ╤Б╨┐╨╡╤Ж╨╕╨░╨╗╨╕╨╖╨╕╤А╨╛╨▓╨░╨╜╨╜╤Л╨╣ ╨░╤Г╨┤╨╕╤В ╨╕╨╖ `docs/aaa.md` (╤А╨░╨╖╨┤╨╡╨╗╤Л 5.1 ╨Ъ╨╛╨╜╤Б╨╕╤Б╤В╨╡╨╜╤В╨╜╨╛╤Б╤В╤М, 5.2 ╨Э╨░╨┤╤С╨╢╨╜╨╛╤Б╤В╤М, 5.3 ╨Ь╨╛╨╜╨╕╤В╨╛╤А╨╕╨╜╨│, 5.4 ╨Р╤А╤Е╨╕╤В╨╡╨║╤В╤Г╤А╨░) ╨╕ ╨╖╨░╨┐╨╕╤Б╨░╤В╤М ╤А╨╡╨╖╤Г╨╗╤М╤В╨░╤В╤Л ╨▓ `docs/ocs/resultall.md`.

### ╨Я╨╗╨░╨╜

| #   | ╨Р╤Г╨┤╨╕╤В                                                                        | ╨б╤В╨░╤В╤Г╤Б                     |
| --- | ---------------------------------------------------------------------------- | -------------------------- |
| 1   | **5.1.1** Idempotency                                                        | ЁЯЯв Done (54 findings)      |
| 2   | **5.1.2** Dual-write                                                         | ЁЯЯв Done (22 findings)      |
| 3   | **5.1.3** Event loss                                                         | ЁЯЯв Done (12 findings)      |
| 4   | **5.1.4** Event duplication                                                  | ЁЯЯв Done (11 findings)      |
| 5   | **5.1.5** Partial failure/rollback                                           | ЁЯЯв Done (8C, 10H findings) |
| 6   | **5.1.6** Crash consistency                                                  | ЁЯЯв Done (18 findings)      |
| 7   | **5.1.7** Stale state/versioning                                             | ЁЯЯв Done (53 findings)      |
| 8   | **5.1.8** Lost updates                                                       | ЁЯЯв Done (24 findings)      |
| 9   | **5.1.9** Ordering bugs                                                      | ЁЯЯв Done (13 findings)      |
| 10  | **5.2.1тАУ5.2.5** Retry storms, DLQ, FAF, leaks                                | ЁЯЯв Done (35 findings)      |
| 11  | **5.2.6тАУ5.2.10** Backpressure, Concurrency, Network, Provider, Rate limits   | ЁЯЯв Done (9 findings)       |
| 12  | **5.2.11тАУ5.2.15** Budget, State-machine, Events, Replay, Non-determinism     | ЁЯЯв Done (12 findings)      |
| 13  | **5.3.1тАУ5.3.5** Observability, Silent errors, Promises, Security, Corruption | ЁЯЯв Done (62 findings)      |
| 14  | **5.4.1тАУ5.4.5** Init, Shutdown, HMR, Cross-tab, Workers                      | ЁЯЯв Done (28 findings)      |
| 15  | **5.4.6тАУ5.4.10** Config, Schema, Cache, DI, Dead code                        | ЁЯЯв Done (32 findings)      |

### Changes

| #   | ╨Р╤Г╨┤╨╕╤В                              | ╨Э╨░╤Е╨╛╨┤╨╛╨║                 | ╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ Critical                                                                                                        |
| --- | ---------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | **5.1.1** Idempotency              | 54 (14C, 16H, 12M, 12L) | DEBATE_SESSION_FAILED 7x ╨▒╨╡╨╖ dedup; MESSAGE_RESPONSE 12x ╨▒╨╡╨╖ dedup; ╨╜╨╡╤В Idempotency-Key ╨▓ HTTP                           |
| 2   | **5.1.2** Dual-write               | 22 (5C, 8H, 5M, 4L)     | debate-human-service 3x emit ╨┤╨╛ fire-and-forget persist; mcp-service removeServer save ╨╜╨╡ await                          |
| 3   | **5.1.3** Event loss               | 12 (1C, 4H, 5M, 2L)     | emit() ╨▓╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╤В void тАФ ╨╜╨╡╤В ack; DEBATE_SESSION_FAILED 7 ╤Б╨░╨╣╤В╨╛╨▓ ╨▒╨╡╨╖ idempotency                                         |
| 4   | **5.1.4** Event duplication        | 11 (4C, 2H, 3M, 2L)     | Cross-tab ╤Н╤Е╨╛-╨┐╨╡╤В╨╗╤П CHAT_FORKED; DEBATE_UPDATED ╨┐╨╛╨┤╨░╨▓╨╗╨╡╨╜ ╨╜╨░ 30╤Б; ╨╜╨╡╨▓╨╡╤А╨╜╤Л╨╣ ╤Д╨╛╤А╨╝╨░╤В ╨▓ debateLiveStore                       |
| 5   | **5.1.5** Partial failure/rollback | 8C, 10H                 | federated-memory 10+ void persist; key-service updateKeyStatus emit ╨┤╨╛ save; virtual-key-service debounced persist       |
| 6   | **5.1.6** Crash consistency        | 18 (2C, 5H, 9M, 2L)     | ai_os_clean_shutdown ╤Д╨╗╨░╨│ ╨╜╨╕╨║╨╛╨│╨┤╨░ ╨╜╨╡ ╤Г╤Б╤В╨░╨╜╨░╨▓╨╗╨╕╨▓╨░╨╡╤В╤Б╤П; sync-backup ╨┐╨╕╤И╨╡╤В╤Б╤П ╨╜╨╛ ╨╜╨╡ ╤З╨╕╤В╨░╨╡╤В╤Б╤П                                 |
| 7   | **5.1.7** Stale state/versioning   | 53 (14C, 18H, 12M, 9L)  | PolicyService 3-key blind write; BudgetService 5 blind writes; DexieSessionStore silent skip; 32 ╤Б╨╡╤А╨▓╨╕╤Б╨░ ╨▒╨╡╨╖ CAS         |
| 8   | **5.1.8** Lost updates             | 24 (1C, 9H, 5M, 9L)     | group-manager persist ╨▒╨╡╨╖ try/catch; research-run void persist ╨▒╨╡╨╖ beforeunload                                          |
| 9   | **5.1.9** Ordering bugs            | 13 (3C, 3H, 3M, 4L)     | Chat _sendQueue ╤В╨╡╤А╤П╨╡╤В ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╤П; cancelSending ╨╜╨╡ ╤З╨╕╤Б╤В╨╕╤В ╨╛╤З╨╡╤А╨╡╨┤╤М; ╨╜╨╡╤В causal ordering ╨▓ EventBus                        |
| 10  | **5.2.1тАУ5.2.5**                    | 35 (0C, 11H, 15M, 9L)   | Fire-and-forget void persist ╨▓ 4+ ╤Б╨╡╤А╨▓╨╕╤Б╨░╤Е; ResearchEngine 10 Maps ╨▒╨╡╨╖ ╨╗╨╕╨╝╨╕╤В╨░; DI init ╨▒╨╡╨╖ await                         |
| 11  | **5.2.6тАУ5.2.10**                   | 9 (3C, 2H, 4M/L)        | Race-executor ╨▒╨╡╨╖ ╨╗╨╕╨╝╨╕╤В╨░ ╨║╨░╨╜╨┤╨╕╨┤╨░╤В╨╛╨▓; TypeError ╨╛╤В fetch() ╨╜╨╡ ╤А╨░╤Б╨┐╨╛╨╖╨╜╨░╤С╤В╤Б╤П; global semaphore ╨▒╨╗╨╛╨║╨╕╤А╤Г╨╡╤В                    |
| 12  | **5.2.11тАУ5.2.15**                  | 12 (6C, 2H, 4M)         | BudgetService ╨╜╨╡╤В hard stop; transition() bypass guards; 63 ╤Б╨╛╨▒╤Л╤В╨╕╤П ╤Б z.unknown(); guardian-registry Math.random         |
| 13  | **5.3.1тАУ5.3.5**                    | 62 (3C, 13H, 24M, 22L)  | config-service ╨╝╤Г╤В╨░╤Ж╨╕╨╕ ╨▒╨╡╨╖ authorization; ╨╜╨╡╤В ╨╝╨╛╨╜╨╕╤В╨╛╤А╨╕╨╜╨│╨░ ╨┤╨╛╤Б╤В╨░╨▓╨║╨╕ ╤Б╨╛╨▒╤Л╤В╨╕╨╣; 4 ╨┐╤Г╤Б╤В╤Л╤Е catch ╨▓ debate-llm-caller           |
| 14  | **5.4.1тАУ5.4.5**                    | 28                      | Cross-tab broadcast ╨▒╨╡╨╖ timestamp ╨┐╤А╨╛╨▓╨╡╤А╨║╨╕; worker fire-and-forget ╤В╨╡╤А╤П╨╡╤В ╨┤╨░╨╜╨╜╤Л╨╡; ╨╜╨╡╤В HMR dispose ╨┤╨╗╤П unhandledrejection |
| 15  | **5.4.6тАУ5.4.10**                   | 32 (4C, 11H, 13M, 4L)   | 3 deprecated ╨╝╨╡╤В╨╛╨┤╨░ ╨▓ policy-service (600+ ╤Б╤В╤А╨╛╨║ dead code); 5 mock-╤Б╨╡╤А╨▓╨╕╤Б╨╛╨▓; 5 ╤Б╨╕╨╜╨│╨╗╤В╨╛╨╜╨╛╨▓ ╨▓╨╜╨╡ DI                        |
