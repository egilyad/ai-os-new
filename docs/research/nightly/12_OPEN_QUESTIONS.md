# OPEN QUESTIONS — unresolved architectural decisions surfaced during research

These are genuine design questions, not confirmed defects. Flagged so a future decision can be made explicitly rather than by accident.

## OQ-01 — Invocation policy `actions.target` vs `InvocationRequest.target` semantics

- Surfaced in: AGENTS.md "Pending Design Question"; EB-19..EB-21 context.
- `policy.actions.target` is a declarative part of the policy, but `InvocationEngineService.invoke()` resolves agents from `req.target`, and `matches()`/`evaluate()` only gate on `match.source/event/expertise`. Question: should the policy _define_ the target, or only _permit/constrain_ the human's chosen target? Today it only permits — which is why the "Manual Room Chat" policy (source-gated) works for any registered agent. A deliberate decision is needed before building policy-targeted automations.

## OQ-02 — Is Invocation `executing` a meaningful state, given it is set post-hoc?

- Surfaced in: EB-19, OP-14.
- `executing` is set synchronously AFTER `execution.start()` resolves. For chat mode (await to completion) and debate mode (returns immediately) the `executing` state is effectively instantaneous / mis-ordered relative to real work. Should `executing` be set _before_ `start()` (true "now running") and should debate-mode `done` wait for the actual debate to finish? The lifecycle D7 (requested→accepted→executing→done) is currently not faithfully realized (AR-06).

## OQ-03 — Is single-active-debate a hard constraint or a limitation?

- Surfaced in: EB-15, FE-08.
- `DebateSyncManager` is a singleton holding one `activeSession`; `startDebate` cancels any non-terminal previous session. This means the Invocation Engine spawning a debate will cancel a user's in-progress DebatePanel debate (visible reset via `DEB...CANCELLED`). Question: is concurrent multi-debate ever desired? If not, document the constraint AND prevent Invocation from silently cancelling user debates (e.g., reject/queue). If yes, `DebateSyncManager` must become multi-session.

## OQ-04 — Which routing service is authoritative: `RouterService` or `SmartRoutingService`?

- Surfaced in: EB-24, OP-05.
- Live routing uses `RouterService`; the panel edits `SmartRoutingService` rules; a third `RoutingPolicyService` bridges. There is no code link between the live router and the SmartRouting panel. Question: is SmartRouting a planned replacement, a deprecated experiment, or a genuine parallel path? Until answered, the panel may give operators a false sense of control.

## OQ-05 — What is the _intended_ contract of `emitOnce` dedup?

- Surfaced in: EB-01, EB-02, EB-17, FE-08.
- The implementation keeps the FIRST emit per `(event,key)` within `ttl` and drops the rest ("first wins"). But the pervasive use with constant keys strongly implies the _intent_ was "latest snapshot wins / throttle, not drop". This is an ambiguous contract: producers expect coalescing, but get suppression. Clarify the intended semantics and align the implementation (OP-01).

## OQ-06 — Is `KEY_COMPROMISE_SIGNAL` dead by design or superseded?

- Surfaced in: IN-08, SEC-01.
- `KEY_COMPROMISE_SIGNAL` (`key:compromise:signal`) is defined in the registry but never emitted or consumed, while `COMPROMISE_SIGNAL` (`compromise:signal`) is the live path and `KEY_COMPROMISED` (`key:compromised`) is emitted-but-unconsumed. Three compromise signal names, two effectively dead. Was `KEY_COMPROMISE_SIGNAL` the original intent, later forked? Decide the canonical name and delete the rest.

## OQ-07 — Should the Director _store_ or the Director _service_ be the UI source of truth?

- Surfaced in: EB-08, EB-12.
- `ConversationDirectorService` keeps `this.state`/`this.session`; `directorStore` keeps its own copy fed by events; RunTab reads the store. The two can diverge (e.g., `completed` reaches the service but the store only flips via `CONVERSATION_COMPLETED`). Question: is the event-driven store the canonical UI state, or should the UI read service state directly? Today the store is authoritative but receives lifecycle via a fragile event set.

## OQ-08 — Which encryption path is canonical: `SecurityService` or raw `crypto.subtle` in `key-vault`?

- Surfaced in: SEC-04.
- `key-migration.ts` uses `SecurityService.encrypt` (PBKDF2+AES-GCM) while `key-vault.ts` uses `crypto.subtle` directly. Both encrypt keys at rest but via divergent code. Which is the standard? Converge on one to avoid two key-derivation schemes drifting.

## OQ-09 — Should "Clear" in RoomPanel be destructive or view-only?

- Surfaced in: FE-06.
- `clear()` resets in-memory state only; persisted Dexie history re-hydrates on reload. The label implies destruction. Decision needed: rename to "Hide/Clear view" (view-only, honest) or make it delete the persisted records (destructive). Currently the behavior contradicts the label.

---

_Next: 09_DOCUMENTATION_FINDINGS.md and 10_CODE_HEALTH.md._
