import { inlineMarkdown } from './inline-markdown';

export function parseTable(tableLines: string[], key: string): React.ReactNode {
    if (tableLines.length < 2) {
        return (
            <div
                key={key}
                style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    margin: '0.25rem 0',
                }}
            >
                {tableLines.join('\n')}
            </div>
        );
    }
    const separatorIndex = tableLines.findIndex((l) => /^[\s|:-]+$/.test(l) && l.includes('-'));
    const headerLine = separatorIndex === 0 ? null : tableLines[0];
    const bodyStart = separatorIndex >= 0 ? separatorIndex + 1 : 1;
    const bodyLines = tableLines.slice(bodyStart);

    const splitRow = (row: string): string[] =>
        row
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());

    return (
        <div key={key} style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
            <table
                style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                }}
            >
                {headerLine && (
                    <thead>
                        <tr>
                            {splitRow(headerLine).map((h, i) => (
                                <th
                                    key={`h-${h}-${i}`}
                                    style={{
                                        textAlign: 'left',
                                        padding: '0.5rem 0.75rem',
                                        borderBottom: '2px solid rgba(255,255,255,0.15)',
                                        fontWeight: 700,
                                        color: 'var(--text-main)',
                                        background: 'rgba(255,255,255,0.03)',
                                    }}
                                >
                                    {inlineMarkdown(h)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {bodyLines
                        .filter((l) => l.trim())
                        .map((row, ri) => (
                            <tr key={`r-${row.slice(0, 24)}-${ri}`}>
                                {splitRow(row).map((c, ci) => (
                                    <td
                                        key={`c-${ci}`}
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        {inlineMarkdown(c)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}
