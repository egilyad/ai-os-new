# 05_DATA_AND_PERSISTENCE.md

The Forum subsystem utilizes Dexie to persist discussions, structured into four core tables.

## 1. Schema

The database (Dexie v17) defines the following tables (`src/kernel/types/schema-types.ts` inferred; `forum-repository.ts` imports):

- `forumTopics`: Stores `ForumTopicRecord` (topic metadata).
- `forumPosts`: Stores `ForumPostRecord` (the content).
- `forumVotes`: Stores `ForumVoteRecord` (individual user/agent votes).
- `forumSubs`: Stores `ForumSubRecord` (subscription tracking).

## 2. Record Shapes (`src/kernel/types/forum-types.ts`)

| Record             | Key Fields                  | Persistence Model                          |
| :----------------- | :-------------------------- | :----------------------------------------- |
| `ForumTopicRecord` | `id, title, author, status` | Full object `topic?: Topic` (VERIFIED 134) |
| `ForumPostRecord`  | `id, topicId, author, body` | Full object `post?: Post` (VERIFIED 151)   |
| `ForumVoteRecord`  | `id, postId, voterId`       | `voterId`, `vote` (VERIFIED 154-160)       |
| `ForumSubRecord`   | `id, topicId, subscriberId` | `subscriberId` (VERIFIED 162-167)          |

## 3. Persistence Model

Persistence is handled via `ForumRepository` (`src/kernel/dal/forum-repository.ts`). The model uses full-object round-tripping: the record in Dexie mirrors the domain object, often caching the full domain model in an optional field (e.g., `ForumTopicRecord.topic`) for performance (VERIFIED `forum-types.ts:134,151`).
