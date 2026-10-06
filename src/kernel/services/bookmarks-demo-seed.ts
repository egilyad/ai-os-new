import type { ChatBookmarksService, ChatBookmark } from './chat-bookmarks-service';
import type { SessionStore } from '../contracts/storage/session-store';
import { seedChatDemo } from './chat-demo-seed';

/**
 * Demo seed for Bookmarks: bookmarks the first assistant reply of the demo
 * chat (ensuring the demo chat exists first via its own seed).
 *
 * Idempotent: addBookmark dedups by sessionId + messageId, and the demo
 * chat seed is itself idempotent.
 */
export const DEMO_BOOKMARK_NOTE = 'Демо: лучший ответ про вето';

export async function seedBookmarksDemo(
    bookmarks: ChatBookmarksService,
    sessions: SessionStore,
): Promise<ChatBookmark> {
    const sessionId = await seedChatDemo(sessions);
    const session = await sessions.getSession(sessionId);
    const reply = session?.history.find((e) => e.role === 'assistant');
    if (!reply) throw new Error('Bookmarks demo: demo chat has no assistant reply');
    return bookmarks.addBookmark({
        sessionId,
        // addBookmark reads (message as { id }) for stable dedup keys —
        // ChatMessage itself carries no id, hence the narrow cast.
        message: { id: reply.id, role: 'assistant', content: reply.text } as Parameters<
            ChatBookmarksService['addBookmark']
        >[0]['message'],
        note: DEMO_BOOKMARK_NOTE,
        tags: ['демо', 'вето'],
    });
}
