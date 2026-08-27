import React, { useState } from 'react';

type JsonSchemaType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'integer';

interface JsonSchemaProperty {
    type: JsonSchemaType;
    title?: string;
    description?: string;
    default?: unknown;
    enum?: string[];
    minimum?: number;
    maximum?: number;
    items?: JsonSchemaProperty;
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
}

interface JsonSchemaEditorProps {
    schema: JsonSchemaProperty;
    value: Record<string, unknown>;
    onChange: (value: Record<string, unknown>) => void;
    height?: number;
}

const SchemaInput: React.FC<{
    prop: JsonSchemaProperty;
    name: string;
    value: unknown;
    onChange: (v: unknown) => void;
    path: string;
}> = ({ prop, name, value, onChange }) => {
    if (prop.enum) {
        const current = String(value ?? prop.default ?? prop.enum[0]);
        return (
            <select
                value={current}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                }}
            >
                {prop.enum.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        );
    }

    switch (prop.type) {
        case 'string':
            return (
                <input
                    type="text"
                    value={String(value ?? prop.default ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={prop.description || name}
                    style={{
                        width: '100%',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                    }}
                />
            );
        case 'number':
        case 'integer':
            return (
                <input
                    type="number"
                    value={String(value ?? prop.default ?? 0)}
                    onChange={(e) =>
                        onChange(
                            prop.type === 'integer'
                                ? parseInt(e.target.value)
                                : parseFloat(e.target.value),
                        )
                    }
                    min={prop.minimum}
                    max={prop.maximum}
                    style={{
                        width: '100%',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                    }}
                />
            );
        case 'boolean':
            return (
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={Boolean(value ?? prop.default ?? false)}
                        onChange={(e) => onChange(e.target.checked)}
                        style={{ accentColor: '#3b82f6' }}
                    />
                    {value ? 'true' : 'false'}
                </label>
            );
        default:
            return (
                <input
                    type="text"
                    value={JSON.stringify(value ?? prop.default ?? '')}
                    onChange={(e) => {
                        try {
                            onChange(JSON.parse(e.target.value));
                        } catch {
                            onChange(e.target.value);
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                    }}
                />
            );
    }
};

export const JsonSchemaEditor: React.FC<JsonSchemaEditorProps> = ({
    schema,
    value,
    onChange,
    height,
}) => {
    const [expanded, setExpanded] = useState<Set<string>>(
        new Set(Object.keys(schema.properties || {})),
    );

    const toggleExpand = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const updateNested = (
        obj: Record<string, unknown>,
        path: string[],
        val: unknown,
    ): Record<string, unknown> => {
        const result = { ...obj };
        let current = result;
        for (let i = 0; i < path.length - 1; i++) {
            current[path[i]!] = { ...((current[path[i]!] as Record<string, unknown>) || {}) };
            current = current[path[i]!] as Record<string, unknown>;
        }
        current[path[path.length - 1]!] = val;
        return result;
    };

    const renderProperties = (
        props: Record<string, JsonSchemaProperty>,
        obj: Record<string, unknown>,
        parentPath: string,
    ) => {
        const entries = Object.entries(props);
        const required = schema.required || [];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {entries.map(([key, prop]) => {
                    const isRequired = required.includes(key);
                    const fullPath = parentPath ? `${parentPath}.${key}` : key;
                    const isObject = prop.type === 'object' && prop.properties;
                    const isExpanded = expanded.has(fullPath);
                    return (
                        <div
                            key={key}
                            style={{
                                padding: '0.4rem 0.5rem',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    marginBottom: isObject ? '0.3rem' : 0,
                                }}
                            >
                                {isObject && (
                                    <button
                                        onClick={() => toggleExpand(fullPath)}
                                        style={{
                                            padding: 0,
                                            border: 'none',
                                            background: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontSize: '0.7rem',
                                            width: 16,
                                        }}
                                    >
                                        {isExpanded ? '\u25BC' : '\u25B6'}
                                    </button>
                                )}
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {key}
                                    {isRequired && (
                                        <span style={{ color: 'var(--error)', marginLeft: '0.15rem' }}>
                                            *
                                        </span>
                                    )}
                                </span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                    {prop.type}
                                </span>
                                {prop.description && (
                                    <span
                                        style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}
                                    >
                                        — {prop.description}
                                    </span>
                                )}
                            </div>
                            {isObject && isExpanded && prop.properties && (
                                <div style={{ marginLeft: '1rem', marginTop: '0.3rem' }}>
                                    {renderProperties(
                                        prop.properties,
                                        (obj[key] as Record<string, unknown>) || {},
                                        fullPath,
                                    )}
                                </div>
                            )}
                            {!isObject && (
                                <SchemaInput
                                    prop={prop}
                                    name={key}
                                    value={obj[key]}
                                    onChange={(v) =>
                                        onChange(updateNested(value, fullPath.split('.'), v))
                                    }
                                    path={fullPath}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!schema.properties) {
        return (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No schema properties defined
            </div>
        );
    }

    return (
        <div style={{ maxHeight: height || 500, overflow: 'auto', padding: '0.5rem' }}>
            {schema.title && (
                <div
                    style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem',
                    }}
                >
                    {schema.title}
                </div>
            )}
            {renderProperties(schema.properties, value || {}, '')}
        </div>
    );
};

export default JsonSchemaEditor;
