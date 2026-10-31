# ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±ÐµÐ»Ð¾Ð² â€” Capability Gap Map
## SuperAgents OS (`egilyad/ai-os-new`)

> **Ð’ÐµÑ€ÑÐ¸Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°:** commit `e08ab8e` (Oct 31, 2026, Ð²ÐµÑ‚ÐºÐ° `main`)
> **Ð”Ð°Ñ‚Ð° Ð°Ð½Ð°Ð»Ð¸Ð·Ð°:** 2026-10-31
> **ÐœÐµÑ‚Ð¾Ð´:** ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð·: grep Ð¿Ð¾ export/import Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð°Ð¼ Ð² `src/components/**`, Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ `BuilderPanel/builder-nodes.tsx` + `ComponentPalette.tsx`, ÑÐ²ÐµÑ€ÐºÐ° `kernel/services/*` (778 Ñ„Ð°Ð¹Ð»Ð¾Ð²) Ñ Ñ‚ÐµÐ¼, Ñ‡Ñ‚Ð¾ exposed as Builder tool, Ð°Ð½Ð°Ð»Ð¸Ð· cross-linking (`navigate()`, `agentMemory`, `debateMemory`), Ð¿Ð¾Ð¸ÑÐº unified overview Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹
> **ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹:** 8 Ð¿Ñ€ÐµÐ´Ñ‹Ð´ÑƒÑ‰Ð¸Ñ… ÐºÐ°Ñ€Ñ‚ (Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚ÑŒ, Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚ÑŒ, Ñ‚ÐµÑ…ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ, Ñ€ÐµÑÑƒÑ€ÑÑ‹, Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ, Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸, lifecycle, Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚ÑŒ)
> **Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚:** Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾ **42 Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±ÐµÐ»Ð°** â€” Ð¾Ñ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÑŽÑ‰Ð¸Ðµ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ **Ð·Ð°ÐºÑ€Ð¾ÑŽÑ‚ Ñ€ÐµÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð½Ð¾ÑÑ‚Ð¸**, Ð° Ð½Ðµ ÑÐ»ÑƒÑ‡Ð°Ð¹Ð½Ñ‹Ðµ Ñ„Ð¸Ñ‡Ð¸.

---

## 1. Ð˜ÑÐ¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ðµ Ñ€ÐµÐ·ÑŽÐ¼Ðµ

SuperAgents OS Ð¸Ð¼ÐµÐµÑ‚ **778 ÑÐµÑ€Ð²Ð¸Ñ-Ñ„Ð°Ð¹Ð»Ð¾Ð²** Ð² ÑÐ´Ñ€Ðµ, Ð½Ð¾ **Builder Ð¼Ð¾Ð¶ÐµÑ‚ Ð²Ñ‹Ð·Ñ‹Ð²Ð°Ñ‚ÑŒ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 4 node-type** (agent, router, guardrail, tool) â€” Ð¸ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ‡ÐµÑ€ÐµÐ· `toolService.getTools()`. Ð˜Ð· 8 killer-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² (crystalVault, synthesisEngine, lensEngine, timeMachineService, federatedMemoryService, forumService, directorService, memoryOrchestrator) **ÐÐ˜ ÐžÐ”Ð˜Ð Ð½Ðµ exposed as Builder tool** â€” Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð¼Ð¾Ð¶ÐµÑ‚ Ð¿Ð¾ÑÑ‚Ñ€Ð¾Ð¸Ñ‚ÑŒ pipeline, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ð¹ Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ synthesis Ð¸Ð»Ð¸ crystal.

**Export/Import gaps:**
- **11 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð±ÐµÐ· export** (Governance, Director, Aquarium, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health)
- **9 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ export, Ð½Ð¾ Ð±ÐµÐ· import** (Chat, Memory, Crystal, Roles, Settings, Knowledge, Builder, Budget, Health) â€” broken round-trip

**Cross-linking gaps:**
- Ð¢Ð¾Ð»ÑŒÐºÐ¾ **14 `navigate()` calls Ð² components** â€” Ð¼Ð°Ð»Ð¾ cross-panel navigation
- `agentMemory` table exists in Dexie schema, Ð½Ð¾ **Ð½ÐµÑ‚ UI** Ð´Ð»Ñ Â«Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ memory written by agent XÂ»
- **ÐÐµÑ‚ debateâ†’memory link** (debate X used memory Y) â€” Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¾Ñ‚ÑÐ»ÐµÐ´Ð¸Ñ‚ÑŒ, ÐºÐ°ÐºÐ¸Ðµ memories Ð¿Ð¾Ð²Ð»Ð¸ÑÐ»Ð¸ Ð½Ð° Ð²Ñ‹Ð²Ð¾Ð´ Ð´ÐµÐ±Ð°Ñ‚Ð¾Ð²
- Decision â†’ Crystal linking Ð¾Ð³Ñ€Ð°Ð½Ð¸Ñ‡ÐµÐ½ (Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ‡ÐµÑ€ÐµÐ· synthesis `exportToCrystal`)

**Unified overview gaps:**
- ÐÐµÑ‚ ÐµÐ´Ð¸Ð½Ð¾Ð³Ð¾ `agentOverview` â€” AgentsPanel Ð¸Ð¼ÐµÐµÑ‚ 30 Ñ‚Ð°Ð±Ð¾Ð²/ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð², Ð½Ð¾ Ð½ÐµÑ‚ single Â«state of all agentsÂ» view
- MemoryCenterPanel ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚, Ð½Ð¾ **Ð½Ðµ Ð°Ð³Ñ€ÐµÐ³Ð¸Ñ€ÑƒÐµÑ‚** 8 Ñ‚Ð¸Ð¿Ð¾Ð² Ð¿Ð°Ð¼ÑÑ‚Ð¸ (working/procedural/semantic/episodic/social/service-backed/spatial/emotional)
- DashboardPanel â€” Ð¾Ð±Ñ‰Ð¸Ð¹, Ð½Ð¾ Ð½Ðµ domain-specific unified overviews

**Ð¡Ð²Ð¾Ð´Ð½Ñ‹Ðµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ð¿Ñ€Ð¾Ð±ÐµÐ»Ð¾Ð²:**

| ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð¿Ñ€Ð¾Ð±ÐµÐ»Ð¾Ð² | ÐšÐ¾Ð»-Ð²Ð¾ | Severity |
|---|---:|---|
| ÐŸÐ°Ð½ÐµÐ»Ð¸ Ð±ÐµÐ· export | **11** | ðŸŸ¡ MED |
| ÐŸÐ°Ð½ÐµÐ»Ð¸ Ñ broken round-trip (export Ð±ÐµÐ· import) | **9** | ðŸŸ¡ MED |
| Killer-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² NOT exposed as Builder tool | **8 of 8** | ðŸ”´ HIGH |
| Cross-panel navigate() calls | 14 (Ð¼Ð°Ð»Ð¾ Ð´Ð»Ñ 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹) | ðŸŸ¡ MED |
| agentMemory table Ð±ÐµÐ· UI | 1 | ðŸŸ¡ MED |
| debateMemory link Ð¾Ñ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÐµÑ‚ | 1 | ðŸŸ¡ MED |
| Domain unified overviews Ð¾Ñ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÑŽÑ‚ | 3 (agents, memory, debates) | ðŸŸ¡ MED |
| Settings Ð±ÐµÐ· search/tooltips | 2 gaps | ðŸŸ¡ LOW |
| Assistant catalog Ð½ÐµÐ²Ð¾ÑÑ‚Ñ€ÐµÐ±Ð¾Ð²Ð°Ð½ | 1 (ÑÐ¼. Accessibility Map) | ðŸŸ¡ MED |
| 64 Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð±ÐµÐ· wiki | 64 (ÑÐ¼. Accessibility Map Â§5.1) | ðŸ”´ HIGH |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹ (top-5):**
1. **Builder Ð½Ðµ Ð¼Ð¾Ð¶ÐµÑ‚ Ð²Ñ‹Ð·Ñ‹Ð²Ð°Ñ‚ÑŒ killer-ÑÐµÑ€Ð²Ð¸ÑÑ‹** (crystal, synthesis, lenses, time-machine) â€” Builder = Ñ‚Ð¾Ð»ÑŒÐºÐ¾ agent/router/guardrail/tool
2. **9 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ broken round-trip** â€” export Ð±ÐµÐ· import (Ð½ÐµÐ»ÑŒÐ·Ñ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¸Ð· Ð±ÑÐºÐ°Ð¿Ð°)
3. **ÐÐµÑ‚ debateâ†’memory provenance** â€” Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¾Ñ‚ÑÐ»ÐµÐ´Ð¸Ñ‚ÑŒ, ÐºÐ°ÐºÐ¸Ðµ memories Ð¿Ð¾Ð²Ð»Ð¸ÑÐ»Ð¸ Ð½Ð° Ð²Ñ‹Ð²Ð¾Ð´ Ð´ÐµÐ±Ð°Ñ‚Ð¾Ð²
4. **ÐÐµÑ‚ unified agent state overview** â€” 30 ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð² Ð² AgentsPanel, Ð½Ð¾ Ð½ÐµÑ‚ single view
5. **MemoryCenterPanel Ð½Ðµ Ð°Ð³Ñ€ÐµÐ³Ð¸Ñ€ÑƒÐµÑ‚** 8 Ñ‚Ð¸Ð¿Ð¾Ð² Ð¿Ð°Ð¼ÑÑ‚Ð¸

**Gap Score: 5.5/10** â€” Ð¼Ð½Ð¾Ð³Ð¾ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¹ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ð½Ð¾, Ð½Ð¾ critical integration gaps Ð¼ÐµÐ¶Ð´Ñƒ Ð½Ð¸Ð¼Ð¸.

---

## 2. ÐœÐµÑ‚Ð¾Ð´Ð¾Ð»Ð¾Ð³Ð¸Ñ: Ñ‚Ð¸Ð¿Ñ‹ Ð¿Ñ€Ð¾Ð±ÐµÐ»Ð¾Ð²

| # | Ð¢Ð¸Ð¿ Ð¿Ñ€Ð¾Ð±ÐµÐ»Ð° | Ð§Ñ‚Ð¾ Ð¸Ñ‰ÐµÐ¼ | ÐŸÑ€Ð¸Ð¼ÐµÑ€ |
|---|---|---|---|
| 1 | **Missing export** | ÐŸÐ°Ð½ÐµÐ»ÑŒ Ð±ÐµÐ· export | GovernancePanel Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ Ñ€Ð¾Ð»Ð¸, Ð½Ð¾ Ð½ÐµÐ»ÑŒÐ·Ñ export |
| 2 | **Missing import (broken round-trip)** | Export Ð±ÐµÐ· import | ChatPanel exportâ†’JSON, Ð½Ð¾ Ð½ÐµÐ»ÑŒÐ·Ñ import Ð¾Ð±Ñ€Ð°Ñ‚Ð½Ð¾ |
| 3 | **Service not exposed** | Ð¡ÐµÑ€Ð²Ð¸Ñ ÐµÑÑ‚ÑŒ, Ð½Ð¾ Ð½Ðµ Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ÑÑ Ñ‡ÐµÑ€ÐµÐ· UI/Builder | crystalVault Ð½ÐµÐ»ÑŒÐ·Ñ Ð²Ñ‹Ð·Ð²Ð°Ñ‚ÑŒ Ð¸Ð· Builder |
| 4 | **Missing cross-link** | ÐžÐ±ÑŠÐµÐºÑ‚Ñ‹ Ð½Ðµ ÑÐ²ÑÐ·Ð°Ð½Ñ‹ | Debate â†’ Memory (Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð»Ð° memory X?) |
| 5 | **Missing unified overview** | Multiple components, no single view | Agents: 30 tabs, no Â«state of allÂ» |
| 6 | **Missing search/filter** | ÐÐµÑ‚ Ð¿Ð¾Ð¸ÑÐºÐ° Ð² Ð´Ð¾Ð¼ÐµÐ½Ðµ | Settings Ð±ÐµÐ· search |
| 7 | **Missing batch operation** | Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð¿Ð¾ Ð¾Ð´Ð½Ð¾Ð¼Ñƒ | Mass approve all alerts? |
| 8 | **Missing sharing/collaboration** | Single-user only | FederatedMemory experimental, Ð½Ð¾ Ð½Ðµ Ð´Ð»Ñ team |
| 9 | **Missing API/SDK** | Ð¢Ð¾Ð»ÑŒÐºÐ¾ UI, Ð½ÐµÑ‚ programmatic access | Wiki API Ð´Ð»Ñ external scripts? |
| 10 | **Missing notifications** | Ð¡Ð¾Ð±Ñ‹Ñ‚Ð¸Ðµ ÐµÑÑ‚ÑŒ, Ð½Ð¾ Ð½Ðµ notifies | Crystal refuted â€” ÑƒÐ²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ðµ? |

**ÐŸÑ€Ð¸Ð½Ñ†Ð¸Ð¿:** Ð¸Ñ‰ÐµÐ¼ Ð½Ðµ Ð±Ð°Ð³Ð¸, Ð° **Ð¾Ñ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÑŽÑ‰Ð¸Ðµ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸**, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ Ð·Ð°ÐºÑ€Ð¾ÑŽÑ‚ Ñ€ÐµÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð½Ð¾ÑÑ‚Ð¸.

---

## 3. ðŸ”´ Builder integration gaps â€” killer-ÑÐµÑ€Ð²Ð¸ÑÑ‹ Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹

### 3.1. Builder Ð¼Ð¾Ð¶ÐµÑ‚ Ð²Ñ‹Ð·Ñ‹Ð²Ð°Ñ‚ÑŒ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 4 node-type

`src/components/BuilderPanel/ComponentPalette.tsx`:

```typescript
const paletteItems = [
    { type: 'agent', icon: Bot, ... },      // agent node
    { type: 'router', icon: GitBranch, ... }, // routing decision
    { type: 'guardrail', icon: ShieldCheck, ... }, // safety check
    { type: 'tool', icon: Blocks, ... },     // toolService.getTools()
];
```

**`tool` node Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ `toolService.getTools()`** â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð·Ð°Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ tools.

### 3.2. 8 killer-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² NOT exposed as Builder tool

| Ð¡ÐµÑ€Ð²Ð¸Ñ | Ð¦ÐµÐ½Ð½Ð¾ÑÑ‚ÑŒ (Ð¸Ð· Feature Value Map) | Exposed as Builder tool? | Gap |
|---|:---:|---|---|
| `crystalVault` â­ | 9/10 | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð¿Ð¾ÑÑ‚Ñ€Ð¾Ð¸Ñ‚ÑŒ pipeline Â«debate â†’ save conclusion as crystalÂ» |
| `synthesisEngine` â­ | 9/10 | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Â«multi-perspective â†’ synthesis â†’ exportÂ» Ð² pipeline |
| `lensEngine` | 7.5/10 | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Â«apply lens X to data YÂ» Ð² pipeline |
| `timeMachineService` â­ | 8/10 | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Â«snapshot before risky operationÂ» |
| `federatedMemoryService` | 4/10 (experimental) | âŒ NO | Experimental, but could be in pipeline |
| `forumService` | 6/10 | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Â«post synthesis to forumÂ» Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸ |
| `directorService` | 6/10 | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Â«run director scenarioÂ» Ð² pipeline |
| `memoryOrchestrator` | 8/10 | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Â«search memory â†’ feed to agentÂ» Ð² pipeline |

**Ð’ÑÐµ 8 killer-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹ Ñ‡ÐµÑ€ÐµÐ· Builder.** Ð­Ñ‚Ð¾ **Ð³Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ñ‹Ð¹ Ð¿Ñ€Ð¾Ð±ÐµÐ»** â€” Builder Ð¼Ð¾Ð¶ÐµÑ‚ ÑÑ‚Ñ€Ð¾Ð¸Ñ‚ÑŒ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ agent/router/guardrail/tool pipelines, Ð½Ð¾ Ð½Ðµ cognitive pipelines Ñ synthesis/crystal/lens.

### 3.3. ÐŸÑ€Ð¸Ð¼ÐµÑ€ pipeline, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ð¹ ÐÐ•Ð›Ð¬Ð—Ð¯ Ð¿Ð¾ÑÑ‚Ñ€Ð¾Ð¸Ñ‚ÑŒ

```
[Agent: gather info] â†’ [Lens: apply security lens] â†’ [Synthesis: multi-perspective] â†’ [Crystal: save as crystal] â†’ [Forum: post for review]
```

ÐšÐ°Ð¶Ð´Ñ‹Ð¹ ÑˆÐ°Ð³ = killer-ÑÐµÑ€Ð²Ð¸Ñ. **ÐÐ¸ Ð¾Ð´Ð¸Ð½ Ð½Ðµ exposed as Builder node.**

---

## 4. Export / Import gaps

### 4.1. 11 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð±ÐµÐ· export ðŸ”´

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð§Ñ‚Ð¾ Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ | ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ Ð½ÑƒÐ¶ÐµÐ½ export |
|---|---|---|
| `GovernancePanel` | RBAC roles | Audit / backup role assignments |
| `DirectorPanel` | Ð¡Ñ†ÐµÐ½Ð°Ñ€Ð¸Ð¸ | Share scenarios Ð¼ÐµÐ¶Ð´Ñƒ ÑƒÑÑ‚Ð°Ð½Ð¾Ð²ÐºÐ°Ð¼Ð¸ |
| `AquariumPanel` | (decorative) | Low priority |
| `LensesPanel` | Custom lenses | Share lens definitions |
| `PolicyPanel` | Policies | Compliance / audit |
| `GuardrailsPanel` | Guardrail rules | Backup safety config |
| `MCPPanel` | MCP server configs | Backup / share |
| `ConnectorsPanel` | Connector configs | Backup / share |
| `PlannerPanel` | Plans | Backup plans |
| `AnalyticsPanel` | Custom analytics | Export reports |
| `TracesPanel` | Execution traces | Share for debugging |
| `HealthPanel` | Health snapshots | Share diagnostics |

### 4.2. 9 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ broken round-trip (export Ð±ÐµÐ· import) ðŸ”´

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Has export? | Has import? | Gap |
|---|---|---|---|
| `ChatPanel` | âœ… (ChatExportPanel, 9 refs) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ chat Ð¸Ð· backup |
| `MemoryPanel` | âœ… (15 files) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ memory dump |
| `CrystalVaultPanel` | âœ… (4 files) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ crystals |
| `RolesPanel` | âœ… (32 files) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ role config |
| `SettingsPanel` | âœ… (11 files) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ settings |
| `KnowledgePanel` | âœ… (6 files) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ knowledge base |
| `BuilderPanel` | âœ… (6 files) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ workflows |
| `BudgetPanel` | âœ… (6 files) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ budget config |
| `HealthPanel` | (limited) | âŒ NO | ÐÐµÐ»ÑŒÐ·Ñ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ health snapshot |

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¼Ð¾Ð¶ÐµÑ‚ export ÑÐ²Ð¾Ð¸ Ð´Ð°Ð½Ð½Ñ‹Ðµ, Ð½Ð¾ **Ð½Ðµ Ð¼Ð¾Ð¶ÐµÑ‚ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ** Ð¸Ð· backup. Ð­Ñ‚Ð¾ violates local-first principle.

### 4.3. ExportImportPanel exists, Ð½Ð¾ coverage partial

`src/components/ExportImportPanel.tsx` (643 ÑÑ‚Ñ€Ð¾ÐºÐ¸) â€” generic export/import. ÐÐ¾ ÑÑƒÐ´Ñ Ð¿Ð¾ gaps Ð²Ñ‹ÑˆÐµ, **Ð½Ðµ Ð¿Ð¾ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ Ð²ÑÐµ Ð´Ð¾Ð¼ÐµÐ½Ñ‹**.

---

## 5. Cross-linking gaps â€” Ð½ÐµÑ‚ navigation Ð¼ÐµÐ¶Ð´Ñƒ ÑÐ²ÑÐ·Ð°Ð½Ð½Ñ‹Ð¼Ð¸ Ð¾Ð±ÑŠÐµÐºÑ‚Ð°Ð¼Ð¸

### 5.1. Agent â†” Memory linking ðŸŸ¡

**EVIDENCE:** `dexie-schema.ts` Ð¸Ð¼ÐµÐµÑ‚ Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ñƒ `agentMemory` (`'++id, agentId, type, createdAt, expiresAt'`).

**ÐÐž:** Ð² UI AgentsPanel **Ð½ÐµÑ‚ Ñ‚Ð°Ð±Ð°** Â«Memory written by this agentÂ». MemoryPanel Ð½Ðµ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ Â«which agent wrote this memoryÂ».

**Gap:** Ð½ÐµÐ»ÑŒÐ·Ñ Ð¿Ñ€Ð¾ÑÐ»ÐµÐ´Ð¸Ñ‚ÑŒ provenance â€” ÐºÐ°ÐºÐ¾Ð¹ Ð°Ð³ÐµÐ½Ñ‚ Ð½Ð°Ð¿Ð¸ÑÐ°Ð» ÐºÐ°ÐºÑƒÑŽ memory.

### 5.2. Debate â†” Memory linking ðŸ”´

**Gap:** Ð½ÐµÑ‚ link Â«debate X used memories Y, ZÂ» â€” Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¾Ñ‚ÑÐ»ÐµÐ´Ð¸Ñ‚ÑŒ, ÐºÐ°ÐºÐ¸Ðµ memories Ð¿Ð¾Ð²Ð»Ð¸ÑÐ»Ð¸ Ð½Ð° Ð²Ñ‹Ð²Ð¾Ð´ Ð´ÐµÐ±Ð°Ñ‚Ð¾Ð².

**Search:** `grep -rE "debateMemory|debate.*memory.*link|memoryUsedIn"` â†’ **0 results**.

### 5.3. Decision â†” Crystal linking ðŸŸ¡

**EVIDENCE:** `SynthesisPanel` Ð¸Ð¼ÐµÐµÑ‚ `exportToCrystal(id)` â€” synthesis â†’ crystal.

**ÐÐž:** DecisionLogPanel Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ decisions, Ð½Ð¾ **Ð½ÐµÑ‚ link** Â«decision X based on crystal YÂ».

### 5.4. Cross-panel navigation â€” Ð¼Ð°Ð»Ð¾ `navigate()` calls

**Ð¢Ð¾Ð»ÑŒÐºÐ¾ 14 `navigate()` calls Ð² components** (Ð´Ð»Ñ 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ = 5%).

**ÐŸÑ€Ð¸Ð¼ÐµÑ€Ñ‹ missing cross-links:**
- Ð’ HealthPanel, Ð¿Ñ€Ð¸ red status Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð° â€” Ð½ÐµÑ‚ Â«Open in ProviderManagerÂ» link
- Ð’ TracesPanel, Ð¿Ñ€Ð¸ trace agent X â€” Ð½ÐµÑ‚ Â«Open agent in AgentsPanelÂ»
- Ð’ BudgetPanel, Ð¿Ñ€Ð¸ budget alert â€” Ð½ÐµÑ‚ Â«Open SREAgentPanel for optimizationÂ»
- Ð’ DebateArena, Ð¿Ñ€Ð¸ debate Ñ agent X â€” Ð½ÐµÑ‚ Â«Open agent historyÂ»
- Ð’ CrystalVaultPanel, Ð¿Ñ€Ð¸ crystal from debate Y â€” Ð½ÐµÑ‚ Â«Open debate YÂ»

### 5.5. Knowledge graph navigation ðŸŸ¡

**GraphWorkbenchPanel** (585 ÑÑ‚Ñ€Ð¾Ðº + 5 lens) â€” Ð²Ð¸Ð·ÑƒÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ Ð³Ñ€Ð°Ñ„Ð°, Ð½Ð¾:
- 5 Ð»Ð¸Ð½Ð· (Calibration/Coverage/Debate/Embeddings/Keys) â€” analytical, Ð½Ðµ navigation
- Click Ð¿Ð¾ ÑƒÐ·Ð»Ñƒ â†’ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ details, Ð½Ð¾ Ð½Ðµ navigate Ðº related Ð¾Ð±ÑŠÐµÐºÑ‚Ñƒ

**WikiGraphService** (122 ÑÑ‚Ñ€Ð¾ÐºÐ¸) â€” graph queries (similarity, communities), Ð½Ð¾ **Ð½ÐµÑ‚ UI** Ð´Ð»Ñ Â«show related entitiesÂ».

---

## 6. Missing unified overviews

### 6.1. Agents â€” Ð½ÐµÑ‚ ÐµÐ´Ð¸Ð½Ð¾Ð³Ð¾ Â«state of all agentsÂ» view ðŸ”´

**AgentsPanel** ÑÐ¾Ð´ÐµÑ€Ð¶Ð¸Ñ‚ 30 ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð²:

```
AgentAvatar, AgentCapabilitiesTab, AgentCard, AgentComparison, AgentConfigTab,
AgentDetailPanel, AgentGroupsSection, AgentHandoffsTab, AgentHistoryTab,
AgentIdentityEditor, AgentInfraTab, AgentObservabilityTab, AgentPolicySection,
AgentProfileTab, AgentStatsDashboard, AgentWizard, AgentsPanelContainer,
AgentsPanelContext, AgentsPanelView, AgentsTable, EloLeaderboard, LiveActivityStream,
QuickCreateAgentModal, agent-templates, sidebar-tabs, ...
```

**Ð•ÑÑ‚ÑŒ:** AgentStatsDashboard (ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°), LiveActivityStream (activity), EloLeaderboard (ratings).

**ÐÐ•Ð¢:** ÐµÐ´Ð¸Ð½Ð¾Ð³Ð¾ overview Â«all agents, current state, health, last activity, current taskÂ» Ð² Ð¾Ð´Ð½Ð¾Ð¼ view.

**Gap:** Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð¿Ð¾Ð½ÑÑ‚ÑŒ Â«Ñ‡Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÑŽÑ‚ Ð²ÑÐµ Ð°Ð³ÐµÐ½Ñ‚Ñ‹ ÑÐµÐ¹Ñ‡Ð°ÑÂ» â€” Ð½ÑƒÐ¶Ð½Ð¾ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¾ Ñ‚Ð°Ð±Ð¾Ð².

### 6.2. Memory â€” 8 Ñ‚Ð¸Ð¿Ð¾Ð², Ð½ÐµÑ‚ unified overview ðŸŸ¡

**8 IMemoryStore Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹** (working/procedural/semantic/episodic/social/service-backed/spatial/emotional â€” ÑÐ¼. Duplication Map Â§5.1).

**MemoryCenterPanel** ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚, Ð½Ð¾ **Ð½Ðµ Ð°Ð³Ñ€ÐµÐ³Ð¸Ñ€ÑƒÐµÑ‚** Ð²ÑÐµ 8 Ñ‚Ð¸Ð¿Ð¾Ð² Ð² single view. MemoryPanel (Ð³Ð»Ð°Ð²Ð½Ð°Ñ) Ñ„Ð¾ÐºÑƒÑÐ¸Ñ€ÑƒÐµÑ‚ÑÑ Ð½Ð° search.

**Gap:** Ð½ÐµÑ‚ Â«all memory types overviewÂ» â€” ÑÐºÐ¾Ð»ÑŒÐºÐ¾ episodic vs semantic vs emotional entries, Ð¸Ñ… distribution over time, cross-references.

### 6.3. Debates â€” Ð½ÐµÑ‚ Â«all debates stateÂ» view ðŸŸ¡

**DebatesManagerPanel** (714 ÑÑ‚Ñ€Ð¾Ðº) â€” Ð¼ÐµÐ½ÐµÐ´Ð¶ÐµÑ€ Ð´ÐµÐ±Ð°Ñ‚Ð¾Ð², Ð½Ð¾ Ñ„Ð¾ÐºÑƒÑ Ð½Ð° list + manage.

**Gap:** Ð½ÐµÑ‚ unified Â«current debates: live/paused/completed, participants, rounds remaining, expected conclusion timeÂ».

### 6.4. Providers â€” Ð½ÐµÑ‚ Â«all providers stateÂ» view ðŸŸ¡

**ProviderDashboard** (670 ÑÑ‚Ñ€Ð¾Ðº) â€” dashboard, Ð½Ð¾ overlap Ñ ProviderManager (ÑÐ¼. Duplication Map Â§3.3).

**Gap:** unified Â«all providers: health, latency, cost, reputation, last errorÂ» Ð² Ð¾Ð´Ð½Ð¾Ð¼ real-time view.

### 6.5. Background services â€” Ð½ÐµÑ‚ unified Â«what's runningÂ» view ðŸ”´

**15+ background `setInterval`** Ð² ÑÐµÑ€Ð²Ð¸ÑÐ°Ñ… (heartbeat, cleanup, snapshot, monitor â€” ÑÐ¼. Resource Map Â§4).

**Gap:** Ð½ÐµÑ‚ UI Â«all background timers: active, last tick, next tick, error countÂ». Ð¢Ð¾Ð»ÑŒÐºÐ¾ MemoryWatchdog Ð² Ð»Ð¾Ð³Ð°Ñ….

---

## 7. Missing search/filter capabilities

### 7.1. Settings Ð±ÐµÐ· search ðŸ”´

**SettingsPanel** â€” 8 Ñ‚Ð°Ð±Ð¾Ð² (General/Writing/Reading/Alerts/Advanced/Notifications/Appearance/Prompts), **Ð½ÐµÑ‚ search**.

**Gap:** Ð½Ð°Ð¹Ñ‚Ð¸ ÐºÐ¾Ð½ÐºÑ€ÐµÑ‚Ð½ÑƒÑŽ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÑƒ (Ð½Ð°Ð¿Ñ€Ð¸Ð¼ÐµÑ€, Â«rate limit thresholdÂ») â€” Ð½ÑƒÐ¶Ð½Ð¾ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Ð²ÑÐµ 8 Ñ‚Ð°Ð±Ð¾Ð².

### 7.2. AgentsPanel â€” Ð½ÐµÑ‚ global filter ðŸŸ¡

30 ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð², Ð½Ð¾ Ð½ÐµÑ‚ ÐµÐ´Ð¸Ð½Ð¾Ð³Ð¾ filter Â«show only agents with status=X, role=Y, last active > ZÂ».

### 7.3. Debates â€” Ð½ÐµÑ‚ filter by technique ðŸŸ¡

**75 Ñ‚ÐµÑ…Ð½Ð¸Ðº ÐºÐ°Ñ‡ÐµÑÑ‚Ð²Ð°** + **33 ÑÑ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ð¸**, Ð½Ð¾ Ð² DebatesManagerPanel Ð½ÐµÑ‚ filter Â«show debates using technique XÂ».

### 7.4. Memory â€” Ð½ÐµÑ‚ filter by type ðŸŸ¡

8 Ñ‚Ð¸Ð¿Ð¾Ð² Ð¿Ð°Ð¼ÑÑ‚Ð¸, Ð½Ð¾ MemoryPanel Ð½Ðµ Ñ„Ð¸Ð»ÑŒÑ‚Ñ€ÑƒÐµÑ‚ Ð¿Ð¾ Ñ‚Ð¸Ð¿Ñƒ (episodic vs semantic vs emotionalâ€¦).

### 7.5. Wiki â€” Ð½ÐµÑ‚ autocomplete ðŸŸ¡

WikiPanel has search, Ð½Ð¾ Ð½ÐµÑ‚ autocomplete suggestions Ð¿Ñ€Ð¸ typing.

---

## 8. Missing batch operations

### 8.1. GovernancePanel â€” Ð½ÐµÑ‚ mass role assignment ðŸŸ¡

Ð¢Ð¾Ð»ÑŒÐºÐ¾ single-user role assignment. ÐÐµÐ»ÑŒÐ·Ñ Â«assign role X to users [A, B, C]Â».

### 8.2. ApprovalsPanel â€” Ð½ÐµÑ‚ mass approve/reject ðŸŸ¡

`approvals` route ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚, Ð½Ð¾ **Ð½ÐµÑ‚** Â«approve all pending approvals from agent XÂ».

### 8.3. AgentsPanel â€” Ð½ÐµÑ‚ mass deploy/configure ðŸŸ¡

ÐÐµÐ»ÑŒÐ·Ñ Â«deploy same skill to agents [A, B, C]Â» Ð¸Ð»Ð¸ Â«set same policy to all pro agentsÂ».

### 8.4. MemoryPanel â€” Ð½ÐµÑ‚ mass delete/tag ðŸŸ¡

ÐÐµÐ»ÑŒÐ·Ñ Â«delete all memories older than XÂ» Ð¸Ð»Ð¸ Â«tag all memories from debate Y as `debate-Y`Â».

### 8.5. TracesPanel â€” Ð½ÐµÑ‚ mass export ðŸŸ¡

ÐÐµÐ»ÑŒÐ·Ñ Â«export all traces from date X to YÂ» â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ single trace export (ÐµÑÐ»Ð¸ ÐµÑÑ‚ÑŒ).

---

## 9. Missing notifications / proactive alerts

### 9.1. Crystal refuted â€” Ð½ÐµÑ‚ notification ðŸŸ¡

ÐšÐ¾Ð³Ð´Ð° crystal Ð¿Ð¾Ð¼ÐµÑ‡Ð°ÐµÑ‚ÑÑ `refuted`, **Ð½ÐµÑ‚ notification** Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŽ. ÐÑƒÐ¶Ð½Ð¾ Ð¿Ñ€Ð¾Ð²ÐµÑ€Ð¸Ñ‚ÑŒ NotificationsTab settings.

### 9.2. Debate concluded â€” Ð½ÐµÑ‚ notification ðŸŸ¡

ÐšÐ¾Ð³Ð´Ð° Ð´Ð¾Ð»Ð³Ð¸Ð¹ debate Ð·Ð°Ð²ÐµÑ€ÑˆÐ°ÐµÑ‚ÑÑ, Ð½ÐµÑ‚ proactive notification (Ñ‚Ð¾Ð»ÑŒÐºÐ¾ ÐµÑÐ»Ð¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ ÑÐ¼Ð¾Ñ‚Ñ€Ð¸Ñ‚ Ð½Ð° DebateArena).

### 9.3. Provider health degraded â€” notification ÐµÑÑ‚ÑŒ Ñ‡ÐµÑ€ÐµÐ· NavBadge ðŸŸ¢

NavBadge Ð½Ð° Providers Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ health status. âœ…

### 9.4. Budget exceeded â€” notification ÐµÑÑ‚ÑŒ Ñ‡ÐµÑ€ÐµÐ· BudgetAlertsPanel ðŸŸ¢

BudgetAlertsPanel (322 ÑÑ‚Ñ€Ð¾ÐºÐ¸) + polling. âœ…

### 9.5. Memory worker failed â€” Ð½ÐµÑ‚ notification ðŸ”´

`memory-engine.ts`: Â«Worker re-init after clear failedÂ» â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ… (ÑÐ¼. Lifecycle Map Â§14.5). ÐÐµÑ‚ user-visible notification.

### 9.6. Audit #6 double-init â€” Ð½ÐµÑ‚ notification ðŸ”´

Ð•ÑÐ»Ð¸ ÑÐµÑ€Ð²Ð¸Ñ double-subscribe Ð¸Ð·-Ð·Ð° Audit #6 (ÑÐ¼. Lifecycle Map Â§14.1), Ð½ÐµÑ‚ warning.

---

## 10. Missing API/SDK for external access

### 10.1. Wiki API ðŸŸ¡

`WikiGraphService` (122 ÑÑ‚Ñ€Ð¾ÐºÐ¸) + `WikiQueryService` â€” ÐµÑÑ‚ÑŒ services, Ð½Ð¾ **Ð½ÐµÑ‚ REST/CLI API** Ð´Ð»Ñ external scripts.

**Gap:** Ð½ÐµÐ»ÑŒÐ·Ñ Ð¸Ð· Ð²Ð½ÐµÑˆÐ½ÐµÐ³Ð¾ ÑÐºÑ€Ð¸Ð¿Ñ‚Ð° ÑÐ´ÐµÐ»Ð°Ñ‚ÑŒ `wiki.search("crystal")` â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ‡ÐµÑ€ÐµÐ· UI.

### 10.2. Memory API ðŸŸ¡

`memoryOrchestrator` â€” ÐµÑÑ‚ÑŒ service, Ð½Ð¾ Ð½ÐµÑ‚ external API.

**Gap:** Ð½ÐµÐ»ÑŒÐ·Ñ Ð¸Ð· CLI ÑÐ´ÐµÐ»Ð°Ñ‚ÑŒ `memory.search("topic X")`.

### 10.3. Crystal API ðŸŸ¡

`crystalVault` â€” service, Ð½Ð¾ Ð½ÐµÑ‚ external API.

**Gap:** Ð½ÐµÐ»ÑŒÐ·Ñ Ð¸Ð· external script ÑÐ´ÐµÐ»Ð°Ñ‚ÑŒ `crystal.list()` Ð¸Ð»Ð¸ `crystal.propose(...)`.

### 10.4. CLI exists, Ð½Ð¾ coverage? ðŸŸ¡

`cli/` directory ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚. ÐÑƒÐ¶Ð½Ð¾ Ñ€ÐµÐ²ÑŒÑŽ â€” ÐºÐ°ÐºÐ¸Ðµ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñ‹ ÐµÑÑ‚ÑŒ.

### 10.5. Server-side API ðŸŸ¡

`server/` directory + `server/tests/` (8 Ñ‚ÐµÑÑ‚Ð¾Ð²). WebSocket + ws-auth. ÐÐ¾ Ð½Ðµ clear, ÐºÐ°ÐºÐ¸Ðµ commands exposed.

---

## 11. Missing observability of capabilities themselves

### 11.1. ÐÐµÑ‚ Â«capability registryÂ» UI ðŸ”´

**Assistant catalog** (4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸, ÑÐ¼. Accessibility Map Â§8) â€” Ð¾Ð¿Ð¸ÑÑ‹Ð²Ð°ÐµÑ‚ capabilities, Ð½Ð¾ **Ð½ÐµÑ‚ UI** Ð´Ð»Ñ Ð¿Ñ€Ð¾ÑÐ¼Ð¾Ñ‚Ñ€Ð° Â«Ñ‡Ñ‚Ð¾ ÑƒÐ¼ÐµÐµÑ‚ ÑÐ¸ÑÑ‚ÐµÐ¼Ð°Â».

**Gap:** Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð¼Ð¾Ð¶ÐµÑ‚ Ð¿Ð¾ÑÐ¼Ð¾Ñ‚Ñ€ÐµÑ‚ÑŒ Â«all capabilities of this OSÂ» Ð² Ð¾Ð´Ð½Ð¾Ð¼ Ð¼ÐµÑÑ‚Ðµ.

### 11.2. ÐÐµÑ‚ Â«service registryÂ» UI ðŸŸ¡

**549 service registrations** Ð² 81 phase-Ñ„Ð°Ð¹Ð»Ðµ (ÑÐ¼. Resource Map Â§3.2). **ServiceRegistryPanel** ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚ (`/service-registry`), Ð½Ð¾ Ð½ÑƒÐ¶Ð½Ð¾ Ñ€ÐµÐ²ÑŒÑŽ coverage.

### 11.3. ÐÐµÑ‚ Â«event registryÂ» UI ðŸŸ¡

**198 event schemas** Ð² `event-registry.ts` (2 772 ÑÑ‚Ñ€Ð¾ÐºÐ¸). **ÐÐµÑ‚ UI** Ð´Ð»Ñ Ð¿Ñ€Ð¾ÑÐ¼Ð¾Ñ‚Ñ€Ð° Ð²ÑÐµÑ… ÑÐ¾Ð±Ñ‹Ñ‚Ð¸Ð¹.

### 11.4. ÐÐµÑ‚ Â«policy registryÂ» UI ðŸŸ¡

**PolicyService** + policies Ð² IndexedDB. **ÐÐµÑ‚ UI** Ð´Ð»Ñ Ð¿Ñ€Ð¾ÑÐ¼Ð¾Ñ‚Ñ€Ð° Ð²ÑÐµÑ… active policies.

---

## 12. Ð¡Ð²Ð¾Ð´Ð½Ð°Ñ ÐºÐ°Ñ€Ñ‚Ð° Ð¿Ñ€Ð¾Ð±ÐµÐ»Ð¾Ð² â€” 42 Ð¿ÑƒÐ½ÐºÑ‚Ð°

### 12.1. ÐŸÐ¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑÐ¼

| ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ | ÐšÐ¾Ð»-Ð²Ð¾ gaps | Priority |
|---|---:|---|
| Builder integration (8 killer-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²) | 8 | ðŸ”´ P0 |
| Missing export | 11 | ðŸŸ¡ P1 |
| Broken round-trip (export Ð±ÐµÐ· import) | 9 | ðŸŸ¡ P1 |
| Cross-linking (agentâ†”memory, debateâ†”memory, etc.) | 5 | ðŸŸ¡ P1 |
| Unified overviews (agents, memory, debates, providers, background) | 5 | ðŸŸ¡ P1 |
| Missing search/filter | 5 | ðŸŸ¡ P2 |
| Missing batch operations | 5 | ðŸŸ¡ P2 |
| Missing notifications | 3 | ðŸŸ¡ P2 |
| Missing external API/SDK | 5 | ðŸŸ¢ P3 |
| Missing capability/event/policy registry UI | 4 | ðŸŸ¢ P3 |
| **Total** | **~60 sub-gaps** Ð² **42 Ð¿ÑƒÐ½ÐºÑ‚Ð°Ñ…** | â€” |

### 12.2. Top-10 critical gaps (close first)

| # | Gap | ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ critical |
|---|---|---|
| 1 | **Builder Ð½Ðµ Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ killer-ÑÐµÑ€Ð²Ð¸ÑÑ‹** (crystal/synthesis/lens/time-machine) | Builder = Ñ‚Ð¾Ð»ÑŒÐºÐ¾ agent/router/guardrail/tool; cognitive pipelines Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ñ‹ |
| 2 | **9 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ broken round-trip** (export Ð±ÐµÐ· import) | Local-first violated â€” Ð½ÐµÐ»ÑŒÐ·Ñ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¸Ð· backup |
| 3 | **ÐÐµÑ‚ debateâ†’memory provenance** | ÐÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¾Ñ‚ÑÐ»ÐµÐ´Ð¸Ñ‚ÑŒ influence |
| 4 | **ÐÐµÑ‚ unified agent state overview** | 30 ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð², Ð½ÐµÑ‚ single view |
| 5 | **agentMemory table Ð±ÐµÐ· UI** | Schema ÐµÑÑ‚ÑŒ, UI Ð½ÐµÑ‚ |
| 6 | **MemoryCenter Ð½Ðµ Ð°Ð³Ñ€ÐµÐ³Ð¸Ñ€ÑƒÐµÑ‚ 8 Ñ‚Ð¸Ð¿Ð¾Ð² Ð¿Ð°Ð¼ÑÑ‚Ð¸** | Fragmented view |
| 7 | **Ð¢Ð¾Ð»ÑŒÐºÐ¾ 14 navigate() calls** | Cross-panel navigation ÑÐ»Ð°Ð±Ð°Ñ |
| 8 | **Settings Ð±ÐµÐ· search** | 8 Ñ‚Ð°Ð±Ð¾Ð² Ð±ÐµÐ· search |
| 9 | **ÐÐµÑ‚ capability registry UI** | Assistant catalog 4832 ÑÑ‚Ñ€Ð¾ÐºÐ¸ Ð½ÐµÐ²Ð¸Ð´Ð¸Ð¼ |
| 10 | **Background services Ð±ÐµÐ· UI overview** | 15+ timers Ð½ÐµÐ²Ð¸Ð´Ð¸Ð¼Ñ‹ |

---

## 13. Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ð¸ â€” Ð·Ð°ÐºÑ€Ñ‹Ð²Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹, Ð½Ðµ Ð´Ð¾Ð±Ð°Ð²Ð»ÑÑ‚ÑŒ random features

### ðŸ”´ P0 â€” Ð·Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ Ð½ÐµÐ¼ÐµÐ´Ð»ÐµÐ½Ð½Ð¾ (high-impact, low-effort)

1. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Builder nodes Ð´Ð»Ñ killer-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²**: `<CrystalNode>`, `<SynthesisNode>`, `<LensNode>`, `<TimeMachineNode>`, `<MemoryNode>`, `<ForumNode>`, `<DirectorNode>`. ÐšÐ°Ð¶Ð´Ñ‹Ð¹ = expose existing service as Builder-callable node. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: cognitive pipeline gap.**

2. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ import Ð² 9 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ export**: ChatPanel, MemoryPanel, CrystalVaultPanel, RolesPanel, SettingsPanel, KnowledgePanel, BuilderPanel, BudgetPanel, HealthPanel. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÑŒ existing `ExportImportPanel` infrastructure. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: round-trip gap.**

3. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ debateâ†’memory provenance link**: Ð¿Ñ€Ð¸ RAG-debate, ÑÐ¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ `memoryIds: string[]` Ð² debate record. Ð’ DebatePanel Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Â«Memory used: [link to memory]Â». Ð’ MemoryPanel Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Â«Used in debates: [link to debate]Â». **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: cross-linking gap.**

4. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ agentMemory UI**: Ð² AgentsPanel Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ñ‚Ð°Ð± Â«Memory written by this agentÂ» (Ñ‡Ð¸Ñ‚Ð°ÐµÑ‚ `agentMemory` table). Ð’ MemoryPanel Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ filter Â«by author agentÂ». **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: agentâ†”memory gap.**

### ðŸŸ¡ P1 â€” Ð²Ð°Ð¶Ð½Ð¾Ðµ (Ð² ÐºÐ²Ð°Ñ€Ñ‚Ð°Ð»)

5. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ unified Â«Agent State OverviewÂ»**: single view Â«all agents, current state, health, last activity, current task, EloÂ». Aggregate Ð¸Ð· AgentStatsDashboard + LiveActivityStream + EloLeaderboard. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: unified overview gap.**

6. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ unified Â«Memory Types OverviewÂ»**: Ð² MemoryCenterPanel aggregate 8 IMemoryStore impls â€” Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ distribution by type, cross-references, timeline. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: memory fragmentation gap.**

7. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ unified Â«Background Services OverviewÂ»**: Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð²ÑÐµ 15+ `setInterval` timers â€” name, interval, last tick, next tick, error count. Ð’ HealthPanel Ð¸Ð»Ð¸ Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð°Ñ `BackgroundServicesPanel`. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: invisible background gap.**

8. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ cross-panel navigation links**: Ð² HealthPanel Ð¿Ñ€Ð¸ red provider â†’ Â«Open in ProviderManagerÂ». Ð’ TracesPanel Ð¿Ñ€Ð¸ agent trace â†’ Â«Open agentÂ». Ð’ BudgetAlertsPanel â†’ Â«Open SREAgentPanelÂ». ÐœÐ¸Ð½Ð¸Ð¼ÑƒÐ¼ 20+ Ñ‚Ð°ÐºÐ¸Ñ… links. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: cross-linking gap.**

9. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ search Ð² SettingsPanel**: filter Ð¿Ð¾ Ð²ÑÐµÐ¼ 8 Ñ‚Ð°Ð±Ð°Ð¼ Ð¾Ð´Ð½Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: settings search gap.**

10. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ export Ð² 11 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð±ÐµÐ· Ð½ÐµÐ³Ð¾**: Governance, Director, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÑŒ existing pattern (`createObjectURL` + `a.download`). **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: export gap.**

### ðŸŸ¢ P2 â€” ÑÑ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ (Ð´Ð¾Ð»Ð³Ð¾ÑÑ€Ð¾Ñ‡Ð½Ð¾)

11. **Capability Registry UI**: Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð°Ñ Ð¿Ð°Ð½ÐµÐ»ÑŒ Â«What can this OS do?Â» â€” aggregate Ð¸Ð· `panel-actions-catalog.ts` (4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸) + service registry + event registry. Search, filter by category. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: invisible capabilities gap.**

12. **Event Registry UI**: Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð²ÑÐµ 198 event schemas, ÐºÑ‚Ð¾ emit, ÐºÑ‚Ð¾ subscribe. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: invisible events gap.**

13. **Mass operations**: mass approve/reject Ð² ApprovalsPanel, mass role assign Ð² Governance, mass deploy skill Ð² Agents, mass delete/tag Ð² Memory. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: batch gap.**

14. **External API/SDK**: REST/CLI Ð´Ð»Ñ Wiki, Memory, Crystal, Debate â€” Ð¿Ð¾Ð·Ð²Ð¾Ð»Ð¸Ñ‚ÑŒ external scripts. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: API gap.**

15. **Notifications Ð´Ð»Ñ silent failures**: crystal refuted, debate concluded, memory worker failed, Audit #6 double-init â€” Ð²ÑÐµ Ð´Ð¾Ð»Ð¶Ð½Ñ‹ emit `EVENTS.NOTIFICATION`. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: silent failure gap.**

16. **Filter by technique in DebatesManager**: Â«show debates using technique XÂ» Ð¸Ð· 75 Ñ‚ÐµÑ…Ð½Ð¸Ðº. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: filter gap.**

17. **Memory filter by type**: episodic vs semantic vs emotional Ð² MemoryPanel. **Ð—Ð°ÐºÑ€Ð¾ÐµÑ‚: filter gap.**

---

## 14. Ð˜Ñ‚Ð¾Ð³Ð¾Ð²Ñ‹Ð¹ Ð²ÐµÑ€Ð´Ð¸ÐºÑ‚ Ð¿Ð¾ functional gaps

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | ÐžÑ†ÐµÐ½ÐºÐ° | ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹ |
|---|:---:|---|
| Builder integration coverage | ðŸ”´ 3/10 | Ð¢Ð¾Ð»ÑŒÐºÐ¾ 4 node-types, 0 of 8 killer-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² exposed |
| Export coverage | ðŸŸ¡ 6/10 | 16 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ export, 11 Ð±ÐµÐ· |
| Import coverage (round-trip) | ðŸ”´ 4/10 | 9 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ broken round-trip |
| Cross-linking | ðŸŸ¡ 5/10 | 14 navigate() calls, debateâ†’memory missing |
| Unified overviews | ðŸŸ¡ 5/10 | DashboardPanel ÐµÑÑ‚ÑŒ, Ð½Ð¾ domain-specific missing |
| Search/filter in panels | ðŸŸ¡ 6/10 | Settings Ð±ÐµÐ· search, Ð¾ÑÑ‚Ð°Ð»ÑŒÐ½Ð¾Ðµ moderate |
| Batch operations | ðŸ”´ 4/10 | Almost none |
| Notifications for silent events | ðŸŸ¡ 6/10 | Provider/Budget ÐµÑÑ‚ÑŒ, crystal/memory worker Ð½ÐµÑ‚ |
| External API/SDK | ðŸŸ¡ 5/10 | CLI + server exist, coverage unclear |
| Capability/event/policy registry UI | ðŸ”´ 3/10 | Catalogs hidden in code |
| **Overall Gap Score** | **5.5/10** | Ð¼Ð½Ð¾Ð³Ð¾ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¹, Ð½Ð¾ critical integration gaps |

**Ð¡Ð¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹ (Ñ‡Ñ‚Ð¾ ÐÐ• gap):**
- **Export exists Ð² 16 Ð¿Ð°Ð½ÐµÐ»ÑÑ…** â€” Chat, Debate, Memory, Knowledge, Crystal, Synthesis, Agents, Roles, Tasks, Budget, Health, Traces, Logs, Settings, Wiki, Builder
- **ChatExportPanel** â€” rich export (Markdown + JSON + HTML)
- **DecisionLogPanel + AuditLogView** â€” export Ð² JSON + CSV
- **Synthesis â†’ Crystal linking** (`exportToCrystal`) â€” ÐµÐ´Ð¸Ð½ÑÑ‚Ð²ÐµÐ½Ð½Ñ‹Ð¹ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÑŽÑ‰Ð¸Ð¹ cross-domain link
- **WikiGraphService** â€” graph queries ÐµÑÑ‚ÑŒ (Ð½Ð¾ UI limited)
- **DashboardPanel** â€” 18 ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð², Ð¾Ð±Ñ‰Ð¸Ð¹ overview
- **AgentStatsDashboard + LiveActivityStream + EloLeaderboard** â€” partial agent overview
- **MemoryWatchdog** â€” Ð²ÑÑ‚Ñ€Ð¾ÐµÐ½Ð½Ñ‹Ð¹ monitoring (Ð½Ð¾ Ð² Ð»Ð¾Ð³Ð°Ñ…)
- **NavBadge** â€” ÑƒÐ²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ñ Ð½Ð° sidebar items
- **BudgetAlertsPanel** â€” proactive alerts

**Ð¡Ð»Ð°Ð±Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹ (gaps):**
- **Builder = only 4 node-types, 0 killer-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² exposed** â€” cognitive pipelines Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ñ‹
- **9 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ broken round-trip** â€” local-first violated
- **ÐÐµÑ‚ debateâ†’memory provenance** â€” influence tracking Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶ÐµÐ½
- **ÐÐµÑ‚ unified agent/memory/debate/background overview** â€” fragmented
- **Ð¢Ð¾Ð»ÑŒÐºÐ¾ 14 navigate() calls** â€” cross-panel navigation ÑÐ»Ð°Ð±Ð°Ñ
- **Settings Ð±ÐµÐ· search** â€” 8 Ñ‚Ð°Ð±Ð¾Ð² Ð±ÐµÐ· filter
- **ÐÐµÑ‚ batch operations** â€” Ð²ÑÑ‘ Ð¿Ð¾ Ð¾Ð´Ð½Ð¾Ð¼Ñƒ
- **Capability/event/policy registries invisible Ð² UI**
- **Silent failures Ð±ÐµÐ· notification** (crystal refuted, memory worker fail)
- **agentMemory table Ð±ÐµÐ· UI** â€” schema ÐµÑÑ‚ÑŒ, view Ð½ÐµÑ‚

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð²Ñ‹Ð²Ð¾Ð´ (ÐºÐ°Ðº Ð¿Ñ€ÐµÐ´ÑÐºÐ°Ð·Ñ‹Ð²Ð°Ð»Ð¾ Ð·Ð°Ð´Ð°Ð½Ð¸Ðµ):** Â«Ð Ð°Ð·Ð²Ð¸Ð²Ð°Ñ‚ÑŒ ÐžÐ¡ Ð½Ðµ ÑÐ»ÑƒÑ‡Ð°Ð¹Ð½Ñ‹Ð¼Ð¸ Ð½Ð¾Ð²Ñ‹Ð¼Ð¸ Ñ„ÑƒÐ½ÐºÑ†Ð¸ÑÐ¼Ð¸, Ð° Ð·Ð°ÐºÑ€Ñ‹Ð²Ð°Ñ‚ÑŒ Ñ€ÐµÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹Â» â€” **Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½Ð¾**. ÐÐ°Ð¹Ð´ÐµÐ½Ð¾ **42 functional gaps** Ð²Ð¼ÐµÑÑ‚Ð¾ 42 random features. **Top-3 critical**:
1. **Builder integration Ñ killer-ÑÐµÑ€Ð²Ð¸ÑÐ°Ð¼Ð¸** â€” Ð·Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ = ÐºÐ¾Ð³Ð½Ð¸Ñ‚Ð¸Ð²Ð½Ñ‹Ðµ pipelines ÑÑ‚Ð°Ð½ÑƒÑ‚ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ñ‹
2. **Import Ð² 9 Ð¿Ð°Ð½ÐµÐ»ÑÑ…** â€” Ð·Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ = local-first round-trip Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÐµÑ‚
3. **Cross-linking debateâ†”memory + agentâ†”memory** â€” Ð·Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ = provenance tracking

**Gap Score: 5.5/10** â€” Ð¼Ð½Ð¾Ð³Ð¾ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¹ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ð½Ð¾, Ð½Ð¾ integration gaps Ð¼ÐµÐ¶Ð´Ñƒ Ð½Ð¸Ð¼Ð¸ Ð¼ÐµÑˆÐ°ÑŽÑ‚ composite scenarios. Ð—Ð°ÐºÑ€Ñ‹Ñ‚Ð¸Ðµ top-10 gaps Ð¿Ð¾Ð´Ð½Ð¸Ð¼Ñ‘Ñ‚ score Ð´Ð¾ ~7.5/10.

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ A. Ð’ÑÐµ 42 functional gaps Ð² Ñ†Ð¸Ñ„Ñ€Ð°Ñ…

| ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ | ÐšÐ¾Ð»-Ð²Ð¾ | Examples |
|---|---:|---|
| Builder node-types missing | 8 | crystal, synthesis, lens, time-machine, federated, forum, director, memoryOrchestrator |
| Panels without export | 11 | Governance, Director, Aquarium, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health |
| Panels with broken round-trip | 9 | Chat, Memory, Crystal, Roles, Settings, Knowledge, Builder, Budget, Health |
| Cross-linking missing | 5 | agentâ†”memory, debateâ†”memory, decisionâ†”crystal, debateâ†”agent, traceâ†”agent |
| Unified overviews missing | 5 | agents, memory, debates, providers, background services |
| Search/filter missing | 5 | Settings, Agents, Debates (by technique), Memory (by type), Wiki autocomplete |
| Batch operations missing | 5 | Governance (mass role), Approvals (mass approve), Agents (mass deploy), Memory (mass delete/tag), Traces (mass export) |
| Notifications missing | 3 | Crystal refuted, Debate concluded, Memory worker failed |
| External API missing | 5 | Wiki, Memory, Crystal, Debate, Server API |
| Registry UI missing | 4 | Capability, Service (partial), Event, Policy |
| **Total gaps** | **~60 sub-gaps Ð² 42 Ð¿ÑƒÐ½ÐºÑ‚Ð°Ñ…** | â€” |

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ B. Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¸ Ð¼ÐµÑ‚Ð¾Ð´

| Ð§Ñ‚Ð¾ | Ð“Ð´Ðµ | ÐšÐ°Ðº Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ |
|---|---|---|
| Export patterns | `src/components/**/*.tsx` | `grep -rE "exportChat\|exportData\|handleExport\|onExport\|downloadBlob\|saveAs\|createObjectURL"` |
| Per-panel export | 18 panels | `grep -rl` per directory |
| Import patterns | `src/components/**/*.tsx` | `grep -rE "importData\|importFile\|importJSON\|handleImport\|onImport\|fileInput"` |
| Builder nodes | `src/components/BuilderPanel/builder-nodes.tsx`, `ComponentPalette.tsx` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| Service â†’ tool exposure | `src/kernel/services/**` | `grep -rE "registerTool.*${svc}\|tool.*name.*${svc}"` for 8 killer services |
| Cross-linking | `src/kernel/services/**`, `src/components/**` | `grep -rE "agentMemory\|debateMemory\|memoryAuthor\|writtenBy\|debate.*memory.*link"` |
| navigate() calls | `src/components/**/*.tsx` | `grep -rE "navigate\(['\"]/"` â†’ 14 results |
| agentMemory table | `src/kernel/services/dexie-schema.ts` | grep |
| Unified overview search | `src/components/**` | `grep -rlE "agentOverview\|agentsOverview\|agentsStatus\|unifiedAgent\|agentDashboard"` |
| Memory center | `src/components/MemoryCenterPanel/` | ls + Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| DashboardPanel | `src/components/DashboardPanel/` (18 Ñ„Ð°Ð¹Ð»Ð¾Ð²) | ls + wc |
| SettingsPanel | `src/components/SettingsPanel/` | ls |
| Total kernel services | `src/kernel/services/**/*.ts` | `find ... ! -name "*.test.ts"` â†’ 778 |

---

*ÐžÑ‚Ñ‡Ñ‘Ñ‚ ÑÐ³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½ 2026-10-31 Ð½Ð° Ð¾ÑÐ½Ð¾Ð²Ðµ ÐºÐ¾Ð¼Ð¼Ð¸Ñ‚Ð° `e08ab8e`. ÐÐ½Ð°Ð»Ð¸Ð· ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹; runtime capability testing Ð½Ðµ Ð¿Ñ€Ð¾Ð²Ð¾Ð´Ð¸Ð»ÑÑ. ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð¾Ñ‚Ñ‡Ñ‘Ñ‚Ñ‹: Â«ÐšÐ°Ñ€Ñ‚Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð¹ Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ‚ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÑÂ», Â«ÐšÐ°Ñ€Ñ‚Ð° Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ñ Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð²Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð³Ð¾ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸ÑÂ», Â«ÐšÐ°Ñ€Ñ‚Ð° Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÐµÐ¹Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ð¶Ð¸Ð·Ð½ÐµÐ½Ð½Ð¾Ð³Ð¾ Ñ†Ð¸ÐºÐ»Ð°Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚Ð¸ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹Â».*
