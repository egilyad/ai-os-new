import { ChevronDown, ChevronRight } from 'lucide-react';
import { MAX_INLINE, valueType, valueColor } from './state-inspector-constants';

interface TreeNodeProps {
    keyName: string;
    value: unknown;
    depth: number;
    expanded: Set<string>;
    toggle: (path: string) => void;
    search: string;
    path: string;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
    keyName,
    value,
    depth,
    expanded,
    toggle,
    search,
    path,
}) => {
    const type = valueType(value);
    const isComplex = type.startsWith('object') || type.startsWith('array');
    const isExpanded = expanded.has(path);
    const matchesSearch =
        search.trim() !== '' &&
        (keyName.toLowerCase().includes(search.toLowerCase()) ||
            (type === 'string' && String(value).toLowerCase().includes(search.toLowerCase())) ||
            (type === 'number' && String(value).includes(search)));

    const indent = { paddingLeft: `${depth * 14}px` };
    const arrayLength = isComplex && Array.isArray(value) ? value.length : 0;
    const objectKeys =
        isComplex && !Array.isArray(value) && value && typeof value === 'object'
            ? Object.keys(value as object)
            : [];

    return (
        <div
            style={{
                fontSize: '0.78rem',
                fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
            }}
        >
            <div
                onClick={() => isComplex && toggle(path)}
                style={{
                    ...indent,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 6px',
                    cursor: isComplex ? 'pointer' : 'default',
                    background: matchesSearch ? 'rgba(245,158,11,0.1)' : 'transparent',
                    borderLeft: `2px solid ${matchesSearch ? '#f59e0b' : 'transparent'}`,
                }}
            >
                {isComplex ? (
                    isExpanded ? (
                        <ChevronDown size={11} color="#64748b" />
                    ) : (
                        <ChevronRight size={11} color="#64748b" />
                    )
                ) : (
                    <span style={{ width: 11 }} />
                )}
                <span style={{ color: 'var(--slate-300)' }}>{keyName}</span>
                <span style={{ color: 'var(--slate-600)' }}>:</span>
                {!isComplex && (
                    <span
                        style={{ color: valueColor(value), marginLeft: 4, wordBreak: 'break-all' }}
                    >
                        {type === 'string'
                            ? `"${value}"`
                            : type === 'null'
                              ? 'null'
                              : String(value)}
                    </span>
                )}
                {isComplex && (
                    <span
                        style={{
                            color: valueColor(value),
                            marginLeft: 4,
                            fontStyle: 'italic',
                            fontSize: '0.7rem',
                        }}
                    >
                        {type}
                    </span>
                )}
            </div>
            {isComplex && isExpanded && (
                <div>
                    {Array.isArray(value)
                        ? value
                              .slice(0, MAX_INLINE)
                              .map((item, i) => (
                                  <TreeNode
                                      key={`${path}.${i}`}
                                      keyName={`[${i}]`}
                                      value={item}
                                      depth={depth + 1}
                                      expanded={expanded}
                                      toggle={toggle}
                                      search={search}
                                      path={`${path}.${i}`}
                                  />
                              ))
                        : objectKeys
                              .slice(0, MAX_INLINE)
                              .map((k) => (
                                  <TreeNode
                                      key={k}
                                      keyName={k}
                                      value={(value as Record<string, unknown>)[k]}
                                      depth={depth + 1}
                                      expanded={expanded}
                                      toggle={toggle}
                                      search={search}
                                      path={`${path}.${k}`}
                                  />
                              ))}
                    {((Array.isArray(value) && arrayLength > MAX_INLINE) ||
                        (!Array.isArray(value) && objectKeys.length > MAX_INLINE)) && (
                        <div
                            style={{
                                ...indent,
                                padding: '2px 6px',
                                color: 'var(--slate-600)',
                                fontSize: '0.7rem',
                            }}
                        >
                            ...{' '}
                            {Array.isArray(value)
                                ? arrayLength - MAX_INLINE
                                : objectKeys.length - MAX_INLINE}{' '}
                            more
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
