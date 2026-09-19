# 18_REALTIME.md

## Realtime Architecture Analysis

The Forum subsystem currently lacks a dedicated realtime update mechanism, relying entirely on polling and manual refresh triggers.

### EventBus Utilization

- **Event Emission**: `ForumService` correctly emits events (`FORUM_TOPIC_CREATED` at `src/kernel/services/forum/forum-service.ts:80`, `FORUM_POST_ADDED` at `:140`, `FORUM_POST_VOTED` at `:187`).
- **Subscription/Observation**: There is no active subscription within the UI layer for these events. The `ForumPanel` relies on manual `refreshTopics` triggers `src/components/ForumPanel/ForumPanel.tsx:29` and polling-like manual interactions to update state.

### Architectural Gaps

- **Stale UI**: Because the UI does not subscribe to `FORUM_POST_ADDED` or `FORUM_POST_VOTED` events, thread views are guaranteed to be out of sync if another agent or user posts to the same topic simultaneously. (VERIFIED, `ForumPanel.tsx` lacks `useEffect` subscriptions).
- **Polling Requirement**: The "Refresh" button (`src/components/ForumPanel/ForumPanel.tsx:92`) is the primary mechanism for state consistency, which is a significant UX regression from a truly realtime system.
- **Architectural Opportunity**: Implement a `useForumEvents` hook that subscribes to `EVENTS.FORUM_POST_ADDED` and triggers a local state re-fetch or incremental update of the `thread` state in `ForumPanel`. (OPINION).

### Potential Issues

- **Lossy/Missing Events**: While the `eventBus` is utilized, there is no guarantee of delivery for the UI if it isn't mounted at the time of emission. (INFERRED).
- **Duplicate Events**: The current implementation does not appear to have idempotency logic for UI state updates based on events. (INFERRED).
