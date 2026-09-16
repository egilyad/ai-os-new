/**
 * Artifact types (roadmapp.md §P11).
 */

export type ArtifactType = 'build' | 'export' | 'snapshot' | 'deployment' | 'report';

export interface Artifact {
    id: string;
    projectId: string;
    type: ArtifactType;
    name: string;
    description?: string;
    files: ArtifactFile[];
    metadata: Record<string, unknown>;
    createdAt: number;
}

export interface ArtifactFile {
    path: string;
    content: string;
    sizeBytes: number;
    mimeType: string;
}

export interface BuildOutput {
    artifactId: string;
    success: boolean;
    durationMs: number;
    warnings: string[];
    errors: string[];
    outputFiles: string[];
}

export interface ProjectSnapshot {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    fileCount: number;
    totalSizeBytes: number;
    createdAt: number;
}

export interface ExportBundle {
    projectId: string;
    projectName: string;
    version: string;
    files: ArtifactFile[];
    metadata: Record<string, unknown>;
    exportedAt: number;
}
