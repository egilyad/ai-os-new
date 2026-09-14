/**
 * FileToolset — agent tools for workspace file operations (roadmapp.md §P2).
 *
 * Provides workspace_file_read, workspace_file_write, workspace_file_edit,
 * workspace_list_dir, workspace_search, workspace_grep as tools for the agentic loop.
 */
import type { IProjectWorkspaceService } from '../contracts/project-workspace';

export interface FileTool {
    name: string;
    description: string;
    parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export const FILE_TOOLS: FileTool[] = [
    {
        name: 'workspace_file_read',
        description: 'Read a file from the project workspace',
        parameters: {
            projectId: { type: 'string', description: 'Project ID', required: true },
            path: { type: 'string', description: 'File path (project-relative)', required: true },
        },
    },
    {
        name: 'workspace_file_write',
        description: 'Write content to a file in the project workspace',
        parameters: {
            projectId: { type: 'string', description: 'Project ID', required: true },
            path: { type: 'string', description: 'File path (project-relative)', required: true },
            content: { type: 'string', description: 'File content', required: true },
        },
    },
    {
        name: 'workspace_file_edit',
        description: 'Edit a file using line-range operations (replace/insert/delete)',
        parameters: {
            projectId: { type: 'string', description: 'Project ID', required: true },
            path: { type: 'string', description: 'File path', required: true },
            kind: { type: 'string', description: 'Edit kind: replace|insert|delete', required: true },
            startLine: { type: 'number', description: 'Start line (1-indexed)', required: true },
            endLine: { type: 'number', description: 'End line (1-indexed, inclusive)' },
            content: { type: 'string', description: 'New content for replace/insert' },
        },
    },
    {
        name: 'workspace_list_dir',
        description: 'List contents of a directory in the project workspace',
        parameters: {
            projectId: { type: 'string', description: 'Project ID', required: true },
            path: { type: 'string', description: 'Directory path (default: /)' },
        },
    },
    {
        name: 'workspace_search',
        description: 'Search files by name pattern',
        parameters: {
            projectId: { type: 'string', description: 'Project ID', required: true },
            pattern: { type: 'string', description: 'Search pattern (supports * wildcards)', required: true },
        },
    },
    {
        name: 'workspace_grep',
        description: 'Search file contents by regex pattern',
        parameters: {
            projectId: { type: 'string', description: 'Project ID', required: true },
            pattern: { type: 'string', description: 'Regex pattern', required: true },
            rootDir: { type: 'string', description: 'Root directory to search from' },
        },
    },
    {
        name: 'workspace_mkdir',
        description: 'Create a directory in the project workspace',
        parameters: {
            projectId: { type: 'string', description: 'Project ID', required: true },
            path: { type: 'string', description: 'Directory path', required: true },
        },
    },
    {
        name: 'workspace_delete',
        description: 'Delete a file from the project workspace',
        parameters: {
            projectId: { type: 'string', description: 'Project ID', required: true },
            path: { type: 'string', description: 'File path', required: true },
        },
    },
];

export type FileToolName = typeof FILE_TOOLS[number]['name'];

/**
 * Execute a file tool call.
 */
export async function executeFileTool(
    ws: IProjectWorkspaceService,
    toolName: string,
    args: Record<string, unknown>,
): Promise<unknown> {
    const projectId = args.projectId as string;

    switch (toolName) {
        case 'workspace_file_read': {
            const file = await ws.readFile(projectId, args.path as string);
            if (!file) return { error: `File not found: ${args.path}` };
            return { content: file.content, mime: file.mime, size: file.size };
        }

        case 'workspace_file_write': {
            const file = await ws.writeFile(projectId, args.path as string, args.content as string);
            return { success: true, path: file.path, size: file.size };
        }

        case 'workspace_file_edit': {
            const file = await ws.editFile(projectId, args.path as string, [{
                kind: args.kind as any,
                startLine: args.startLine as number,
                endLine: args.endLine as number | undefined,
                content: args.content as string | undefined,
            }]);
            return { success: true, path: file.path, size: file.size };
        }

        case 'workspace_list_dir': {
            const entries = await ws.listDir(projectId, (args.path as string) || '/');
            return entries.map((e) => ({ path: e.path, type: e.type, size: e.size }));
        }

        case 'workspace_search': {
            const paths = await ws.searchFiles(projectId, args.pattern as string);
            return { files: paths };
        }

        case 'workspace_grep': {
            const matches = await ws.grepContent(projectId, args.pattern as string, args.rootDir as string | undefined);
            return { matches };
        }

        case 'workspace_mkdir': {
            await ws.mkdir(projectId, args.path as string);
            return { success: true };
        }

        case 'workspace_delete': {
            await ws.deleteFile(projectId, args.path as string);
            return { success: true };
        }

        default:
            throw new Error(`Unknown file tool: ${toolName}`);
    }
}
