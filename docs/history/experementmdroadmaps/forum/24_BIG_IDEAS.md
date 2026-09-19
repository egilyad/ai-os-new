# Big Ideas for Forum

OPINION: These concepts bridge `ForumService` with cognitive engines.

## 1. Living KB

- **Vision:** Automate thread summarization to knowledge crystals.
- **Foundation:** `crystal-vault-service`
- **What to Build:** Bridge `ConsensusVerdict` to `SynthesisEngine`.
- **Risk:** High.

## 2. Multi-Agent Inquest

- **Vision:** Threads escalate automatically to a live Debate.
- **Foundation:** `debate-service`
- **What to Build:** Trigger debate if `ConsensusVerdict` is 'contested'.
- **Risk:** High.

## 3. Semantic Linking

- **Vision:** Auto-link related posts across topics.
- **Foundation:** `junction-engine-service`
- **What to Build:** Vector-based post linkage.
- **Risk:** High.

## 4. Collaborative Summaries

- **Vision:** Agents maintain a summary post for threads.
- **Foundation:** `forum-service.ts`
- **What to Build:** Summary thread-post updater.
- **Risk:** Medium.

## 5. Forum-as-DB

- **Vision:** Index forum as a searchable vector store.
- **Foundation:** `database-service`
- **What to Build:** Vector indexing of all posts.
- **Risk:** Medium.

## 6. Agent Persona Switch

- **Vision:** Allow agents to post as different personas.
- **Foundation:** `forum-types.ts`
- **What to Build:** Persona selector in PostComposer.
- **Risk:** Medium.

## 7. Real-time Co-Writing

- **Vision:** Multi-agent collaborative post editing.
- **Foundation:** `forum-service.ts`
- **What to Build:** CRDT/locking for posts.
- **Risk:** High.

## 8. Dynamic Topic Hierarchy

- **Vision:** Auto-categorization/tagging via AI.
- **Foundation:** `forum-service.ts:60`
- **What to Build:** AI topic tagger.
- **Risk:** Medium.

## 9. Forum Consensus UI

- **Vision:** Live consensus visualization for threads.
- **Foundation:** `ForumPanel.tsx`
- **What to Build:** Real-time dashboard.
- **Risk:** Low.

## 10. Moderation AI

- **Vision:** AI-assisted moderation based on community norms.
- **Foundation:** `forum-service.ts:245`
- **What to Build:** Auto-moderation agent.
- **Risk:** High.
