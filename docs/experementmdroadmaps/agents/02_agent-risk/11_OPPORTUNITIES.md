# 11_OPPORTUNITIES — wins for `agent-risk`

Each: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (UI/Config only, low risk)

**Q1 — Specialization chips on AgentCard**

- Desc: Render `specializations` (Risk Modeling/Monte Carlo/Compliance) as badges on AgentCard + RoomPanel picker.
- Value: Users instantly see what agent-risk is; sets correct expectation.
- Reuse: `AgentIdentityView.specializations` (agent-identity.ts), AgentCard.tsx.
- Effort: S. Risk: low. Deps: none. Infra: existing resolver. Why now: trivial, fixes P9.

**Q2 — Fix avatar to use curated profile**

- Desc: `AgentAvatar.getAgentAvatar` consults `AGENT_PROFILES`/AgentIdentityView before hash fallback.
- Value: consistent 📊/#ef4444 identity everywhere.
- Reuse: AGENT_PROFILES (agent-profiles.ts:37), agentAvatarService.
- Effort: S. Risk: low. Deps: none. Infra: existing. Why now: fixes P8.

**Q3 — Risk invocation Task hints**

- Desc: RoomPanel picker shows placeholder Task suggestions for agent-risk ("Score risk of…", "Monte-Carlo…", "Audit compliance of…").
- Value: guides humans to use the agent correctly.
- Reuse: RoomPanel.tsx, AGENT_PROFILES.specializations.
- Effort: S. Risk: low. Deps: none. Infra: existing. Why now: fixes P1 expectation gap.

**Q4 — Specialization-aware debate side**

- Desc: `debate-api.resolveParticipants` consults `AGENT_PROFILES.specializations` to default Risk Analyst → `con`/`neutral` (not positional `i%3`).
- Value: Risk Analyst always casts as critic/auditor — semantically correct debates.
- Reuse: debate-api.ts:307, agent-profiles.ts.
- Effort: S–M. Risk: low (additive, keep fallback). Deps: none. Infra: existing. Why now: fixes P3 (highest-value debate fix).

**Q5 — Surface cognitive:decision:made**

- Desc: Wire a consumer for the already-emitted `cognitive:decision:made` (cognitive-service.ts:414) into AgentObservabilityTab / a risk badge.
- Value: risk "decisions" become visible instead of dropped.
- Reuse: existing event + CognitiveDecisionSchema; event-recorder skip removed or a new consumer added.
- Effort: S. Risk: low (read-only consumer). Deps: none. Infra: existing event. Why now: fixes P6 with zero new events.

## 5 MEDIUM (wiring existing pieces)

**M1 — Risk persona variant**

- Desc: Add `risk_analyst` variant to persona-selector.ts with risk/compliance keywords; suitableRoles con/neutral.
- Value: deliberate risk framing in debates.
- Reuse: persona-selector.ts VARIANTS pattern; aligns with lens:security `category:'risk'`.
- Effort: M. Risk: low. Deps: Q4 optional. Infra: existing selector. Why now: fixes P4.

**M2 — Auto-load agent memory into turns**

- Desc: In `resolveAgent`/`ChatExecutor` path, attach `memoryService.query({agentId:'agent-risk'})` as systemContext.
- Value: agent recalls prior risk reviews → compounding expertise.
- Reuse: episodic/semantic stores (agentId filter), resolveAgent seam (agent-service.ts:337).
- Effort: M. Risk: med (context size, caps). Deps: memory engine. Infra: existing. Why now: fixes P5.

**M3 — Auto-journal risk decisions**

- Desc: On debate argument / cognitive:decision:made for agent-risk, write JournalEntry via agentJournalService.
- Value: persistent, browsable risk log in AgentJournalPanel.
- Reuse: agent-journal-service.ts, AgentJournalPanel.tsx.
- Effort: M. Risk: low. Deps: Q5. Infra: existing. Why now: fixes P5 journaling.

**M4 — Pre-built "Risk Review" Director scenario**

- Desc: Seed a ConversationScenario (agent-risk + architect + security) in ScenarioRepository; one-click launch from RoomPanel/ConfigureTab.
- Value: humans get agent-risk in its natural multi-agent role instantly.
- Reuse: ScenarioRepository.create (B5.3), Director run (B5.4c), RoomPanel.
- Effort: M. Risk: low. Deps: none. Infra: existing Director. Why now: unlocks 05 scenarios.

**M5 — Risk summary widget in AgentDetailPanel**

- Desc: Show last risk assessment / open risk items / compliance coverage from memory+journal+decisions.
- Value: agent-risk becomes a dash-board, not a name.
- Reuse: AgentDetailPanel.tsx, memory (M2), journal (M3), decisions (Q5).
- Effort: M. Risk: med. Deps: M2/M3/Q5. Infra: existing UI. Why now: closes P9 + gives ROI visibility.

## 3 BIG IDEAS (strategic, still reuse-first)

**B1 — Risk as a cross-cutting "assurance" layer**

- Desc: A lightweight `risk-advisor` hook (NO new agent) that, given any debate/conversation output, asks agent-risk (via existing Invocation) to score probability×impact and emit a `risk:assessed` _decision_ (reuse cognitive:decision:made payload shape). Surfaced as a badge on DebateRuntimePanel/Director.
- Value: every major decision gets a risk overlay from the existing Risk Analyst.
- Reuse: Invocation (phase21), cognitive event, DirectorStore/debate UI. Effort: L. Risk: med. Deps: Q5/M4. Infra: existing. Why now: turns identity into system value.

**B2 — Monte-Carlo / Compliance as tool calls, not prompts**

- Desc: Bind `ANALYTICS_TOOLS` + a new `risk_model` tool (a thin wrapper calling an existing stats lib or a prompt-to-code) actually invoked by the executor when agent-risk's turn requests quantification. Output stored as semantic memory.
- Value: real quantitative risk, not prose.
- Reuse: tool-execution path, semantic memory. Effort: L. Risk: med–high (tool sandboxing). Deps: executor tool support. Infra: existing tools contract. Why now: addresses P1 root cause.

**B3 — Scheduled risk sweeps**

- Desc: Reuse Scheduler (if exists) or a cron-like Director policy to invoke agent-risk on a topic set (e.g. "new regulatory changes") → crystals/forum announcements.
- Value: proactive compliance monitoring, not just reactive.
- Reuse: Invocation + crystal-debate-bridge + forum bridge. Effort: L. Risk: med. Deps: scheduler/policy. Infra: existing bridges. Why now: fixes P11.
