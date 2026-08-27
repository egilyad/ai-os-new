# 10_PROBLEMS_AND_LIMITATIONS — Concrete VERIFIED problems for `agent-data`

> Only concrete, source-backed problems. No fabrication.

1. **Specializations are inert in debate.** `persona-selector.ts:243-290` selects personas by topic keywords + role and never reads `agent.specializations`. Sam's ML/Statistics/Forecasting identity does not influence her debate persona — only the node `systemPrompt` (generic "data scientist") and topic luck do. `agent-data` can be cast as `passionate_advocate` for a "justice" topic despite being a statistician. (VERIFIED)

2. **No data/statistics lens assigned.** `normalizeAgentIdentity` sets `lensIds:[]` (topology-defaults.ts:106); the lens library has 11 lenses, none "data"/"statistics" (lens-library.ts). Sam never gets a lens badge or lens-driven transform. (VERIFIED)

3. **Journal stores raw nodeId, not display name.** `agent-journal-service.ts:135,161` writes `agentName: e.nodeId` ("agent-data"), so the AgentJournalPanel shows the id, not "Sam Okafor". (VERIFIED)

4. **`cognitive:decision:made` is dead.** Emitted at `cognitive-service.ts:414`; grep finds zero subscribers. Sam (and all agents) produce a decision event that no store/UI consumes. (VERIFIED)

5. **Brief's avatar claim is inaccurate.** `AgentAvatar.tsx:47 getAgentAvatar` is a deterministic hash fallback and does **not** read `AGENT_PROFILES`. The curated 🔬 comes from `node.config.avatar` via `normalizeAgentIdentity` (topology-defaults.ts:103) surfaced by `resolveAgentIdentity` (agent-identity.ts:102-114). Any consumer that forgets to pass `emoji` from the resolved identity will render Sam with a wrong glyph. (VERIFIED)

6. **No agent-scoped memory recall.** `memory-orchestrator.ts` supports `agentId`-filtered queries, but no caller queries memory by `agentId:'agent-data'`; Sam has no persistent, personalized context across sessions. (VERIFIED gap)

7. **Expertise-match invocation is UI-hidden.** `invocation-engine-service.ts:167-173` can match `target.expertise` to `agent-data.specializations`, but RoomPanel only supports free human pick — the match path is unreachable from UI. (VERIFIED)

8. **`AGENT_PROFILES` is build-time only.** Imported only in `topology-defaults.ts` + its test (grep). At runtime the profile is frozen into node config; editing `AGENT_PROFILES` requires a topology rebuild to take effect. (VERIFIED)

9. **Auto-spawn clones are generic copies.** `agent-service.ts:642-651` clones `sourceAgent.config` verbatim — a clone of Sam is indistinguishable from Sam except label; no specialization-aware differentiation. (VERIFIED)

10. **No research wiring.** No `src/kernel/**/research/**` module exists (grep); only `DebateSystemResearch.tsx` UI. Sam has zero research-subsystem integration despite "Data Scientist" framing. (VERIFIED N/A)
