import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { textSecondaryItalic } from '../../styles/common';
import type { ProbeResult } from '../../kernel/contracts/probe';

const STATUS_COLORS: Record<string, string> = {
  ready: '#10b981', degraded: '#f59e0b', limited: '#f97316',
  broken: '#ef4444', unknown: '#64748b',
};

const tableShell: React.CSSProperties = {
  marginTop: '0.75rem',
  borderRadius: 10,
  border: '1px solid rgba(100,116,139,0.18)',
  overflow: 'hidden',
  background: 'rgba(0,0,0,0.18)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
};

const headerCell: React.CSSProperties = {
  padding: '0.55rem 0.65rem',
  color: 'var(--slate-400)',
  fontSize: '0.75rem',
  fontWeight: 700,
  textAlign: 'left',
  background: 'rgba(15,23,42,0.55)',
  borderBottom: '1px solid rgba(100,116,139,0.18)',
};

const cellStyle: React.CSSProperties = {
  padding: '0.6rem 0.65rem',
  color: 'var(--slate-300)',
  fontSize: '0.8rem',
  verticalAlign: 'middle',
  borderBottom: '1px solid rgba(100,116,139,0.12)',
};

interface ProbeResultsProps {
  results: Map<string, ProbeResult>;
  availableAgents: Array<{ id: string; label: string }>;
  expandedProbe: string | null;
  onToggleProbe: (id: string | null) => void;
}

const ProbeResults: React.FC<ProbeResultsProps> = ({ results, availableAgents, expandedProbe, onToggleProbe }) => {
  const entries = Array.from(results.entries());
  const readyCount = entries.filter(([, r]) => r.status === 'ready').length;

  return (
    <div style={tableShell}>
      <div style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-400)', borderBottom: '1px solid rgba(100,116,139,0.16)' }}>
        Quick Test — responses
        <span style={{ marginLeft: 8, color: 'var(--slate-500)', fontWeight: 500 }}>
          {readyCount}/{results.size} ready
        </span>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...headerCell, width: '24%' }}>Agent</th>
            <th style={{ ...headerCell, width: '16%' }}>Status</th>
            <th style={{ ...headerCell, width: '14%' }}>Latency</th>
            <th style={headerCell}>Response</th>
            <th style={{ ...headerCell, width: 44 }} />
          </tr>
        </thead>
        <tbody>
          {entries.map(([id, r]) => {
            const node = availableAgents.find(a => a.id === id);
            const name = node?.label || id;
            const c = STATUS_COLORS[r.status] || '#64748b';
            const isExpanded = expandedProbe === id;
            const preview = r.responseContent
              ? r.responseContent.slice(0, 80) + (r.responseContent.length > 80 ? '\u2026' : '')
              : undefined;
            return (
              <React.Fragment key={id}>
                <tr>
                  <td style={{ ...cellStyle, color: 'var(--slate-200)', fontWeight: 700 }}>{name}</td>
                  <td style={cellStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: c, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
                      {r.status}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, color: 'var(--slate-400)' }}>
                    {r.latency > 0 ? `${r.latency}ms` : '—'}
                  </td>
                  <td style={{ ...cellStyle, color: r.error ? '#fca5a5' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {preview || r.error || <span style={textSecondaryItalic}>no response</span>}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => onToggleProbe(isExpanded ? null : id)}
                      aria-label={isExpanded ? 'Collapse probe response' : 'Expand probe response'}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(15,23,42,0.8)', color: 'var(--slate-400)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={5} style={{ padding: '0.75rem', background: 'rgba(15,23,42,0.35)', borderBottom: '1px solid rgba(100,116,139,0.12)' }}>
                      <div style={{
                        padding: '0.75rem',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.18)',
                        color: 'var(--slate-300)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 180,
                        overflowY: 'auto',
                        lineHeight: 1.5,
                        fontSize: '0.82rem',
                      }}>
                        {r.responseContent || <span style={textSecondaryItalic}>no response</span>}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProbeResults;
