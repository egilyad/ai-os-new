/**
 * ArtifactService — artifact registry, build output, export/import, snapshots (roadmapp.md §P11).
 */
import type {
    Artifact,
    ArtifactType,
    ArtifactFile,
    BuildOutput,
    ProjectSnapshot,
    ExportBundle,
} from '../types/artifact-types';
import type { ProjectWorkspaceService } from './project-workspace-service';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ArtifactService');

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
    importProject(bundle: ExportBundle): Promise<string>; // returns new projectId
}

let artCounter = 0;
let snapCounter = 0;

export class ArtifactService implements IArtifactService {
    private artifacts = new Map<string, Artifact>();
    private snapshots = new Map<string, ProjectSnapshot>();
    private snapshotFiles = new Map<string, ArtifactFile[]>();
    private workspace: ProjectWorkspaceService;

    constructor(workspace: ProjectWorkspaceService) {
        this.workspace = workspace;
    }

    createArtifact(projectId: string, type: ArtifactType, name: string, files: ArtifactFile[], description?: string): Artifact {
        const artifact: Artifact = {
            id: `art-${Date.now()}-${++artCounter}`,
            projectId,
            type,
            name,
            description,
            files,
            metadata: { totalSize: files.reduce((s, f) => s + f.sizeBytes, 0) },
            createdAt: Date.now(),
        };
        this.artifacts.set(artifact.id, artifact);
        LOGGER.info('createArtifact', `Created ${type} artifact '${name}' for project ${projectId}`);
        return artifact;
    }

    getArtifact(artifactId: string): Artifact | undefined {
        return this.artifacts.get(artifactId);
    }

    listArtifacts(projectId: string, type?: ArtifactType): Artifact[] {
        const list = Array.from(this.artifacts.values()).filter((a) => a.projectId === projectId);
        if (!type) return list;
        return list.filter((a) => a.type === type);
    }

    deleteArtifact(artifactId: string): boolean {
        return this.artifacts.delete(artifactId);
    }

    async build(projectId: string, name: string): Promise<BuildOutput> {
        const startedAt = Date.now();
        const warnings: string[] = [];
        const errors: string[] = [];
        const outputFiles: string[] = [];

        try {
            const tree = await this.workspace.getTree(projectId);
            const files = this.flattenTree(tree);

            for (const filePath of files) {
                const file = await this.workspace.readFile(projectId, filePath);
                if (!file) continue;

                // Simulate build: copy files as-is, validate HTML
                if (filePath.endsWith('.html')) {
                    if (!file.content.includes('<!DOCTYPE')) {
                        warnings.push(`${filePath}: missing DOCTYPE`);
                    }
                    outputFiles.push(filePath);
                } else if (filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                    outputFiles.push(filePath);
                }
            }

            const artifactFiles: ArtifactFile[] = [];
            for (const fp of outputFiles) {
                const file = await this.workspace.readFile(projectId, fp);
                if (file) {
                    artifactFiles.push({
                        path: fp,
                        content: file.content,
                        sizeBytes: new TextEncoder().encode(file.content).length,
                        mimeType: fp.endsWith('.html') ? 'text/html' : fp.endsWith('.css') ? 'text/css' : 'application/javascript',
                    });
                }
            }

            const artifact = this.createArtifact(projectId, 'build', name, artifactFiles);

            return {
                artifactId: artifact.id,
                success: errors.length === 0,
                durationMs: Date.now() - startedAt,
                warnings,
                errors,
                outputFiles,
            };
        } catch (e) {
            errors.push(String(e));
            return {
                artifactId: '',
                success: false,
                durationMs: Date.now() - startedAt,
                warnings,
                errors,
                outputFiles,
            };
        }
    }

    async createSnapshot(projectId: string, name: string, description?: string): Promise<ProjectSnapshot> {
        const tree = await this.workspace.getTree(projectId);
        const filePaths = this.flattenTree(tree);
        const files: ArtifactFile[] = [];
        let totalSize = 0;

        for (const fp of filePaths) {
            const file = await this.workspace.readFile(projectId, fp);
            if (file) {
                const size = new TextEncoder().encode(file.content).length;
                files.push({ path: fp, content: file.content, sizeBytes: size, mimeType: 'application/octet-stream' });
                totalSize += size;
            }
        }

        const snapshot: ProjectSnapshot = {
            id: `snap-${Date.now()}-${++snapCounter}`,
            projectId,
            name,
            description,
            fileCount: files.length,
            totalSizeBytes: totalSize,
            createdAt: Date.now(),
        };

        this.snapshots.set(snapshot.id, snapshot);
        this.snapshotFiles.set(snapshot.id, files);
        LOGGER.info('createSnapshot', `Snapshot '${name}' created for project ${projectId}: ${files.length} files`);
        return snapshot;
    }

    listSnapshots(projectId: string): ProjectSnapshot[] {
        return Array.from(this.snapshots.values()).filter((s) => s.projectId === projectId);
    }

    async restoreSnapshot(snapshotId: string): Promise<void> {
        const snapshot = this.snapshots.get(snapshotId);
        if (!snapshot) throw new Error(`Snapshot not found: ${snapshotId}`);

        const files = this.snapshotFiles.get(snapshotId);
        if (!files) throw new Error(`Snapshot files not found: ${snapshotId}`);

        for (const file of files) {
            await this.workspace.writeFile(snapshot.projectId, file.path, file.content);
        }

        LOGGER.info('restoreSnapshot', `Restored snapshot '${snapshot.name}' to project ${snapshot.projectId}`);
    }

    async exportProject(projectId: string): Promise<ExportBundle> {
        const tree = await this.workspace.getTree(projectId);
        const filePaths = this.flattenTree(tree);
        const files: ArtifactFile[] = [];

        for (const fp of filePaths) {
            const file = await this.workspace.readFile(projectId, fp);
            if (file) {
                const size = new TextEncoder().encode(file.content).length;
                files.push({ path: fp, content: file.content, sizeBytes: size, mimeType: 'application/octet-stream' });
            }
        }

        return {
            projectId,
            projectName: `project-${projectId}`,
            version: '1.0.0',
            files,
            metadata: { fileCount: files.length, exportedAt: Date.now() },
            exportedAt: Date.now(),
        };
    }

    async importProject(bundle: ExportBundle): Promise<string> {
        const newId = `imported-${Date.now()}`;

        for (const file of bundle.files) {
            await this.workspace.writeFile(newId, file.path, file.content);
        }

        LOGGER.info('importProject', `Imported project '${bundle.projectName}' as ${newId}: ${bundle.files.length} files`);
        return newId;
    }

    private flattenTree(tree: import('../types/workspace-types').WorkspaceTreeEntry[]): string[] {
        const result: string[] = [];
        for (const entry of tree) {
            if (entry.type === 'file') result.push(entry.path);
            else if (entry.children) result.push(...this.flattenTree(entry.children));
        }
        return result;
    }
}
