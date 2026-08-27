# 11_OPPORTUNITIES — Quick wins, medium, big ideas for `agent-security`

> Each: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.
> IDs: QW = quick win, MD = medium, BI = big idea.

## 5 QUICK WINS (QW)

### QW-1 — Inject `specializations` into the system prompt

- **Description:** When building the LLM system prompt for `agent-security` (Debate `DebatePanel.tsx:241-250`, ConversationCore `cognitive-service.ts:421`), append `specializations` + `baseRole` as a structured directive ("Specializations: Threat Modeling, AppSec, Zero Trust").
- **User value:** The agent finally behaves like a specialist, not a generic "security engineer." Directly fixes P1/P2.
- **Technical reuse:** `resolveAgent` already returns `specializations` (`agent-service.ts:385`); `agent-identity.ts:135`.
- **Effort:** S (1–2 files, ~half day).
- **Risk:** Low. Pure prompt enrichment; no schema change.
- **Dependencies:** None.
- **Existing infra:** `AGENT_PROFILES`, `normalizeAgentIdentity`, `resolveAgent`.
- **Why now:** Highest ROI; the curated data already exists and is currently wasted.

### QW-2 — Attach `lens:security` to the agent

- **Description:** Set `lensIds:['lens:security']` for `agent-security` in `normalizeAgentIdentity` (currently forced `[]` at `topology-defaults.ts:106`).
- **User value:** Security perspective lens auto-applies to the agent's reasoning; consistent with `lens-engine` design.
- **Technical reuse:** `lens:security` already exists (`lens-library.ts:69`); `lens-engine-service`.
- **Effort:** S.
- **Risk:** Low; lens is stackable/non-breaking.
- **Dependencies:** None.
- **Existing infra:** lens-engine.
- **Why now:** Fixes P9; trivial.

### QW-3 — Specialization quick-tasks in RoomPanel

- **Description:** When `agent-security` (or `domain:security`) is selected in RoomPanel, surface 3 template buttons ("Threat model", "AppSec audit", "Zero-trust review") that prefill `reason` + a `security_task` hint.
- **User value:** Faster, clearer invocation; educates users on the agent's real capabilities.
- **Technical reuse:** RoomPanel agent picker + `specializations` field.
- **Effort:** S–M.
- **Risk:** Low.
- **Dependencies:** None (complements QW-1).
- **Existing infra:** Invocation Engine, RoomPanel.
- **Why now:** Cheap UX win; pairs with QW-1.

### QW-4 — Close the debate cognitive blind-spot

- **Description:** Have `AgentJournalService` also consume `debate:argument`/`agent:responded` (or have debate runtime emit `COGNITIVE_STEP_COMPLETED` for participants) so `agent-security` debate activity counts in stats/journal.
- **User value:** Accurate agent analytics; no more "missing" debate runs.
- **Technical reuse:** `agent-journal-service.ts:129-191` subscription pattern; existing `debate:*` events.
- **Effort:** S–M.
- **Risk:** Low–Med (event volume); debounce as in `event-recorder.ts`.
- **Dependencies:** None.
- **Existing infra:** EventBus, AgentJournalService, AgentService stats.
- **Why now:** Fixes P4; restores trust in agent metrics.

### QW-5 — Domain/security chip on AgentCard + Detail

- **Description:** Render a "🔒 Security" domain chip + `specializations` chips on `AgentCard`/`AgentDetailPanel` (reuse `specializations`).
- **User value:** Discoverability; distinguishes `agent-security` from generic agents.
- **Technical reuse:** `AgentCard.tsx`, `AgentDetailPanel.tsx`, existing i18n `agents.*`.
- **Effort:** S.
- **Risk:** Low.
- **Dependencies:** None.
- **Existing infra:** UI components, i18n.
- **Why now:** Fixes part of P6/P10 discoverability.

## 5 MEDIUM (MD)

### MD-1 — Security-native debate personas (`security_reviewer`, `red_team`)

- **Description:** Add two `PersonaVariant`s to `persona-selector.ts` (`:3-241`) and a role-aware injector so `domain:security` agents receive STRIDE/OWASP/Zero-Trust framing; `red_team` for adversarial.
- **User value:** Real security war-games; fixes P3. Enables 04 scenarios S2/S3.
- **Technical reuse:** `persona-selector.ts` `selectForTopic` interface; `DebatePanel` persona build.
- **Effort:** M.
- **Risk:** Med (persona wording quality); A/B with existing variants.
- **Dependencies:** QW-1 (prompt enrichment).
- **Existing infra:** persona-selector, debate runtime.
- **Why now:** Unlocks the agent's debate value proposition.

### MD-2 — Structured security findings in AgentJournal

- **Description:** Extend `AgentJournalService` to parse/store a `securityFinding {severity, category, recommendation}` shape from `COGNITIVE_STEP_COMPLETED`/`debate:argument` for `domain:security` agents.
- **User value:** Persistent, queryable security knowledge per agent; basis for a security console (09 SEC-UX-3). Fixes P6 memory gap (08 SEC-MEM-1).
- **Technical reuse:** `agent-journal-service.ts` storage adapter; Dexie KV.
- **Effort:** M.
- **Risk:** Med (parsing reliability); start with heuristic + manual tag.
- **Dependencies:** QW-4.
- **Existing infra:** AgentJournalService, AgentDetailPanel tabs.
- **Why now:** Turns one-off outputs into durable assets.

### MD-3 — "Security console" tab in AgentDetailPanel

- **Description:** New tab rendering aggregated findings (severity counts, trends) from MD-2.
- **User value:** First agent-specific, domain-relevant view.
- **Technical reuse:** `AgentDetailPanel` tab pattern (`AgentObservabilityTab` etc.).
- **Effort:** M.
- **Risk:** Low.
- **Dependencies:** MD-2.
- **Existing infra:** UI tabs, i18n.
- **Why now:** Completes the observability story.

### MD-4 — Security scan invocation mode in RoomPanel

- **Description:** Add a `mode:'security_scan'` to Invocation that runs `agent-security` with a code/architecture artifact as input and returns a structured report.
- **User value:** Turns the agent into an actionable scanner, not just a chat.
- **Technical reuse:** `InvocationEngineService` + `InvocationExecutionDelegate` (`phase21-invocation.ts:61-110`); ConversationCore.
- **Effort:** M.
- **Risk:** Med (input handling, report schema).
- **Dependencies:** QW-1.
- **Existing infra:** Invocation Engine, ScenarioRepository.
- **Why now:** Differentiates from generic chat.

### MD-5 — Bind `agent-security` to Crystal Vault (security knowledge)

- **Description:** When `agent-security` produces a high-confidence finding/verdict, offer one-click "crystallize" into Crystal Vault (`crystal-types.ts:17` `security` domain already exists).
- **User value:** Institutionalizes security knowledge; cross-agent reuse.
- **Technical reuse:** `crystalVault` service, `CrystalRepository`, debate→crystal bridge pattern (`crystal-debate-bridge`).
- **Effort:** M.
- **Risk:** Med (dedup/conflict).
- **Dependencies:** MD-2.
- **Existing infra:** Crystal Vault, event bridge.
- **Why now:** Closes the Knowledge/Crystal gap (P7).

## 3 BIG IDEAS (BI)

### BI-1 — Autonomous Security Review Pipeline (continuous)

- **Description:** A scheduled/triggered pipeline that runs `agent-security` (plus `agent-risk`, `agent-ethics`) over new PRs/architecture docs via ConversationCore scenarios, producing a security verdict consumed by Forum + Crystal.
- **User value:** Continuous, agent-driven security posture without manual invocation.
- **Technical reuse:** ConversationDirectorService scenarios, Invocation Engine, Forum bridge, Crystal Vault.
- **Effort:** L.
- **Risk:** High (orchestration, cost, false positives).
- **Dependencies:** QW-1, MD-1, MD-2, MD-5, scheduler (none exists — build or reuse cron).
- **Existing infra:** All components present except a scheduler.
- **Why now:** Realizes the agent's strategic purpose (proactive threat surface reduction).

### BI-2 — Red/Blue Agent Arena

- **Description:** Purpose-built debate mode where `agent-security` (red_team) faces `agent-architect`/`agent-devops` (blue) with structured attack/defense scoring and a verdict that feeds Crystal/Forum.
- **User value:** Repeatable adversarial testing of designs before build.
- **Technical reuse:** Debate runtime, `persona-selector` (MD-1), `debate:verdict:generated` bridge.
- **Effort:** L.
- **Risk:** High (scenario design, scoring fairness).
- **Dependencies:** MD-1.
- **Existing infra:** Debate, verdict bridge, Forum.
- **Why now:** Differentiates the platform as a security war-gaming environment.

### BI-3 — Security Memory & Learning Loop

- **Description:** Give `agent-security` a dedicated memory store + feedback loop: past findings (MD-2) prepended to prompts, user corrections stored, and recurring threats auto-crystallized; the agent improves across sessions.
- **User value:** The agent becomes genuinely smarter over time — a "Senior Security Engineer," not a stateless prompt.
- **Technical reuse:** AgentJournalService storage, `lens:security`, Crystal Vault, `updateAgent` persistence.
- **Effort:** L.
- **Risk:** High (memory correctness, privacy of findings).
- **Dependencies:** MD-2, QW-2, MD-5.
- **Existing infra:** Journal, lens-engine, Crystal Vault, Dexie.
- **Why now:** Transforms the agent from a prompt into a persistent competency.
