import { GitBranch, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Compact entry point — full routing tools live at /routing (D-06). */
const RoutingIntelligenceView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="glass-panel"
      style={{
        padding: '2rem',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <GitBranch size={32} color="#8b5cf6" aria-hidden />
      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-50)' }}>
        Routing Intelligence
      </h3>
      <p style={{ margin: 0, maxWidth: 420, fontSize: '0.85rem', color: 'var(--slate-400)', lineHeight: 1.6 }}>
        A/B tests, weight tuning, fallback chains, and live decision traces are in the full Routing Intelligence panel.
      </p>
      <button
        type="button"
        className="btn-primary"
        onClick={() => navigate('/routing')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
      >
        Open full Routing Intelligence
        <ExternalLink size={16} aria-hidden />
      </button>
    </div>
  );
};

export default RoutingIntelligenceView;
