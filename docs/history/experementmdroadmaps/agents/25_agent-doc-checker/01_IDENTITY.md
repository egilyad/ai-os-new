# 01_IDENTITY — Resolution & UI Identity View

**Status:** VERIFIED. How `agent-doc-checker` becomes a rich, renderable identity.

## Runtime identity source (single source of truth)

`src/kernel/services/agent-identity.ts:62` `resolveAgentIdentity(id, deps)` is the canonical resolver. It delegates to `IAgentResolver.resolveAgent(id)` (implemented by `AgentService`) and enriches with:

- `lensEngine.getLens()` for lens names (agent-identity.ts:117-124)
- `PROVIDER_DISPLAY_NAMES` for human provider name (agent-identity.ts:126-127)
- `agentAvatarService.generate(id)` deterministic fallback (agent-identity.ts:68-77)

It **never throws** — degrades to `displayName = id` if unresolved (agent-identity.ts:90-100).

## `ResolvedAgent` shape

`src/kernel/contracts/conversation/agent-resolver.ts:20-52` defines `ResolvedAgent`:

- `id`, `name` (node label), `role` (topology `roleName`), `systemPrompt`, `model`, `displayName`, `firstName`, `lastName`, `baseRole`, `specializations`, `lensIds`, `provider`, `avatar`.
- For doc-checker at runtime: `role` = `Consistency Checker` (topology `roleName`), `baseRole` = `Consistency Checker`, `specializations` = `['Consistency','Cross-Reference','Validation']`, `provider` = `nvidia`, `model` = `meta/llama-3.3-70b-instruct`, `avatar` = `{emoji:'🎯',color:'#ef4444'}`.

## `resolveAgent` mechanics

`src/kernel/services/agent-service.ts:337-390` `resolveAgent(id)`:

- Finds the topology node where `type==='agent'||'router'` and `id` matches (agent-service.ts:340-343).
- Reads `config.systemPrompt`/`config.prompt` → `systemPrompt` (agent-service.ts:345-350).
- `model` is returned ONLY if `config.model` is a real value (not `auto`/`default`/`undefined`) — agent-service.ts:351-353. For doc-checker the normalized config model IS `meta/llama-3.3-70b-instruct` (see 02_TOPOLOGY), so it is returned.
- `provider` returned from `config.provider` (agent-service.ts:387) → `nvidia`.

## UI surfaces

`src/components/AgentsPanel/` renders identity via this resolver. Relevant components:

- `AgentCard.tsx`, `AgentDetailPanel.tsx`, `AgentIdentityEditor.tsx`, `AgentAvatar.tsx` (emoji+color), `AgentStatsDashboard.tsx`, `EloLeaderboard.tsx`, `LiveActivityStream.tsx`, `AgentComparison.tsx`, `AgentGroupsSection.tsx`, `AgentPolicySection.tsx`.
- `AgentAvatar` renders the `🎯`/`#ef4444` avatar (AgentAvatar.tsx).
- `AgentIdentityEditor` allows editing the resolved identity (AgentIdentityEditor.tsx) — edits write back to the topology node via `AgentService.updateAgent` (agent-service.ts:432-441).

## Confidence

- Resolver path: VERIFIED (read directly).
- UI rendering: INFERRED from component names + `agent-identity.ts` usage; components not individually read but architecture is confirmed by AGENTS.md ("AgentsPanel … Used widely").
