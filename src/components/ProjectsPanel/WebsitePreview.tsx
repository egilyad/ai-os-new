import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { projectManagerService, projectWorkspaceService } from '../../kernel/instances/services-extras';
import { Button } from '../../components/Common';
import type { Project } from '../../kernel/types/project-types';

const PREVIEW_CONTAINER: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid #2a2a35',
    borderRadius: 8,
    background: '#0f0f1a',
};

const PREVIEW_HEADER: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.4rem 0.6rem',
    borderBottom: '1px solid #2a2a35',
    fontSize: '0.78rem',
    opacity: 0.7,
};

const PREVIEW_IFRAME: React.CSSProperties = {
    flex: 1,
    border: 'none',
    background: '#ffffff',
};

const ERROR_BAR: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    background: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    maxHeight: 120,
    overflowY: 'auto',
};

const VALIDATION_LIST: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    fontSize: '0.75rem',
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 6,
    marginTop: '0.5rem',
};

interface Props {
    project: Project;
}

const WebsitePreview: React.FC<Props> = ({ project }) => {
    const { t } = useTranslation();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const generatePreview = async () => {
        setLoading(true);
        try {
            const ws = projectWorkspaceService();
            const tree = await ws.getTree(project.id);
            const flatFiles = flattenTree(tree);

            let html = '';
            let css = '';
            let js = '';
            let fileCount = 0;

            for (const filePath of flatFiles) {
                const file = await ws.readFile(project.id, filePath);
                if (!file) continue;
                fileCount++;
                const ext = filePath.split('.').pop()?.toLowerCase();
                if (ext === 'html') html += file.content;
                else if (ext === 'css') css += `/* ${filePath} */\n${file.content}\n`;
                else if (['js', 'jsx', 'ts', 'tsx'].includes(ext!)) js += `/* ${filePath} */\n${file.content}\n`;
            }

            if (!html) {
                html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Preview</title></head><body><div id="app"><h2>No HTML files yet</h2><p>Add an index.html to your project.</p></div></body></html>`;
            }

            // Inject CSS
            if (css) {
                const tag = `<style data-project>\n${css}\n</style>`;
                html = html.includes('</head>') ? html.replace('</head>', `${tag}\n</head>`) : html.replace('<body>', `<body>\n${tag}`);
            }

            // Inject JS + error boundary
            if (js) {
                const boundary = `<script>window.onerror=function(m,u,l){var e=document.createElement('div');e.style.cssText='position:fixed;bottom:0;left:0;right:0;padding:6px;background:#ef4444;color:#fff;font:12px monospace;z-index:99999';e.textContent='Error: '+m+' (line '+l+')';document.body.appendChild(e);};</script>`;
                const tag = `<script data-project>\n${js}\n</script>`;
                html = html.includes('</body>') ? html.replace('</body>', `${boundary}\n${tag}\n</body>`) : html + `\n${boundary}\n${tag}`;
            }

            setPreviewHtml(html);
            setErrors([]);

            // Run validation
            const errs: string[] = [];
            if (!flatFiles.some((f) => f.endsWith('.html'))) errs.push('No HTML files found');
            setValidationErrors(errs);
        } catch (e) {
            setErrors([String(e)]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generatePreview();
    }, [project.id]);

    // Auto-refresh every 5s when enabled
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(generatePreview, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, project.id]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={PREVIEW_HEADER}>
                <span>{t('preview.title')}: {project.name}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                        {t('preview.autoRefresh')}
                    </label>
                    <Button variant="ghost" size="sm" onClick={generatePreview} disabled={loading}>
                        {loading ? t('preview.refreshing') : t('preview.refresh')}
                    </Button>
                </div>
            </div>

            {errors.length > 0 && <div style={ERROR_BAR}>{errors.join('\n')}</div>}
            {validationErrors.length > 0 && (
                <div style={VALIDATION_LIST}>
                    {validationErrors.map((e, i) => <div key={i}>⚠ {e}</div>)}
                </div>
            )}

            <div style={PREVIEW_CONTAINER}>
                {previewHtml ? (
                    <iframe
                        ref={iframeRef}
                        srcDoc={previewHtml}
                        style={PREVIEW_IFRAME}
                        title="Website Preview"
                        sandbox="allow-scripts allow-same-origin"
                    />
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                        {t('preview.noFiles')}
                    </div>
                )}
            </div>
        </div>
    );
};

function flattenTree(tree: import('../../kernel/types/workspace-types').WorkspaceTreeEntry[]): string[] {
    const result: string[] = [];
    for (const entry of tree) {
        if (entry.type === 'file') result.push(entry.path);
        else if (entry.children) result.push(...flattenTree(entry.children));
    }
    return result;
}

export default WebsitePreview;
