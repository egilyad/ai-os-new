import { useState } from 'react';

/** Image with graceful degradation: hallucinated/broken URLs collapse to a caption instead of a broken icon. */
function SafeImage({ src, alt }: { src: string; alt: string }): React.ReactNode {
    const [failed, setFailed] = useState(false);
    if (failed) {
        return (
            <span
                style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
                title="Image failed to load"
            >
                [{alt || 'image'}]
            </span>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            style={{ maxWidth: '100%', borderRadius: 8, margin: '0.25rem 0' }}
            loading="lazy"
            onError={() => setFailed(true)}
        />
    );
}

/** Strip sentence punctuation from the end of a bare URL, keeping balanced parens (e.g. Wikipedia links). */
function cleanBareUrl(raw: string): string {
    let url = raw.replace(/[.,;:!?]+$/u, '');
    let opens = 0;
    let closes = 0;
    for (const ch of url) {
        if (ch === '(') opens++;
        else if (ch === ')') closes++;
    }
    while (closes > opens && url.endsWith(')')) {
        url = url.slice(0, -1);
        closes--;
    }
    return url;
}

const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

function renderLink(
    label: string,
    url: string,
    key: string,
): React.ReactNode {
    try {
        const parsed = new URL(url);
        if (ALLOWED_LINK_PROTOCOLS.includes(parsed.protocol)) {
            return (
                <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#60a5fa', textDecoration: 'underline' }}
                >
                    {label}
                </a>
            );
        }
    } catch {
        // fall through to plain-text fallback below
    }
    return (
        <span key={key} style={{ color: '#60a5fa', textDecoration: 'underline' }}>
            {label}
        </span>
    );
}

export function inlineMarkdown(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let idx = 0;
    const inlineRegex =
        /(`{1,2})([^`]+)\1|!\[([^\]]*)\]\(([^)]+)\)|(\*\*\*?|___?)(.+?)\5|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<>"'\]]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        if (match[1]) {
            parts.push(
                <code
                    key={`c-${idx++}`}
                    style={{
                        background: 'var(--border-subtle)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '0.85em',
                        fontFamily: 'monospace',
                    }}
                >
                    {match[2]}
                </code>,
            );
        } else if (match[3] !== undefined) {
            const imgSrc = match[4]!;
            let renderable = false;
            try {
                renderable = new URL(imgSrc).protocol === 'https:';
            } catch {
                renderable = false;
            }
            if (renderable) {
                parts.push(<SafeImage key={`img-${idx++}`} src={imgSrc} alt={match[3]} />);
            } else {
                parts.push(
                    <span
                        key={`img-${idx++}`}
                        style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
                    >
                        [{match[3]}]
                    </span>,
                );
            }
        } else if (match[5] && match[6]) {
            const delim = match[5];
            const inner = match[6];
            const isBold = delim.length >= 2;
            const style: React.CSSProperties = {};
            if (isBold) style.fontWeight = 700;
            if (delim.includes('*') || delim.includes('_')) style.fontStyle = 'italic';
            parts.push(
                <span key={`s-${idx++}`} style={style}>
                    {inner}
                </span>,
            );
        } else if (match[7] && match[8]) {
            parts.push(renderLink(match[7], match[8], `a-${idx++}`));
        } else if (match[9]) {
            // Bare URL (not inside [text](url), image, or code span): autolink like chat apps do.
            const url = cleanBareUrl(match[9]);
            const trailing = match[9].slice(url.length);
            parts.push(renderLink(url, url, `a-${idx++}`));
            if (trailing) parts.push(trailing);
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}
