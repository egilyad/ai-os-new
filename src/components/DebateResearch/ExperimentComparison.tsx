import React, { useState, useMemo } from 'react';
import {
  GitCompare, ArrowLeftRight, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { researchRunService } from '../../kernel/instances';
import type { ResearchRun } from '../../kernel/services/research-run-service';
import { glassPanel } from '../../styles/common';

export const ExperimentComparison: React.FC = () => {
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const allRuns = useMemo(() => researchRunService.getAllRuns(), []);
  const completedRuns = useMemo(() => allRuns.filter(r => r.status === 'completed' || r.status === 'failed'), [allRuns]);

  const left = useMemo(() => allRuns.find(r => r.id === leftId) || null, [allRuns, leftId]);
  const right = useMemo(() => allRuns.find(r => r.id === rightId) || null, [allRuns, rightId]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDuration = (r: ResearchRun) => {
    if (!r.completedAt) return '—';
    return `${((r.completedAt - r.startedAt) / 1000).toFixed(1)}s`;
  };

  const diffFields = useMemo(() => {
    if (!left || !right) return [];
    const fields: Array<{ key: string; label: string; leftVal: string; rightVal: string; match: boolean }> = [];

    fields.push({ key: 'module', label: 'Module', leftVal: left.module, rightVal: right.module, match: left.module === right.module });
    fields.push({ key: 'status', label: 'Status', leftVal: left.status, rightVal: right.status, match: left.status === right.status });
    fields.push({ key: 'duration', label: 'Duration', leftVal: formatDuration(left), rightVal: formatDuration(right), match: formatDuration(left) === formatDuration(right) });
    fields.push({ key: 'findings', label: 'Findings', leftVal: `${left.findings?.length || 0} items`, rightVal: `${right.findings?.length || 0} items`, match: (left.findings?.length || 0) === (right.findings?.length || 0) });

    const lParams = JSON.stringify(left.parameters, null, 2);
    const rParams = JSON.stringify(right.parameters, null, 2);
    fields.push({ key: 'parameters', label: 'Parameters', leftVal: lParams, rightVal: rParams, match: lParams === rParams });

    const lSummary = left.summary || '(no summary)';
    const rSummary = right.summary || '(no summary)';
    fields.push({ key: 'summary', label: 'Summary', leftVal: lSummary, rightVal: rSummary, match: lSummary === rSummary });

    return fields;
  }, [left, right]);

  const selectRandom = (side: 'left' | 'right') => {
    if (completedRuns.length < 2) return;
    const other = side === 'left' ? rightId : leftId;
    const candidates = completedRuns.filter(r => r.id !== other);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (pick) {
      if (side === 'left') setLeftId(pick.id);
      else setRightId(pick.id);
    }
  };

  if (completedRuns.length < 2) {
    return (
      <div style={{ ...glassPanel, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: 200, color: 'var(--slate-500)' }}>
        <GitCompare size={32} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Need at least 2 completed runs to compare</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Run some research experiments first, then come back.</p>
      </div>
    );
  }

  return (
    <div style={{ ...glassPanel, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ padding: '0.5rem', background: 'rgba(6,182,212,0.15)', borderRadius: 10, border: '1px solid rgba(6,182,212,0.3)' }}>
          <GitCompare size={20} color="#06b6d4" />
        </div>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--slate-50)', margin: 0 }}>Experiment Comparison</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--slate-400)', margin: 0 }}>Side-by-side diff of two research runs</p>
        </div>
      </div>

      {/* Run selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
        {/* Left selector */}
        <div>
          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Run A</label>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <select
              value={leftId}
              onChange={e => setLeftId(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'var(--slate-200)', fontSize: '0.75rem', outline: 'none' }}
            >
              <option value="">Select run...</option>
              {completedRuns.map(r => (
                <option key={r.id} value={r.id}>{r.module} — {formatDate(r.startedAt)}</option>
              ))}
            </select>
            <button onClick={() => selectRandom('left')} style={{ padding: '0.3rem 0.5rem', fontSize: '0.6rem', fontWeight: 700, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--slate-400)', cursor: 'pointer' }}>Random</button>
          </div>
        </div>

        {/* Swap */}
        <button
          onClick={() => { setLeftId(rightId); setRightId(leftId); }}
          style={{ padding: '0.5rem', borderRadius: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', cursor: 'pointer', marginTop: '1rem' }}
          title="Swap"
        >
          <ArrowLeftRight size={16} />
        </button>

        {/* Right selector */}
        <div>
          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Run B</label>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <select
              value={rightId}
              onChange={e => setRightId(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'var(--slate-200)', fontSize: '0.75rem', outline: 'none' }}
            >
              <option value="">Select run...</option>
              {completedRuns.map(r => (
                <option key={r.id} value={r.id}>{r.module} — {formatDate(r.startedAt)}</option>
              ))}
            </select>
            <button onClick={() => selectRandom('right')} style={{ padding: '0.3rem 0.5rem', fontSize: '0.6rem', fontWeight: 700, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--slate-400)', cursor: 'pointer' }}>Random</button>
          </div>
        </div>
      </div>

      {/* Diff table */}
      {left && right && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {/* Summary bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: '0.7rem' }}>
            <span style={{ color: 'var(--slate-400)', fontWeight: 700 }}>Differences:</span>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{diffFields.filter(f => f.match).length} same</span>
            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{diffFields.filter(f => !f.match).length} different</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: 'var(--slate-500)', fontSize: '0.6rem' }}>Click field to expand</span>
          </div>

          {diffFields.map(f => {
            const isExpanded = expandedField === f.key;
            const Icon = f.match ? CheckCircle2 : AlertTriangle;
            const color = f.match ? '#10b981' : '#f59e0b';
            return (
              <div key={f.key}>
                <div
                  onClick={() => setExpandedField(isExpanded ? null : f.key)}
                  style={{ display: 'grid', gridTemplateColumns: '120px 1fr 24px 1fr', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: 8, background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                >
                  {/* Left value */}
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: f.match ? '#94a3b8' : '#f8fafc', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.leftVal.length > 40 ? f.leftVal.slice(0, 38) + '…' : f.leftVal}
                  </div>

                  {/* Label + indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', order: 0 }}>
                    <Icon size={12} color={color} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-200)' }}>{f.label}</span>
                  </div>

                  {/* Chevron */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {isExpanded ? <ChevronUp size={12} color="#64748b" /> : <ChevronDown size={12} color="#64748b" />}
                  </div>

                  {/* Right value */}
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: f.match ? '#94a3b8' : '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.rightVal.length > 40 ? f.rightVal.slice(0, 38) + '…' : f.rightVal}
                  </div>
                </div>

                {/* Expanded view */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.5rem 0.75rem 0.75rem 0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Run A — {left.module}</div>
                          <pre style={{ fontSize: '0.6rem', color: 'var(--slate-300)', fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 150, overflow: 'auto' }}>{f.leftVal}</pre>
                        </div>
                        <div style={{ padding: '0.5rem', borderRadius: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Run B — {right.module}</div>
                          <pre style={{ fontSize: '0.6rem', color: 'var(--slate-300)', fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 150, overflow: 'auto' }}>{f.rightVal}</pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
