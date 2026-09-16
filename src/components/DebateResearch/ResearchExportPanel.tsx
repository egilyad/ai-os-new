import React, { useState, useCallback } from 'react';
import { Download, Copy, FileText, FileJson, Globe, Check } from 'lucide-react';
import { researchRunService, hypothesisService } from '../../kernel/instances';
import { exportResearch, downloadExport, copyAsGithubIssue } from '../../utils/research-export';
import type { ExportFormat } from '../../utils/research-export';
import { useTranslation } from '../../i18n/useTranslation';

const ResearchExportPanel: React.FC = () => {
  useTranslation();
  const [format, setFormat] = useState<ExportFormat>('md');
  const [includeFindings, setIncludeFindings] = useState(true);
  const [includeHypotheses, setIncludeHypotheses] = useState(true);
  const [copied, setCopied] = useState<'clipboard' | 'json' | null>(null);

  const runs = researchRunService.getAllRuns();
  const hypotheses = hypothesisService.getAll();

  const handleExport = useCallback(() => {
    const content = exportResearch(runs, hypotheses, { format, includeFindings, includeHypotheses });
    const mimeMap: Record<ExportFormat, string> = {
      md: 'text/markdown;charset=utf-8',
      json: 'application/json;charset=utf-8',
      html: 'text/html;charset=utf-8',
    };
    const extMap: Record<ExportFormat, string> = { md: 'md', json: 'json', html: 'html' };
    downloadExport(content, `research-report.${extMap[format]}`, mimeMap[format]);
  }, [runs, hypotheses, format, includeFindings, includeHypotheses]);

  const handleCopyIssue = useCallback(async () => {
    const content = copyAsGithubIssue(runs, hypotheses);
    await navigator.clipboard.writeText(content);
    setCopied('clipboard');
    setTimeout(() => setCopied(null), 2000);
  }, [runs, hypotheses]);

  const handleCopyJson = useCallback(async () => {
    const content = exportResearch(runs, hypotheses, { format: 'json', includeFindings, includeHypotheses });
    await navigator.clipboard.writeText(content);
    setCopied('json');
    setTimeout(() => setCopied(null), 2000);
  }, [runs, hypotheses, includeFindings, includeHypotheses]);

  const completedRuns = runs.filter(r => r.status === 'completed');

  return (
    <div style={{ padding: '1.25rem', borderRadius: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        <Download size={16} color="#f59e0b" />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>Export Research</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ padding: '0.25rem 0.6rem', borderRadius: 6, background: 'var(--accent-tint)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600 }}>
          {runs.length} runs ({completedRuns.length} completed)
        </span>
        <span style={{ padding: '0.25rem 0.6rem', borderRadius: 6, background: 'var(--purple-tint)', color: '#c084fc', fontSize: '0.75rem', fontWeight: 600 }}>
          {hypotheses.length} hypotheses
        </span>
      </div>

      {/* Format selector */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Format</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {([
            { value: 'md' as ExportFormat, icon: <FileText size={14} />, label: 'Markdown' },
            { value: 'json' as ExportFormat, icon: <FileJson size={14} />, label: 'JSON' },
            { value: 'html' as ExportFormat, icon: <Globe size={14} />, label: 'HTML' },
          ]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormat(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.75rem', borderRadius: 6,
                border: format === opt.value ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.1)',
                background: format === opt.value ? 'rgba(245,158,11,0.1)' : 'transparent',
                color: format === opt.value ? '#fbbf24' : '#94a3b8',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--slate-400)', cursor: 'pointer' }}>
          <input type="checkbox" checked={includeFindings} onChange={e => setIncludeFindings(e.target.checked)} style={{ accentColor: '#f59e0b' }} />
          Include findings
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--slate-400)', cursor: 'pointer' }}>
          <input type="checkbox" checked={includeHypotheses} onChange={e => setIncludeHypotheses(e.target.checked)} style={{ accentColor: '#f59e0b' }} />
          Include hypotheses
        </label>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 8,
            border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
          }}
        >
          <Download size={14} /> Export
        </button>
        <button
          type="button"
          onClick={handleCopyIssue}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)', background: copied === 'clipboard' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: copied === 'clipboard' ? '#34d399' : '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.15s',
          }}
        >
          {copied === 'clipboard' ? <Check size={14} /> : <Copy size={14} />} Copy as GitHub Issue
        </button>
        <button
          type="button"
          onClick={handleCopyJson}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)', background: copied === 'json' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: copied === 'json' ? '#34d399' : '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.15s',
          }}
        >
          {copied === 'json' ? <Check size={14} /> : <FileJson size={14} />} Copy JSON
        </button>
      </div>
    </div>
  );
};

export default ResearchExportPanel;
