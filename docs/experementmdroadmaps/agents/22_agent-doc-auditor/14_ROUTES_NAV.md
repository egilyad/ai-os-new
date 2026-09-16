# 14_ROUTES_NAV — Routing & Navigation for `agent-doc-auditor`

**VERIFIED.** Doc-auditor is reached through the generic **Agents** route; there is no dedicated route for it or for documentation agents as a group.

## Route registration

- `src/route-registry-system.ts:10-11`:
  ```
  id: 'agents',
  labelKey: 'nav.agents',
  ```
  The Agents route is registered in the system route registry (the KNOWLEDGE/utility section per AGENTS.md layout). Doc-auditor is one entry inside that panel.
- `src/route-imports.ts:188` `const AgentsPanelLazy = React.lazy(() => import('./components/AgentsPanel/AgentsPanel'));`
- `src/route-imports.ts:242` `agents: AgentsPanelLazy,` — maps the `agents` route id to the lazy panel.

## Navigation labels

- `i18n/translations/en/nav.ts:33` `'nav.agents': 'Agents'`.
- `i18n/translations/ru/nav.ts:33` `'nav.agents': 'агенты'`.
- Agent-level strings under `i18n/translations/{en,ru}/agents.ts` (e.g. `agents.pause_agent_title`, `agents.stat_invocations`, `agents.no_capabilities` used by `AgentCard.tsx`).

## Other routes that surface doc-auditor indirectly

- **`/debate`** — if a debate includes `agent-doc-auditor` (`04_DEBATE.md`), it appears in `DebatePanel`, `DebateAnalytics`, `DebateRuntimePanel/AgentControlPanel`.
- **`/director`** — Director scenarios targeting doc-auditor render in `DirectorPanel` (`05_CONVERSATIONCORE.md`). The Invocation "Open session" navigates to `/director?session=…` or `/debate?…` (`stores/invocationStore.ts`, RoomPanel).
- **`/room`** — RoomPanel invokes doc-auditor (`06_INVOCATION.md`).
- **Dashboard** (`DashboardPanel/AgentLiveBoard.tsx`) shows live agent state including doc-auditor.

## INFERRED

There is **no** `route-registry` entry for `documentation` or `doc-auditor` specifically — confirming the agent is data within the Agents route, not a first-class navigable entity. To feature doc-auditor, one would add a route/tab (new code), not just config.

## OPINION

The routing is correctly agent-agnostic. Hardcoding a doc-auditor route would violate the "agents are topology data" principle and is unnecessary given the generic Agents panel already lists it.
