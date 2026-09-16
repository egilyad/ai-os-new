export interface SourceVerificationResult {
    readonly claimContext: string;
    readonly sourceUrl: string;
    readonly sourceExcerpt: string;
    readonly matchScore: number;
    readonly isDistorted: boolean;
    readonly warning: string;
}

export interface IAdversarialSourceService {
    verifyClaims(text: string, signal?: AbortSignal): Promise<SourceVerificationResult[]>;
}
