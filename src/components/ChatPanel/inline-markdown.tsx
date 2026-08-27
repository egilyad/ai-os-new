export function inlineMarkdown(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let idx = 0;
    const inlineRegex =
        /(`{1,2})([^`]+)\1|!\[([^\]]*)\]\(([^)]+)\)|(\*\*\*?|___?)(.+?)\5|\[([^\]]+)\]\(([^)]+)\)/g;
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
        } else if (match[3]) {
            const imgSrc = match[4]!;
            try {
                const parsed = new URL(imgSrc);
                if (parsed.protocol === 'https:') {
                    parts.push(
                        <img
                            key={`img-${idx++}`}
                            src={imgSrc}
                            alt={match[3]}
                            style={{ maxWidth: '100%', borderRadius: 8, margin: '0.25rem 0' }}
                            loading="lazy"
                        />,
                    );
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
            } catch {
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
            const url = match[8];
            try {
                const parsed = new URL(url);
                const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
                if (allowedProtocols.includes(parsed.protocol)) {
                    parts.push(
                        <a
                            key={`a-${idx++}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: '#60a5fa', textDecoration: 'underline' }}
                        >
                            {match[7]}
                        </a>,
                    );
                } else {
                    parts.push(
                        <span
                            key={`a-${idx++}`}
                            style={{ color: '#60a5fa', textDecoration: 'underline' }}
                        >
                            {match[7]}
                        </span>,
                    );
                }
            } catch {
                parts.push(
                    <span
                        key={`a-${idx++}`}
                        style={{ color: '#60a5fa', textDecoration: 'underline' }}
                    >
                        {match[7]}
                    </span>,
                );
            }
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}
