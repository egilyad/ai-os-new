export type LiveStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface GeminiLiveMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export interface GeminiLiveSession {
    id: string;
    status: LiveStatus;
    messages: GeminiLiveMessage[];
    error?: string;
    startedAt: number;
}

export interface IGeminiLiveService {
    getSession(): GeminiLiveSession;
    start(): Promise<void>;
    stop(): void;
    sendText(text: string): Promise<void>;
    isSupported(): boolean;
    destroy(): void;
}
