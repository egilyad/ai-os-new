/**
 * BrowserInspectorService — simulated browser inspection for QA (roadmapp.md §P5).
 *
 * Parses HTML content and checks links, visual structure, text quality,
 * and basic functionality without a real browser.
 */
import type {
    LinkCheck,
    VisualCheck,
    TextCheck,
    FunctionalityCheck,
    QAReport,
} from '../types/qa-types';
import type { ProjectWorkspaceService } from './project-workspace-service';

export interface IQABrowserInspector {
    inspect(projectId: string): Promise<QAReport>;
    checkLinks(projectId: string): Promise<LinkCheck[]>;
    checkVisual(projectId: string): Promise<VisualCheck>;
    checkText(projectId: string): Promise<TextCheck>;
    checkFunctionality(projectId: string): Promise<FunctionalityCheck>;
}

export class BrowserInspectorService implements IQABrowserInspector {
    private workspace: ProjectWorkspaceService;

    constructor(workspace: ProjectWorkspaceService) {
        this.workspace = workspace;
    }

    async inspect(projectId: string): Promise<QAReport> {
        const links = await this.checkLinks(projectId);
        const visual = await this.checkVisual(projectId);
        const text = await this.checkText(projectId);
        const functionality = await this.checkFunctionality(projectId);

        const issues: string[] = [];
        const brokenLinks = links.filter((l) => !l.valid);
        if (brokenLinks.length > 0) issues.push(`${brokenLinks.length} broken link(s)`);
        if (!visual.hasHeadings) issues.push('No headings found');
        if (!visual.hasViewport) issues.push('Missing viewport meta tag');
        if (!visual.hasCharset) issues.push('Missing charset meta tag');
        if (!text.hasTitle) issues.push('Missing <title> tag');
        if (!text.hasMetaDescription) issues.push('Missing meta description');
        if (text.missingAltCount > 0) issues.push(`${text.missingAltCount} image(s) missing alt text`);
        if (text.emptyLinks > 0) issues.push(`${text.emptyLinks} empty link(s)`);
        if (text.emptyButtons > 0) issues.push(`${text.emptyButtons} empty button(s)`);
        if (functionality.brokenAnchors.length > 0) issues.push(`${functionality.brokenAnchors.length} broken anchor(s)`);

        // Score: start at 100, deduct for issues
        let score = 100;
        score -= brokenLinks.length * 10;
        if (!visual.hasHeadings) score -= 15;
        if (!visual.hasViewport) score -= 5;
        if (!visual.hasCharset) score -= 5;
        if (!text.hasTitle) score -= 10;
        if (!text.hasMetaDescription) score -= 5;
        score -= text.missingAltCount * 5;
        score -= text.emptyLinks * 5;
        score -= text.emptyButtons * 5;
        score -= functionality.brokenAnchors.length * 10;
        score = Math.max(0, Math.min(100, score));

        return {
            projectId,
            timestamp: Date.now(),
            links,
            visual,
            text,
            functionality,
            score,
            issues,
            passed: issues.length === 0,
        };
    }

    async checkLinks(projectId: string): Promise<LinkCheck[]> {
        const html = await this.getCombinedHtml(projectId);
        const linkRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
        const results: LinkCheck[] = [];
        let match;

        while ((match = linkRegex.exec(html)) !== null) {
            const rawUrl = match[1];
            const rawText = match[2];
            if (!rawUrl || rawText === undefined) continue;
            const url = rawUrl;
            const text = rawText.replace(/<[^>]*>/g, '').trim();

            // Check for broken anchors
            if (url.startsWith('#')) {
                const anchorId = url.slice(1);
                const idExists = html.includes(`id="${anchorId}"`) || html.includes(`id='${anchorId}'`);
                results.push({ url, text: text || url, valid: idExists, error: idExists ? undefined : 'Anchor not found' });
            }
            // Check for mailto/tel
            else if (url.startsWith('mailto:') || url.startsWith('tel:')) {
                results.push({ url, text: text || url, valid: true });
            }
            // External links — mark as valid (can't check in sandbox)
            else if (url.startsWith('http')) {
                results.push({ url, text: text || url, valid: true });
            }
            // Relative links — check if target file exists
            else {
                const exists = await this.workspace.readFile(projectId, url) !== undefined;
                results.push({ url, text: text || url, valid: exists, error: exists ? undefined : 'File not found' });
            }
        }

        return results;
    }

    async checkVisual(projectId: string): Promise<VisualCheck> {
        const html = await this.getCombinedHtml(projectId);

        const headingRegex = /<h[1-6][^>]*>/gi;
        const headings = html.match(headingRegex) || [];

        const imgRegex = /<img\s+[^>]*>/gi;
        const images = html.match(imgRegex) || [];

        return {
            hasHeadings: headings.length > 0,
            headingCount: headings.length,
            hasImages: images.length,
            hasForms: /<form[\s>]/i.test(html),
            hasNavigation: /<nav[\s>]/i.test(html) || /class=["'][^"']*nav/i.test(html),
            hasFooter: /<footer[\s>]/i.test(html) || /class=["'][^"']*footer/i.test(html),
            hasViewport: /viewport/i.test(html),
            hasCharset: /charset/i.test(html),
        };
    }

    async checkText(projectId: string): Promise<TextCheck> {
        const html = await this.getCombinedHtml(projectId);

        // Strip HTML tags for word count
        const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const wordCount = text.split(/\s+/).filter(Boolean).length;

        const imgRegex = /<img\s+[^>]*>/gi;
        const images = html.match(imgRegex) || [];
        const missingAlt = images.filter((img) => !/alt=["'][^"']+["']/i.test(img));

        const linkRegex = /<a(?:\s[^>]*)?>([\s\S]*?)<\/a>/gi;
        let emptyLinks = 0;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(html)) !== null) {
            const raw = linkMatch[1];
            if (raw === undefined) continue;
            const content = raw.replace(/<[^>]*>/g, '').trim();
            if (!content) emptyLinks++;
        }

        const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
        let emptyButtons = 0;
        let btnMatch;
        while ((btnMatch = buttonRegex.exec(html)) !== null) {
            const raw = btnMatch[1];
            if (raw === undefined) continue;
            const content = raw.replace(/<[^>]*>/g, '').trim();
            if (!content) emptyButtons++;
        }

        return {
            wordCount,
            hasTitle: /<title[^>]*>[^<]+<\/title>/i.test(html),
            hasMetaDescription: /meta\s+[^>]*description/i.test(html),
            hasAltTexts: missingAlt.length === 0 && images.length > 0,
            missingAltCount: missingAlt.length,
            emptyLinks,
            emptyButtons,
        };
    }

    async checkFunctionality(projectId: string): Promise<FunctionalityCheck> {
        const html = await this.getCombinedHtml(projectId);

        const hasScripts = /<script[\s>]/i.test(html);
        const hasEventListeners = /on(click|load|error|submit|change|input|keydown|keyup|mouseover)/i.test(html);
        const hasForms = /<form[\s>]/i.test(html);

        // Check internal links
        const internalLinks = html.match(/href=["']((?!http|mailto|tel|#)[^"']+)["']/gi) || [];
        const hasInternalLinks = internalLinks.length > 0;

        // Check broken anchors
        const anchorLinks = html.match(/href=["']#[^"']+["']/gi) || [];
        const brokenAnchors: string[] = [];
        for (const link of anchorLinks) {
            const anchorId = link.match(/href="#([^"]+)"/)?.[1];
            if (anchorId && !html.includes(`id="${anchorId}"`)) {
                brokenAnchors.push(anchorId);
            }
        }

        return {
            hasScripts,
            hasEventListeners,
            hasForms,
            hasInternalLinks,
            brokenAnchors,
        };
    }

    private async getCombinedHtml(projectId: string): Promise<string> {
        const tree = await this.workspace.getTree(projectId);
        const flatFiles = this.flattenTree(tree);
        let html = '';

        for (const filePath of flatFiles) {
            if (!filePath.endsWith('.html')) continue;
            const file = await this.workspace.readFile(projectId, filePath);
            if (file) html += file.content + '\n';
        }

        // Also include CSS/JS for structure analysis
        for (const filePath of flatFiles) {
            const file = await this.workspace.readFile(projectId, filePath);
            if (!file) continue;
            if (filePath.endsWith('.css')) html += `<style>${file.content}</style>\n`;
            if (filePath.endsWith('.js') || filePath.endsWith('.ts')) html += `<script>${file.content}</script>\n`;
        }

        return html;
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
