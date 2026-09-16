# INTEGRATION FINDINGS — Nightly Research (Backend ↔ Frontend)

> Research-only. Findings verified against current source. IDs prefixed IN-.

## IN-01 (CONFIRMED, High) — Forum→Debate "escalate to debate" is a phantom integration (advertised, absent on both sides)

- Category: Integration / Missing capability
- Location: `contracts/forum.ts:22` (comment: "consensus check can escalate contested threads to a debate"); `forum-service.ts` (NO `escalateToDebate` method — grep confirms none); `phase18-forum.ts` (no subscription/emission of `forum:topic:escalated-to-debate`); `forum-service.test.ts:297,307` (NEGATIVE test asserting the event is NOT emitted); `components/ForumPanel/**` (no escalate UI — grep for `escalate` finds only an unrelated agent prompt).
- Evidence:
  ```ts
  // forum-service.test.ts
  it('does not escalate a contested thread to a debate', async () => {
    ...
    expect(events).not.toContain('forum:topic:escalated-to-debate');
  });
  ```
- Observed flow: the contract comment + the documented phase18 bridge + the prior audit all describe forum→debate escalation, but (a) `ForumService` has no escalate API, (b) no UI button exists, (c) nothing emits `forum:topic:escalated-to-debate`, so any debate-side consumer is dead. The feature is entirely unimplemented.
- Why it matters: a documented cross-module capability that does not exist. Users/operators cannot escalate a contested forum thread to a debate; the promise is false.
- Confidence: High.
- Suggested direction: either implement `escalateToDebate` (forum method + emit event + debate consumer) or remove the documentation/bridge references. Flag only.
- Related: IN-02, IN-03 (other forum capability gaps).

## IN-02 (CONFIRMED, Medium) — `forumService.votePost` is fully implemented + tested but has NO UI

- Category: Integration / Unused backend capability
- Location: `forum-service.ts:149` (`votePost`), `contracts/forum.ts:35` (declared), `forum-service.test.ts:189+` (tested); `components/ForumPanel/**` (NO vote button — grep for `vote` in ForumPanel finds only "thread"; `handleVote` exists only in HypothesisMarketplace/DebateVerdictPanel/AudiencePanel, not ForumPanel).
- Evidence: backend supports voting on posts; ForumPanel `TopicView`/`PostComposer` render posts without any vote control.
- Observed flow: a user viewing a forum thread cannot up/down-vote posts, even though the backend stores and aggregates votes.
- Why it matters: implemented, tested, persisted capability is invisible to users — wasted effort + a visible feature gap vs. other panels (DebateVerdictPanel has voting).
- Confidence: High.
- Related: IN-01, IN-03.

## IN-03 (CONFIRMED, Medium) — Forum `subscribe` has no UI; `pinTopic` is display-only (no toggle)

- Category: Integration / Unused / partial backend capability
- Location: `forum-service.ts:195` (`subscribe`), `:237` (`pinTopic`); `ForumPanel/TopicList.tsx:29` (renders `topic.pinned` badge `??` but no pin/unpin control); no `subscribe` UI anywhere in ForumPanel.
- Evidence: backend supports subscribe + pin/unpin; UI shows a pinned indicator but offers no way to pin/unpin or subscribe.
- Observed flow: operators cannot pin a topic or subscribe to it from the UI; the `subscribe` API is unreachable from the interface.
- Why it matters: two more implemented backend capabilities are unreachable from the UI. Consistent pattern (IN-01/IN-02): the Forum backend is ahead of its UI.
- Confidence: High.
- Related: IN-01, IN-02.

## IN-04 (CONFIRMED, Medium) — Director checkpoints are presented as a durable run record in the UI but are in-memory only (never persisted)

- Category: Integration / Persistence mismatch
- Location: `conversation-director-service.ts:221-241` (`checkpoint()` pushes to `this.session.checkpoints`; `getCheckpoints()` reads `this.session` — a private in-memory object, `:62`); no Dexie table for `conversationSessions`/checkpoints (grep of `schema-types.ts` for `checkpoint` → none); `RunTab.tsx:64,213,251` renders the "Checkpoints" list with `director.run.noCheckpoints` copy.
- Evidence:
  ```ts
  // conversation-director-service.ts
  this.session.checkpoints.push(checkpoint); // in-memory only
  // no saveCheckpoint() to Dexie anywhere
  ```
- Observed flow: the Run UI shows a "Checkpoints" panel and lets the operator capture checkpoints, implying a persistent run record. But `ConversationSession` (with its checkpoints) lives only in the service instance; on session end or page reload they are gone, and there is no Dexie persistence path.
- Why it matters: users may rely on checkpoints as a saved artifact; they silently vanish. A persistence/UX mismatch.
- Confidence: High.
- Related: EB-08 (Director session facet not persisted), EB-09.

## IN-05 (CONFIRMED, Low-Medium) — RunTab "Override" hard-codes objective type to `CHALLENGE`

- Category: Integration / UX limitation
- Location: `RunTab.tsx:112-116`:
  ```ts
  const proposal: TurnProposal = {
    participantId: overrideParticipant,
    objective: {
      type: 'CHALLENGE',
      description: overrideObjective,
      constraints: [],
    },
  };
  controls.override(proposal);
  ```
- Evidence: the Override form exposes only participant + instruction; `objective.type` is always `'CHALLENGE'`. The `TurnProposal` contract supports `PROPOSE`/`SUPPORT`/`CHALLENGE`/etc.
- Observed flow: an operator overriding a turn can only inject a CHALLENGE-type turn; they cannot choose the objective type.
- Why it matters: the Override feature underuses the `TurnProposal` contract; limits expressive control over the run. Low impact but a clear mismatch between contract capability and UI.
- Confidence: High.
- Related: EB-05..EB-07 (Director controls).

---

## IN-06 (CONFIRMED, Medium — reclassified from High after Cycle 11 security sweep) — `KEY_COMPROMISED` event is emitted but has NO consumer (dead telemetry signal; key IS quarantined inline)

- Category: Integration / Security / Negative research
- Location: emitted at `key-management/key-status.ts:174` (`emitOnce(EVENTS.KEY_COMPROMISED, ...)`); grep for `EVENTS.KEY_COMPROMISED` across `src` returns ONLY that emit line — no `on`/`onSafe`/`subscribeAll` consumer anywhere (no AlertLayer/ProviderManager/security panel subscribes).
- Evidence:
  ```ts
  this.deps.eventBus.emitOnce(EVENTS.KEY_COMPROMISED, `${id}:${provider}`, { ... });
  // no subscriber found in src
  ```
- Observed flow: `compromiseKey(id)` at `key-status.ts:162-181` quarantines the key **inline** — `registry.modifyKey` → `health.compromiseKey` → `registry.saveKeys()` → `notify()` — BEFORE emitting `KEY_COMPROMISED`. `notify()` drives `key-service` subscribers (UI state), so the key IS isolated and the UI DOES reflect the change. The orphaned `KEY_COMPROMISE` event is therefore a dead **observability/audit** signal (no telemetry, no external alert, no audit-log subscriber), NOT a security breach: the protective action happens regardless of the event.
- Why it matters (re-scoped): original High "silent security blind spot" was overstated — the key is quarantined inline. The real gap is that the dedicated `KEY_COMPROMISED` event has no consumer while the related `COMPROMISE_SIGNAL` (`compromise:signal`, emitted by `compromise-webhook-service.ts`) IS consumed by `notification-webhook-service.ts:178`. So external compromise webhooks flow, but the internal `compromiseKey()` path emits an unconsumed event. Two compromise signals with asymmetric wiring. Lower severity.
- Confidence: High (grep confirms no `EVENTS.KEY_COMPROMISED` consumer; inline quarantine verified in source).
- Suggested direction: either (a) have `compromiseKey()` also emit/forward `COMPROMISE_SIGNAL` so the webhook/notification path is unified, or (b) subscribe an audit/telemetry listener to `KEY_COMPROMISED`. Consolidate the two compromise signals. Flag only.
- Related: IN-07.

## IN-07 (CONFIRMED, Medium) — `ROLE_ASSIGNED` / `ROLE_UNASSIGNED` / `METRICS_ALERT_RESOLVED` emitted with no consumer

- Category: Integration / Negative research
- Location: `role-service.ts:550` (`ROLE_ASSIGNED`), `:562` (`ROLE_UNASSIGNED`), `metrics-service.ts:368` (`METRICS_ALERT_RESOLVED`); grep for each `EVENTS.X` returns ONLY the emit line — no consumer.
- Evidence: each event is emitted via `emitOnce` but no `on`/`onSafe`/`subscribeAll` subscribes.
- Observed flow: role-assignment changes and metrics-alert resolutions are broadcast but no panel reacts (the RolePanel/MetricsPanel likely re-fetch on mount/interval instead). The events are effectively dead.
- Why it matters: event-driven UI refresh is absent for these; panels rely on polling. Lower impact than IN-06 (not security), but the same "emit into the void" pattern indicates event contracts are not reliably consumed.
- Confidence: High.
- Related: IN-06, EB-01 (emitOnce compounds the loss).

## IN-08 (CONFIRMED, Low) — `KEY_COMPROMISE_SIGNAL` event defined but never emitted or consumed (dead contract entry)

- Category: Integration / Negative research / Dead code
- Location: `event-registry.ts:56` (`KEY_COMPROMISE_SIGNAL: event('key:compromise:signal', ...)`). Grep for `KEY_COMPROMISE_SIGNAL` across `src` returns ONLY the definition — no emitter and no subscriber. Note this is distinct from `KEY_COMPROMISED` (`key:compromised`, IN-06) and `COMPROMISE_SIGNAL` (`compromise:signal`, consumed by `notification-webhook-service.ts:178`).
- Evidence: a third, separate compromise-related event name exists in the registry that nothing uses.
- Observed flow: the event is declared in the contract surface but is never fired and never listened to — pure dead weight in the event namespace.
- Why it matters: three compromise-related event names (`KEY_COMPROMISED`, `COMPROMISE_SIGNAL`, `KEY_COMPROMISE_SIGNAL`) create confusion about which signal is authoritative. Dead contract entries drift and mislead future integrators. Ties into the broader "event contracts not reliably consumed" theme (IN-06/IN-07).
- Confidence: High.
- Suggested direction: remove `KEY_COMPROMISE_SIGNAL` (or wire it if a real producer/consumer is intended). Document the single canonical compromise signal. Flag only.
- Related: IN-06, IN-07.

---

_Next areas appended as research continues._
