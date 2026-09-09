# 10_PROBLEMS_AND_LIMITATIONS — concrete VERIFIED problems for `agent-quality`

> Each item cites source. Severity: 🔴 real defect, 🟠 meaningful gap, 🟡 minor.

1. 🔴 **No persona in debates.** `PersonaSelector.selectVariant` filters by `pro/con/neutral`; role `"Quality Engineer"` matches none → returns `undefined` → no persona prompt injected (`persona-selector.ts:260-290`). The agent's QA identity is therefore inert during debates; it speaks only its node prompt inside a generic debate frame. All non-pro/con/neutral agents share this defect.

2. 🔴 **Profile model is ignored at runtime.** `agent-profiles.ts:139` pins `llama-3.1-8b-instant`, but the topology node sets `config.model:'auto'` (`topology-defaults.ts:289`). `resolveAgent` returns `model=undefined` for `'auto'` (`agent-service.ts:351-353`), so the execution engine routes to an auto-selected model. The "cheap/fast QA" intent is lost; cost and behaviour differ from the profile.

3. 🟠 **Specializations never exercised.** `Test Automation`, `QA`, `Coverage` are metadata only. No runtime hook, tool, or persona consumes them. They appear on the card but do nothing.

4. 🟠 **No QA lens.** `lens-library.ts` has 15 lenses; none QA/test/coverage. `agent-quality` has `lensIds:[]` (`agent-service.ts:386`). Its analytical strength is never amplified (contrast `lens:critical`, `lens:security`, `lens:meta-meta`).

5. 🟠 **No QA memory / continuity.** 15 generic memory stores exist (`src/kernel/services/memory/*`) but nothing writes `agent-quality` QA findings. Each run starts context-free; prior test plans/verdicts are lost (see 08).

6. 🟡 **Journal name is the raw node id.** `AgentJournalService` stores `agentName: e.nodeId` (`agent-journal-service.ts:135,161`), so history shows `agent-quality`, not "Noah Ferreira". Human-readability gap.

7. 🟡 **Misleading `agentQualityActivations` naming.** `debateLiveStore.ts:88,414,500,524,541,556` tracks _debate-quality-technique_ activations, unrelated to this agent. The name can mislead a reader into thinking the agent is instrumented. (Not a runtime bug, but a clarity hazard — verify before assuming linkage.)

8. 🟡 **UI shows pinned model that isn't used.** `AgentCard`/`AgentDetailPanel` likely render the profile model; users expect `llama-3.1-8b-instant` but runs use `auto`. (INFERRED from 02/09; verify in `AgentCard.tsx`.)

9. 🟠 **No QA-specific invocation affordance.** RoomPanel treats `agent-quality` like any agent; no QA task templates despite `specializations` being available in `AgentResolverDirectory` (`phase21-invocation.ts:47-57`).

10. 🟡 **Health/auto-spawn generic.** `AgentHealthMonitor` restarts on failure but has no QA-aware recovery (e.g. retest). Acceptable, but the auto-spawn threshold (`agent-service.ts:81-86`) may clone unrelated agents, not QA.
