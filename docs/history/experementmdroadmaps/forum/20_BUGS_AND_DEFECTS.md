# 20_BUGS_AND_DEFECTS.md

## Forum Bugs and Defects

### Root Cause: Broken Imports / DI

- **BUG**: `ForumPanel.tsx` imports `forumService` from `../../kernel/instances` (`ForumPanel.tsx:4`), but it is not exported. (VERIFIED).

### Root Cause: Stale State / No Realtime

- **ARCHITECTURAL GAP**: `ForumPanel` uses local `useState` for topics and threads (`ForumPanel.tsx:23,25`) with no subscription to `eventBus`. Updates are only reflected on manual refresh (`ForumPanel.tsx:92`).

### Root Cause: UI/Backend Contract Mismatches

- **ARCHITECTURAL GAP**: Backend computes consensus (`ForumService.getConsensus` at `src/kernel/services/forum/forum-service.ts:262`), but the UI only uses the status (`ForumPanel.tsx:44`), ignoring the `confidence` and `summary` fields provided by the backend. (VERIFIED).
- **BUG**: `getThread` (`forum-service.ts:232`) fails to filter out 'hidden' moderated posts, only filtering 'removed' ones.
- **BUG**: The `ModerationQueue` component (`src/components/ForumPanel/ForumPanel.tsx:140`) relies on `thread.posts` but does not provide an actual mechanism to view the reason for moderation in the UI, despite the backend supporting `moderation.reason` (`forum-service.ts:256`).

### Root Cause: Persistence / Functional Gaps

- **ARCHITECTURAL GAP**: Consensus is recalculated on every `getConsensus` call (`forum-service.ts:265`) by fetching _all_ posts for the topic, which will become a performance bottleneck as threads grow. (VERIFIED).
- **ARCHITECTURAL GAP**: The debate escalation bridge described in `phase18-forum.ts` is currently dead code (INFERRED).
- **BUG**: Flood control (`ForumService.enforceFloodBudget` at `forum-service.ts:315`) fetches _all_ posts for a topic just to check if the _current author_ has flooded, which is O(N) where N is topic posts.
