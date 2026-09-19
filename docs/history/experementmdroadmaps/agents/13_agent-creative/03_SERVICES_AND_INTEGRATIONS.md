# 03_SERVICES_AND_INTEGRATIONS — Agent → Services → Events → Storage → UI → Other agents

> Map of how `agent-creative` touches the system. **REUSE-EXISTING** posture: every touch
> point is already-built shared infra; nothing here is creative-specific code.

```
┌──────────────────────────────────────────────────────────────────────┐
│  agent-creative  (topology node, id=agent-creative)                    │
│  config: prompt, model(openrouter/llama-3.3-70b), temperature 0.8,    │
│          specializations[Ideation,Narrative,Brand], lensIds[],        │
│          avatar{🎨,#a855f7}, provider openrouter                       │
└───────────────┬──────────────────────────────────────────────────────┘
                │ resolveAgent / getAgents
   ┌────────────▼─────────────┐
   │ AgentService (IAgentResolver)  agent-service.ts:71,306,337 │
   │  - stats (COGNITIVE_STEP_COMPLETED/STREAM_END)             │
   │  - lifecycle, groups, autoSpawn                            │
   │  - persist KV (super_agents_agent_stats / _groups)         │
   └────────────┬─────────────┬───────────────────┬────────────┘
                │             │                   │
   ┌────────────▼───┐ ┌────────▼────────┐ ┌────────▼──────────────┐
   │ Debate runtime │ │ ConversationCore│ │ Invocation Engine     │
   │ (participant)  │ │ /Director/Chat │ │ (AgentResolverDir)    │
   │ debate-* events│ │ conversation-*  │ │ invocation-* events   │
   └────────┬───────┘ └────────┬────────┘ └────────┬──────────────┘
           │                  │                   │
   ┌───────▼──────────────────▼───────────────────▼──────────────┐
   │  ChatExecutor (chat-executor.ts) → LLMHttpClient → provider  │
   │  emits MESSAGE_RESPONSE / STREAM_END / COGNITIVE_STEP_*      │
   └────────┬─────────────────────────────────────────────────────┘
            │
   ┌────────▼─────────────────────────────────────────────────────┐
   │ Storage: Dexie KV (stats, groups, agent_journal_v1) +         │
   │   debate:* tables, conversation scenarios, crystals, forum    │
   │ UI: AgentsPanel(AgentCard/Detail/Stats/Comparison/History/   │
   │   Groups/Policy/Wizard), DebateRuntimePanel, DirectorPanel,   │
   │   ForumPanel/AuthorBadge, RoomPanel, Dashboard/AgentLiveBoard │
   └──────────────────────────────────────────────────────────────┘
```

## Assessment by subsystem (VERIFIED unless noted)

| Subsystem                | Relationship                 | Evidence                                                                            | Notes                                       |
| ------------------------ | ---------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| **Debate**               | Participant (opt-in)         | `debate-orchestrator.ts`, `phase21-invocation.ts:75-86`                             | Persona from topic keywords, not role.      |
| **Cognitive stream**     | Generic emitter + consumer   | `event-registry.ts:763,776`; `agent-service.ts:184`; `agent-journal-service.ts:129` | `COGNITIVE_DECISION_MADE` dead-at-consumer. |
| **Memory**               | Journal only (generic)       | `agent-journal-service.ts`                                                          | No agent-keyed semantic memory.             |
| **Invocation**           | Resolvable + expertise match | `phase21-invocation.ts:44-58`, `invocation-engine-service.ts:158-173`               | Human picker; expertise target optional.    |
| **Research**             | Generic node                 | INFERRED (no creative-specific code)                                                | Could be selected like any agent.           |
| **Workflow/Builder**     | Generic node                 | INFERRED                                                                            | Compiled flows can include the node id.     |
| **Knowledge/Crystal**    | Generic participant          | `crystal-debate-bridge` topic-keyed                                                 | No creative-only crystallize path.          |
| **Forum**                | Author identity              | `ForumPanel/AuthorBadge`                                                            | Posting agent shown by resolved identity.   |
| **Scheduler**            | None found                   | VERIFIED by absence                                                                 | No scheduler→agent-creative binding.        |
| **ConversationCore**     | Chat participant             | `conversation-execution-engine.ts:40`, `chat-executor.ts:121`                       | Director TurnProposal.participantId.        |
| **Analytics/Stats**      | Full                         | `AgentStatsDashboard`, `EloLeaderboard`                                             | Tally from events.                          |
| **UI card**              | Full                         | `AgentCard.tsx:68-77`                                                               | Shows specializations, avatar.              |
| **Health/auto-recovery** | Full                         | `agent-health-monitor.ts`, `agent-service.ts:245-254,493-515`                       | Restart/pause supported.                    |
| **Groups/teams**         | Full                         | `agent-service.ts:667-799`                                                          | Can be grouped with other Creative agents.  |

## Cross-agent interactions

- **Same audit group:** `agent-designer`, `agent-content`, `agent-ux`
  (`prompt-audit-service.ts:21-24`) — useful for grouping in debates/teams.
- **Mission Router fan-out:** `agent-creative` is one leaf of the default router
  (`topology-defaults.ts:478,530`); co-exists with 20+ sibling agents.
- **Invocation delegate** can place it alongside others in a debate or director scenario
  (`phase21-invocation.ts:68-89`).
- **No agent→agent direct calls.** Authority is human / engine-mediated (D3/D6 of
  Invocation design, AGENTS.md). `agent-creative` cannot self-invoke or summon others.

## Reuse summary

Everything `agent-creative` does is delivered by **already-existing** services:
`AgentService`, `ChatExecutor`, `AgentJournalService`, `AgentAvatarService`,
`PersonaSelector`, `InvocationEngine`, `AgentHealthMonitor`, `PromptAuditService`,
Dexie KV + domain tables, and the AgentsPanel component family. No creative-specific
service exists and none is required to make it function today.
