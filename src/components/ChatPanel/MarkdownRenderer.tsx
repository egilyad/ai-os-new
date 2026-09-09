import React from 'react';
import { CodeRunner, EXECUTABLE_LANGS } from './CodeRunner';
import { CopyButton } from './CopyButton';
import { highlightCode } from './highlight-utils';
import { inlineMarkdown } from './inline-markdown';
import { parseTable } from './markdown-parser';

interface MarkdownRendererProps {
    content: string;
    isStreaming?: boolean;
}

const MarkdownRendererImpl: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
    if (isStreaming) {
        return (
            <div
                style={{
                    fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {content}
            </div>
        );
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLang = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (line.startsWith('```')) {
            if (inCodeBlock) {
                const highlighted = codeBlockLang
                    ? highlightCode(codeBlockContent, codeBlockLang)
                    : codeBlockContent;
                const isExecutable =
                    codeBlockLang &&
                    EXECUTABLE_LANGS.has(
                        codeBlockLang
                            .toLowerCase()
                            .replace(/^node/i, 'js')
                            .replace(/^javascript/i, 'js')
                            .replace(/^typescript/i, 'ts')
                            .replace(/^python/i, 'py'),
                    );
                elements.push(
                    <div key={`code-${i}`} style={{ position: 'relative', margin: '0.5rem 0' }}>
                        {codeBlockLang && (
                            <div
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-muted)',
                                    padding: '4px 12px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '8px 8px 0 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {codeBlockLang}
                            </div>
                        )}
                        <pre
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: codeBlockLang ? '0 0 8px 8px' : 8,
                                padding: '1rem',
                                overflow: 'auto',
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                margin: 0,
                                fontFamily:
                                    "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                            }}
                        >
                            <code>{highlighted}</code>
                        </pre>
                        <CopyButton text={codeBlockContent} />
                        {isExecutable && (
                            <CodeRunner code={codeBlockContent} language={codeBlockLang} />
                        )}
                    </div>,
                );
                codeBlockContent = '';
                codeBlockLang = '';
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
                codeBlockLang = line.slice(3).trim();
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent += (codeBlockContent ? '\n' : '') + line;
            continue;
        }

        if (line.trim() === '') {
            elements.push(<br key={`br-${i}`} />);
            continue;
        }

        if (line.startsWith('|')) {
            const tableLines: string[] = [line];
            let j = i + 1;
            while (j < lines.length && lines[j]!.startsWith('|')) {
                tableLines.push(lines[j]!);
                j++;
            }
            i = j - 1;
            elements.push(parseTable(tableLines, `tbl-${i}`));
            continue;
        }

        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            const level = headerMatch[1]!.length;
            const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
            elements.push(
                <Tag
                    key={`h-${i}`}
                    style={{
                        margin: '0.75rem 0 0.25rem',
                        fontWeight: 700,
                        fontSize: `${1.6 - level * 0.15}rem`,
                    }}
                >
                    {inlineMarkdown(headerMatch[2]!)}
                </Tag>,
            );
            continue;
        }

        if (line.startsWith('- ') || line.startsWith('* ')) {
            const items: React.ReactNode[] = [
                <li key={`li-${i}`} style={{ lineHeight: 1.7 }}>
                    {inlineMarkdown(line.slice(2))}
                </li>,
            ];
            let j = i + 1;
            while (j < lines.length && (lines[j]!.startsWith('- ') || lines[j]!.startsWith('* '))) {
                items.push(
                    <li key={`li-${j}`} style={{ lineHeight: 1.7 }}>
                        {inlineMarkdown(lines[j]!.slice(2))}
                    </li>,
                );
                j++;
            }
            i = j - 1;
            elements.push(
                <ul key={`ul-${i}`} style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                    {items}
                </ul>,
            );
            continue;
        }

        if (/^\d+\.\s/.test(line)) {
            const items: React.ReactNode[] = [
                <li key={`li-${i}`} style={{ lineHeight: 1.7 }}>
                    {inlineMarkdown(line.replace(/^\d+\.\s/, ''))}
                </li>,
            ];
            let j = i + 1;
            while (j < lines.length && /^\d+\.\s/.test(lines[j]!)) {
                items.push(
                    <li key={`li-${j}`} style={{ lineHeight: 1.7 }}>
                        {inlineMarkdown(lines[j]!.replace(/^\d+\.\s/, ''))}
                    </li>,
                );
                j++;
            }
            i = j - 1;
            elements.push(
                <ol key={`ol-${i}`} style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                    {items}
                </ol>,
            );
            continue;
        }

        if (line.startsWith('> ')) {
            elements.push(
                <blockquote
                    key={`bq-${i}`}
                    style={{
                        borderLeft: '3px solid rgba(255,255,255,0.2)',
                        paddingLeft: '1rem',
                        margin: '0.5rem 0',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                    }}
                >
                    {inlineMarkdown(line.slice(2))}
                </blockquote>,
            );
            continue;
        }

        elements.push(
            <p key={`p-${i}`} style={{ margin: '0.25rem 0', lineHeight: 1.7 }}>
                {inlineMarkdown(line)}
            </p>,
        );
    }

    if (inCodeBlock) {
        const highlighted = codeBlockLang
            ? highlightCode(codeBlockContent, codeBlockLang)
            : codeBlockContent;
        const isExecutable =
            codeBlockLang &&
            EXECUTABLE_LANGS.has(
                codeBlockLang
                    .toLowerCase()
                    .replace(/^node/i, 'js')
                    .replace(/^javascript/i, 'js')
                    .replace(/^typescript/i, 'ts')
                    .replace(/^python/i, 'py'),
            );
        elements.push(
            <div key="code-unclosed" style={{ position: 'relative', margin: '0.5rem 0' }}>
                {codeBlockLang && (
                    <div
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            padding: '4px 12px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px 8px 0 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        {codeBlockLang}
                    </div>
                )}
                <pre
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: codeBlockLang ? '0 0 8px 8px' : 8,
                        padding: '1rem',
                        overflow: 'auto',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        margin: 0,
                        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                    }}
                >
                    <code>{highlighted}</code>
                </pre>
                <CopyButton text={codeBlockContent} />
                {isExecutable && <CodeRunner code={codeBlockContent} language={codeBlockLang} />}
            </div>,
        );
    }

    return <>{elements}</>;
};

export const MarkdownRenderer = React.memo(
    MarkdownRendererImpl,
    (prev, next) => prev.content === next.content && prev.isStreaming === next.isStreaming,
);
