# Справочник: Доменный каталог событий EventBus

> Источник: `src/kernel/events/event-registry.ts` (~2772 строк, единственный источник правды).
> Условные обозначения: **[HOT]** — streaming; **[SYS]** — системное; **[CMD]** — команда/запрос; **[internal]** — «декоративная» схема (валидация на шине обходится).
> Многие константы — алиасы одного строкового имени (напр. `STREAM_CHUNK`=`CHAT_STREAM_CHUNK` → `chat:stream:chunk`).

## 1. Provider / Key

`key:loaded`, `key:added`, `key:removed`, `key:updated`, `key:state:changed`, `key:compromised`,
`key:compromise:signal`, `key:group:sync`, `key:health:check:started/completed/failed`,
`key:latency:burst`, `key:quota:exceeded` (`quota:breached`), `key:reputation:threshold:crossed`,
`key:health:check` **[CMD]**, `key:health:check:all` **[CMD]**, `key:probe:result`,
`provider:state:changed`, `provider:circuit:breaker:synced`, `provider:rate:limit:synced`,
`provider:error:synced`, `key:alert:resolved`, `key:rotation:triggered`, `key:intelligence:pipeline:error`,
`keystate:updated/removed`, `virtual:key:created/resolved/revoked`, `provider:runtime:state/budget`.

## 2. Chat (вкл. assistant/streaming)

`chat:send`, `chat:cancel`, `chat:response`, `chat:model:select`, `chat:target:start`,
`chat:stream:start` **[HOT]**, `chat:stream:chunk` **[HOT][internal]**, `chat:stream:end` **[HOT][internal]**,
`chat:stream:error` **[HOT]**, `chat:summary:created`, `chat:forked`, `chat:rewound`,
`chat:bookmark:added/removed/cleared`, `chat:tool:call`, `assistant:chunk` **[HOT]**,
`assistant:tool:call`, `assistant:done`, `assistant:navigation`, `assistant:navigation:resolved`.

## 3. Session / Binding

`session:binding:expired`, `session:deleted`, `session:delta`.

## 4. System / Kernel

`system:navigate` **[CMD]**, `system:notification`, `system:decision`, `kernel:updated`,
`kernel:heartbeat` **[SYS]**, `kernel:state:reset`, `system:runtime:ready` **[SYS]**,
`system:runtime:failed`, `system:data:clear` **[CMD]**, `system:reload` **[CMD]**,
`kernel:load:failed`, `kernel:persist:failed`, `system:runtime:metrics`, `system:eventbus:backpressure` **[SYS]**,
`system:topology:mounted`, `system:node:spawn`, `system:node:removed`.

## 5. Debate Runtime (debate:runtime:*)

`debate:runtime:session:created/started/paused/resumed/cancelled/completed/failed`,
`debate:runtime:phase:changed`, `debate:runtime:budget:exceeded/updated/pressure`,
`debate:runtime:round:started/ended`, `debate:runtime:round:early:exit`,
`debate:runtime:agent:thinking`, `debate:runtime:agent:chunk` **[HOT]**,
`debate:runtime:agent:responded/error/timeout/fallback`, `debate:runtime:agent:phase:changed`,
`debate:runtime:agent:scored`, `debate:runtime:consensus:reached`, `debate:runtime:memory:claim`,
`debate:transition:invalid`.

## 6. Debate — доменные (унаследованные)

`debate:updated`, `debate:started`, `debate:argument`, `debate:consensus`, `debate:ended`,
`debate:fact:checked`, `debate:verdict:generated`, `debate:session:conflict`, `debate:human:vote`,
`debate:quality:technique:applied`, `debate:quality:impact:computed`, `debate:quality:experiment:completed`.

## 7. Observability

`observability:timeline:event:added`, `observability:timeline:cleared`, `observability:metrics:snapshot`,
`observability:metrics:alert`, `observability:metrics:alert:resolved`, `observability:trace:updated`,
`observability:health:changed`, `observability:error:boundary:caught`.

## 8. Cognitive / Requests

`cognitive:trace:updated` **[HOT][internal]**, `cognitive:step:active/completed`, `cognitive:decision:made`,
`request:incoming`, `request:completed`.

## 9. Persona / Context / Goal / Memory

`persona:changed/tone:changed/created/updated/deleted/distilled`, `memory:updated/remembered/promoted/forgotten/lt-updated/linked`,
`context:created/shared`, `goal:created/progress/completed`.

## 10. Roles

`roles:updated`, `role:assigned/unassigned/created/deleted/updated`, `role:sandbox:test:completed/failed`.

## 11. Team

`team:created/updated/deleted`, `team:execution:started/completed/failed`.

## 12. Scheduler

`schedule:completed/created/deleted/triggered/updated`, `scheduler:heartbeat` **[SYS]**.

## 13. Metrics / Pressure / WhatIf

`metrics:key:store:gauges`, `whatif:simulation:completed`, `pressure:map:updated`, `pressure:alert:raised`.

## 14. Webhook / Secrets / Compromise

`webhook:delivery:failed`, `secrets:lookup:failed`, `compromise:signal:rejected`.

## 15. Topology / Queue

`topology:evaluated`, `queue:task:failed`, `queue:enqueued`.

## 16. Crystal Vault (знания)

`knowledge:crystal:proposed/formed/superseded/refuted`, `knowledge:crystal:contradiction:detected`.

## 17. Junction Engine

`knowledge:junction:detected/validated/rejected`.

## 18. Synthesis

`synthesis:started/completed/refined`, `synthesis:exported-to-crystal`, `synthesis:exported-to-forum`.

## 19. Knowledge Generator

`generator:started/stage/completed/failed/cancelled`.

## 20. Forum

`forum:topic:created`, `forum:post:added/voted`, `forum:topic:escalated-to-debate`, `forumplus:poll/solved`.

## 21. Invocation

`invocation:requested/accepted/rejected/executing/done`.

## 21a. Conversation Core

`conversation:turn:start/complete/error`, `conversation:paused/resumed/aborted/completed`.

## 22. Crew / Task / Forge

`crew:created/started/completed/failed/aborted/deleted`, `task:started/completed/failed/hitl`, `forge:proposed`.

## 23. Council

`council:created/proposal/fact/message/whisper/phase/judged/vote/completed/aborted`.

## 24. State Graph (LangGraph-style)

`graph:defined/started/node/checkpoint/reflected/hitl/approved/rejected/completed/failed/aborted/restored`.

## 25. Ops / Governance / Mobile

`ops:audit`, `ops:hierarchy`, `ops:budget`, `ops:sandbox`, `ops:mobile`, `ops:notify`.

## 26. Interop / Federation / Coordination

`interop:agent/negotiated/error`, `gateway:ingress`, `fed:peer`, `handoff:dispatched/returned`,
`market:opened/awarded`, `contract:proposed`.

## 27. Meta / unified memory

`meta:proposed/applied/evolved/health`, `cog:written/governed/counterfactual/compiled`.

## 28. Trust / Ecosystem

`trust:updated`, `trust:policy`, `eco:installed`, `eco:snapshot`.

## 29. Frontier evals

`eval:run`, `eval:compared`, `eval:redteam`, `eval:org`, `eval:intent`, `eval:scorer:registered`, `eval:judge:done`.

## 30. Parity E.2/E.3 (tools/knowledge/training)

`tool:executed`, `knowledge:added`, `knowledge:hybrid:retrieved`, `training:recorded`, `catalog:updated`.

## 31. Agent / Router / Advisor / Diagnostic / MCP / Settings / Skills / Budget / Tools / Permission / Capability / Snapshot

`agent:config:updated`, `agent:lifecycle:change`, `agent:health:change`, `agent:restarted`, `agent:created/executed`, `agent:rate:limited`,
`agent:blackboard:updated`, `agent:handoff:initiated`, `agent:wizard:config-generated`, `agent:journal:added/removed/cleared`,
`claudecode:exec`, `router:signal`, `advisor:suggestion`, `advisor:suggestion:executed/dismissed`, `diagnostic:complete`,
`mcp:updated`, `mcp:harness:reconnected/proxy`, `settings:updated`, `settings:latency:threshold`, `policy:violation`,
`skills:updated`, `pricing:updated`, `budget:alert`, `tools:updated`, `tool:execution:start/success/error`,
`tool:pipeline:blocked`, `tool:approval:requested/resolved`, `permission:decided/updated`, `capability:trust:changed/seeded`,
`elo:rating:updated`, `snapshot:captured/restored`, `cache:invalidated/control:marked/control:stats/saved`,
`aquarium:screenshot:captured`, `hypotheses:updated`, `research:session:updated`.

## 32. Rival Parity — эмуляция сторонних фреймворков (Phase F–V)

Обширная группа flat-событий без общих доменных схем. Фазы:

- **F:** `loop:iter`, `groupchat:created/turn`, `guardrail:hit`, `guardrail:rule:added/removed`, `interpreter:exec`, `miniswe:solved`,
  `whale:cargo:check`, `whale:patch:applied`, `files:uploaded`, `project:created:rivals`, `project:file:added`,
  `routine:defined/triggered`, `agentview:sessions/skill`, `block:set`, `sop:phase`, `queue:enqueued`, `dyad:done`,
  `planner:plan:completed/step/filter:added`.
- **G:** `react:step`, `rag:answered`, `runtime:started/action`, `swe:edit`, `modes:switched`, `smem:added`, `integration:trigger`, `character:imported`.
- **H:** `reason:thought`, `session:delta`, `dataset:hit`, `docstore:feedback`, `typed:valid`, `codeplan:round`, `dialogue:turn`, `botroute:node`.
- **I:** `copilot:topic`, `bedrock:action/guard`, `cx:route`, `force:run`, `kore:interrupt`, `yellow:sent`, `lindy:hired`, `smol:step`.
- **J:** `app:scaffold`, `onto:created`, `work:pushed`, `computer:act/handoff`, `search:fanout`, `codeexec:queued`, `codeexec:sandbox:done`,
  `browser:harness:act`, `mcp:harness:reconnected/proxy`, `eval:scorer:registered`, `eval:judge:done`.
- **K:** `n8n:run`, `make:run`, `zap:fired`, `temporal:step/signal/paused`, `asset:built`, `sensor:ok`, `voice:started/ended`, `support:open/handoff`.
- **L (debate plus):** `format:start/done`, `dung:attack`, `toulmin:card`, `brier:resolved`.
- **M:** `forumplus:poll/solved`, `decision:outcome`, `polis:clustered`, `reflexion:trial/done`, `tot:level`, `selfcon:vote`, `soar:fired/impasse`,
  `meter:alert`, `err:captured`.
- **N (OpenClaw/DSH/CN/Manus/Genspark):** `claw:soul/cron`, `dsh:plugin`, `manus:verify/export`, `gen:fanout/sheets/longtask`.
- **P (Google + Chat Studio):** `a2aspec:card/task`, `cache:saved`, `notebook:audio`, `live:barge/tool`, `deepres:step`, `studio:pack`.
- **Q:** `netlogo:tick`, `mesa:step`, `bonsai:trained`, `chainlit:step`, `malmo:goal`.
- **R:** `constit:critique/revise`, `voyager:skill/step`.
- **U:** `metabolic:tick`, `maestro:orchestrate`, `localtriple:run`, `ruslan:learn`, `evolab:run`, `gigastudio:gen`, `agencyru:catalog/import`,
  `analitik:intake`, `chemist:ask`, `heisenberg:board/move`.
- **V:** `latent:synth`, `aiscientist:queued/run`, `sparks:cycle`, `sciagents:hypothesize`, `eightstage:run`, `cognitae:run`, `cogteam:run`,
  `syn:sleep`, `helix:gaps`, `ideator:test`, `rck:bind`, `cognee:recall`, `metan:hierarchy`, `concepts:compose`, `secondbrain:run`,
  `storm:research`, `blackboard:post`, `dolores:trace`, `episteme:sync`, `metakb:query`, `researchos:folder`, `deepresearch2:run`,
  `darwin:evolve`, `qyvaria:query`, `parliamentary:run`, `policy:advantages`, `socratic:discuss`, `fishbowl:rotate`, `continue:chat`,
  `goose:recipe`, `gptengineer:run`, `gptpilot:start`, `pi:dispatch`, `tabby:complete`, `void:session`, `warp:block`, `zed:open`,
  `codex:prompt`, `geminicli:chat`, `kilo:fanout`, `helicone:log`, `portkey:route`, `litellm:proxy`, `langfuse:trace`.

## 33. Deploy / Simulation

`deploy:bundle:created`, `sim:world:created`, `sim:tick`, `sim:completed`.

## 34. Projects / Workspace / Agent Runtime / QA / Pipeline / Python / Artifacts / Templates / Debate Integration / Autonomy / Channels

`project:created/updated/deleted`, `project:agent:assigned/removed`, `project:task:created/status`,
`project:run:started/completed`, `project:file:updated/deleted`, `project:exported/imported`,
`workspace:initialized`, `workspace:file:written/deleted`, `workspace:dir:deleted`, `runtime:agent:event`,
`website:preview:generated/validated`, `qa:inspection:completed`, `pipeline:created/stage:completed/advanced/completed`,
`python:run:started/completed`, `python:requirement:added`, `artifact:created/build:completed`, `snapshot:created`,
`template:applied`, `project:debate:started/verdict`, `autonomy:goal:created/phase:advanced/task:completed/goal:completed/failed`,
`project:activity:logged`, `project:error:logged`, `channel:created/message/agent:joined/agent:left/archived`.

## Сводка по атрибутам

- **[HOT] streaming:** `chat:stream:start/chunk/end/error`, `assistant:chunk`, `debate:runtime:agent:chunk`.
- **[HOT][internal]:** `chat:stream:chunk`, `chat:stream:end`, `cognitive:trace:updated`.
- **[SYS]:** `kernel:heartbeat`, `system:runtime:ready`, `system:eventbus:backpressure`, `scheduler:heartbeat`.
- **[CMD]:** `chat:send/cancel`, `system:navigate`, `system:data:clear`, `system:reload`, `key:health:check/all`.
