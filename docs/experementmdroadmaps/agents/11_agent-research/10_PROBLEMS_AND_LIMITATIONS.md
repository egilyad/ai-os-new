# 10 — PROBLEMS AND LIMITATIONS (concrete, VERIFIED)

1. **Specializations are decorative.** `Literature Review / Synthesis / Citations` (`agent-profiles.ts:130`) are free-text; no service consumes them. The agent cannot actually cite, review literature, or structure a synthesis beyond what the LLM improvises from the prompt.
   - Evidence: `agent-profiles.ts:130`; no code references these strings for behavior.

2. **No lens attached.** `normalizeAgentIdentity` forces `lensIds:[]` (`topology-defaults.ts:106`). The agent never benefits from `lens:critical`/`meta-uncertainty` even though those lenses exist (`lens-library.ts`). Its "critical synthesis" potential is untapped.

3. **Disconnected from the real Research Engine.** The phase9 `researchRunService`/`researchEngine`/`geminiResearchService` (`services-extras.ts:103-140`) do **not** use `agent-research` (grep: 0 matches in `research-run-service.ts`). Two "research" concepts exist side-by-side with no link.

4. **Disconnected from Knowledge/Crystal/Synthesis.** No reference to `agent-research` in `knowledge-generator-service.ts`, `crystal-vault-service`, `synthesis-engine-service.ts` (verified by grep). The agent cannot feed or consume structured knowledge.

5. **`cognitive:decision:made` is DEAD for it (and everyone).** Emitted at `cognitive-service.ts:414`, but no consumer and explicitly dropped by `event-recorder.ts:232,261`. Any decision visibility about this agent is impossible via that event.

6. **Debate turns are invisible to the cognitive stream.** Debate emits no `COGNITIVE_*` events (verified: `debate-agent-executor.ts` only emits debate/budget events). So agent-research's debate reasoning never appears in cognitive traces/journals-from-cognitive — only via the separate `agent-journal-service` debate-error listener.

7. **Amnesic across invocations.** It does not load its own journal/past debates/crystals at turn time. Each run starts cold (see 08).

8. **Search tools unverified.** `SEARCH_TOOLS = ['web_search','summarize','document_query']` (`topology-defaults.ts:10`) are declared but whether they resolve to a live `web_search` adapter for this node is not established by topology/profile alone. The "research" label may over-promise vs. actual tool access.

9. **No scheduled/auto invocation.** Only the `human-mention` policy exists (`phase21-invocation.ts:125-144`); expertise-match and schedule triggers (D2) are designed but not implemented for this agent.

10. **Generic persona only.** Debate persona is keyword-matched (`persona-selector.ts`); there is no research-domain-specific persona guaranteed. On non-research topics it may receive an unrelated persona (e.g. `technologist`).

11. **Stats conflate cognitive + provider.** `AgentService` mixes `COGNITIVE_STEP_COMPLETED` (node-level) and `STREAM_END` (key/provider-level) stats (`agent-service.ts:184-244`) into the same map keyed differently (`nodeId` vs `key:`/`provider:`). Per-agent research productivity metrics are coarse.

12. **Avatar/identity is hardcoded in `AGENT_PROFILES`** — editing requires code change; the UI `AgentIdentityEditor` can override per-node but the canonical seed is static (`agent-profiles.ts:122-131`).
