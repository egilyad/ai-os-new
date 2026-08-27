import type { ChatMessage } from '../kernel/types/llm-types';

export interface ExportableChat {
    id: string;
    title: string;
    model?: string;
    provider?: string;
    createdAt?: number;
    updatedAt?: number;
    messages: ChatMessage[];
}

export interface ChatExportOptions {
    includeTimestamps?: boolean;
    includeModel?: boolean;
    includeProvider?: boolean;
    includeStats?: boolean;
}

function formatDate(ts: number | undefined): string {
    if (!ts) return '';
    try {
        return new Date(ts).toISOString();
    } catch {
        return String(ts);
    }
}

function escapeMarkdown(text: string): string {
    return (
        text
            .replace(/\\(?=[`*_{}()#+\-.!>[\]])/g, '\\\\')
            // B10-159: Replace lookbehind (?<=^|\n) with simpler pattern — compatible with older browsers
            .replace(/(^|\n)(#+)(?=\s)/g, '$1\\$2')
    );
}

function sanitizeFilename(name: string): string {
    return (
        name
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 100) || 'chat'
    );
}

function computeStats(messages: ChatMessage[]) {
    let total = 0;
    let user = 0;
    let assistant = 0;
    let system = 0;
    let tool = 0;
    let wordCount = 0;
    for (const m of messages) {
        total++;
        if (m.role === 'user') user++;
        else if (m.role === 'assistant') assistant++;
        else if (m.role === 'system') system++;
        else if (m.role === 'tool') tool++;
        const wc = (m.content ?? '').trim().split(/\s+/).filter(Boolean).length;
        wordCount += wc;
    }
    return { total, user, assistant, system, tool, wordCount };
}

export function exportChatToMarkdown(
    chat: ExportableChat,
    options: ChatExportOptions = {},
): string {
    const lines: string[] = [];
    const opts = {
        includeTimestamps: true,
        includeModel: true,
        includeProvider: true,
        includeStats: true,
        ...options,
    };
    lines.push(`# ${chat.title || 'Chat'}`);
    lines.push('');
    if (opts.includeModel && chat.model) {
        lines.push(
            `> **Model:** \`${chat.model}\`${opts.includeProvider && chat.provider ? ` · **Provider:** \`${chat.provider}\`` : ''}`,
        );
        lines.push('');
    }
    if (opts.includeTimestamps) {
        if (chat.createdAt) lines.push(`- **Created:** ${formatDate(chat.createdAt)}`);
        if (chat.updatedAt) lines.push(`- **Updated:** ${formatDate(chat.updatedAt)}`);
        lines.push('');
    }
    if (opts.includeStats) {
        const s = computeStats(chat.messages);
        lines.push(`## Stats`);
        lines.push('');
        lines.push(`- **Messages:** ${s.total}`);
        lines.push(`- **Words:** ${s.wordCount.toLocaleString()}`);
        lines.push(
            `- **User:** ${s.user} · **Assistant:** ${s.assistant} · **System:** ${s.system} · **Tool:** ${s.tool}`,
        );
        lines.push('');
    }
    lines.push('---');
    lines.push('');
    for (const m of chat.messages) {
        const role = m.role.charAt(0).toUpperCase() + m.role.slice(1);
        lines.push(`## ${role}`);
        lines.push('');
        const body = escapeMarkdown((m.content ?? '').trim());
        lines.push(body || '_(empty)_');
        if (m.toolCalls && m.toolCalls.length > 0) {
            lines.push('');
            lines.push('**Tool calls:**');
            for (const tc of m.toolCalls) {
                lines.push(`- \`${tc.function.name}\``);
                if (tc.function.arguments) lines.push(`  - args: \`${tc.function.arguments}\``);
            }
        }
        lines.push('');
    }
    return lines.join('\n');
}

export function exportChatToJSON(chat: ExportableChat, pretty = true): string {
    const payload = {
        id: chat.id,
        title: chat.title,
        model: chat.model,
        provider: chat.provider,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        exportedAt: new Date().toISOString(),
        messageCount: chat.messages.length,
        messages: chat.messages.map((m, idx) => ({
            index: idx,
            role: m.role,
            content: m.content,
            name: m.name,
            toolCallId: m.toolCallId,
            toolCalls: m.toolCalls,
        })),
    };
    return JSON.stringify(payload, null, pretty ? 2 : 0);
}

export function exportChatToHtml(chat: ExportableChat, options: ChatExportOptions = {}): string {
    const opts = { includeTimestamps: true, includeModel: true, ...options };
    const esc = (s: string) =>
        s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    const parts: string[] = [];
    parts.push(
        `<!doctype html><html><head><meta charset="utf-8"><title>${esc(chat.title || 'Chat')}</title>`,
    );
    parts.push(
        `<style>body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1rem;color:#0f172a;}h1{margin:0 0 .5rem;}h2{font-size:1rem;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:0.3rem;margin-top:1.5rem;}.role-user{color:#2563eb;}.role-assistant{color:#16a34a;}.role-system{color:#64748b;}.role-tool{color:#a855f7;}.msg{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;padding:.75rem 1rem;border-radius:8px;margin:.5rem 0;}.meta{color:#94a3b8;font-size:.8rem;}</style>`,
    );
    parts.push(`</head><body><h1>${esc(chat.title || 'Chat')}</h1>`);
    if (opts.includeModel && chat.model) {
        parts.push(
            `<div class="meta">Model: <code>${esc(chat.model)}</code>${chat.provider ? ` · Provider: <code>${esc(chat.provider)}</code>` : ''}</div>`,
        );
    }
    if (opts.includeTimestamps && chat.createdAt) {
        parts.push(`<div class="meta">Created: ${esc(formatDate(chat.createdAt))}</div>`);
    }
    for (const m of chat.messages) {
        parts.push(`<h2 class="role-${esc(m.role)}">${esc(m.role)}</h2>`);
        parts.push(`<div class="msg">${esc(m.content ?? '')}</div>`);
    }
    parts.push('</body></html>');
    return parts.join('\n');
}

export function downloadFile(content: string, filename: string, mime: string): void {
    try {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = sanitizeFilename(filename);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
        }, 2000);
    } catch (err) {
        console.error('[exportChat] download failed', err);
    }
}

export function exportAndDownload(chat: ExportableChat, format: 'md' | 'json' | 'html'): void {
    const base = sanitizeFilename(chat.title || 'chat');
    if (format === 'md') {
        downloadFile(exportChatToMarkdown(chat), `${base}.md`, 'text/markdown;charset=utf-8');
    } else if (format === 'json') {
        downloadFile(exportChatToJSON(chat), `${base}.json`, 'application/json;charset=utf-8');
    } else {
        downloadFile(exportChatToHtml(chat), `${base}.html`, 'text/html;charset=utf-8');
    }
}
