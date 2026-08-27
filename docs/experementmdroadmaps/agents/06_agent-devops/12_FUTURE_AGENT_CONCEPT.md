# 12_FUTURE_AGENT_CONCEPT — realized concept from EXISTING capabilities

> No new framework. The "Senior SRE Agent" is assembled from capabilities that already exist in the codebase.

## Concept: "Tomas Berg — Autonomous SRE Lead"

A realized agent that _operationalizes_ the already-present `CI/CD, Kubernetes, Observability` specializations (`agent-profiles.ts:80`) using only existing services, without writing per-agent code.

## What already exists to build it (VERIFIED)

| Needed capability             | Existing piece                                    | Source                                                   |
| ----------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Identity + pinned model       | curated `agent-devops` node                       | `agent-profiles.ts:72-81`, `topology-defaults.ts:91-119` |
| Invocation by human           | `RoomPanel` + `invocationEngine`                  | `phase21-invocation.ts:43-58`, `RoomPanel.tsx`           |
| Debate participation          | topology node + `persona-selector`                | `topology-defaults.ts:206`, `persona-selector.ts`        |
| ConversationCore turn         | `resolveAgent` honors `llama-3.1-8b-instant`      | `agent-service.ts:337,351`                               |
| Memory of past work           | `AgentJournalService.listByAgent('agent-devops')` | `agent-journal-service.ts:253`                           |
| Stats / live board            | `AgentService.getStats` + `AgentLiveBoard`        | `agent-service.ts:288`, `AgentLiveBoard.tsx`             |
| Lens for structured reasoning | `lens-engine` (add `lens:operations`)             | `lens-library.ts`                                        |
| Knowledge crystallization     | `crystalVault` + `synthesisEngine`                | AGENTS.md Modules 2/4                                    |
| Tool execution (future)       | `ToolService`/`SandboxService`/`MCPService`       | `phase4-agents-roles.ts`                                 |

## The realized concept (OPINION)

1. **Invoke** Tomas Berg from Room with a preset ("Incident timeline", "K8s upgrade plan") → `invocationEngine.invoke`.
2. **Debate** seats him with an ops-aware persona (M1) on infra topics; his `lens:operations` frames analysis.
3. **ConversationCore/Director** runs a scenario where devops leads a post-mortem; outputs are journaled **with specialization tags** (Q1) and crystallized into a runbook Crystal (B2).
4. **Memory** (M3) recalls prior runbooks so the next incident starts warm.
5. **AgentLiveBoard cognitive tab** (M5) shows Tomas Berg "thinking" live.

## Why this is "realized, not invented"

Every numbered piece is either already present or a reuse-only change listed in `11_OPPORTUNITIES.md`. The concept needs **zero new buses, zero new agent-type code, zero new event types** — only (a) an ops lens, (b) specialization-aware persona/seating, (c) tagged journal memory, and (d) UI presets. That is exactly the Phase1–Phase2 plan below.

## Anti-pattern avoided

Do NOT build a separate "SRE agent class" or "DevOps module." The architecture explicitly forbids per-agent code (AGENTS.md: "behavior is SHARED infra"). The concept is a _configuration + bridge_ story, not a new component.
