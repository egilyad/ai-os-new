import React, { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { provenanceService, graphVizService } from '../../kernel/instances/services-extras';

const btn: React.CSSProperties = { padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #2a2a35', background: '#3b82f6', color: '#fff', cursor: 'pointer' };

const ProvenancePanel: React.FC = () => {
    const { t } = useTranslation();
    const [decisionId, setDecisionId] = useState('');
    const [svg, setSvg] = useState<string>('');
    const [msg, setMsg] = useState<string|null>(null);

    const trace = async () => {
        try {
            const { nodes, edges } = await provenanceService.trace(decisionId, 4);
            const ids = nodes.map(n => n.id);
            const pairs = edges.map(e => [e.fromId, e.toId] as [string,string]);
            setSvg(graphVizService.svg(ids, pairs, 'layered'));
            setMsg(`${nodes.length} nodes, ${edges.length} edges`);
        } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <h2 style={{ margin: 0 }}>{t('provenance.title', { defaultValue: 'Provenance Graph' })}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('provenance.subtitle', { defaultValue: 'Трассировка решения до источников. SVG через GraphViz.' })}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input value={decisionId} onChange={e => setDecisionId(e.target.value)} placeholder="decision node id" style={{ flex: 1, padding: '0.4rem', borderRadius: 6, border: '1px solid #2a2a35', background: 'transparent', color: 'inherit' }} />
                <button style={btn} onClick={() => void trace()}>Trace</button>
            </div>
            {msg && <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>{msg}</p>}
            {svg && <div dangerouslySetInnerHTML={{ __html: svg }} style={{ border: '1px solid #2a2a35', borderRadius: 8, padding: '0.5rem', overflow: 'auto' }} />}
        </div>
    );
};
export default ProvenancePanel;
