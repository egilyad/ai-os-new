# 06_INVOCATION_ROLE — Human invocation of `agent-creative`

## CURRENT (VERIFIED)

The Invocation Engine is the **only** sanctioned way a human "summons" `agent-creative`
at runtime (D6: authority = human; agents never self-invoke — AGENTS.md).

- **Directory:** `AgentResolverDirectory` wraps `agentService` and re-exposes
  `getAgents()` **with specializations** (`phase21-invocation.ts:44-58`). So
  `agent-creative` appears in the directory as
  `{ id:'agent-creative', name:'Indira Sun', role:'Creative Visionary',
 specializations:['Ideation','Narrative','Brand'] }`.
- **Resolution:** `InvocationEngineService.resolveAgents(target)`
  (`invocation-engine-service.ts:158-173`) supports two target modes:
  - explicit `target.agentId` → direct resolve;
  - `target.role` / `target.expertise` → match against `specializations`.
    For `agent-creative`, an `expertise:['Brand']` target would match it
    (`invocation-engine-service.ts:172`).
- **Execution delegate:** `InvocationExecutionDelegate.start`
  (`phase21-invocation.ts:68-89`) maps agents to a **debate** (round_robin, 5 rounds) or
  to a **ConversationCore/Director** chat/scenario. For `agent-creative` picked alone in
  "chat" mode, it becomes a single-agent Director session.
- **Policy gate:** `invoke()` emits `INVOCATION_REQUESTED` → policy `matches()`
  (gates on `match.source`/`event`/`expertise`, NOT on `policy.actions.target` —
  AGENTS.md pending-design note). The default "Manual Room Chat" policy
  (`match.source:'human-mention'`) permits any human-selected registered agent, so
  `agent-creative` passes.
- **Lifecycle:** `requested → accepted → executing → done | rejected`
  (`event-registry.ts` 5 `invocation:*` events). `invocationStore` observes and shows
  live `conversation:*` output.

## Human UX (VERIFIED, RoomPanel)

RoomPanel presents a friendly picker: **Agent** (dropdown of `agentService.getAgents()`),
**Where** (This room / Forum topic / Conversation), **Mode** (Chat / Debate / Scenario),
**Task** textarea. The human picks `Indira Sun` → `agent-creative` is resolved by id →
`invocationEngine.invoke(req)` with `context` + `constraints.mode`
(`RoomPanel`, AGENTS.md Step 6 rework). No IDs shown in default view.

## context / mode guidance (RECOMMENDED defaults)

| Human intent                                             | Where        | Mode     | Notes                                 |
| -------------------------------------------------------- | ------------ | -------- | ------------------------------------- |
| "Brainstorm a campaign concept"                          | This room    | Chat     | single-agent ideation                 |
| "Debate two brand directions"                            | Conversation | Debate   | pairs creative with critic            |
| "Write a scenario where creative drafts, critic reviews" | Conversation | Scenario | needs authored `ConversationScenario` |

## Policy recommendation

Keep the source-only `human-mention` policy (already seeded) so any human-selected agent
is allowed. **Do NOT** add a `policy.actions.target` restriction for `agent-creative` —
the design intentionally lets the human pick the agent while the policy gates the _type_
of call (AGENTS.md pending-design question). If a "creative-only" auto-invocation is ever
wanted, add an `expertise:['Brand','Narrative','Ideation']` match rule, not a target pin.
