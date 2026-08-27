# 10_PROBLEMS_AND_LIMITATIONS — Concrete, VERIFIED problems

> Every item cites file:line. No fabrication.

1. **"Fallacy Detection" is a fiction.** The specialization string exists (`agent-profiles.ts:110`) but no code performs fallacy classification, scoring, or structured output. The model is merely _asked_ in the prompt (`topology-defaults.ts:250`). **Severity: High** — the agent's headline capability is unbacked.

2. **`lens:critical` is orphaned.** The critical lens (`lens-library.ts:11-41`) is never bound to the critic; grep `lensIds` in `agent-profiles.ts` → 0 matches; `normalizeAgentIdentity` sets `lensIds=[]` (`topology-defaults.ts:106,111`). **Severity: Medium** — duplicated "critical" concept, zero reuse.

3. **Debate participation is invisible to memory/stats/journal.** Debate emits no `COGNITIVE_STEP_COMPLETED` (grep: no emit in `debate-runtime/`). So when the critic red-teams in a debate, it accrues **no stats, no journal, no memory** (`agent-service.ts:184`, `agent-journal-service.ts:150`, `memory-engine.ts:181` all key off that event). **Severity: High** — the agent's most natural role leaves no trace.

4. **Persona assignment ignores identity.** `persona-selector.ts:251-290` selects variant by topic keywords + debate role, never consulting the agent's specializations or `Critical Auditor` role. A critic can be assigned the "Passionate Advocate" or "Optimistic" variant, contradicting its persona. **Severity: Medium.**

5. **No critique routing in ConversationCore.** Director `Scenario` turns have no `CRITIQUE`/`REVIEW` objective type; the critic is just another participant (`conversation-director-service.ts`, `HybridPolicy`). **Severity: Medium** — missed structured-opportunity.

6. **Profile/role/node triple redundancy, no link.** `AGENT_PROFILES['agent-critic']` (`agent-profiles.ts:102`), `role-service.ts:141-152` (`r-critic`), and the topology node (`topology-defaults.ts:245`) are three separate definitions with no enforced consistency. Editing one silently diverges from the others. **Severity: Low/Medium.**

7. **`COGNITIVE_DECISION_MADE` is dead.** Defined (`event-registry.ts:776`) but no consumer acts on it; the critic could emit "I reject this claim" decisions but nothing records them. **Severity: Low.**

8. **Stats are topology-only and thus skew.** `AgentService` stats for the critic only grow from topology runs; heavy debate/critique usage is invisible in `getTopAgents` (`agent-service.ts:296-304`). **Severity: Medium** — misleads analytics.

9. **No critique output schema.** The critic returns free text; downstream (aggregator, forum, memory) cannot parse claim/fallacy/severity. **Severity: Medium** — blocks all structured reuse.

10. **Model pin creates hidden coupling.** `normalizeAgentIdentity` overwrites `model:'auto'` with the profile's `meta/llama-3.3-70b-instruct` (`topology-defaults.ts:105`). If that nvidia model is unavailable, the critic silently fails while siblings on `auto` fail over. **Severity: Low/Medium** (depends on provider health).
