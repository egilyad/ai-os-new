# REJECTED HYPOTHESES — Nightly Research

> Hypotheses that were investigated and found to be FALSE (or environment artifacts). Kept so we don't re-investigate.

## RH-01 — `conversation-director-service.ts:163` LSP "paused/aborted no overlap" type error

- Status: REJECTED as a real defect.
- Investigation: `this.phase` is a getter returning `DirectorState` (`conversation-director-service.ts:68-70`), and `DirectorState` explicitly includes `'paused'` and `'aborted'` (`contracts/conversation/director.ts:11`). The comparison at line 163 is type-correct. The red squiggle is an **environment LSP false positive** (the LSP server mis-resolves the union). Verified by direct source read + subagent trace.
- Lesson: trust `tsc -b` over the editor LSP for this repo; the LSP here reports stale/incorrect diagnostics.

## RH-02 — `invocation-types` "Cannot find module" LSP errors across 4 files

- Status: REJECTED as a real break.
- Investigation: `src/kernel/types/invocation-types.ts` **exists** and is imported via `'../../types/invocation-types'` (from `invocation-repository.ts`), `'../types/invocation-types'` (from `dexie-schema.ts`), `'./invocation-types'` (from `interfaces.ts`). The LSP cannot resolve the path (extension/tsconfig path quirk) but `tsc` resolves it — the Invocation Engine was committed and its E2E passed. Environment LSP false positive.
- Files flagged by LSP (all false): `invocation-repository.ts:4`, `dexie-schema.ts:20`, `interfaces.ts:8`, plus `LensesPanel.tsx` (`lensEngine` not exported) and `LensesPanel.tsx:66/67/75` (`implicit any`).

## RH-03 — (from ConversationDirector subagent) "service `DirectorState` lacks `paused`/`aborted`"

- Status: REJECTED.
- Investigation: `DirectorState = 'idle' | 'running' | 'paused' | 'aborted' | 'completed' | 'error'` is complete; `directorStore.DirectorStatus` matches. The "mismatched enum" sub-claim of old hypothesis H4 is false. However the _behavioral_ three-channel divergence (EB-08) is CONFIRMED.
