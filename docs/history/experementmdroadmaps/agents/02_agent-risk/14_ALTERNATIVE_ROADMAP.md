# 14_ALTERNATIVE_ROADMAP — second philosophy

Two viable philosophies for maturing `agent-risk`. Roadmap A (13) is **Specialist-first**:
deepen the single Risk Analyst's quantitative/compliance competence via memory + tools + debate
fit. This alternative is **System-agent-first / Collaboration-orchestration**: make agent-risk a
_router of risk expertise_ across the workforce rather than a solo calculator.

## Philosophy B — "Risk Orchestrator" (collaboration-first)

- Idea: agent-risk rarely computes alone; instead it _decomposes_ a risk question and delegates
  sub-analyses to other agents (agent-security for threat, agent-data for stats, agent-legal for
  compliance, agent-ethics for norms), then synthesizes. This leans on existing `AgentService.executeGroup`
  (consensus/pipeline patterns, agent-service.ts:688-762) and the Invocation `handleAgentRequest`
  seam (invocation-engine-service.ts:124) — but note D6 forbids agent self-invocation, so the
  orchestration must be human-initiated or policy-gated.
- Trade-offs vs A:
  - **Pro:** avoids building a heavy solo quantitative engine; reuses the 25-agent workforce;
    more robust (ensemble) risk calls.
  - **Con:** higher latency/cost (many agents); depends on other agents being competent; the
    "Risk Analyst" becomes a coordinator, not the expert — risks diluting identity (P1).
  - **Risk:** orchestration loops, cost blow-up, hard to attribute a risk score to one agent.

## Philosophy C — "Deep-expertise" (Specialist-first, the chosen A)

- Already detailed in 13. agent-risk becomes a genuinely quantitative solo analyst.
- Trade-offs vs B:
  - **Pro:** clear ownership, reproducible, cheap per call, directly fulfills the profile promise.
  - **Con:** relies on tool sandboxing (B2) and model pin (P2); if the model is weak, solo math is weak.

## Recommendation (OPINION)

- **Hybrid:** Phase 0–2 follow A (cheap, high-value, fixes real bugs). Phase 3+ can add B's
  _collaboration_ as an _optional_ "Risk Review" Director scenario (M4/2.3) that ensembles
  agent-risk + security + data + legal — getting B's ensemble benefit without making agent-risk
  permanently a coordinator. Keep agent-risk as the **synthesizer/owner** of the risk call, not
  a pure router. This respects D6 (human authority) and avoids premature orchestration infra.

## Decision drivers

- If the priority is **correctness at low cost** → A (Specialist-first).
- If the priority is **coverage across domains now** → B (Orchestration), accepting cost/latency.
- Given existing infra (executeGroup, Director scenarios, Invocation delegation) both are feasible
  with reuse; the differentiator is whether to invest in a `risk_model` tool (A) or in
  multi-agent risk scenarios (B). A's tool investment pays off for every future quantitative agent.
