import type { ResearchRun } from '../kernel/services/research-run-service';
import type { ResearchHypothesis } from '../kernel/types/research-types';

type ExportFormat = 'md' | 'json' | 'html';

interface ExportOptions {
  format: ExportFormat;
  includeFindings: boolean;
  includeHypotheses: boolean;
  title?: string;
}

function formatDate(ts: number | undefined): string {
  if (!ts) return '';
  try {
    return new Date(ts).toISOString();
  } catch {
    return String(ts);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'research';
}

function statusBadge(status: string): string {
  switch (status) {
    case 'completed': return '#10b981';
    case 'failed': return '#ef4444';
    case 'running': return '#f59e0b';
    case 'accepted': return '#10b981';
    case 'rejected': return '#ef4444';
    case 'active': return '#3b82f6';
    case 'debating': return '#a855f7';
    default: return '#64748b';
  }
}

// ── Markdown ──

function generateMarkdown(runs: ResearchRun[], hypotheses: ResearchHypothesis[], options: ExportOptions): string {
  const title = options.title || 'Research Report';
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`# ${title}`);
  lines.push(`> Generated ${now}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Research runs:** ${runs.length}`);
  lines.push(`- **Hypotheses:** ${hypotheses.length}`);
  lines.push(`- **Completed:** ${runs.filter(r => r.status === 'completed').length}`);
  lines.push(`- **Failed:** ${runs.filter(r => r.status === 'failed').length}`);
  lines.push(`- **Accepted hypotheses:** ${hypotheses.filter(h => h.status === 'accepted').length}`);
  lines.push('');

  // Findings
  if (options.includeFindings) {
    lines.push('## Findings');
    lines.push('');
    const completedRuns = runs.filter(r => r.status === 'completed' && r.findings && r.findings.length > 0);
    if (completedRuns.length === 0) {
      lines.push('_(No findings recorded yet.)_');
    } else {
      for (const run of completedRuns) {
        lines.push(`### ${run.module}`);
        if (run.summary) {
          lines.push('');
          lines.push(`> ${run.summary}`);
        }
        lines.push('');
        for (const f of run.findings!) {
          lines.push(`- ${f}`);
        }
        lines.push('');
      }
    }
  }

  // Hypotheses
  if (options.includeHypotheses) {
    lines.push('## Hypotheses');
    lines.push('');
    if (hypotheses.length === 0) {
      lines.push('_(No hypotheses recorded yet.)_');
    } else {
      for (const h of hypotheses) {
        lines.push(`- **[${h.status.toUpperCase()}]** ${h.title}`);
        if (h.description) lines.push(`  - ${h.description}`);
        if (h.metricsDelta) lines.push(`  - Metrics: ${h.metricsDelta}`);
        if (h.evidenceRefs.length > 0) lines.push(`  - Evidence: ${h.evidenceRefs.join(', ')}`);
      }
      lines.push('');
    }
  }

  // Methodology
  const modules = [...new Set(runs.map(r => r.module))];
  if (modules.length > 0) {
    lines.push('## Methodology');
    lines.push('');
    lines.push(`- **Modules tested:** ${modules.join(', ')}`);
    const allParams = runs.flatMap(r => Object.keys(r.parameters));
    const uniqueParams = [...new Set(allParams)];
    if (uniqueParams.length > 0) {
      lines.push(`- **Parameters used:** ${uniqueParams.join(', ')}`);
    }
    lines.push('');
  }

  // Raw data appendix
  if (runs.length > 0) {
    lines.push('## Appendix: Raw Data');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify({ runs, hypotheses }, null, 2));
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

// ── JSON ──

function generateJson(runs: ResearchRun[], hypotheses: ResearchHypothesis[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    runs,
    hypotheses,
    stats: {
      totalRuns: runs.length,
      completedRuns: runs.filter(r => r.status === 'completed').length,
      failedRuns: runs.filter(r => r.status === 'failed').length,
      totalHypotheses: hypotheses.length,
      acceptedHypotheses: hypotheses.filter(h => h.status === 'accepted').length,
    },
  }, null, 2);
}

// ── HTML ──

function generateHtml(runs: ResearchRun[], hypotheses: ResearchHypothesis[], options: ExportOptions): string {
  const title = options.title || 'Research Report';
  const now = new Date().toISOString();
  const completedRuns = runs.filter(r => r.status === 'completed');

  const runRows = runs.map(r => `
    <tr>
      <td>${escapeHtml(r.module)}</td>
      <td><span style="color:${statusBadge(r.status)};font-weight:600">${escapeHtml(r.status)}</span></td>
      <td>${formatDate(r.startedAt)}</td>
      <td>${r.findings?.length ?? 0}</td>
      <td>${escapeHtml(r.summary ?? '—')}</td>
    </tr>`).join('');

  const hypothesisRows = hypotheses.map(h => `
    <tr>
      <td>${escapeHtml(h.title)}</td>
      <td><span style="color:${statusBadge(h.status)};font-weight:600">${escapeHtml(h.status)}</span></td>
      <td>${escapeHtml(h.category)}</td>
      <td>${escapeHtml(h.description ?? '—')}</td>
    </tr>`).join('');

  const findingBlocks = options.includeFindings ? completedRuns.filter(r => r.findings && r.findings.length > 0).map(r => `
    <h3 style="color:#3b82f6;margin-top:1.5rem">${escapeHtml(r.module)}</h3>
    ${r.summary ? `<blockquote style="border-left:3px solid #3b82f6;padding-left:1rem;color:#64748b;margin:0.5rem 0">${escapeHtml(r.summary)}</blockquote>` : ''}
    <ul>${r.findings!.map(f => `<li style="margin:0.25rem 0">${escapeHtml(f)}</li>`).join('')}</ul>
  `).join('') : '';

  const hypothesisBlock = options.includeHypotheses && hypotheses.length > 0 ? `
    <h2 style="border-bottom:2px solid #a855f7;padding-bottom:0.4rem;margin-top:2rem">Hypotheses</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
      <thead><tr style="border-bottom:2px solid #e2e8f0">
        <th style="text-align:left;padding:0.5rem">Title</th>
        <th style="text-align:left;padding:0.5rem">Status</th>
        <th style="text-align:left;padding:0.5rem">Category</th>
        <th style="text-align:left;padding:0.5rem">Description</th>
      </tr></thead>
      <tbody>${hypothesisRows}</tbody>
    </table>` : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;max-width:900px;margin:2rem auto;padding:0 1.5rem;color:#0f172a;line-height:1.6}
  h1{margin:0 0 0.25rem}h2{border-bottom:2px solid #e2e8f0;padding-bottom:0.4rem;margin-top:2rem}
  table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:0.5rem;border-bottom:1px solid #e2e8f0}
  .meta{color:#94a3b8;font-size:0.8rem;margin-bottom:1.5rem}
  .stat{display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.75rem 1rem;margin:0.25rem}
  .stat .num{font-size:1.4rem;font-weight:700;color:#0f172a}.stat .lbl{font-size:0.75rem;color:#64748b}
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">Generated ${now}</div>

<div style="margin-bottom:1.5rem">
  <div class="stat"><div class="num">${runs.length}</div><div class="lbl">Total Runs</div></div>
  <div class="stat"><div class="num">${completedRuns.length}</div><div class="lbl">Completed</div></div>
  <div class="stat"><div class="num">${hypotheses.length}</div><div class="lbl">Hypotheses</div></div>
  <div class="stat"><div class="num">${hypotheses.filter(h => h.status === 'accepted').length}</div><div class="lbl">Accepted</div></div>
</div>

<h2 style="border-bottom:2px solid #3b82f6;padding-bottom:0.4rem">Research Runs</h2>
<table style="width:100%;border-collapse:collapse;font-size:0.85rem">
  <thead><tr style="border-bottom:2px solid #e2e8f0">
    <th style="text-align:left;padding:0.5rem">Module</th>
    <th style="text-align:left;padding:0.5rem">Status</th>
    <th style="text-align:left;padding:0.5rem">Started</th>
    <th style="text-align:left;padding:0.5rem">Findings</th>
    <th style="text-align:left;padding:0.5rem">Summary</th>
  </tr></thead>
  <tbody>${runRows}</tbody>
</table>

${findingBlocks ? `<h2 style="border-bottom:2px solid #10b981;padding-bottom:0.4rem;margin-top:2rem">Findings</h2>${findingBlocks}` : ''}

${hypothesisBlock}
</body></html>`;
}

// ── Public API ──

export function exportResearch(runs: ResearchRun[], hypotheses: ResearchHypothesis[], options: ExportOptions): string {
  switch (options.format) {
    case 'md': return generateMarkdown(runs, hypotheses, options);
    case 'json': return generateJson(runs, hypotheses);
    case 'html': return generateHtml(runs, hypotheses, options);
  }
}

export function downloadExport(content: string, filename: string, mimeType: string): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFilename(filename);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  } catch (err) {
    console.error('[research-export] download failed', err);
  }
}

export function copyAsGithubIssue(runs: ResearchRun[], hypotheses: ResearchHypothesis[]): string {
  const completedRuns = runs.filter(r => r.status === 'completed');
  const acceptedHyp = hypotheses.filter(h => h.status === 'accepted');
  const modules = [...new Set(runs.map(r => r.module))];

  const lines: string[] = [];

  lines.push('## Research Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total runs | ${runs.length} |`);
  lines.push(`| Completed | ${completedRuns.length} |`);
  lines.push(`| Failed | ${runs.filter(r => r.status === 'failed').length} |`);
  lines.push(`| Hypotheses | ${hypotheses.length} |`);
  lines.push(`| Accepted | ${acceptedHyp.length} |`);
  lines.push('');

  if (completedRuns.length > 0) {
    lines.push('## Key Findings');
    lines.push('');
    for (const run of completedRuns) {
      if (run.findings && run.findings.length > 0) {
        lines.push(`**${run.module}:**`);
        for (const f of run.findings) {
          lines.push(`- ${f}`);
        }
      }
    }
    lines.push('');
  }

  if (acceptedHyp.length > 0) {
    lines.push('## Accepted Hypotheses');
    lines.push('');
    for (const h of acceptedHyp) {
      lines.push(`- **${h.title}** — ${h.description}`);
      if (h.metricsDelta) lines.push(`  - Metrics: ${h.metricsDelta}`);
    }
    lines.push('');
  }

  if (modules.length > 0) {
    lines.push('## Modules Tested');
    lines.push('');
    for (const m of modules) {
      const count = runs.filter(r => r.module === m).length;
      lines.push(`- \`${m}\` (${count} run${count > 1 ? 's' : ''})`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`_Exported ${new Date().toISOString()}_`);

  return lines.join('\n');
}

export type { ExportFormat, ExportOptions };
