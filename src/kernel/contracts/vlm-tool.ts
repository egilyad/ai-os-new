export interface VisionResult {
    description: string;
    labels: string[];
    model: string;
}

/** Expose image understanding as a callable agent tool (OWL K2). */
export interface IVlmToolService {
    /** Analyze an image (base64 data URL or http URL) with a vision-capable model. */
    analyze(image: string, prompt?: string): Promise<VisionResult>;
    isConfigured(): boolean;
}
