# 11 — OPPORTUNITIES

Each item: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (UI/seed-only, hours)

- **Q1 — Bind lenses to agent-research.**
  - Desc: Set `lensIds:['lens:critical','lens:meta-uncertainty']` in `normalizeAgentIdentity` seed for `agent-research`.
  - Value: Its debate/conversation turns become automatically lens-augmented (critical + uncertainty framing) — directly serves "Synthesis/Citations".
  - Reuse: `resolveAgent` already returns `lensIds` (`agent-service.ts:386`); `agent-identity.ts:116` consumes.
  - Effort: S. Risk: Low. Deps: none. Infra: `topology-defaults.ts:106`. Why now: zero-cost, flips an EXISTS-but-unused asset on.
- **Q2 — Surface specializations in UI.**
  - Desc: Render `identity.specializations` as chips on `AgentCard`/`AgentDetailPanel`.
  - Value: User understands this is the research voice; aids agent selection.
  - Reuse: `resolveAgentIdentity` already returns `specializations` (`agent-identity.ts:135`).
  - Effort: S. Risk: Low. Deps: none. Infra: `AgentsPanel/*`. Why now: trivial UX clarity.
- **Q3 — "Research brief" quick-action in AgentDetailPanel.**
  - Desc: Button → opens RoomPanel pre-filled (Target=agent-research, Mode=Chat, Task template).
  - Value: One-click research invocation.
  - Reuse: `RoomPanel` invoke flow (`phase21-invocation.ts`), `agentService.getAgents`.
  - Effort: S. Risk: Low. Deps: RoomPanel. Infra: existing invocation. Why now: invocation already works.
- **Q4 — Auto-load prior journal into prompt.**
  - Desc: On invoke, seed system prompt with condensed `listByAgent('agent-research')`.
  - Value: Continuity; agent "remembers" past research.
  - Reuse: `AgentJournalService.listByAgent` (`agent-journal-service.ts:253`).
  - Effort: S–M. Risk: Low (prompt bloat). Deps: none. Infra: journal store. Why now: removes amnesic limitation (#7).
- **Q5 — Per-agent cognitive timeline tab.**
  - Desc: Reuse `LiveActivityStream` to show `COGNITIVE_STEP_*` for this node in `AgentDetailPanel`.
  - Value: See its reasoning activity in one place.
  - Reuse: `LiveActivityStream.tsx`, `EVENTS.COGNITIVE_STEP_COMPLETED`.
  - Effort: S. Risk: Low. Deps: none. Infra: cognitive events (already emitted). Why now: display-only, no new producer.

## 5 MEDIUM (weeks)

- **M1 — Research objective type in Director.**
  - Desc: Add `objective.type:'LITERATURE_REVIEW'`/`'CITED_SYNTHESIS'` to `TurnProposal` handling; agent-research is the natural owner.
  - Value: Structured, enforceable research outputs (citations schema).
  - Reuse: `conversation-director-service`, `TurnProposal` (B3/B5.3).
  - Effort: M. Risk: Med (schema change). Deps: contracts. Infra: Director. Why now: B5.3 editor exists.
- **M2 — Post-debate synthesis by agent-research.**
  - Desc: On `DEBATE_CONSENSUS`, offer agent-research to emit a cited synthesis → Crystal Vault.
  - Value: Turns debates into citable knowledge.
  - Reuse: `DEBATE_CONSENSUS` (`event-registry.ts:793`), Crystal `propose`/`crystallize`.
  - Effort: M. Risk: Med. Deps: Crystal Vault. Infra: event bridge. Why now: closes debate→knowledge gap.
- **M3 — Expertise-match invocation suggestion.**
  - Desc: Policy `source:'expertise'` that _suggests_ (not auto-runs) agent-research when topic matches its specializations.
  - Value: Humans discover the right agent faster (D2/D6 compliant).
  - Reuse: `phase21-invocation.ts` policy engine, `specializations` from `AgentResolverDirectory`.
  - Effort: M. Risk: Low. Deps: none. Infra: invocation. Why now: policy model already supports `expertise` match.
- **M4 — Tag research journal entries.**
  - Desc: Auto-tag `JournalEntry.tags` with `literature-review`/`synthesis` from objective type; enable `listByTag`.
  - Value: Filterable research history.
  - Reuse: `AgentJournalService.listByTag` (`agent-journal-service.ts:257`).
  - Effort: S–M. Risk: Low. Deps: M1 objective type. Infra: journal. Why now: pairs with M1.
- **M5 — Verify + wire SEARCH_TOOLS.**
  - Desc: Confirm `web_search` adapter resolves for this node; if not, bind a real adapter.
  - Value: Makes "research" real, not prompt-only.
  - Reuse: `SEARCH_TOOLS` (`topology-defaults.ts:10`), tool registry.
  - Effort: M. Risk: Med (adapter availability). Deps: tool infra. Infra: executor harness. Why now: removes over-promise (#8).

## 3 BIG IDEAS

- **B1 — Agent-research as the Knowledge Generator's analyst.** Wire it as the peer-reviewer/synthesizer inside `knowledge-generator-service` (currently lens-driven). Value: real autonomous research cycle with a named analyst. Reuse: generator + crystal + journal. Effort: L. Risk: Med. Deps: generator. Why now: generator exists, lacks a persona.
- **B2 — Cited Research Engine persona.** Let the phase9 Research Engine accept `agentId:'agent-research'` so its runs carry the research identity + journaling. Value: unifies the two "research" concepts. Reuse: `researchEngine`, `agentService`. Effort: L. Risk: Med. Deps: research engine refactor. Why now: eliminates the duplicate-research split (#3).
- **B3 — Persistent Research Memory (Crystal-backed).** Every synthesis agent-research produces is crystallized; future runs load relevant crystals as context. Value: genuine accumulating expertise. Reuse: Crystal Vault + journal. Effort: L. Risk: Med. Deps: Crystal. Why now: enables the "realized concept" in 12.
