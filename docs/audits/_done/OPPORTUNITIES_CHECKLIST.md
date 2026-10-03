# OPPORTUNITIES CHECKLIST — реализовано или нет

> Сгенерировано 2026-09-19 из `docs/history/experementmdroadmaps/` (21 agent `11_OPPORTUNITIES.md` + корневой `QUICK_WINS.md`).
> Всего пунктов: 164. Статус по умолчанию UNVERIFIED — сверять с кодом, отмечать `[x] DONE <коммит>` / `[ ] WONT (причина)`.

Легенда Effort: XS/S = часы, M = дни, L = недели, H = значение (doc-формат O1–O9).

## Effort XS

- [ ] **Q5** Attach `lens:security` to agent-network — `agents/01_agent-network/11_OPPORTUNITIES.md`
## Effort S

- [x] **QW-Q1** Scheduler → Invocation bridge — `QUICK_WINS.md` — DONE 2026-09-19: `phase21-invocation.ts:189 bridgeSchedulerToInvocation` (в коде пометка «Q1»)
- [x] **QW-Q5** Key-health AlertLayer — `QUICK_WINS.md` — DONE 2026-09-19: `AlertLayer.tsx:125` подписан на `KEY_COMPROMISED`
- [ ] **QW-Q8** ComingSoon stub hygiene — `QUICK_WINS.md`
- [ ] **Q1** Surface specializations on the agent card — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **Q2** Expertise-aware persona selection — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **Q3** Per-agent Journal tab in AgentDetailPanel — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **Q1** Specialization chips on AgentCard — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **Q2** Fix avatar to use curated profile — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **Q3** Risk invocation Task hints — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **Q5** Surface cognitive:decision:made — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **Q1** Tag journal entries with specializations — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **Q2** Specialization chips on AgentCard — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **Q4** Debate persona badge — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **Q1** Emit cognitive events from debate — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **Q2** Add `performance_engineer` persona variant — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **Q3** Tag journal entries with `performance` when actor is `agent-perf` — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **Q4** Honest tool state on AgentCard — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **Q1** Fix journal display name to "Sam Okafor" — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **Q2** Expose "Ask by expertise" in RoomPanel — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **Q3** Add "Statistics/ML/Forecasting" quick-ask buttons in AgentDetailPanel — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **Q4** Tag memory writes with `agentId` — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **Q1** Bind lenses to agent-research — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **Q2** Surface specializations in UI — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **Q3** "Research brief" quick-action in AgentDetailPanel — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **Q5** Per-agent cognitive timeline tab — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **Q1** Add `creative_visionary` + `brand_strategist` persona variants — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **Q2** Surface assigned persona on agent chip — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **Q3** Auto-tag journal entries with specializations — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **Q5** "Creative Council" debate preset — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **Q1** Add `design_critic` persona variant — `agents/14_agent-designer/11_OPPORTUNITIES.md`
- [ ] **Q2** Bind `specializations` into debate system prompt — `agents/14_agent-designer/11_OPPORTUNITIES.md`
- [ ] **Q3** Fix journal `agentName` + `tokensUsed` — `agents/14_agent-designer/11_OPPORTUNITIES.md`
- [ ] **Q4** Assign `lens:design` + `lens:critical` to design agents — `agents/14_agent-designer/11_OPPORTUNITIES.md`
- [ ] **Q5** Add a `design-role` Invocation policy + preserve design stance — `agents/14_agent-designer/11_OPPORTUNITIES.md`
- [ ] **Q1** Activate specializations for routing/persona (flag P1) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **Q2** Surface "Management" audit badge (flag P5) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **Q3** PM quick-action chips in RoomPanel (flag 09-1) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **Q4** Debate→journal bridge for PM (flag P4) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **Q5** Assign PM lenses via config (flag P7) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **Q1** "Coordinator" badge from specializations — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **Q2** Seed "Team Sync" Director template featuring agent-lead — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **Q3** Room policy that prefers lead for coordination intents — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **Q4** Lead step metadata tag in observability — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **Q5** Coordination memory tag — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **Q1** "Document" action in RoomPanel — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **Q2** Specialization-aware pre-select in RoomPanel — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **Q3** Documentation activity strip in AgentCard — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **Q5** Doc-expertise persona variant in `PersonaSelector` — `agents/20_agent-writer/11_OPPORTUNITIES.md`
## Effort S-M

- [ ] **QW-Q6** Room feed scoping + honest status — `QUICK_WINS.md`
- [x] **QW-Q9** Command palette extend — `QUICK_WINS.md` — DONE 2026-09-19: 10 actions в `CommandPalette.tsx` (коммит 9acf13c, AGEMS 7.3)
- [ ] **M3** Cognitive visibility in debate — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **M5** Networking agent group (pre-built team) — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **Q4** Expertise preset + policy in RoomPanel — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **Q4** Specialization-aware debate side — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **Q3** Room invocation presets for devops — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **Q5** Resurrect cognitive decision display — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **M4** Perf filter in AgentsPanel — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **Q5** "Profile this" quick action on card — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **Q5** Agent activity timeline tab — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **M4** Tag research journal entries — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **Q4** Auto-load prior journal into prompt — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **Q4** "Invoke for…" quick actions on AgentCard — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **Q4** Fix `COGNITIVE_DECISION_MADE` consumer (enables doc decisions later) — `agents/20_agent-writer/11_OPPORTUNITIES.md`
## Effort M

- [ ] **QW-Q10** Template marketplace persist + import — `QUICK_WINS.md`
- [x] **QW-Q2** Forum vote / pin / moderate UI — `QUICK_WINS.md` — DONE 2026-09-19: `ForumPanel.tsx:78,88,93` вызывает `moderatePost/votePost/pinTopic`
- [ ] **QW-Q3** Forum consensus → Debate escalation — `QUICK_WINS.md` — PARTIAL 2026-09-19: событие `forum:topic:escalated-to-debate` зарегистрировано в `event-registry.ts:1423`, consumer (getConsensus → invoke debate) не подтверждён
- [ ] **QW-Q4** Research phases expose — `QUICK_WINS.md`
- [ ] **QW-Q7** Director checkpoint persistence + history — `QUICK_WINS.md`
- [ ] **M1** Seed semantic memory for Nadia — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **M2** Read-before-speak memory injection — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **M4** Suggested debate side from topic — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **M1** Risk persona variant — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **M2** Auto-load agent memory into turns — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **M3** Auto-journal risk decisions — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **M4** Pre-built "Risk Review" Director scenario — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **M5** Risk summary widget in AgentDetailPanel — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **M1** Specialization-aware debate persona — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **M2** DevOps ops lens — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **M4** Expertise-matched debate seating — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **M5** AgentLiveBoard cognitive tab for devops — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **M1** Performance lens (`lens:performance`) — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **M2** Post-debate Crystal from `agent-perf` output — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **M3** Perf scenario templates in Director — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **M5** Room "performance review" preset — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **M1** Specialization-aware debate persona — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **M2** Agent memory tab (recall) — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **M3** Inject recent memories into Sam's system prompt — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **M4** "Data/Statistics" lens + assign to agent-data — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **M5** Repair/repurpose `cognitive:decision:made` — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **M1** Research objective type in Director — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **M2** Post-debate synthesis by agent-research — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **M3** Expertise-match invocation suggestion — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **M5** Verify + wire SEARCH_TOOLS — `agents/11_agent-research/11_OPPORTUNITIES.md`
- [ ] **M1** Specialization-aware persona bias — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **M2** Add a `lens:brand-voice` / `lens:ideation` lens — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **M3** Brand-voice Crystal continuity — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **M4** Agent-scoped creative memory view — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **M5** Router specialization hints — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **M1** UX Lens — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **M2** Usability heuristic scorer (debate decorator) — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **M3** UX memory namespace + pre-turn recall — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **M4** Revive `COGNITIVE_DECISION_MADE` for UX decisions — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **M5** UX outcome KPIs in stats — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **M1** Curated "PM Facilitation" Director scenario (flags 04/05) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **M2** Structured plan output → Crystal/Forum — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **M3** Add `FACILITATE`/`SUMMARIZE` objective types — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **M4** PM "recall last plan" context injection — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **M5** Expertise-aware RoomPanel hints — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **M1** Add `coordinator` tactical role to debate meta-agent — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **M2** HybridPolicy inserts lead synthesis turns — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **M3** "Coordination" tab in AgentDetailPanel — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **M4** Group "leader" execution pattern — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **M5** Revive `COGNITIVE_DECISION_MADE` for lead decisions — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **M1** Doc-source tool for grounding — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **M2** `documents` Dexie store + repository — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **M3** Post-debate auto-doc on `DEBATE_CONSENSUS` — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **M4** Documentation lens — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **M5** Documentation team/group + routing rule — `agents/20_agent-writer/11_OPPORTUNITIES.md`
## Effort M-L

- [ ] **M3** Devops-scoped runbook/incident memory — `agents/06_agent-devops/11_OPPORTUNITIES.md`
## Effort L

- [ ] **B1** Tool-enabled Network Engineer — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **B2** Expertise-routed Invocation Engine — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **B3** Living Network Knowledge Crystal — `agents/01_agent-network/11_OPPORTUNITIES.md`
- [ ] **B1** Risk as a cross-cutting "assurance" layer — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **B2** Monte-Carlo / Compliance as tool calls, not prompts — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **B3** Scheduled risk sweeps — `agents/02_agent-risk/11_OPPORTUNITIES.md`
- [ ] **B1** Real DevOps tool bridge — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **B2** Incident post-mortem autonomous workflow — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **B3** DevOps "expertise graph" across agents — `agents/06_agent-devops/11_OPPORTUNITIES.md`
- [ ] **B1** Real measurement harness behind `agent-perf` — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **B2** Perf observability dashboard (reuse, don't build new panel) — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **B3** Auto-invoke `agent-perf` on perf regressions (policy-gated) — `agents/08_agent-perf/11_OPPORTUNITIES.md`
- [ ] **B1** Resident Data Scientist (auto-invoked quant reviewer) — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **B2** Skill Graph from specializations — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **B3** Lens-driven quantified uncertainty layer — `agents/10_agent-data/11_OPPORTUNITIES.md`
- [ ] **B1** "Creative Director" meta-agent — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **B2** Brand-memory knowledge graph — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **B3** Lens-driven creative critique loop — `agents/13_agent-creative/11_OPPORTUNITIES.md`
- [ ] **Q1** UX-Review scenario template — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **Q2** "Run UX Review" quick action on AgentCard — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **Q3** UX `ux_researcher` persona variant — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **Q4** Specialization chips → Invocation prefill — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **Q5** Expertise-match suggestion policy — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **B1** "Program Manager" orchestration layer (realized, no new runtime) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **B2** PM decision ledger (revive `cognitive:decision:made`) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **B3** Agent-pm as default human-facing coordinator (see `12_FUTURE_AGENT_CONCEPT.md`) — `agents/17_agent-pm/11_OPPORTUNITIES.md`
- [ ] **B1** "Team Lead" as a first-class Coordination Agent — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **B2** Invocation "coordinate" mode — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **B3** Cross-agent mentoring memory graph — `agents/19_agent-lead/11_OPPORTUNITIES.md`
- [ ] **B1** "Doc-as-a-Product" pipeline — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **B2** Living Documentation that self-updates from crystals/code — `agents/20_agent-writer/11_OPPORTUNITIES.md`
- [ ] **B3** Agent-written docs as first-class Knowledge artifacts (Crystal-like) — `agents/20_agent-writer/11_OPPORTUNITIES.md`
## Effort H

- [ ] **B1** "User Advocate" standing role in debates — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **B2** Interview/Research synthesis pipeline — `agents/16_agent-ux/11_OPPORTUNITIES.md`
- [ ] **B3** Persistent User-Persona Memory — `agents/16_agent-ux/11_OPPORTUNITIES.md`
## Effort ?

- [ ] **O1** Grant grounding tools (fixes P1) — HIGH VALUE — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
- [ ] **O2** Documentation/Taxonomy lens + link (fixes P2) — MEDIUM — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
- [ ] **O3** Route doc-architecture tasks to it (fixes P3/P8) — MEDIUM — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
- [ ] **O4** Debate observability bridge (fixes P4) — MEDIUM — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
- [ ] **O5** Doc cluster pipeline (fixes P5) — HIGH — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
- [ ] **O6** Documents store + `document:*` events (fixes P6) — HIGH — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
- [ ] **O7** Director scenario "Doc Architecture from spec" (fixes P3) — LOW — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
- [ ] **O8** RoomPanel doc templates (fixes P3) — LOW — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
- [ ] **O9** Subscribe to `knowledge:crystal:formed` (fixes P6/P3) — MEDIUM — `agents/21_agent-doc-architect/11_OPPORTUNITIES.md`
