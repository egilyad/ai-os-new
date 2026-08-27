export type VoiceInputSource = 'microphone' | 'file' | 'push_to_talk';
export type InputStatus = 'idle' | 'recording' | 'processing' | 'ready' | 'error';
export type MultimodalType = 'image' | 'audio' | 'video' | 'file';

export interface VoiceInputSession {
    id: string;
    status: InputStatus;
    duration: number;
    transcript?: string;
    error?: string;
    startedAt: number;
}

export interface MultimodalAttachment {
    id: string;
    type: MultimodalType;
    name: string;
    size: number;
    mimeType: string;
    preview?: string;
    status: 'pending' | 'uploaded' | 'error';
}

export interface IVoiceInputService {
    getSessions(): VoiceInputSession[];
    startRecording(source: VoiceInputSource): Promise<VoiceInputSession>;
    stopRecording(sessionId: string): Promise<VoiceInputSession>;
    getTranscript(sessionId: string): string;
    attachFile(file: File): Promise<MultimodalAttachment>;
    getAttachments(): MultimodalAttachment[];
    removeAttachment(id: string): void;
}
