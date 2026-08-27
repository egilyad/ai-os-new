export interface ChatPreview {
    id: string;
    title: string;
    model?: string;
    provider?: string;
    createdAt?: number;
    updatedAt?: number;
    messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }>;
}
