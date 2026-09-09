import type { ToolDefinition } from '../../kernel/instances';

interface ToolSchemaTabProps {
    tool: ToolDefinition;
    t: (key: string) => string;
}

export const ToolSchemaTab: React.FC<ToolSchemaTabProps> = ({ tool, t }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
            <label
                style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--slate-500)',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                    display: 'block',
                    letterSpacing: '0.05em',
                }}
            >
                {t('tools.schema_desc')}
            </label>
            <div
                style={{
                    background: 'var(--slate-950)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    overflowY: 'auto',
                    flex: 1,
                    maxHeight: '450px',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                }}
            >
                <pre
                    style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: 'var(--slate-300)',
                        fontFamily: '"JetBrains Mono", monospace',
                        lineHeight: 1.6,
                    }}
                >
                    {JSON.stringify(
                        {
                            name: tool.name,
                            description: tool.description,
                            parameters: tool.parameters || {
                                type: 'object',
                                properties: {
                                    query: {
                                        type: 'string',
                                        description: 'The primary input parameter for the tool',
                                    },
                                },
                                required: ['query'],
                            },
                        },
                        null,
                        2,
                    )}
                </pre>
            </div>
            <p
                style={{
                    fontSize: '0.85rem',
                    color: 'var(--slate-400)',
                    marginTop: '1rem',
                    lineHeight: 1.6,
                    padding: '1rem',
                    background: 'rgba(59,130,246,0.05)',
                    borderRadius: 10,
                    border: '1px solid rgba(59,130,246,0.2)',
                }}
            >
                This exact JSON schema is automatically injected into the LLM context via the
                `tools` array when the tool is equipped by an Agent, enabling precise, autonomous
                function calling.
            </p>
        </div>
    </div>
);
