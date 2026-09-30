# Navigation Map — зафиксированная раскладка меню

> Дата: 2026-09-30. Статус: решение, не код. Dashboard сознательно НЕ дробится —
> это витрина перекрёстков, внутри четыре живых кластера (разбор по коду панелей).

## Dashboard (как есть, кластеры внутри)

- **Dashboard core:** Overview
- **Knowledge / Cognitive Core:** Knowledge, Cognitive Lenses, Crystal Vault,
  Junction Engine, Synthesis Engine, Knowledge Generator
  (цепочка: Knowledge → Junctions → Synthesis → Crystal / Forum)
- **Projects / Workspace:** Projects, Project OS Explorer (разные звери —
  рабочий контур vs research-инспектор, не смешивать)
- **Communication:** Agent Forum, Agent Rooms, Channels, Group Chat,
  Conversation Director, Dyad
- **Execution / Automation:** Workflows (в integrations — кандидат на перенос,
  пока там), Scheduler, Planner, Autonomy, SOP, Run Queue
- **Crossroads:** Providers (ключи остаются здесь)

## Остальные секции (зафиксированы ранее)

- **Budget AI:** Analytics, Economics, Budget, Cost Analytics, Cost Optimization,
  Budget Alerts, Company Costs
- **Chats:** Chat, Chat Sessions, Session Hub, Bookmarks
- **Debate AI:** Debate Arena, Debate Live, Debates Manager, Debate History,
  Debate Workspace (+templates, tournament, replay), Scratchpad, Experimental
- **Debate Strategy & Analysis:** Outcome Forecaster, Minimax Planner,
  Similarity, Drift Detector
- **Patterns:** только приёмы внутри дебата (дубли bayesian-judge/judges и др.
  НЕ трогать — отдельный аудит legacy)
- **Agents:** Agents, Roles, Meta Agent, Leaderboard, Marketplace, Skills…
- **Diagnostics:** Activity Log, Traces, Router Trace, Memory, Health SLA,
  Custom Metrics, Observability Gaps Scanner…
- **Fleet (ядро, не трогать):** Console, Crews, Councils, Graphs, Persona,
  Interop, Frontier
- **Fleet (спорные, на исследовании):** Companies, Issues, Runs, Provenance
  Graph (один Company Gateway — отдельный контур)
- **Google AI, Research** — как есть (+Rival Labs, Rivals Catalog в Research)
- **AI / Providers & Keys:** pools, groups, notes, rotations, bindings,
  smart-routing, routing, dashboards, marketplace, groq, nvidia, openrouter
- **System Services:** tools, connectors, mcp, service-registry,
  topology-templates, cache, webhooks, guardians, plugin-sdk, adapters,
  portability
- **Security & Rules:** settings, policies, policy-editor, audit, history,
  export-import, time-machine, governance, guardrails, security-scan, approvals
- **System Memory:** memory-palace, federated-memory, memory-export-import
- **Lab:** eval-datasets, routing-experiments, playground, ab-testing,
  experimental(→переехал в Debate AI), arch-review, prompt-audit,
  simulation, gov-stress-test
- **Other (честный остаток):** editors, prompts, prompt-versions, batch,
  team-collaboration, community-hub, model-distillation, deploy, voice-input,
  aquarium, leaderboard(→Agents), rival-labs/rivals-catalog(→Research),
  custom-metrics(→Diagnostics), contribution-graph, tasks, files
- **Спецвопросы (не двигать без разбора соседей):** Tasks, Files, Tutorials,
  Issues↔Tasks, Provenance↔Traces/Graphs, Template Sharing, Contribution Graph
