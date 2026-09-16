# 26_CROSS_AGENT_ARCHITECTURE — Duplication, Collaboration, and Shared-Service Lifting

> Research-only synthesis over the 25 agent folders + `src/`. Tags: **[VERIFIED]** (read in source /
> per-agent docs), **[INFERRED]** (reasoned from architecture), **[OPINION]** (recommendation).
> Companion to `00_AGENTS_MASTER_MAP.md`.

## 1. Duplication map — who overlaps whom

| Cluster                | Members                                                                      | Overlap evidence                                                                                                                                                                                                                                                      | Verdict                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Documentation (6)**  | 20 writer, 21 architect, 22 auditor, 23 simplifier, 24 historian, 25 checker | All 6 are router→node→aggregator leaf workers with `tools:[]` and no cross-wiring (`20_*/00_PROFILE.md:45-58`, `21_*/00_PROFILE.md:33`). Auditor (temp 0.05, "reject" prompt) and Checker (consistency) and Simplifier (clarity) are **near-duplicates** of function. | **[OPINION]** Over-engineered: 6 nodes for what is 1 role + mode flags. |
| **Management (3)**     | 17 pm, 18 po, 19 lead                                                        | Same `Management` audit group (`prompt-audit-service.ts:18-20`), identical topology trio, one prompt sentence each. pm=planning, po=backlog, lead=mentoring — all "coordinate/deliver" spins.                                                                         | **[OPINION]** 3 nodes where 1 + prompt-param would do.                  |
| **Analytical (5)**     | 02 risk, 03 ethics, 09 critic, 10 data, 11 research                          | Same `Analytical` group (`prompt-audit-service.ts:25-29`); critic/risk/ethics all "find flaws/risk/bias"; data/research both "evidence/stats".                                                                                                                        | **[INFERRED]** Distinguishable only by system prompt, not machinery.    |
| **Creative (4)**       | 13 creative, 14 designer, 15 content, 16 ux                                  | Same `Creative` group (`prompt-audit-service.ts:21-24`); designer/content/ux overlap heavily on "user/clarity".                                                                                                                                                       | **[INFERRED]** Topic-keyword persona is the only differentiator.        |
| **Technical core (6)** | 01 network, 04 architect, 05 security, 06 devops, 07 database, 08 perf       | All `router→…→aggregator`; share groq/70B or nvidia pins; all `tools` decorative.                                                                                                                                                                                     | **[VERIFIED]** Structurally identical nodes.                            |

**Key duplication facts [VERIFIED]:**

- No agent has bespoke source: every `grep agent-<id>` returns only `agent-profiles.ts` +
  `topology-defaults.ts` (+ audit group). The duplication is **in data, not code** — 25 near-identical
  node definitions.
- The doc cluster is the worst offender: 6 nodes, 1 behavior (`AgentService` resolves them identically,
  `21_*/00_PROFILE.md:33`). Their only real differences are the system-prompt sentence and the
  `specializations` label — both cosmetic at runtime because persona selection ignores specializations
  (`persona-selector.ts:251-309`).

### 1.1 Deep-dive: the documentation cluster

- 20 writer (`topology-defaults.ts:382`) — generalist technical writer.
- 21 doc-architect (`:397`) — IA/taxonomy.
- 22 doc-auditor (`:408`) — temp 0.05, "reject any statement that does not match the system".
- 23 doc-simplifier (`:421`) — plain-language/clarity.
- 24 doc-historian (`:433`) — changelog/lineage.
- 25 doc-checker — consistency/cross-reference.
  All 6 share: `tools:[]`, `lensIds:[]`, `router→node→aggregator` edges, and the `Documentation` audit
  domain (`prompt-audit-service.ts:46` `startsWith('agent-doc-')`). **[VERIFIED]** The behavioral
  difference between auditor/checker/simplifier is entirely in the prompt text — three prompts that could
  be one node with a `mode` parameter. **[OPINION]**

### 1.2 Deep-dive: the management trio

- 17 pm (`topology-defaults.ts:345`) — "Break down work into milestones…".
- 18 po (`:357`) — "Define requirements, prioritize the backlog…".
- 19 lead (`:369`) — "Guide development, mentor… ensure code quality".
  These three plus the 6 doc agents + the 4 creative agents are the clearest cases of **role-spinning**:
  distinct labels whose runtime behavior is one generic node + a one-line prompt. **[OPINION]**

## 2. Natural pairs & trios (who should collaborate)

Collaboration here means "belong in the same `executeGroup` / debate / room session", because there is
**no agent→agent call** — the Invocation Engine forbids it (D3, `phase21-invocation.ts`); agents only
meet via Debate/ConversationCore/Director/Room. **[VERIFIED]**

- **Network + Architect + Security** — infra design with threat surface
  (`01_*/04_DEBATE_ROLE.md:31`). All Technical core.
- **Security + Risk + Ethics** — threat→risk→responsible-alternatives
  (`05_*/00_PROFILE.md:51`, `03_*/00_PROFILE.md:47`). Analytical + Technical.
- **Data + Research + Critic** — evidence → synthesis → fallacy-check (`10_*/00_PROFILE.md:50`).
- **PM + PO + Lead** — delivery planning (but see §1.2, could be 1 node).
- **Architect + DevOps + Perf + Database** — build/run/scale/data deployment chain
  (`06_*/00_PROFILE.md:40-46`).
- **Creative + Designer + Content + UX** — product surface ideation (`13_*/00_PROFILE.md:76-81`).
- **Writer + 5 doc-*** — doc production pipeline (`20_*/00_PROFILE.md:45-58`).

### 2.1 Collaboration matrix (strength of natural fit)

| Pair                 | Fit    | Why                                           |
| -------------------- | ------ | --------------------------------------------- |
| security ↔ risk      | Strong | STRIDE/DREAD vs probability/impact frameworks |
| security ↔ architect | Strong | threat surface vs scalable design             |
| network ↔ perf       | Strong | latency vs throughput budgets                 |
| data ↔ research      | Strong | stats vs literature/synthesis                 |
| critic ↔ ethics      | Strong | fallacy vs bias audit                         |
| po ↔ ux              | Medium | vision vs user evidence                       |
| devops ↔ quality     | Medium | pipeline vs test gates                        |
| writer ↔ doc-auditor | Strong | author vs reject-mismatch                     |

## 3. Natural debate teams

Debate persona is topic-keyword driven (`persona-selector.ts:251-309`), so "teams" are really
_topic-aligned participant sets_. Recommended pro/con/neutral casts **[OPINION]**:

- **"Migrate to service mesh?"** → pro: Architect; con: Security (east-west/attack surface) + Network
  (latency); neutral: Critic/PM. (`01_*/04_DEBATE_ROLE.md:31`)
- **"Is our protocol safe at 10x traffic?"** → pro: Perf; con: Security + Risk (Monte Carlo); neutral:
  Architect.
- **"Ship this AI feature?"** → pro: PO; con: Ethics + Critic; neutral: Research (evidence).
- **"Rewrite the docs?"** → pro: Doc-Architect; con: Doc-Auditor/Checker; neutral: Writer/Simplifier.
- **"New design system?"** → pro: Designer; con: UX (pain points); neutral: Content/Critic.

All run through the **same** `debate-agent-executor` — no agent-specific debate code. **[VERIFIED]**

## 4. Which agents should work via Invocation

The Invocation Engine (`phase21-invocation.ts`) wraps `agentService` via `AgentResolverDirectory` and
permits **any registered agent** under the seeded `Manual Room Chat (human-mention)` policy
(`phase21-invocation.ts:125-144`). **[VERIFIED]** So _all 25_ are Invocation-reachable from `RoomPanel`.

Special note: expertise/role-targeted invocation (`invocation-engine-service.ts:163-173`) exists in the
engine but **no policy/UI uses it** — only `human-mention` is seeded. **[INFERRED]** Enabling
expertise policies would let, e.g., "find me a risk expert" auto-resolve to agent-risk by
`specializations`, realizing the doc cluster's intended routing without new agents.

## 5. Which agents should see the Cognitive Event Stream

Cognitive events: `cognitive:trace:updated` (`:737`), `cognitive:step:active` (`:756`),
`cognitive:step:completed` (`:764`), `cognitive:decision:made` (`:776`) — `event-registry.ts`.
**[VERIFIED]**

- **Today:** only `AgentService` consumes `COGNITIVE_STEP_COMPLETED` (stats); debate emits none; the
  decision event is dead. `[VERIFIED]`
- **Should see it [OPINION]:** any agent acting as a _synthesizer/judge_ — Critic (09), Doc-Auditor
  (22), Doc-Checker (25), Risk (02), Ethics (03) — would benefit from a per-agent journal fed by these
  events (reuse `AgentJournalService`, `01_*/07_COGNITIVE_ROLE.md:25`). The stream is **agent-agnostic**
  already; no new event types needed, just consumers.
- **Debate visibility [INFERRED]:** emitting `COGNITIVE_STEP_COMPLETED` from `debate-agent-executor`
  (nodeId = participant.agentId) after each turn would make all debate participants visible in the same
  journal/stats as ConversationCore — one emit call, zero schema change.

## 6. Identical services used (the "shared substrate")

Every agent is resolved/executed by the **same** services **[VERIFIED]**:

- `AgentService` — `getAgents:306`, `resolveAgent:337`, `executeGroup:688`, `evaluateAutoSpawn:614`.
- `agent-identity.ts` (`resolveAgentIdentity:62`) — UI identity.
- `PersonaSelector` (`persona-selector.ts:251`) — debate persona (topic-keyword, no specialization).
- `ConversationOrchestrator` + `ChatExecutor` — ConversationCore/Director turns.
- `debate-agent-executor.ts` — debate turns.
- `AgentJournalService` — per-agent memory/journal.
- `phase21-invocation.ts` `InvocationEngineService` + `AgentResolverDirectory` — Room/Invocation.
- `prompt-audit-service.ts` — cosmetic `Analytical/Creative/Management/Documentation/Specialized` groups.

There is **no** service that differs per agent. The only per-agent variation is the _data_ in
`AGENT_PROFILES` / `topology-defaults.ts`.

## 7. What to lift to a shared/common level (avoid 25 bespoke impls)

Today each agent is "bespoke" only as **25 hand-written data blobs**. The fix is _not_ 25 services —
it is a **single shared capability model** plus small selector hooks. **[OPINION/INFERRED]**

1. **One `AgentCapabilityProfile` schema** (merge identity + prompt + `tools` + `lensIds` +
   `debatePersonaHint` + `cognitiveVisibility`) replacing the split `AGENT_PROFILES` ↔
   `topology-defaults.ts` duo (`24_*/00_PROFILE.md:30` drift risk). Normalize once.
2. **Specialization→Persona hint table** consumed by `PersonaSelector` (`persona-selector.ts:251`):
   map `specializations` → preferred variant (e.g. `TCP/IP`→`technologist`). One table, not 25 agents.
3. **Specialization→Lens auto-bind** at normalize (`topology-defaults.ts:106`): `critical`→critic,
   `security`→security/architect, `economic`→risk/po. Reuses existing lenses.
4. **Cluster→AgentService group seed**: seed 5 groups (Technical/Analytical/Management/Creative/Doc)
   at boot so `executeGroup` works without per-agent code (`agent-service.ts:688`).
5. **Doc/Management collapse**: represent 20-25 as one Doc agent + `mode` and 17-19 as one PM agent +
   `perspective` — eliminates 8 of 25 near-duplicate nodes (`20_*/00_PROFILE.md:58`, `18_*/00_PROFILE.md:59`).
6. **Tool reality layer**: implement or remove the decorative `tools` entries so capability claims are
   honest (`07_*/00_PROFILE.md:29-33`).
7. **Cognitive visibility toggle**: a per-agent boolean (default on for judge/synthesizer roles) gating
   journal consumption of `COGNITIVE_*` — no new events.

### 7.1 Why this is safe

All seven lifts are **additive and reversible**: they change data shape + two selector functions, never
the execution path. No agent loses capability; the doc/management collapses are pure node-count
reductions with behavior preserved via `mode`/`perspective` params. **[INFERRED]**

## 8. Service-level de-duplication opportunity

Because every agent is the _same_ service with different data, the only true "duplication cost" is
**maintenance of 25 parallel data blobs** and the **misleading capability claims** (decorative tools,
unbound lenses). There is no runtime redundancy — one `resolveAgent` path serves all. **[INFERRED]**

Concrete de-dup moves, ordered by effort/impact **[OPINION]**:

1. **Cheap / high:** seed 5 cluster groups (§7.4) — unlocks `executeGroup` teams, zero new code.
2. **Cheap / high:** specialization→lens auto-bind (§7.3) — reuses existing lenses.
3. **Cheap / medium:** specialization→persona hint (§7.2) — one table in `persona-selector.ts`.
4. **Medium / high:** collapse doc (6→1+mode) and management (3→1+perspective) clusters (§7.5).
5. **Medium / medium:** unify `AGENT_PROFILES`+`topology-defaults.ts` into one schema (§7.1).
6. **Hard / medium:** implement or delete decorative `tools` (§7.6).

## 9. Risk of the status quo

- **Capability theater:** users see "Network Engineer with TCP/IP/SDN" but the agent has `tools:[]` and a
  topic-keyword persona — it cannot measure latency or read topology. **[VERIFIED]** via `07_*/02_CAPABILITIES.md`.
- **Model-pin fragility:** pins live only in `AGENT_PROFILES`; a refactor reading model from the node
  config silently degrades 25 agents to `'auto'` (`24_*/00_PROFILE.md:30`). **[OPINION]**
- **Uncoordinated clusters:** the 5 doc agents can never run as a pipeline because no group/sequence is
  seeded (`21_*/00_PROFILE.md:33`). **[VERIFIED]**

## 9. Per-agent research coverage (grounding)

This synthesis is grounded in the full 16-file research pack for **all 25** folders
(`NN_agent-*/00_PROFILE.md` … `15_DO_NOT_BUILD_YET.md`). The duplication and shared-substrate claims
were verified by reading every `00_PROFILE.md` plus spot-reading `02_CAPABILITIES.md`,
`04_DEBATE_ROLE.md`, and `07_COGNITIVE_ROLE.md` across agents 01-25, and by direct `src/` greps of
`agent-profiles.ts`, `topology-defaults.ts`, `persona-selector.ts`, `event-registry.ts`,
`agent-service.ts`, `phase21-invocation.ts`, and `prompt-audit-service.ts`. **[VERIFIED]**

## 10. Evidence index (cited)

- `src/kernel/state/agent-profiles.ts:21` — 25 curated profiles. **[VERIFIED]**
- `src/kernel/state/topology-defaults.ts:91-119` — `normalizeAgentIdentity` merges profile→node. **[VERIFIED]**
- `src/kernel/services/debate-runtime/persona-selector.ts:251-309` — topic/role scoring, no specialization. **[VERIFIED]**
- `src/kernel/events/event-registry.ts:737/756/764/776` — 4 cognitive events; decision dead. **[VERIFIED]**
- `src/kernel/services/agent-service.ts:306/337/614/688` — shared resolver/group/spawn. **[VERIFIED]**
- `src/kernel/service-registration/phase21-invocation.ts:43-58,125-144` — Invocation wraps agentService; human-mention policy. **[VERIFIED]**
- `src/kernel/services/prompt-audit-service.ts:18-30,46` — cosmetic clusters. **[VERIFIED]**
- Per-agent `00_PROFILE.md` / `02_CAPABILITIES.md` — duplication & decorative-tools claims. **[VERIFIED]**
