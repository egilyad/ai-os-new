# 10_PROBLEMS_AND_LIMITATIONS — Concrete VERIFIED issues

All items below are VERIFIED against source unless marked INFERRED.

1. **Specializations are inert (VERIFIED).** `UX / Prototyping / Design Systems`
   (`agent-profiles.ts:160`) are displayed in `AgentCard` (`AgentCard.tsx:68`) but grep shows
   **0 usages** in `debate-runtime` and no injection into system prompts. The "design" identity does
   nothing at runtime.

2. **No design persona variant (VERIFIED).** `persona-selector.ts:3-241` defines 10 generic variants;
   none cover design/UX/accessibility. In debate the designer speaks only the generic node prompt.

3. **No design lens (VERIFIED).** `LENS_LIBRARY` has 15 lenses (critical, second-order, security,
   economic, …); grep for design|ux|user|prototyp|visual|accessib → no match. Designer `lensIds:[]`
   (`topology-defaults.ts:106`).

4. **Forced neutral stance in Invocation debates (VERIFIED).** `phase21-invocation.ts:81` sets
   `role:'neutral'` for every participant, erasing the designer's design perspective in debates.

5. **No tools despite "Prototyping" (VERIFIED).** Node `tools:[]` (`topology-defaults.ts:314`); card
   shows "no capabilities" (`AgentCard.tsx:115`). A prototyping agent cannot fetch URLs, render, or
   read design files.

6. **Journal `agentName` bug (VERIFIED).** `agent-journal-service.ts:135,160` store `agentName =
nodeId` (`agent-designer`), not "Kai Mendez". Affects all agents; designer history is anonymous.

7. **Journal `tokensUsed` always 0 (VERIFIED).** `agent-journal-service.ts:166,182` pass `0`;
   design effort/cost invisible in history (only stats KV has cost).

8. **`cognitive:decision:made` dead (VERIFIED via AGENTS.md).** Designer design-decisions cannot be
   surfaced; the consumer is inert.

9. **groq/70b, no multimodal (INFERRED).** Model is text-only `llama-3.3-70b-versatile`
   (`agent-profiles.ts:159`); design work often needs image understanding — unavailable.

10. **No design-specific policy / subsystem binding (VERIFIED).** Only the generic
    `Manual Room Chat` policy exists (`phase21-invocation.ts:125`); no Research/Knowledge/Workflow/
    Scheduler/Design binding (grep: 5 repo refs, none subsystem-specific).

11. **Prompt-audit low-temp vs creative conflict (VERIFIED).** Grouped `'Creative'`
    (`prompt-audit-service.ts:22`) yet temperature `0.5` (`topology-defaults.ts:313`); audit rule
    flags `temperature>0.7 && creative keywords` (`:213`) — designer passes, but `tools:[]` triggers
    "No tools assigned" info suggestion (`:192`), accurate.
