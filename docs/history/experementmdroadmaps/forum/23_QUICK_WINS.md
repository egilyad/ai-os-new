# Quick Wins Deep Dive (Top 10)

## QW-01: Thread Search

- **Description:** Add keyword search for posts.
- **Value:** High.
- **Foundation:** `forum-repository.ts:34`
- **Effort:** Low.
- **Risk:** Low.
- **Why Now:** Essential for navigation as topics grow.

## QW-02: Topic Tags

- **Description:** UI for filtering by tags.
- **Value:** High.
- **Foundation:** `forum-types.ts`
- **Effort:** Low.
- **Risk:** Low.
- **Why Now:** Scalability.

## QW-03: Export Thread

- **Description:** Export thread to Markdown.
- **Value:** Medium.
- **Foundation:** `ForumPanel.tsx`
- **Effort:** Low.
- **Risk:** Low.
- **Why Now:** Portability.

## QW-04: Edit Post

- **Description:** Allow editing own posts.
- **Value:** Medium.
- **Foundation:** `forum-service.ts:93`
- **Effort:** Low.
- **Risk:** Medium.
- **Why Now:** Fix errors.

## QW-05: Drafts

- **Description:** Save local post drafts.
- **Value:** High.
- **Foundation:** `PostComposer.tsx`
- **Effort:** Medium.
- **Risk:** Low.
- **Why Now:** UX improvement.

## QW-06: Auto-Subscribe

- **Description:** Subscribe on post.
- **Value:** Medium.
- **Foundation:** `forum-service.ts:195`
- **Effort:** Low.
- **Risk:** Low.
- **Why Now:** Better engagement.

## QW-07: User Profiles

- **Description:** Link author to profile.
- **Value:** Medium.
- **Foundation:** `AuthorBadge.tsx`
- **Effort:** Low.
- **Risk:** Low.
- **Why Now:** Community.

## QW-08: Read Indicators

- **Description:** Track last read post.
- **Value:** High.
- **Foundation:** `forum-types.ts`
- **Effort:** Medium.
- **Risk:** Medium.
- **Why Now:** Better tracking.

## QW-09: Post permalinks

- **Description:** URL for direct post link.
- **Value:** High.
- **Foundation:** `TopicView.tsx`
- **Effort:** Low.
- **Risk:** Low.
- **Why Now:** Sharing.

## QW-10: Quote Post

- **Description:** Reply with quote.
- **Value:** High.
- **Foundation:** `PostComposer.tsx`
- **Effort:** Low.
- **Risk:** Low.
- **Why Now:** Conversation flow.
