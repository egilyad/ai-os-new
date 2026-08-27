# 00_PROFILE — Rafael Stone, Risk Analyst (`agent-risk`)

> Research-only deep-dive. All claims labeled VERIFIED (read directly from source),
> INFERRED (reasoned from verified mechanics), or OPINION (recommendation/design view).

## Identity (VERIFIED)

- **Node id:** `agent-risk` — `src/kernel/state/agent-profiles.ts:32`
- **First/Last name:** Rafael Stone — `agent-profiles.ts:33-34`
- **Display name:** "Rafael Stone" — `agent-profiles.ts:35`
- **Base role:** Risk Analyst — `agent-profiles.ts:36`
- **Avatar:** emoji `📊`, color `#ef4444` — `agent-profiles.ts:37`
- **Provider:** `openrouter` — `agent-profiles.ts:38`
- **Model (declared):** `openrouter/meta-llama/llama-3.3-70b-instruct` — `agent-profiles.ts:39`
- **Specializations:** `Risk Modeling`, `Monte Carlo`, `Compliance` — `agent-profiles.ts:40`

## Topology node (VERIFIED)

- Defined in `src/kernel/state/topology-defaults.ts:157-167` as type `agent`, label "Risk Analyst".
- **System prompt (behavioral):** "You are a risk analyst. Categorize risks by probability and impact. Propose mitigation strategies using frameworks like STRIDE, DREAD, or FAIR." — `topology-defaults.ts:162`
- **temperature:** `0.15` (low — deterministic, analytical) — `topology-defaults.ts:163`
- **tools:** `ANALYTICS_TOOLS = ['data_analysis','visualization','web_search']` — `topology-defaults.ts:8,164`
- **model:** `'auto'` in topology config — `topology-defaults.ts:165`
  - ⚠️ **IMPORTANT DISCREPANCY (VERIFIED):** The topology `config.model` is `'auto'`, while the declared model in `AGENT_PROFILES` is the pinned `openrouter/meta-llama/llama-3.3-70b-instruct`. `AgentService.resolveAgent` (agent-service.ts:351-353) uses `node.config.model`; since it is `'auto'`, the model resolves to `undefined` and falls back to the routing default. So **the pinned `llama-3.3` model in `AGENT_PROFILES` is NOT actually used at execution time** — the routing layer (`'auto'`) decides. This is a real, verifiable mismatch.
- **Topology edges (VERIFIED):** router→agent-risk (`e-router-risk`, `topology-defaults.ts:475`); agent-risk→aggregator (`e-risk-agg`, `topology-defaults.ts:527`). So it is wired into the default `AuditorTopology` data-flow graph.

## Audit grouping (VERIFIED)

- Classified as `'Analytical'` group in `prompt-audit-service.ts:28` (GROUP_BY_NODE_ID map). Co-located with agent-critic, agent-data, agent-research, agent-ethics.

## Lens (VERIFIED / INFERRED)

- `agent-risk` node has **no `lensIds`** in its topology config — `topology-defaults.ts:157-167`.
- There is a `lens:security` whose `category: 'risk'` (`lens-library.ts:68-95`), but it is a global lens, **not bound to this agent**. INFERRED: no agent-specific lens is attached; the "risk" lens exists in the catalog but must be applied manually by a user, not auto-injected for agent-risk.

## Where used / surfaced (VERIFIED)

- `AgentsPanel` UI family (src/components/AgentsPanel/*): AgentCard, AgentDetailPanel, AgentIdentityEditor, AgentWizard, AgentAvatar, AgentStatsDashboard, EloLeaderboard, LiveActivityStream, AgentObservabilityTab, AgentHistoryTab, AgentGroupsSection.
- `AgentAvatar.getAgentAvatar` (`AgentAvatar.tsx:47`) is a **hash-based** fallback (emoji/color from id), NOT reading `AGENT_PROFILES` — so in raw avatar-rendering contexts the 📊/#ef4444 from the profile is NOT guaranteed; `AgentIdentityView` (agent-identity.ts) is what carries the curated avatar via `agentAvatarService`.
- Consumed by Debate (participant), ConversationCore/Director (`resolveAgent`), Invocation (RoomPanel + `AgentResolverDirectory`), Forum `AuthorBadge`, Dashboard `AgentLiveBoard`, Director `AgentIdentityChip`.
- `AgentJournalPanel` (`route-imports.ts:246`) — general journal, not agent-specific but queryable by agentId.

## Related agents (VERIFIED — same topology)

- Siblings in `AuditorTopology`: agent-network, agent-ethics, agent-critic, agent-data, agent-research, agent-security, agent-architect, etc. (25 seeded agents total; `agent-profiles.ts:21`).
- Closest analytical peers: agent-critic, agent-data, agent-research, agent-ethics (`prompt-audit-service.ts:25-29` all `Analytical`).

## Systems that can invoke it (VERIFIED)

1. **Debate runtime** — via `debate-api.ts:299-321` `resolveParticipants` (auto-selected from topology agent nodes).
2. **ConversationCore / Director** — `AgentService.resolveAgent('agent-risk')` resolves the participant; `ChatExecutor` runs turns.
3. **Invocation Engine (RoomPanel)** — human picks `agent-risk` from `agentService.getAgents()` (`RoomPanel.tsx:91`); registered policy `Manual Room Chat (human-mention)` permits any registered agent (`phase21-invocation.ts`).
4. **AgentService.executeGroup** — teams/groups can include agent-risk.

## Status summary

- VERIFIED identity, topology wiring, audit grouping, declared model mismatch (`auto` vs pinned), tools, temperature, edges.
- INFERRED: lens not auto-bound; avatar hash-fallback caveat.
- OPINION: the model mismatch and lack of specialization-aware debate side assignment (see 04) are the two most concrete "real agent" gaps.
