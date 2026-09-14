/**
 * Artifact contract (roadmapp.md §P11).
 */
import type { Artifact, ArtifactType, ArtifactFile, BuildOutput, ProjectSnapshot, ExportBundle } from '../types/artifact-types';

export interface IArtifactService {
    createArtifact(projectId: string, type: ArtifactType, name: string, files: ArtifactFile[], description?: string): Artifact;
    getArtifact(artifactId: string): Artifact | undefined;
    listArtifacts(projectId: string, type?: ArtifactType): Artifact[];
    deleteArtifact(artifactId: string): boolean;
    build(projectId: string, name: string): Promise<BuildOutput>;
    createSnapshot(projectId: string, name: string, description?: string): Promise<ProjectSnapshot>;
    listSnapshots(projectId: string): ProjectSnapshot[];
    restoreSnapshot(snapshotId: string): Promise<void>;
    exportProject(projectId: string): Promise<ExportBundle>;
    importProject(bundle: ExportBundle): Promise<string>;
}
