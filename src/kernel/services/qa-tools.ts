/**
 * QA agent tools for browser inspection (roadmapp.md §P5).
 */
import type { IQABrowserInspector } from './browser-inspector-service';

export const QA_TOOLS = [
    {
        name: 'qa_inspect_page',
        description: 'Run a full QA inspection on a project website (links, visual, text, functionality)',
        parameters: { projectId: { type: 'string', description: 'Project ID', required: true } },
    },
    {
        name: 'qa_check_links',
        description: 'Check all links in a project for broken references',
        parameters: { projectId: { type: 'string', description: 'Project ID', required: true } },
    },
    {
        name: 'qa_check_visual',
        description: 'Check visual structure (headings, images, nav, viewport)',
        parameters: { projectId: { type: 'string', description: 'Project ID', required: true } },
    },
    {
        name: 'qa_check_text',
        description: 'Check text quality (word count, title, alt texts, empty elements)',
        parameters: { projectId: { type: 'string', description: 'Project ID', required: true } },
    },
] as const;

export async function executeQATool(
    inspector: IQABrowserInspector,
    toolName: string,
    args: Record<string, unknown>,
): Promise<unknown> {
    const projectId = args.projectId as string;

    switch (toolName) {
        case 'qa_inspect_page':
            return inspector.inspect(projectId);
        case 'qa_check_links':
            return { links: await inspector.checkLinks(projectId) };
        case 'qa_check_visual':
            return inspector.checkVisual(projectId);
        case 'qa_check_text':
            return inspector.checkText(projectId);
        default:
            throw new Error(`Unknown QA tool: ${toolName}`);
    }
}
