import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    height?: number;
    readonly?: boolean;
    minimap?: boolean;
}

const SUPPORTED_LANGUAGES = [
    { id: 'typescript', label: 'TypeScript' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'json', label: 'JSON' },
    { id: 'yaml', label: 'YAML' },
    { id: 'markdown', label: 'Markdown' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'python', label: 'Python' },
    { id: 'plaintext', label: 'Plain Text' },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language = 'typescript',
    height = 400,
    readonly,
    minimap,
}) => {
    const [lang, setLang] = React.useState(language);
    const [isReady, setIsReady] = React.useState(false);

    React.useEffect(() => {
        const t = setTimeout(() => setIsReady(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: '0.3rem',
                    padding: '0.3rem 0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    alignItems: 'center',
                }}
            >
                <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    style={{
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'var(--text-primary)',
                        fontSize: '0.7rem',
                    }}
                >
                    {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.id} value={l.id}>
                            {l.label}
                        </option>
                    ))}
                </select>
                <div style={{ flex: 1 }} />
                {!readonly && (
                    <button
                        onClick={() => onChange(value)}
                        style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'rgba(59,130,246,0.3)',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                    >
                        Apply
                    </button>
                )}
            </div>
            {isReady ? (
                <Editor
                    height={height}
                    language={lang}
                    value={value}
                    onChange={(v) => {
                        if (v !== undefined) onChange(v);
                    }}
                    options={{
                        readOnly: readonly,
                        minimap: { enabled: minimap ?? false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        theme: 'vs-dark',
                        padding: { top: 8 },
                    }}
                />
            ) : (
                <div
                    style={{
                        height,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                    }}
                >
                    Loading editor...
                </div>
            )}
        </div>
    );
};

export default CodeEditor;
