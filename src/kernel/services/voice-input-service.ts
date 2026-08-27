import type {
    IVoiceInputService,
    VoiceInputSession,
    VoiceInputSource,
    MultimodalAttachment,
} from '../contracts/voice-input';

const genId = () => crypto.randomUUID();
const genAttachId = () => crypto.randomUUID();

const MAX_SESSIONS = 50;

const LOGGER = console;

export class VoiceInputService implements IVoiceInputService {
    private _mockWarned = false;

    destroy(): void {
        /* no-op — all resources are method-scoped */
    }

    private sessions: VoiceInputSession[] = [];
    private attachments: MultimodalAttachment[] = [
        {
            id: genAttachId(),
            type: 'image',
            name: 'architecture-diagram.png',
            size: 245760,
            mimeType: 'image/png',
            preview:
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFkMjUzOSIvPjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NDhiIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0Ij5BcmNoaXRlY3R1cmUgRGlhZ3JhbTwvdGV4dD48L3N2Zz4=',
            status: 'uploaded',
        },
        {
            id: genAttachId(),
            type: 'audio',
            name: 'meeting-notes.mp3',
            size: 5242880,
            mimeType: 'audio/mpeg',
            status: 'uploaded',
        },
    ];

    getSessions(): VoiceInputSession[] {
        return [...this.sessions];
    }

    async startRecording(_source: VoiceInputSource): Promise<VoiceInputSession> {
        const session: VoiceInputSession = {
            id: genId(),
            status: 'recording',
            duration: 0,
            startedAt: Date.now(),
        };
        this.sessions.push(session);
        if (this.sessions.length > MAX_SESSIONS) {
            this.sessions = this.sessions.slice(-MAX_SESSIONS);
        }
        return session;
    }

    async stopRecording(sessionId: string): Promise<VoiceInputSession> {
        const session = this.sessions.find((s) => s.id === sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);
        session.status = 'processing';
        await new Promise((r) => setTimeout(r, 1000));
        session.status = 'ready';
        session.duration = Math.floor((Date.now() - session.startedAt) / 1000);
        if (!this._mockWarned) {
            LOGGER.warn(
                'VoiceInputService: Mock backend — stopRecording() returns simulated transcript',
            );
            this._mockWarned = true;
        }
        session.transcript =
            'This is a simulated voice transcription. In production, this would be processed by a speech-to-text engine.';
        return { ...session };
    }

    getTranscript(sessionId: string): string {
        const session = this.sessions.find((s) => s.id === sessionId);
        return session?.transcript || '';
    }

    async attachFile(file: File): Promise<MultimodalAttachment> {
        const attachment: MultimodalAttachment = {
            id: genAttachId(),
            type: file.type.startsWith('image/')
                ? 'image'
                : file.type.startsWith('audio/')
                  ? 'audio'
                  : file.type.startsWith('video/')
                    ? 'video'
                    : 'file',
            name: file.name,
            size: file.size,
            mimeType: file.type,
            status: 'pending',
        };
        await new Promise((r) => setTimeout(r, 500));
        attachment.status = 'uploaded';
        this.attachments.push(attachment);
        return attachment;
    }

    getAttachments(): MultimodalAttachment[] {
        return [...this.attachments];
    }

    removeAttachment(id: string): void {
        this.attachments = this.attachments.filter((a) => a.id !== id);
    }
}
