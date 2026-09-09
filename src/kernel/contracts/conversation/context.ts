export interface ConversationContext {
    topic: string;
    participants: Array<{ id: string; role: string }>;
    history: Array<{ role: string; content: string }>;
    metadata: Record<string, unknown>;
}
