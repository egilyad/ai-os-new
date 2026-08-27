import { CheckCircle2, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { getStatusColor } from '../Common/status-vocabulary';
import type { ApiKey } from '../../types/metrics';

export function statusBadge(status: string): { label: string; labelKey: string; color: string; bg: string; icon: React.ReactNode } {
  const color = getStatusColor(status);
  const ICONS: Record<string, React.ReactNode> = {
    active: <CheckCircle2 size={14} />,
    error: <AlertTriangle size={14} />,
    checking: <Loader2 size={14} className="provider-spin" />,
    pending: <Loader2 size={14} />,
  };
  const LABELS: Record<string, string> = {
    active: 'Active', error: 'Error', checking: 'Checking', inactive: 'Inactive',
    pending: 'Testing', quota_exhausted: 'Quota Exhausted', invalid: 'Invalid',
    duplicate: 'Duplicate', quarantined: 'Quarantined', probation: 'Probation',
    unknown: 'Unchecked',
  };
  const LABEL_KEYS: Record<string, string> = {
    active: 'provider.status.active', error: 'provider.status.error', checking: 'provider.status.checking',
    inactive: 'provider.status.inactive', pending: 'provider.status.pending', quota_exhausted: 'provider.status.quota_exhausted',
    invalid: 'provider.status.invalid', duplicate: 'provider.status.duplicate', quarantined: 'provider.status.quarantined',
    probation: 'provider.status.probation', unknown: 'provider.status.unknown',
  };
  return { label: LABELS[status] || status, labelKey: LABEL_KEYS[status] || status, color, bg: `${color}18`, icon: ICONS[status] || <Shield size={14} /> };
}

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="provider-highlight">{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

export type SortColumn = 'label' | 'status' | 'accountId' | 'group' | 'latency' | 'tps' | 'reliability' | 'reputation' | 'models';
export type SortDir = 'asc' | 'desc';
type SortFn = (a: ApiKey, b: ApiKey) => number;

export const SORT_FNS: Record<SortColumn, (dir: SortDir) => SortFn> = {
  label:      dir => (a, b) => dir === 'asc' ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label),
  status:     dir => (a, b) => dir === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status),
  accountId:  dir => (a, b) => dir === 'asc' ? (a.accountId || '').localeCompare(b.accountId || '') : (b.accountId || '').localeCompare(a.accountId || ''),
  group:      dir => (a, b) => dir === 'asc' ? (a.group || '').localeCompare(b.group || '') : (b.group || '').localeCompare(a.group || ''),
  latency:    dir => (a, b) => dir === 'asc' ? (a.stats?.avgLatency || 0) - (b.stats?.avgLatency || 0) : (b.stats?.avgLatency || 0) - (a.stats?.avgLatency || 0),
  tps:        dir => (a, b) => dir === 'asc' ? (a.stats?.extended?.latencyBreakdown?.tokensPerSec || 0) - (b.stats?.extended?.latencyBreakdown?.tokensPerSec || 0) : (b.stats?.extended?.latencyBreakdown?.tokensPerSec || 0) - (a.stats?.extended?.latencyBreakdown?.tokensPerSec || 0),
  reliability: dir => {
    const fn: SortFn = (a, b) => {
      const ra = a.stats?.successCount && a.stats?.errorCount ? a.stats.successCount / (a.stats.successCount + a.stats.errorCount) : 1;
      const rb = b.stats?.successCount && b.stats?.errorCount ? b.stats.successCount / (b.stats.successCount + b.stats.errorCount) : 1;
      return dir === 'asc' ? ra - rb : rb - ra;
    };
    return fn;
  },
  reputation: dir => (a, b) => dir === 'asc' ? (a.stats?.extended?.reputationScore || 0) - (b.stats?.extended?.reputationScore || 0) : (b.stats?.extended?.reputationScore || 0) - (a.stats?.extended?.reputationScore || 0),
  models:     dir => (a, b) => dir === 'asc' ? (a.availableModels?.length || 0) - (b.availableModels?.length || 0) : (b.availableModels?.length || 0) - (a.availableModels?.length || 0),
};

export const COLUMNS: { key: string; label: string; labelKey?: string }[] = [
  { key: 'drag', label: '' },
  { key: 'label', label: 'Provider', labelKey: 'provider.column.provider' },
  { key: 'status', label: 'Status', labelKey: 'provider.column.status' },
  { key: 'actions', label: '' },
  { key: 'quota', label: 'Quota', labelKey: 'provider.column.quota' },
  { key: 'group', label: 'Group', labelKey: 'provider.column.group' },
  { key: 'accountId', label: 'Account', labelKey: 'provider.column.account' },
  { key: 'latency', label: 'Latency', labelKey: 'provider.column.latency' },
  { key: 'tps', label: 'TPS', labelKey: 'provider.column.tps' },
  { key: 'reliability', label: 'Reliability', labelKey: 'provider.column.reliability' },
  { key: 'reputation', label: 'Reputation', labelKey: 'provider.column.reputation' },
  { key: 'models', label: 'Models', labelKey: 'provider.column.models' },
  { key: 'notes', label: 'Notes', labelKey: 'provider.column.notes' },
  { key: 'label', label: 'Tags', labelKey: 'provider.column.tags' },
];
