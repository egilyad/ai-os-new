# 00_AGENTS_MASTER_MAP — SuperAgents OS 25-System-Agent Synthesis

> Research-only synthesis. No source modified, no commit. Every material claim is tagged
> **[VERIFIED]** (read in source / per-agent docs), **[INFERRED]** (reasoned from architecture),
> **[OPINION]** (analyst recommendation). Citations use `file:line` against `src/` or the
> per-agent research folders `docs/experementmdroadmaps/agents/NN_*/`.

## 1. What these 25 agents actually are

The 25 "system agents" (Nadia Volkov → Iris Tanaka) are **not micro-services, not bespoke
code modules, and not independent LLM workers**. They are **curated topology NODES** — rows in a
single `AGENT_PROFILES` map (`src/kernel/state/agent-profiles.ts:21`, 25 entries **[VERIFIED]**)
that get merged onto corresponding `topology-defaults.ts` node configs at build time by
`normalizeAgentIdentity()` (`topology-defaults.ts:91-119`, consumes `AGENT_PROFILES:5,96`
**[VERIFIED]**).

Two parallel definitions must agree for each agent:

- **Identity** (`agent-profiles.ts`): name, avatar, provider, **model pin**, specializations.
- **Behavior** (`topology-defaults.ts`): the `prompt` (system persona), `temperature`, `tools`, `model:'auto'`.

The shared behavioral machinery (resolved/selected/stats) lives in `AgentService`
(`getAgents():306`, `resolveAgent():337`, `executeGroup():688`, `evaluateAutoSpawn():614`
**[VERIFIED]**). Debate uses the generic `PersonaSelector` (`persona-selector.ts:251-309`)
which keys on **debate side + topic keywords — never on `specializations`** **[VERIFIED]**.
ConversationCore/Director run turns through `ChatExecutor`/`ConversationOrchestrator`. The
Invocation Engine (`phase21-invocation.ts`) wraps `agentService` and exposes agents to `RoomPanel`.
Debate emits **no** cognitive events (`grep cognitive: src/kernel/services/debate-runtime → 0`
**[VERIFIED]**). The four cognitive events exist at `event-registry.ts:737/756/764/776`
**[VERIFIED]** but are consumed by `AgentService` for stats only; `cognitive:decision:made`
is dead-at-consumer.

**Bottom line:** the 25 agents are 25 _curated identities_ (names, faces, pinned models,
specialization labels) layered onto one shared execution substrate. Their "roles" exist as
system-prompt sentences plus metadata, not as differentiated runtime behavior.

## 2. The 25 Agents

Format per entry: **ID — Name (Role)** · _purpose_ · top VERIFIED capabilities · systems that
can use it · verdict on role↔capability match.

### 01 — agent-network — Nadia Volkov (Network Engineer)

- Purpose: bring networking/latency/topology expertise into debates, conversations, rooms.
- Capabilities: groq/`llama-3.3-70b-versatile` pin (`agent-profiles.ts:28-29`); system prompt
  on protocols/topology/latency/throughput/fault-tolerance (`topology-defaults.ts:150`); full
  participant in Debate/ConversationCore/Invocation/Topology (`01_*/00_PROFILE.md:36-58`).
- Systems: Debate, Director/ConversationCore, RoomPanel/Invocation, Topology router→aggregator,
  AgentService groups, Forum, AgentsPanel.
- Verdict: **Under-delivers — specialization dormant.** `tools:[]` (no iperf/API/code), no lens,
  `specializations` not used by persona selector (`01_*/04_DEBATE_ROLE.md:7-9`). Voice only.

### 02 — agent-risk — Rafael Stone (Risk Analyst)

- Purpose: risk categorization, Monte Carlo / STRIDE / DREAD / FAIR framing.
- Capabilities: `ANALYTICS_TOOLS` (`topology-defaults.ts:8,164`); low temp 0.15; grouped
  `Analytical` in prompt-audit (`prompt-audit-service.ts:28`).
- Systems: same shared set; no risk-specific path.
- Verdict: **Under-delivers — metadata role.** 02's own research flags a possible model-pin
  mismatch (topo `model:'auto'` vs profile `openrouter/meta-llama/...`, `02_*/00_PROFILE.md:24`)
  — flag as **[INFERRED]** discrepancy; other identical agents report the pin IS applied by
  `normalizeAgentIdentity:104-105`. Specialization never drives behavior.

### 03 — agent-ethics — Elena Marchetti (Ethics Officer)

- Purpose: fairness/transparency/bias/accountability review.
- Capabilities: nvidia/`meta/llama-3.3-70b-instruct` pin applied at runtime
  (`03_*/00_PROFILE.md:25-30`); `tools:[]`; `Analytical` audit group
  (`prompt-audit-service.ts:29`).
- Systems: shared set; no ethics-specific path.
- Verdict: **Pure declarative node.** Zero bespoke code (grep → only profile+topology+audit,
  `03_*/00_PROFILE.md:43`). Role = one prompt sentence + metadata.

### 04 — agent-architect — Marcus Hale (System Architect)

- Purpose: scalability / modularity / architecture-trade-off reasoning.
- Capabilities: groq/`llama-3.3-70b-versatile`; `CODER_TOOLS`; node prompt on monolith vs
  microservices vs serverless (`topology-defaults.ts:183-193`).
- Systems: shared; note `architectureReviewService` is a **separate static analyzer**, not this
  agent (`04_*/00_PROFILE.md:34`).
- Verdict: **Identity only.** No `lens:security` (which lists `architecture` taskTypes,
  `lens-library.ts`) bound; persona topic-keyword driven.

### 05 — agent-security — Yara Haddad (Security Engineer)

- Purpose: threat modeling, AppSec, Zero Trust.
- Capabilities: nvidia/`meta/llama-3.3-70b-instruct`; `SECURITY_TOOLS`
  (`vulnerability_scan, code_audit, threat_model`, `topology-defaults.ts:9,194-205`).
- Systems: shared; only agent with a _declared_ security toolset (still metadata-decorative per
  ToolService absence — see §3).
- Verdict: **Best tooled of the 25, but tools are decorative** (no `vulnerability_scan` exists in
  `ToolService`, `05_*/02_CAPABILITIES.md`). Specialization still not persona-aware.

### 06 — agent-devops — Tomas Berg (DevOps Engineer)

- Purpose: CI/CD, IaC, reliability, observability, incident response.
- Capabilities: groq/`llama-3.1-8b-instant`; `CODER_TOOLS`; node prompt
  (`topology-defaults.ts:206-217`).
- Systems: shared; also Builder/workflow step target (but debate hook broken — emits
  non-existent `debate:start`, `06_*/00_PROFILE.md:54`).
- Verdict: **Under-delivers.** No infra/exe tool, persona topic-keyword only.

### 07 — agent-database — Priya Nair (Database Engineer)

- Purpose: schema/query/migration design, replication, ACID vs BASE.
- Capabilities: openrouter/`meta-llama/...`; declares `data_analysis, sql_executor` tools
  (`topology-defaults.ts:226`) — **[VERIFIED]** neither exists in `ToolService`
  (`tool-executor.ts:174-257`).
- Systems: shared.
- Verdict: **Decorative tools.** Pure persona + metadata; no SQL/lens.

### 08 — agent-perf — Leon Ortiz (Performance Engineer)

- Purpose: bottleneck detection, throughput/latency measurement, optimization.
- Capabilities: groq/`llama-3.3-70b-versatile`; declares `benchmark, profiler` tools
  (`topology-defaults.ts:231-241`) — not in any tool constant set.
- Systems: shared; shares groq/70B slot with network/architect/data/designer/po.
- Verdict: **Identity only.** No performance lens, no real tools, persona topic-keyword.

### 09 — agent-critic — Greta Lindqvist (Critical Auditor)

- Purpose: find weaknesses, fallacies, edge cases; concrete improvements.
- Capabilities: nvidia/`meta/llama-3.3-70b-instruct`; temp 0.1; `SECURITY_TOOLS`;
  `lens:critical` exists but **NOT bound** (`09_*/00_PROFILE.md:41-45`); `Analytical` group.
- Systems: shared; plus `r-critic` role template (unlinked, `role-service.ts:141-152`).
- Verdict: **Closest to a real function** (very low temp + critic prompt), but still
  specialization-blind in debate.

### 10 — agent-data — Sam Okafor (Data Scientist)

- Purpose: statistical/empirical analysis, correlation vs causation, forecasting.
- Capabilities: groq/`llama-3.3-70b-versatile`; `ANALYTICS_TOOLS`; `Analytical` group.
- Systems: shared; **NOT** wired to the separate Research Engine subsystem (grep → 0,
  `11_*/00_PROFILE.md:60`).
- Verdict: **Identity + tools metadata only.** No data lens, specialization ignored in debate.

### 11 — agent-research — Mira Castellan (Research Analyst)

- Purpose: literature review, synthesis, citations, evidence quality.
- Capabilities: openrouter/`meta-llama/...`; `SEARCH_TOOLS`; `Analytical` group;
  likely `cautious_scientist` persona via keyword overlap (`11_*/00_PROFILE.md:37`).
- Systems: shared; **not** referenced by Research Engine phase9 services.
- Verdict: **Decorative specialization.** Distinct from the research _subsystem_.

### 12 — agent-quality — Noah Ferreira (Quality Engineer)

- Purpose: test strategy, coverage gaps, quality gates.
- Capabilities: groq/`llama-3.1-8b-instant`; `CODER_TOOLS`; "Engineering" neighbourhood.
- Systems: shared.
- Verdict: **Identity only.** No QA lens, no test execution tool, specialization dormant.

### 13 — agent-creative — Indira Sun (Creative Visionary)

- Purpose: ideation, narrative, brand, lateral thinking.
- Capabilities: openrouter/`meta-llama/...`; temp 0.8 (open-ended); `Creative` audit group
  (`prompt-audit-service.ts:21-24`); `tools:[]`.
- Systems: shared.
- Verdict: **Decorative role.** No creativity lens exists; persona topic-keyword only.

### 14 — agent-designer — Kai Mendez (Product Designer)

- Purpose: user-centered design, interaction, visual hierarchy, accessibility.
- Capabilities: groq/`llama-3.3-70b-versatile`; `Creative` group; `tools:[]`.
- Systems: shared; `r-...Product Designer` role template unlinked (`role-service.ts:221`).
- Verdict: **Identity only.** No design lens/tools; specialization metadata.

### 15 — agent-content — Lena Petrova (Content Strategist)

- Purpose: clear/engaging/audience-appropriate content, SEO, structure.
- Capabilities: openrouter/`meta-llama/...`; `SEARCH_TOOLS`; `Creative` group.
- Systems: shared.
- Verdict: **Fully-provisioned node, zero agent-specific code** (`15_*/00_PROFILE.md:68-70`).

### 16 — agent-ux — Theo Nakamura (UX Researcher)

- Purpose: user behavior, pain points, evidence-based improvements.
- Capabilities: groq/`llama-3.1-8b-instant`; `SEARCH_TOOLS`; `Creative` group; `tools:[]`.
- Systems: shared.
- Verdict: **Pure topology node** (grep → only topo/profile/audit, `16_*/00_PROFILE.md:57`).

### 17 — agent-pm — Dana Whitfield (Project Manager)

- Purpose: milestone breakdown, dependency/resource planning, stakeholder comms.
- Capabilities: openrouter/`meta-llama/...`; `tools:[]`; `Management` group
  (`prompt-audit-service.ts:18-20`).
- Systems: shared.
- Verdict: **Identity + planning prompt only.** Note: earlier stale docs claimed model pin
  dropped; source confirms pin applied (`17_*/00_PROFILE.md:22`).

### 18 — agent-po — Sofia Romano (Product Owner)

- Purpose: requirements, backlog prioritization, scope trade-offs.
- Capabilities: groq/`llama-3.3-70b-versatile`; `tools:[]`; `Management` group.
- Systems: shared.
- Verdict: **Purely declarative node** (`18_*/00_PROFILE.md:58-59`). Overlaps heavily with pm/lead.

### 19 — agent-lead — Victor Soto (Team Lead)

- Purpose: guide dev, mentor, unblock, code-quality/velocity balance.
- Capabilities: nvidia/`meta/llama-3.3-70b-instruct`; `CODER_TOOLS`; `Management` group.
- Systems: shared; **never** auto-promoted to coordinator (`19_*/00_PROFILE.md:55`).
- Verdict: **No lead orchestration logic.** "Team Lead" exists only in prompt text + label.

### 20 — agent-writer — Clara Bengtsson (Technical Writer)

- Purpose: API/architecture/user-guide docs, tutorials.
- Capabilities: groq/`llama-3.1-8b-instant`; `SEARCH_TOOLS`; `Specialized` audit group
  (`prompt-audit-service.ts:30`); `r-tech-writer` role template unlinked (`role-service.ts:298`).
- Systems: shared.
- Verdict: **Generalist of the doc cluster**; overlaps the 5 `doc-*` agents with no coordinator
  (`20_*/00_PROFILE.md:58`).

### 21 — agent-doc-architect — Bianca Conti (Documentation Architect)

- Purpose: information architecture, taxonomy, standards for docs.
- Capabilities: openrouter/`meta-llama/...`; `tools:[]`; one of 5 doc-cluster nodes.
- Systems: shared; **no coordination subsystem** links the 5 doc agents
  (`21_*/00_PROFILE.md:33`).
- Verdict: **One of five near-identical doc nodes.** No taxonomy tool/lens.

### 22 — agent-doc-auditor — Felix Moreau (Documentation Auditor)

- Purpose: find doc errors/inconsistencies, cross-check vs code, reject mismatches.
- Capabilities: nvidia/`meta-llama/...`; temp 0.05 (near-deterministic, "rejection authority"
  prompt `topology-defaults.ts:408-419`); `tools:[]`; auto-classified `Documentation` audit
  domain (`prompt-audit-service.ts:46`).
- Systems: shared; judge archetype — participant only, never autonomous executor.
- Verdict: **Strongest single-purpose prompt of the 25**, but still a plain node.

### 23 — agent-doc-simplifier — Maya Lindholm (Documentation Simplifier)

- Purpose: clarify complex docs, remove jargon, restructure for readability.
- Capabilities: groq/`llama-3.1-8b-instant`; temp 0.3; `tools:[]`; `Documentation` audit domain.
- Systems: shared; grep → only topo+profile (`23_*/00_PROFILE.md:60-63`).
- Verdict: **Decorative role.** Behavioral overlap with writer/architect/checker.

### 24 — agent-doc-historian — Oscar Vilhelm (Documentation Historian)

- Purpose: changelog/context/lineage for docs.
- Capabilities: openrouter/`meta-llama/...`; temp 0.4; `tools:[]`; `Documentation` audit domain.
- Systems: shared.
- Verdict: **Metadata-only specialization** (`24_*/00_PROFILE.md:35`); no lineage subsystem.

### 25 — agent-doc-checker — Iris Tanaka (Consistency Checker)

- Purpose: consistency / cross-reference / validation of docs.
- Capabilities: nvidia/`meta/llama-3.3-70b-instruct`; `tools:[]`.
- Systems: shared; 5th doc-cluster node.
- Verdict: **Near-duplicate of doc-auditor/simplifier** with no coordination.

## 3. Cross-cutting findings

1. **Shared-infra reality [VERIFIED].** All 25 resolve through `AgentService.resolveAgent`
   (`agent-service.ts:337`) and execute via the same Debate/ConversationCore/Invocation paths.
   There is **no** `agent-*` source file, service, or contract for any of them (each grep
   returns only `agent-profiles.ts` + `topology-defaults.ts` + audit group).

2. **Decorative specializations [VERIFIED].** `specializations` arrays are used _only_ for UI
   display and Invocation expertise-matching (`invocation-engine-service.ts:163-173`), never for
   debate persona selection (`persona-selector.ts:251-309` scores topic keywords + side). So a
   "Network Engineer" debates identically to a "Creative Visionary" unless the topic happens to
   trigger a matching variant.

3. **Cognitive invisibility in debate [VERIFIED].** Debate emits zero cognitive events
   (`grep cognitive: src/kernel/services/debate-runtime` → 0). Agents are visible in ConversationCore
   (`COGNITIVE_STEP_COMPLETED`, `event-registry.ts:764`) but invisible during debates; the
   `cognitive:decision:made` event (`event-registry.ts:776`) is dead-at-consumer.

4. **Model-pin mismatch risk [VERIFIED/INFERRED].** Most nodes declare `model:'auto'` in
   `topology-defaults.ts`; `normalizeAgentIdentity` overwrites it with the profile pin
   (`topology-defaults.ts:104-105`). 02's research disputes this for risk; the mechanism is real
   but **fragile** — if any future refactor reads model from the node config instead of the merged
   profile, pins silently become `'auto'` (`24_*/00_PROFILE.md:30` OPINION).

5. **Tools are metadata, not capabilities [VERIFIED].** `SECURITY_TOOLS`, `ANALYTICS_TOOLS`,
   `CODER_TOOLS`, `SEARCH_TOOLS` are declared on nodes, but `ToolService` (`tool-executor.ts`)
   lacks `sql_executor`, `data_analysis`, `benchmark`, `profiler`, `vulnerability_scan`, etc.
   So agents _describe_ abilities they cannot exercise.

6. **Lens void [VERIFIED].** `lensIds:[]` is forced for every profiled agent
   (`topology-defaults.ts:106`). Existing lenses (`critical`, `security`, `economic`, …) are never
   auto-bound, even where semantically obvious (e.g., `lens:critical` ↔ agent-critic;
   `lens:security` ↔ agent-security/architect).

7. **Natural clusters exist only as metadata [VERIFIED].** Three readable groupings:
   - **Technical/core**: 01 network, 04 architect, 05 security, 06 devops, 07 database, 08 perf.
   - **Analytical**: 02 risk, 03 ethics, 09 critic, 10 data, 11 research (`prompt-audit-service.ts:25-29`).
   - **Management**: 17 pm, 18 po, 19 lead (`prompt-audit-service.ts:18-20`).
   - **Creative**: 13 creative, 14 designer, 15 content, 16 ux (`prompt-audit-service.ts:21-24`).
   - **Documentation**: 20 writer + 21-25 doc-* (`prompt-audit-service.ts:30` + `startsWith('agent-doc-')`).
     None of these clusters has a runtime coordinator, group seed, or shared service.

8. **Identity is split across two files [VERIFIED].** `AGENT_PROFILES` (provider/model/avatar/specs)
   vs `topology-defaults.ts` (prompt/label/roleName) — drift risk noted by 24/OPINION.

## 4. Top 10 systemic opportunities (cross-agent)

1. **Specialization-aware persona mapping.** Feed `specializations` into `PersonaSelector`
   (`persona-selector.ts:251`) so a Network Engineer biases to `technologist`/`cautious_scientist`
   and a Critic to `critic` — without 25 bespoke agents. **[OPINION, high-leverage]**

2. **Bind existing lenses by specialization.** Auto-attach `lens:critical`→critic, `lens:security`→
   security/architect, at `normalizeAgentIdentity` — reuse, no new lenses. **[INFERRED]**

3. **Make tools real or drop them.** Either implement `sql_executor`/`vulnerability_scan`/etc. in
   `ToolService`, or stop advertising them — today they are misleading metadata. **[OPINION]**

4. **Unify the 6 documentation agents into one "Doc Agent" + mode flag.** 20-25 overlap heavily
   with no coordination (`20_*/00_PROFILE.md:58`); a single node with `mode:
architect|auditor|simplifier|historian|checker|writer` collapses 6 near-duplicate nodes.
   **[OPINION]**

5. **Collapse Management trio (pm/po/lead) into one PM node + perspective param.** They share one
   topology trio and one audit group; distinct spins can be prompt-parameters, not 3 agents.
   **[OPINION]**

6. **Emit `COGNITIVE_STEP_COMPLETED` from debate turns** (mirror ConversationCore) for unified
   stats/journal with **zero new event types** (`01_*/07_COGNITIVE_ROLE.md:27`). **[INFERRED]**

7. **Revive `cognitive:decision:made` consumer** in `AgentJournalService` (currently dead,
   `event-registry.ts:776`) to log agent decisions. **[INFERRED]**

8. **Seed AgentService groups for the 5 natural clusters** (Technical/Analytical/Management/
   Creative/Documentation) so `executeGroup` (`agent-service.ts:688`) can run them as teams without
   per-agent code. **[OPINION]**

9. **Single "agent capability profile" schema** lifted to `agent-profiles.ts` (merge identity +
   prompt + tools + lensIds + debate-persona-hint) to eliminate the two-file drift
   (`24_*/00_PROFILE.md:30`). **[OPINION]**

10. **Expertise-matched Invocation policies.** The engine already supports role/expertise targets
    (`invocation-engine-service.ts:163-173`) but no policy/UI wires them — enable auto-routing by
    specialization instead of human-pick-only. **[INFERRED]**

## 5. How to read the per-agent folders

Each `NN_agent-*/` folder holds 16 research files (`00_PROFILE.md` … `15_DO_NOT_BUILD_YET.md`):

- `00_PROFILE.md` — canonical identity + topology wiring + systems that can invoke it.
- `02_CAPABILITIES.md` — EXISTS/USED/UI capability matrix with flags (EXISTS-BUT-UNUSED, etc.).
- `03_SERVICES_AND_INTEGRATIONS.md`, `04_DEBATE_ROLE.md`, `05_CONVERSATION_ROLE.md`,
  `06_INVOCATION_ROLE.md`, `07_COGNITIVE_ROLE.md` — per-system behavior.
- `08_MEMORY_AND_CONTEXT.md`, `09_UI_UX.md`, `10_PROBLEMS_AND_LIMITATIONS.md`,
  `11_OPPORTUNITIES.md`, `12_FUTURE_AGENT_CONCEPT.md`, `13_ROADMAP.md`,
  `14_ALTERNATIVE_ROADMAP.md`, `15_DO_NOT_BUILD_YET.md` — analysis & recommendations.

All are **research artifacts**, not code. Citations inside point back to `src/` `file:line` and are
tagged VERIFIED/INFERRED/OPINION. This master map is the cross-agent synthesis; files `26_` and
`27_` build on it.
