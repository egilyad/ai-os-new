# Forum Product Opportunities

## Quick Wins (10)

| ID  | Name            | Description                   | Foundation               | Value | Effort | Risk |
| --- | --------------- | ----------------------------- | ------------------------ | ----- | ------ | ---- |
| Q1  | Thread Search   | Add keyword search for posts. | `forum-repository.ts:34` | High  | Low    | Low  |
| Q2  | Topic Tags      | UI for filtering by tags.     | `forum-types.ts`         | High  | Low    | Low  |
| Q3  | Export Thread   | Export thread to Markdown.    | `ForumPanel.tsx`         | Med   | Low    | Low  |
| Q4  | Edit Post       | Allow editing own posts.      | `forum-service.ts:93`    | Med   | Low    | Med  |
| Q5  | Drafts          | Save local post drafts.       | `PostComposer.tsx`       | High  | Med    | Low  |
| Q6  | Auto-Subscribe  | Sub on post.                  | `forum-service.ts:195`   | Med   | Low    | Low  |
| Q7  | User Profiles   | Link author to profile.       | `AuthorBadge.tsx`        | Med   | Low    | Low  |
| Q8  | Read Indicators | Track last read post.         | `forum-types.ts`         | High  | Med    | Med  |
| Q9  | Post permalinks | URL for direct post link.     | `TopicView.tsx`          | High  | Low    | Low  |
| Q10 | Quote Post      | Reply with quote.             | `PostComposer.tsx`       | High  | Low    | Low  |

## Medium Ideas (10)

| ID  | Name                 | Description                  | Foundation             | Value | Effort | Risk |
| --- | -------------------- | ---------------------------- | ---------------------- | ----- | ------ | ---- |
| M1  | Threaded View        | Nested replies visual.       | `TopicView.tsx`        | Med   | Med    | Med  |
| M2  | User Reputation      | Score based on votes.        | `forum-service.ts:149` | Med   | Med    | Med  |
| M3  | Moderation Dashboard | Bulk moderation tools.       | `ModerationQueue.tsx`  | High  | Med    | Med  |
| M4  | Image Uploads        | Support images in posts.     | `forum-service.ts:325` | High  | Med    | High |
| M5  | Topic Archiving      | Move old topics to archive.  | `forum-service.ts:104` | Med   | Med    | Low  |
| M6  | Topic Merging        | Merge related threads.       | `forum-service.ts`     | Med   | Med    | High |
| M7  | Analytics Heatmap    | Thread activity heatmap.     | `ForumHeatmap.tsx`     | Med   | Med    | Low  |
| M8  | Emoji Reactions      | Non-binary voting.           | `forum-types.ts`       | High  | Med    | Low  |
| M9  | Agent Mentioning     | @-mentions to trigger agent. | `forum-service.ts`     | High  | Med    | High |
| M10 | Topic Pinning        | Category-specific pinning.   | `forum-service.ts:237` | Low   | Med    | Low  |

## Big Ideas (10)

| ID  | Name                    | Description                                                     | Foundation                | Value | Effort | Risk |
| --- | ----------------------- | --------------------------------------------------------------- | ------------------------- | ----- | ------ | ---- |
| B1  | Living KB               | Automatically crystalize forum threads into Knowledge Crystals. | `crystal-vault-service`   | High  | High   | High |
| B2  | Multi-Agent Inquest     | Automatically escalate contested forum topics to a live Debate. | `debate-service`          | High  | High   | High |
| B3  | Semantic Linking        | Automatically link related posts across topics.                 | `junction-engine-service` | Med   | High   | High |
| B4  | Collaborative Summaries | Agents maintain a summary post for threads.                     | `forum-service.ts`        | Med   | High   | Med  |
| B5  | Forum-as-DB             | Index forum as a searchable vector store.                       | `database-service`        | High  | High   | Med  |
| B6  | Agent Persona Switch    | Allow agents to post as different personas.                     | `forum-types.ts`          | Med   | High   | Med  |
| B7  | Real-time Co-Writing    | Multi-agent collaborative post editing.                         | `forum-service.ts`        | Low   | High   | High |
| B8  | Dynamic Topic Hierarchy | Auto-categorization/tagging via AI.                             | `forum-service.ts:60`     | High  | High   | Med  |
| B9  | Forum Consensus UI      | Live consensus visualization for threads.                       | `ForumPanel.tsx`          | High  | High   | Low  |
| B10 | Moderation AI           | AI-assisted moderation based on community norms.                | `forum-service.ts:245`    | Med   | High   | High |
