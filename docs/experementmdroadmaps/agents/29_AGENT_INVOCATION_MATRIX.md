# 29 — AGENT INVOCATION MATRIX

> Synthesis of _who can invoke whom, and in what situations_, grounded strictly in the **existing** Invocation Engine (`phase21-invocation.ts`), `AgentResolverDirectory`, the seeded `Manual Room Chat` policy, and `RoomPanel`. Read-only. No expansion of the Invocation Engine is proposed — it is reused as-is.
>
> Source: `src/kernel/service-registration/phase21-invocation.ts` (engine + default policy), `src/kernel/services/invocation/invocation-engine-service.ts` (aggregate, D7), `RoomPanel.tsx`, `AGENTS.md` Step 6 notes.

---

## 1. The invocation machinery (VERIFIED)

- **Single write path.** Every invocation is created by `invocationEngine.invoke(req)` (`phase21-invocation.ts:151-167`). The Engine is the **sole owner** of the `Invocation` aggregate (D7, `phase21-invocation.ts:7`). Nothing else writes it.
- **The Engine does NOT execute agents** (D5, `phase21-invocation.ts:8-12`). It policy-gates, then hands off to existing subsystems via `InvocationExecutionDelegate`:
  - `mode === 'debate'` → `debateService.startDebate(...)` with all participants forced to `role:'neutral'` (`phase21-invocation.ts:75-87`).
  - `mode === 'chat' | 'director-scenario'` → `scenarioRepository.create(...)` with one `INTRODUCE` turn per agent → `conversationDirectorService.loadScenario` + `.run()` (`phase21-invocation.ts:89-108`).
- **Target resolution from the request, not the policy.** `InvocationEngineService` resolves agents from `req.target` (`AGENTS.md` Step 6 "Manual Room invocation policy": "actual target resolution is performed from `req.target`"; `matches()` gates only on `match.source/event/expertise`). Non-registered ids are rejected by `resolveAgents` (`AGENTS.md` Step 6).
- **Agent directory.** `AgentResolverDirectory` wraps `agentService` and exposes `specializations` on each agent (`phase21-invocation.ts:44-57`) — this is the seam that makes expertise-match invocation possible.
- **Policy gating.** The default seeded policy `Manual Room Chat (human-selected agent)` matches **only** `source: 'human-mention'` and lets the human pick _any registered agent_; `actions.target` is a deliberately unused placeholder (`phase21-invocation.ts:125-144`).

## 2. The RoomPanel request shape (VERIFIED)

`RoomPanel` translates human choices into an `InvocationRequest` (`AGENTS.md` Step 6 human-facing rework):

- **Agent picker** → `target.agentId` (resolved from `agentService.getAgents()`).
- **Where picker** (💬 This room / 📋 Forum topic / 🗨️ Conversation) → `context.type` (ref `'general'`).
- **Mode picker** (💬 Chat / ⚔️ Debate / 🎬 Scenario) → `constraints.mode`.
- **Task textarea** → `reason`.
  This is the **only** UI surface that produces invocations today. There is no programmatic auto-invoker wired to expertise-match in the UI (the expertise-match policy exists but is UI-hidden — `AGENTS.md` shared context).

---

## 3. Natural invocations (human → specialist)

"Natural" = a human has a question/task and picks the specialist best suited to it from the dropdown. All are permitted by the `human-mention` policy. (Role/agent pairs from `agent-profiles.ts:21-272`.)

| Situation (human need)                   | Invoked agent                                         | Mode   | Why natural (specialization)                   |
| ---------------------------------------- | ----------------------------------------------------- | ------ | ---------------------------------------------- |
| "Explain our network topology risk"      | `agent-network`                                       | chat   | TCP/IP, SDN, Latency Optimization (`:30`)      |
| "Quantify the risk of this launch"       | `agent-risk`                                          | chat   | Risk Modeling, Monte Carlo, Compliance (`:40`) |
| "Is this decision ethically defensible?" | `agent-ethics`                                        | chat   | Ethical Reasoning, Bias Audit (`:50`)          |
| "Review this architecture for scale"     | `agent-architect`                                     | chat   | Distributed Systems, Scalability (`:60`)       |
| "Threat-model this feature"              | `agent-security`                                      | chat   | Threat Modeling, AppSec, Zero Trust (`:70`)    |
| "Set up CI/CD review"                    | `agent-devops`                                        | chat   | CI/CD, Kubernetes (`:80`)                      |
| "Tune this SQL query"                    | `agent-database`                                      | chat   | SQL Tuning, Replication (`:90`)                |
| "Profile this bottleneck"                | `agent-perf`                                          | chat   | Profiling, Caching, Load Testing (`:100`)      |
| "Audit this argument for fallacies"      | `agent-critic`                                        | chat   | Fallacy Detection, Logic (`:110`)              |
| "Forecast demand from this data"         | `agent-data`                                          | chat   | Statistics, Forecasting (`:120`)               |
| "Summarize the literature on X"          | `agent-research`                                      | chat   | Literature Review, Citations (`:130`)          |
| "What test gaps exist?"                  | `agent-quality`                                       | chat   | Test Automation, Coverage (`:140`)             |
| "Draft a product narrative"              | `agent-creative`                                      | chat   | Ideation, Narrative (`:150`)                   |
| "Review the UX of this flow"             | `agent-ux`                                            | chat   | User Research, Usability (`:180`)              |
| "Write the API docs"                     | `agent-writer`                                        | chat   | Documentation, API Docs (`:220`)               |
| "Validate doc consistency"               | `agent-doc-checker`                                   | chat   | Consistency, Cross-Reference (`:270`)          |
| Adversarial "war-game" on a proposal     | `agent-security` + `agent-critic`                     | debate | Red-team vs Critic (`:70`,`:110`)              |
| "Hold a design review debate"            | `agent-architect` + `agent-security` + `agent-critic` | debate | Secure-design triad (see doc 28 §3.2)          |

**Bottom line (VERIFIED + INFERRED):** because the Manual Room policy permits _any registered agent_, the realistic invocation graph is a **complete bipartite graph**: every human → every agent. The "matrix" of _who invokes whom_ is therefore not a constraint problem but a **discoverability** problem (helping the human pick the right specialist). That is a UI concern, not an engine concern.

---

## 4. Invocations that are NOT needed (anti-patterns)

- **Agent → agent spontaneous chains.** Explicitly forbidden by design: D3 (managed call chains — an agent may _request_ another only via the engine, never agent→agent) and D6 (human authority; agents never self-invoke). `phase21-invocation.ts:137` seeds `allowAgentInitiatedInvocation:false`. There is **no** code path where one agent autonomously invokes another (VERIFIED — the delegate only ever runs _human-authored_ `req.target`).
- **Policy that _defines_ the target.** `policy.actions.target` is intentionally unused for resolution (`phase21-invocation.ts:123`, `AGENTS.md` Step 6 open question). A policy should **permit/constrain the type of call** (source, event, expertise), never hard-pick the agent — that is the human's job in RoomPanel. Building target-defining policies would duplicate RoomPanel's picker and break D6.
- **Per-agent dedicated invocation endpoints.** Unnecessary: the single `invoke(req)` + `AgentResolverDirectory` already routes to any agent. Adding 25 bespoke endpoints would violate the "no new facades" rule (`phase21-invocation.ts:10-12`).
- **Spontaneous expertise-match auto-invocation in the runtime.** The expertise-match _policy_ exists but is UI-hidden on purpose — surfacing it as automatic invocation would risk D6 violations and surprise agent chains. Keep it as a _suggestion_ source for RoomPanel, not an auto-firer.

---

## 5. Policies needed (reuse, do not extend the engine)

1. **`Manual Room Chat (human-selected agent)`** — EXISTS (`phase21-invocation.ts:125-144`). Permits any registered agent for `source:'human-mention'`. This is sufficient for 100% of current human→agent invocations. **No change needed.**
2. **`expertise-match` (UI-hidden suggestion)** — EXISTS in the engine's matching logic (`matches()` supports `match.expertise`); only the RoomPanel UI toggle is hidden (`AGENTS.md` shared context). Recommended: surface it as a _"suggested agents for this task"_ helper in RoomPanel, still requiring the human to confirm (preserves D6). **No engine change.**
3. **Optional topic/role policies (future, declarative only).** Example: a `debate:verdict:generated`-triggered policy that invites `agent-critic` as a post-consensus sanity gate (`agent-critic/04_DEBATE_ROLE.md:35`). These are _data_ entries in the `invocationPolicies` Dexie table (`AGENTS.md` Step 2), not code. **Reuse the existing policy registry.**

**What is explicitly OUT of scope (VERIFIED by design):** expanding `InvocationEngineService` with new execution modes, new buses, or agent-initiated chains. The engine is the sole `Invocation` writer and a thin dispatch layer — that is its strength (`phase21-invocation.ts:7-13`).

---

## 6. Recommendations (OPINION)

1. **Don't grow the engine — grow RoomPanel's guidance.** The invocation matrix is complete; the value is in _recommending_ the right agent (leverage the already-exposed `specializations` from `AgentResolverDirectory`, `phase21-invocation.ts:44-57`).
2. **Surface the expertise-match policy as a suggestion widget**, not an auto-invoker, to respect D6.
3. **Keep `allowAgentInitiatedInvocation:false`** for all seeded policies; agent→agent chains remain architecturally disallowed.
4. **Add declarative topic policies** (e.g., "any debate on a security topic auto-invites `agent-security` as a neutral reviewer") as pure data in `invocationPolicies` — zero engine code.

_All recommendations reuse the existing Invocation Engine. No new framework is proposed. Final decision rests with the human._
