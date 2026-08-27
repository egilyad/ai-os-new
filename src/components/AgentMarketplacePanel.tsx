import React, { useState, useMemo } from 'react';
import { Search, Download, Star, Store } from 'lucide-react';
import { agentMarketplace } from '../kernel/instances';
import type { MarketplaceItem } from '../kernel/services/agent-marketplace';
import PanelLoader from './PanelLoader';
import { glassPanel, flexBetween, textXsMuted } from '../styles/common';

const TYPE_COLORS: Record<MarketplaceItem['type'], string> = {
  prompt: '#a855f7',
  skill: '#3b82f6',
  template: '#10b981',
  topology: '#f59e0b',
};

const AgentMarketplacePanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MarketplaceItem['type'] | 'all'>('all');
  const [installedSet, setInstalledSet] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => agentMarketplace.search(query, typeFilter === 'all' ? undefined : typeFilter),
    [query, typeFilter],
  );

  const handleInstall = (id: string) => {
    if (agentMarketplace.install(id)) {
      setInstalledSet(prev => new Set(prev).add(id));
    }
  };

  return (
    <PanelLoader title="Agent Marketplace">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, ...glassPanel, padding: '8px 12px' }}>
            <Search size={16} color="#64748b" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search prompts, templates, topologies…"
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--slate-200)', outline: 'none' }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as MarketplaceItem['type'] | 'all')}
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: 'var(--slate-200)', padding: '8px 12px' }}
          >
            <option value="all">All types</option>
            <option value="prompt">Prompts</option>
            <option value="template">Templates</option>
            <option value="topology">Topologies</option>
            <option value="skill">Skills</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-panel" style={{ ...glassPanel, padding: 32, textAlign: 'center', color: 'var(--slate-500)' }}>
            <Store size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            No marketplace items match your search.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(item => (
              <div key={item.id} className="glass-panel" style={{ ...glassPanel, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={flexBetween}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: TYPE_COLORS[item.type] }}>{item.type}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#facc15' }}>
                    <Star size={12} fill="#facc15" /> {item.rating.toFixed(1)}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>{item.description}</p>
                <div style={{ ...textXsMuted, display: 'flex', justifyContent: 'space-between' }}>
                  <span>by {item.author}</span>
                  <span>{item.downloads} installs</span>
                </div>
                <button
                  type="button"
                  onClick={() => !installedSet.has(item.id) && handleInstall(item.id)}
                  disabled={installedSet.has(item.id)}
                  style={{
                    marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${installedSet.has(item.id) ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`,
                    background: installedSet.has(item.id) ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                    color: installedSet.has(item.id) ? '#10b981' : '#60a5fa',
                    cursor: installedSet.has(item.id) ? 'default' : 'pointer', fontWeight: 600,
                  }}
                >
                  <Download size={14} /> {installedSet.has(item.id) ? 'Installed' : 'Install'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelLoader>
  );
};

export default AgentMarketplacePanel;
