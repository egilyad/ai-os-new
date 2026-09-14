/**
 * Website preview contract (roadmapp.md §P4).
 */
export interface PreviewResult {
    html: string;
    errors: string[];
    fileCount: number;
}

export interface IWebsitePreviewService {
    generatePreview(projectId: string): Promise<PreviewResult>;
    validate(projectId: string): Promise<{ valid: boolean; errors: string[] }>;
}
