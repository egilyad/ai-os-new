import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

function ensureInit(): void {
    if (!initialized) {
        // strict: no click handlers / foreign scripts from diagram source (LLM-generated code).
        mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict' });
        initialized = true;
    }
}

/**
 * Renders a ```mermaid fence as SVG. Invalid syntax degrades to a plain
 * code block — a broken diagram never breaks the answer.
 */
export function MermaidDiagram({ code }: { code: string }): React.ReactNode {
    const rawId = useId();
    const id = `mmd-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const [svg, setSvg] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setSvg(null);
        setFailed(false);
        if (code.trim() === '') {
            setFailed(true);
            return;
        }
        (async () => {
            try {
                ensureInit();
                await mermaid.parse(code);
                const { svg } = await mermaid.render(id, code);
                if (!cancelled) setSvg(svg);
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [code, id]);

    if (failed) {
        return (
            <pre
                style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    padding: '1rem',
                    overflow: 'auto',
                    fontSize: '0.85rem',
                    margin: '0.5rem 0',
                    fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                }}
            >
                <code>{code}</code>
            </pre>
        );
    }
    if (!svg) {
        return (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Rendering diagram…
            </span>
        );
    }
    return (
        <div
            style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 8,
                padding: '1rem',
                margin: '0.5rem 0',
                overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
