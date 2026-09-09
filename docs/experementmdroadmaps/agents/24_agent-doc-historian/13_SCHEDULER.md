# 13_SCHEDULER — `agent-doc-historian`

Scheduling / auto-spawn behavior for the historian.

## VERIFIED

- `AgentService.autoSpawnConfig` (`:81-86`): `enabled:true, maxAgents:10, spawnThreshold:1, terminateAfterMs:300000`. This is generic auto-cloning, not historian-specific.
- `evaluateAutoSpawn` (`:614-665`): when every agent node is busy and count < maxAgents, clones a source agent (copying its `config` via `structuredClone`). The historian could be cloned if it is busy and all 25 are busy.
- There is **no** cron/scheduler service that periodically invokes the historian to produce changelogs. AGENTS.md mentions "schedule" only as a _future_ Invocation trigger (D2 hybrid triggers: `@mention`, expert request, expertise-match, module event, consensus/debate, schedule) — not yet implemented.
- `AGENT_HEALTH_CHANGE` triggers `evaluateAutoSpawn` (`:252-254`), and lifecycle `busy|idle` transitions trigger it (`:609-611`).

## INFERRED

- The historian today is purely reactive: it runs only when dispatched (router/group/chat/invocation). No scheduled "nightly changelog" exists.
- Auto-clones of the historian would inherit `model:'auto'` and the topology prompt — identical persona, separate stats key (`agent-<uuid>`).

## OPINION

- A scheduled historian job (e.g. weekly diff of `AGENTS.md`/topology and emit a changelog crystal) is desirable but blocked on the schedule-trigger feature of the Invocation Engine (D2, not yet built).
