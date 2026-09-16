/**
 * Website preview service (roadmapp.md §P4).
 *
 * Assembles project files (HTML/CSS/JS) into a single preview document
 * that can be rendered in an iframe via srcdoc.
 */
import type { ProjectWorkspaceService } from './project-workspace-service';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('WebsitePreviewService');

export interface PreviewResult {
    html: string;
    errors: string[];
    fileCount: number;
}

export interface IWebsitePreviewService {
    /** Generate a self-contained HTML preview from project files */
    generatePreview(projectId: string): Promise<PreviewResult>;

    /** Validate project files for common issues */
    validate(projectId: string): Promise<{ valid: boolean; errors: string[] }>;
}

export class WebsitePreviewService implements IWebsitePreviewService {
    private workspace: ProjectWorkspaceService;

    constructor(workspace: ProjectWorkspaceService) {
        this.workspace = workspace;
    }

    async generatePreview(projectId: string): Promise<PreviewResult> {
        const errors: string[] = [];
        let html = '';
        let css = '';
        let js = '';
        let fileCount = 0;

        // Gather files from workspace
        const tree = await this.workspace.getTree(projectId);
        const flatFiles = this.flattenTree(tree);

        for (const filePath of flatFiles) {
            const file = await this.workspace.readFile(projectId, filePath);
            if (!file) continue;
            fileCount++;

            const ext = filePath.split('.').pop()?.toLowerCase();
            switch (ext) {
                case 'html':
                    html += file.content;
                    break;
                case 'css':
                    css += `/* ${filePath} */\n${file.content}\n`;
                    break;
                case 'js':
                case 'jsx':
                case 'ts':
                case 'tsx':
                    js += `/* ${filePath} */\n${file.content}\n`;
                    break;
            }
        }

        // If no HTML file found, create a basic template
        if (!html) {
            html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Preview</title>
</head>
<body>
    <div id="app">
        <h1>Project Preview</h1>
        <p>No HTML file found. Add an index.html to your project.</p>
    </div>
</body>
</html>`;
        }

        // Inject CSS and JS into the HTML
        let preview = html;

        // Inject CSS before </head> or at start of body
        if (css) {
            const cssTag = `<style data-project-css>\n${css}\n</style>`;
            if (preview.includes('</head>')) {
                preview = preview.replace('</head>', `${cssTag}\n</head>`);
            } else {
                preview = preview.replace('<body>', `<body>\n${cssTag}`);
            }
        }

        // Inject JS before </body> or at end
        if (js) {
            const jsTag = `<script data-project-js>\n${js}\n</script>`;
            if (preview.includes('</body>')) {
                preview = preview.replace('</body>', `${jsTag}\n</body>`);
            } else {
                preview += `\n${jsTag}`;
            }
        }

        // Add error boundary for JS
        if (js) {
            const errorScript = `<script data-project-errors>
window.onerror = function(msg, url, line, col, err) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:8px;background:#ef4444;color:#fff;font-size:12px;z-index:99999;font-family:monospace;';
    el.textContent = 'Error: ' + msg + ' (line ' + line + ')';
    document.body.appendChild(el);
};
</script>`;
            if (preview.includes('</body>')) {
                preview = preview.replace('</body>', `${errorScript}\n</body>`);
            }
        }

        return { html: preview, errors, fileCount };
    }

    async validate(projectId: string): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];
        const tree = await this.workspace.getTree(projectId);
        const flatFiles = this.flattenTree(tree);

        // Check for at least one HTML file
        const htmlFiles = flatFiles.filter((f) => f.endsWith('.html'));
        if (htmlFiles.length === 0) {
            errors.push('No HTML files found — add an index.html');
        }

        // Check for common issues
        for (const filePath of flatFiles) {
            const file = await this.workspace.readFile(projectId, filePath);
            if (!file) continue;

            if (filePath.endsWith('.html')) {
                // Check for missing doctype
                if (!file.content.includes('<!DOCTYPE') && !file.content.includes('<!doctype')) {
                    errors.push(`${filePath}: Missing DOCTYPE declaration`);
                }
                // Check for missing charset
                if (!file.content.includes('charset')) {
                    errors.push(`${filePath}: Missing charset meta tag`);
                }
            }

            if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                // Check for syntax basics (very basic check)
                const openBraces = (file.content.match(/\{/g) || []).length;
                const closeBraces = (file.content.match(/\}/g) || []).length;
                if (Math.abs(openBraces - closeBraces) > 2) {
                    errors.push(`${filePath}: Possible unmatched braces`);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    private flattenTree(tree: import('../types/workspace-types').WorkspaceTreeEntry[]): string[] {
        const result: string[] = [];
        for (const entry of tree) {
            if (entry.type === 'file') {
                result.push(entry.path);
            } else if (entry.children) {
                result.push(...this.flattenTree(entry.children));
            }
        }
        return result;
    }
}
