# NIGHTLY RESEARCH — SESSION LOG

Format: timestamp | cycle | area | what was investigated | findings | files checked | hypotheses confirmed/rejected | next

---

## 2026-08-15 — Cycle 1: RECONNAISSANCE

Area: AGENTS.md, existing research reports, architecture docs, key kernel files.

What investigated:

- Read AGENTS.md (full) — architecture layers, conventions, current session state.
- Existing research reports (BACKEND/FRONTEND_IMPROVEMENT_REVIEW.md) used as HYPOTHESES only, not truth.
- Noted pre-existing baseline LSP errors (invocation-types module resolution, lensEngine export, director paused/aborted comparison).

Findings: (to be filled as research proceeds)

- Hypothesis bank seeded from prior reports: EventBus lossy (B-02/B-03), Director abort mislabeled (B-01), debateCallLlm god-function (B-11), Invocation fake lifecycle (B-17/B-18), Forum↔Debate escalation broken (FM-02), duplicate builder nav id (FA-01).

Files checked: AGENTS.md, docs/research/*.md
Hypotheses confirmed: (pending verification)
Hypotheses rejected: (pending)
Next: Cycle 2 — Kernel deep trace (EventBus, container, service-helper, instances, service-registration).

---

## 2026-08-15 — Cycle 2: KERNEL / EVENTBUS

Area: `src/kernel/events/event-bus.ts` + all `emitOnce` callers + `event-registry.ts` helper + consumers in `src/components`.

Investigated:

- `emitOnce` idempotency cache keyed by `(event,key)` with 30s TTL.
- Grepped all 96 `emitOnce` call sites; many use CONSTANT keys.
- Verified `event()` helper uses plain `z.object` (no `.strict()`) → strict-mode drop only on genuinely mistyped payloads.
- Verified consumers: KnowledgePanel (MEMORY_UPDATED), SkillsPanel (SKILLS_UPDATED), ProviderMarketplace/AlertLayer (KEY_UPDATED).

Findings recorded: EB-01 (High, constant-key emitOnce drops state updates), EB-02 (Med, LRU eviction wrong), EB-03 (Med, recursion deferral reorders), EB-04 (Low, singleton DI-bypass).
Confirmed that the `invocation-types` / `conversation-director-service.ts:163` LSP errors are FALSE POSITIVES (file exists; DirectorState is 6-member; LSP polluted by baseline module errors). Logged as RH-01/RH-02 for the rejected-hypotheses file.

Next: Cycle 3 — ConversationDirector lifecycle.

---

## 2026-08-15 — Cycle 3: CONVERSATIONCORE / DIRECTOR

Area: `conversation-director-service.ts`, `conversation-orchestrator.ts`, `conversation-execution-engine.ts`, `conversation-hybrid-policy.ts`, `director.ts`/`scenario.ts` contracts, `directorStore.ts`, `directorController.ts`, `RunTab.tsx`.

Investigated (via thorough subagent + direct source verification):

- H1 abort→error: CONFIRMED at `run()` catch line 169 (overwrites `aborted`).
- H2 first-turn abort not cancelled: CONFIRMED (single guard, AbortController built post-await).
- H3 resume-after-abort→completed: CONFIRMED (`resume()` sets state='running', orchestrator aborted set never cleared).
- H4 enum mismatch: REJECTED (DirectorState is complete) — but 3-channel divergence CONFIRMED behaviorally (EB-08).
- H5 line-163 type error: REJECTED (code type-correct; LSP cascade). Logged RH-01/RH-03.

Findings recorded: EB-05..EB-14 (10 findings). Notable: dual state facets (EB-08), empty-sessionId pause event loss (EB-09), store no sessionId filter + leak (EB-12), permanent aborted flag (EB-13).
Files checked: conversation-director-service.ts (1-299 read), conversation-orchestrator.ts (via subagent), directorStore.ts, directorController.ts, RunTab.tsx, contracts/conversation/director.ts.

Next: Cycle 4 — Debate runtime deep trace (caller, sync manager, persistence, state ownership).

---

## 2026-08-15 — Cycle 4: DEBATE RUNTIME

Area: `debate-sync-manager.ts`, `debate-llm-caller.ts`, `debate-human-service.ts`, `debate-finalizer.ts`, registration (`phase3-debate-runtime.ts`, `phase21-invocation.ts`), `activeDebateStore`.

Investigated:

- `DebateSyncManager` holds single `activeSession` + `runtimeSessionId`. Registered as singleton `'debateService'`. Invocation delegate (`phase21-invocation.ts:156,76`) reuses SAME instance. `startDebate` cancels previous non-terminal session (`:228-244`) → concurrent/Invocation-spawned debates silently cancel the first.
- `debate-llm-caller.ts` = 1168 lines; error classification via string matching (`includes(...)`, regex on `413`); NO `debate-llm-caller.test.ts` exists.
- `DEBATE_UPDATED` emitted via `emitOnce(session.id, ...)` → frequent same-session updates within 30s dropped.
- Debate state has 4+ owners: `activeSession`, engine session, `activeDebateStore`, Dexie persistence.

Findings recorded: EB-15 (High, singleton single-debate + cancel-on-concurrent), EB-16 (High, llm-caller god-fn + string-match + no tests), EB-17 (Med, DEBATE_UPDATED emitOnce drop), EB-18 (Med, 4+ state owners).
Files checked: debate-sync-manager.ts (read 224-268, 695-744, greps), debate-llm-caller.ts (size + grep), phase3/phase21 registration, debate-human-service.ts (grep).
Note: a prior subagent call returned a truncated/empty result; completed the investigation directly.

Next: Cycle 5 — Forum service + backend↔frontend integration (votePost, escalation, threading).

---

## 2026-08-15 — Cycle 5: FORUM + INTEGRATION

Area: `forum-service.ts`, `contracts/forum.ts`, `ForumPanel/**`, `phase18-forum.ts`, `RunTab.tsx`, `conversation-director-service.ts` (checkpoints), `schema-types.ts`.

Investigated (negative research on advertised capabilities):

- `escalated-to-debate`: NO forum method, NO UI, NO emitter; only referenced in a NEGATIVE test asserting it's absent. Phase18 bridge has no such handler. → phantom integration (IN-01, High).
- `votePost`: implemented + tested, but ForumPanel has no vote UI (other panels do). → unused backend capability (IN-02).
- `subscribe` / `pinTopic`: implemented, but no subscribe UI and pin is display-only. → unused/partial (IN-03).
- Director checkpoints: shown in RunTab UI but stored in-memory `this.session`, no Dexie table → ephemeral (IN-04).
- RunTab Override: hard-codes `objective.type:'CHALLENGE'` (IN-05).

Findings recorded: IN-01..IN-05 (in 04_INTEGRATION_FINDINGS.md).
Files checked: forum-service.ts, contracts/forum.ts, ForumPanel/*, phase18-forum.ts, RunTab.tsx, conversation-director-service.ts, schema-types.ts.

Next: Cycle 6 — Invocation Engine + Room (lifecycle fake? executing-after-done, orphaned accepted, policy semantics).

---

## 2026-08-15 — Cycle 6: INVOCATION ENGINE + ROOM

Area: `invocation-engine-service.ts` (`invoke` lifecycle), `phase21-invocation.ts` (`InvocationExecutionDelegate.start`), `invocation-repository.ts`, `RoomPanel`/store (context).

Investigated:

- Read full `invoke()` (lines 39-122). Lifecycle: requested→accepted (persisted) → `await execution.start()` → executing (set) → done (set), both synchronous after start resolves.
- `InvocationExecutionDelegate.start`: chat mode `await director.run()` (blocks to completion); debate mode `startDebate` returns immediately (background).
- NO try/catch around `execution.start()`.

Findings recorded: EB-19 (executing instantaneous/post-hoc), EB-20 (orphaned accepted on failure — no error captured), EB-21 (premature done for debate mode). All CONFIRMED against source.
Files checked: invocation-engine-service.ts (39-133), phase21-invocation.ts (full).

Next: Cycle 7 — LLM adapters / routing / execution governor / race executor (B-19 timeout fix miss, B-20 CacheDecorator key, B-21 dual routing stores).

---

## 2026-08-15 — Cycle 7: LLM ADAPTERS / ROUTING

Area: `openai-compatible-adapter.ts`, `cerebras-adapter.ts`, `gemini-adapter.ts`, `llm-http-client.ts`, `cloudflare/openrouter/nvidia/groq adapters`, `cache-decorator.ts`, `provider-router.ts` vs `smart-routing-service.ts`.

Investigated:

- B-19 (60s→120s miss): CONFIRMED. `OpenAiCompatibleAdapter` builds `LLMHttpClient(proxyUrl, headers, 'authorization', this.id)` — 4 args, no timeout → default 60000. `CerebrasAdapter extends OpenAiCompatibleAdapter` inherits it. `GeminiAdapter` also 4-arg. cloudflare/openrouter/nvidia/groq pass 120000. So openai-compatible family + gemini MISSED the G-01 fix → 60s HTTP timeout can beat the 90s large-model caller window → bare AbortError → no-retry turn loss. (EB-22)
- B-20 (CacheDecorator key): NUANCED. Key = apiKeyHash + JSON(messages,model,options). No agentId/sessionId. Contamination only on byte-identical prompts. Lower risk than claimed. (EB-23)
- B-21 (dual routing): CONFIRMED disjoint. `RouterService` (live) vs `SmartRoutingService` (panel); neither references the other; bridge is `RoutingPolicyService` (3rd). SmartRouting rules likely don't affect live routing. (EB-24, Likely)

Findings recorded: EB-22 (High), EB-23 (Med), EB-24 (Med).
Files checked: openai-compatible-adapter.ts, cerebras-adapter.ts, gemini-adapter.ts, llm-http-client.ts, cloudflare/openrouter/nvidia/groq adapters (grep), cache-decorator.ts, provider-router.ts, smart-routing-service.ts, services-extras.ts, SmartRoutingPanel.tsx.

Next: Cycle 8 — Frontend stores / routing / route-registry (FA-01 duplicate builder nav id, observer stores never unsubscribe, etc.).

---

## 2026-08-15 — Cycle 8: FRONTEND ROUTING / STORES

Area: `route-registry-{content,core,system}.ts(x)`, `route-registry.tsx` (merge), `route-imports.ts`, `stores/invocationStore.ts`, `components/Common/*`, `ResearchPanel/*`.

Investigated:

- FA-01 (duplicate builder id): CONFIRMED. `builder` declared in BOTH `route-registry-content.ts:106` and `route-registry-core.ts:146`; both merged in `route-registry.tsx:1-3` → duplicate nav + route. (FE-01, High)
- Observer stores: CONFIRMED `void subs` never torn down in invocationStore (:199) + directorStore. (FE-02)
- Global subscription no sessionId filter → cross-session contamination. (FE-03)
- 3 incompatible StatusBadge impls; Common/index.ts exports only ErrorBoundary; inline styles pervasive. (FE-04)
- Split core/system/content registry with no id-uniqueness guard → FE-01 happened. (FE-05)

Findings recorded: FE-01..FE-05 (in 02_FRONTEND_FINDINGS.md).
Files checked: route-registry-_.ts(x), route-imports.ts, invocationStore.ts, Common/index.ts, status-vocabulary.tsx, ResearchPanel/_.

Next: Cycle 9 — Architecture synthesis (lazyService DI-bypass, dual-state anti-pattern, single-source-of-truth). Plus testing/performance synthesis.

---

## 2026-08-15 — Cycle 9: SYNTHESIS (Architecture / Testing / Performance)

Consolidated cross-cutting findings from cycles 2-8 into:

- `03_ARCHITECTURE_FINDINGS.md` (AR-01..AR-07): lazyService DI-bypass, EventBus singleton, dual/multi-state anti-pattern, single-active-debate, dual routing, unrealized invocation lifecycle, emitOnce misuse.
- `05_TESTING_FINDINGS.md` (TE-01..TE-05): debate-llm-caller no tests (High), Director lifecycle failure modes unasserted, only 2 E2E tests, no cognitive/panel component tests, EventBus semantics untested.
- `06_PERFORMANCE_FINDINGS.md` (PE-01..PE-04): store leak/unsub, unscoped feed, debate full-object store push, global fan-out.

These reference the primary EB/FE/IN findings; not added to the primary total (34).
Files: 03/05/06 written.

Next: Cycle 10 — Frontend panels deep (RoomPanel, Director RunTab, DebateArena, ForumPanel) + cross-module (Forum↔Debate, Invocation↔ConversationCore).

---

## 2026-08-15 — Cycle 10: NEGATIVE RESEARCH (events with no consumer)

Area: `phase18-forum.ts` (full re-read), `key-status.ts` EventBus emits, event-registry consumers, `services-key.ts`/key-state-store.

Investigated (search for emitted events with NO subscriber — dead signal / security blind spot):

- Re-read `phase18-forum.ts` in full; confirmed it DOES wire debate→forum (`debate:verdict:generated` → case study, `knowledge:crystal:formed` → announcement) and forum→generator bridges live. Only the advertised **forum→debate escalation** is absent (already IN-01).
- Grepped all emitters of `KEY_COMPROMISED`, `ROLE_ASSIGNED`, `METRICS_ALERT_RESOLVED`. `KEY_COMPROMISED` is emitted at `key-status.ts:174` (and likely key-state-store) but grep for subscribers/`onSafe(...)` returns NONE → a security-critical key-compromise signal has no consumer. `ROLE_ASSIGNED`/`METRICS_ALERT_RESOLVED` similarly emitted with no listener.

Findings recorded: IN-06 (High, KEY_COMPROMISED no consumer — security blind spot), IN-07 (Med, ROLE_ASSIGNED/METRICS_ALERT_RESOLVED emitted-no-consumer). Both CONFIRMED against source.

Files checked: phase18-forum.ts (full), key-status.ts (grep emit), event-registry.ts (grep emitters), services-key.ts (grep).
Hypotheses confirmed: IN-06 (High), IN-07 (Med). Rejected: none.

Next: Cycle 11 — Frontend panels deep (RoomPanel, Director RunTab, DebateArena, ForumPanel) for UX/integration bugs; expand 07_SECURITY_RELIABILITY.md from IN-06; create 13_VERIFIED_FINDINGS.md to re-validate old audit claims (B-01..B-21).

---

## 2026-08-15 — Cycle 11: FRONTEND PANELS (RoomPanel) + SECURITY SWEEP

Area: `RoomPanel.tsx`, `RoomPanel` store feed (`invocationStore.ts`), key-management (`key-status.ts`, `key-service.ts`), `SecurityService` (`security.ts`), `config-registry.ts` webhook secret, event-registry compromise events.

Investigated:

- RoomPanel feed: CONFIRMED `useInvocationStore` `CONVERSATION_TURN_*` handlers (invocationStore.ts:160-197) ignore `sessionId` and aggregate ALL conversation turns into one global `feed` → cross-session interleaving (FE-07, Medium).
- RoomPanel "Clear" (RoomPanel.tsx:242) → `clear()` (invocationStore.ts:236) resets ONLY in-memory state; `loadHistory()` re-hydrates from Dexie on mount → cleared history reappears on reload (FE-06, Medium; misleading control).
- SECURITY: `compromiseKey()` (key-status.ts:162-181) quarantines the key INLINE (modifyKey+health+saveKeys+notify) — so the key IS isolated; the orphaned `KEY_COMPROMISED` event (IN-06) is a dead telemetry signal, NOT a breach. Reclassified IN-06 High→Medium. `COMPROMISE_SIGNAL` (consumed by notification-webhook-service.ts:178) is the wired path → asymmetric signal wiring (SEC-01).
- `KEY_COMPROMISE_SIGNAL` (event-registry.ts:56) never emitted/consumed → dead contract entry (IN-08, Low).
- `webhookSecret` stored plaintext in localStorage (config-registry.ts:308-323) → XSS-exfil risk (SEC-02, Medium).
- `adminToken` dead/unenforced config (config-registry.ts:305-307) → phantom auth (SEC-style, SEC-03, Low).
- VERIFIED STRENGTH: API keys encrypted at rest via `SecurityService` (PBKDF2+AES-GCM; key-migration.ts:120) — SEC-04 (not a defect).

Findings recorded: FE-06, FE-07 (in 02), IN-06 reclassified, IN-08, SEC-01/02/03/04 (in 07).
Files checked: RoomPanel.tsx, invocationStore.ts, key-status.ts, key-service.ts, security.ts, config-registry.ts, event-registry.ts, compromise-webhook-service.ts, notification-webhook-service.ts.
Hypotheses confirmed: FE-06, FE-07, IN-08, SEC-01, SEC-02, SEC-03. Rejected/refined: IN-06 downgraded (inline quarantine present).
Note: persistent LSP false positives (invocation-types module, director paused/aborted, LensesPanel lensEngine) are environment noise, not breakage.

Next: Cycle 12 — re-validate old audit claims (B-01..B-21 / FM-02 / FA-01) into 13_VERIFIED_FINDINGS.md; then continue frontend DebatePanel/ForumPanel deep dive and cross-module flows.

---

## 2026-08-15 — Cycle 12: VERIFIED-FINDINGS (re-validation of prior audit)

Area: prior audit reports (`BACKEND_IMPROVEMENT_REVIEW.md`, `FRONTEND_IMPROVEMENT_REVIEW.md`) hypothesis bank, cross-checked against Cycles 2–11 primary findings.

Investigated: mapped 10 sampled prior hypotheses to verified source findings:

- B-01 → EB-05 (CONFIRMED). B-02/B-03 → EB-01 (+EB-02/EB-03) (CONFIRMED, broader). B-11 → EB-16 (CONFIRMED). B-17/B-18 → EB-19/EB-20/EB-21 (CONFIRMED). B-19 → EB-22 (CONFIRMED). B-20 → EB-23 (CONFIRMED-WITH-NUANCE, severity lower). B-21 → EB-24 (CONFIRMED, Likely). FA-01 → FE-01 (CONFIRMED). FM-02 → IN-01 (CONFIRMED, characterized as never-built phantom). FM-vote/subscribe → IN-02/IN-03 (CONFIRMED).
- REJECTED/REFINED: IN-06 downgraded High→Medium (inline quarantine present); EB-23 severity downgraded; H5 (director paused/aborted) REJECTED as false-positive (RH-01).

Findings recorded: 13_VERIFIED_FINDINGS.md (synthesis; closes loop on prior audit). Net: all sampled prior hypotheses substantiated by direct source verification; 2 severity overstatements corrected; 0 fully contradicted.
Files checked: prior audit .md reports (context), all referenced primary findings.
Hypotheses confirmed: 10 prior claims hold. Refined: IN-06, EB-23. Rejected: H5/RH-01.

Next: Cycle 13 — Frontend DebatePanel / ForumPanel deep dive (live feed, history, verdict display) + cross-module flows.

---

## 2026-08-15 — Cycle 13: DEBATE PANEL + FORUM PANEL (UI integration)

Area: `DebatePanel.tsx`, `useDebatePanelSubscriptions.ts`, `DebateSessionHeader.tsx`, `CollabDebatePanel.tsx`, `ForumPanel/**` (escalation UI).

Investigated:

- `useDebatePanelSubscriptions` (useDebatePanelSubscriptions.ts:82-119): the main `debate:updated` handler IS correctly session-scoped (line 85 guards `data.id !== sessionRef.current?.id`) — the unscoped-feed anti-pattern (FE-07) was avoided here. BUT it is the sole live-sync path and consumes `DEBATE_UPDATED`, which the producer emits via `emitOnce(session.id, ...)` (EB-17) → the panel gets a lossy ≤1/30s-per-session stream. Recorded as FE-08 (Medium, consumer manifestation of EB-17).
- `CollabDebatePanel.tsx:53` and `DebateHistoryPage.tsx:23` / `DebateMemoryPanel.tsx:23` subscribe `debate:updated` and correctly scope by `session.id`. Consistent with FE-08 root cause (producer emitOnce), not a new unscoped bug.
- `DebateSessionHeader` uses `debateEngine.pause/resume/cancelSession` — interacts with the singleton `DebateSyncManager` (EB-15): an Invocation-spawned debate cancels the active one, and the panel's `DEBATE_SESSION_CANCELLED` handler (useDebatePanelSubscriptions.ts:159) nulls the session → visible reset. (EB-15 consumer impact, already counted.)
- ForumPanel: grep for `escalat|Escalat|startDebate|debate` across all `ForumPanel/*.tsx` → NO matches. Confirms IN-01 from the UI side: forum→debate escalation is entirely absent (no button, no handler), not merely broken. IN-01 fully corroborated backend+UI.

Findings recorded: FE-08 (in 02). IN-01 UI-side corroborated.
Files checked: useDebatePanelSubscriptions.ts, DebatePanel.tsx, DebateSessionHeader.tsx, CollabDebatePanel.tsx, DebateHistoryPage.tsx, DebateMemoryPanel.tsx, ForumPanel/*.tsx (grep).
Hypotheses confirmed: FE-08, IN-01 (UI absence). Rejected: none.
Note: persistent LSP false positives (invocation-types, director paused/aborted, LensesPanel lensEngine) remain environment noise.

Next: Cycle 14 — cross-module flows (Forum↔Debate bridge reality, Invocation↔ConversationCore session handoff) + remaining frontend panels (Director RunTab, cognitive panels) + documentation mismatches.

---

## 2026-08-15 — Cycle 14: OPPORTUNITIES + OPEN QUESTIONS (synthesis)

Area: consolidation of all prior findings into actionable opportunities (11) and explicit unresolved design questions (12).

Investigated (synthesis, no new source reads beyond prior cycles):

- `11_OPPORTUNITIES.md`: 14 concrete directions (OP-01..OP-14) each linked to primary findings — emitOnce "latest-wins" publisher, SessionScopedStore base, dev-time no-consumer detector, unify compromise signals, reconcile dual routing, Director lifecycle tests, debate-llm-caller unit tests, centralized StatusBadge, route-id uniqueness guard, persist Director checkpoints, build/delete forum→debate escalation, encrypt webhookSecret, harden ConversationCore lifecycle, make Invocation executing pre-hoc + failure-safe.
- `12_OPEN_QUESTIONS.md`: 9 genuine design questions (OQ-01..OQ-09) — policy target semantics, executing post-hoc, single-active-debate constraint, authoritative routing service, emitOnce intended contract, KEY_COMPROMISE_SIGNAL dead-by-design?, store vs service source of truth, dual encryption path, Clear destructive vs view-only.

Findings recorded: synthesis only (no new primary IDs). Deliverable set now covers 11/12 of 16 required files.
Hypotheses confirmed: n/a (synthesis). Rejected: n/a.

Next: Cycle 15 — Documentation mismatches (09) + Code health / duplication / dead code (10) to complete the 16-file deliverable set; then continue residual source areas (Director RunTab, cognitive panels, cross-module) as long as STOP is not given.

---

## 2026-08-15 — Cycle 15: DOCUMENTATION + CODE HEALTH (synthesis + verification)

Area: doc/contract vs code reality; duplication/dead-code/sprawl metrics.

Investigated (synthesis + verification):

- DOC-01: event registry advertises events with no consumer (links IN-06/07/08). DOC-02: prior audits stale vs AGENTS.md G-01..G-03 fixes (notes EB-22 partial). DOC-03: AGENTS.md documents Invocation lifecycle as realized but `executing` is post-hoc (links EB-19/AR-06). DOC-04: Forum→Debate escalation implied by contract/negative test but absent (IN-01).
- CH-01 (3 StatusBadge) FE-04; CH-02 (dual encryption) SEC-04; CH-03 (dead event) IN-08; CH-04 (dead adminToken) SEC-03; CH-05 (inline-style sprawl) — VERIFIED `grep -c "style={{" src/**/*.tsx` = **2576**; CH-06 (debate-llm-caller 1168-line untested) EB-16; CH-07 (lazyService DI-bypass) — VERIFIED `grep -c "lazyService" services-extras.ts` = **72**.

Findings recorded: DOC-01..04 (in 09), CH-01..07 (in 10). Verified metrics: 2576 inline-style blocks, 72 lazyService exports.
Files checked: event-registry.ts, config-registry.ts, security.ts, key-vault.ts, services-extras.ts, status-vocabulary.tsx, ResearchPanel/*, grep counts.
Hypotheses confirmed: DOC-01..04, CH-01..07.

Next: Cycle 16 — create 08_UX_FINDINGS.md (consolidate FE-06/07/08 + DOC-03 UX impact) to complete the 16-file set; then continue residual source areas (Director RunTab deep dive, cognitive panels, cross-module handoffs) until STOP.

---

## 2026-08-15 — Cycle 16: UX FINDINGS (synthesis)

Area: UX lens over FE-01/06/07/08, IN-06, EB-19/21, DOC-03.

Investigated (synthesis): consolidated 6 UX findings (UX-01..UX-06):

- UX-01 Clear misleads (FE-06), UX-02 RoomPanel feed unscoped (FE-07), UX-03 DebatePanel lossy live (FE-08), UX-04 duplicate Builder nav (FE-01), UX-05 Invocation status over-promises (EB-19/21), UX-06 no key-compromise alert (IN-06/SEC-01).

Findings recorded: UX-01..06 (in 08). **All 16 required deliverable files now exist** (00 master, 01-06 primary/synthesis, 07 security, 08 ux, 09 doc, 10 code-health, 11 opportunities, 12 open-questions, 13 verified, 14 rejected, 15 session-log).
Hypotheses confirmed: n/a (synthesis).

Next: Cycle 17 — Director RunTab source deep dive (read RunTab.tsx) for any new integration/UX bug beyond IN-04/IN-05/EB-09/EB-12; continue residual areas until STOP.

---

## 2026-08-15 — Cycle 17: DIRECTOR RUNTAB SOURCE DEEP DIVE

Area: `DirectorPanel/RunTab.tsx` (full read), `stores/directorController.ts`, `conversation-director-service.ts` `checkpoint()`.

Investigated:

- RunTab reads `controls.getSession()` / `controls.getCheckpoints()` during render (lines 63-64) from the SERVICE, not the store; re-renders only on `useDirectorStore` changes (status/currentParticipantId/turnLog). `service.checkpoint()` (`conversation-director-service.ts:221-235`) pushes to `this.session.checkpoints` with NO `eventBus.emit`, so no store update → RunTab does NOT re-render → the checkpoint list (line 251) is stale after adding one. User clicks "Checkpoint" and nothing appears until an unrelated turn event. **New finding FE-09 (Medium).**

Other observations (no new primary finding, already covered):

- Override hard-codes `objective.type:'CHALLENGE'` (IN-05).
- Checkpoints in-memory only (IN-04 / EB-08 dual-state).
- `key={i}` index keys on turnLog (minor, PE-class).
- Pause/abort don't cancel in-flight LLM (EB-10/11) — visible here as the UI staying "running" during abort.
- `useDirectorStore()` unscoped subscription (FE-03).

Findings recorded: FE-09 (in 02).
Files checked: RunTab.tsx (full), directorController.ts (grep), conversation-director-service.ts (grep checkpoint).
Hypotheses confirmed: FE-09. Rejected: none.

Next: Cycle 18 — cognitive-module panels (Lenses/Crystal/Synthesis/Junction/Forum/Builder) deep dive for unused capabilities / unscoped feeds / integration gaps; then continue until STOP.

---

## 2026-08-15 — Cycle 18: UI SUBSCRIPTION-BREADTH SCAN (architecture scale)

Area: `src/components/**` grep for `eventBus.on/onSafe/subscribeAll`.

Investigated:

- Grep returned **97 subscription sites across ~50 component files**. Most panels use a refresh-on-event idiom (re-fetch), correctly scoped where they filter by `requestId` (streaming tables). BUT `DashboardPanel.tsx:212` and `LiveWorkspace.tsx:78` use `eventBus.subscribeAll` (every event). Observer stores (`directorStore`, `invocationStore`) and RoomPanel `feed` do NOT scope by session (FE-03/FE-07).
- This confirms the global-singleton EventBus + per-component subscription is THE architectural idiom of the entire frontend — elevating AR-03/AR-04 from "a few stores" to "the whole UI". Recorded AR-08 (Medium, grep-verified).

Findings recorded: AR-08 (in 03). No new primary IDs (corroborates AR-03/04, FE-03/07/09).
Files checked: grep over src/components/*.tsx (97 hits).
Hypotheses confirmed: AR-08 (breadth). Rejected: none.

STATUS: 18 cycles complete. All 16 deliverable files populated. Primary findings: 41 (24 EB + 8 IN + 9 FE). Synthesis: AR-08 + AR-01..07, TE-01..05, PE-01..04, SEC-01..04, UX-01..06, DOC-01..04, CH-01..07, OP-01..14, OQ-01..09, IN-06/07/08 reclass, 10 prior hypotheses re-validated (13), 3 rejected (14).
Next: continue residual source areas (cognitive panel unused-capability specifics, cross-module handoffs) until STOP. The research loop is open.
