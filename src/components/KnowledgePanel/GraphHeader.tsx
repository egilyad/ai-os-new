import { Network } from 'lucide-react';

interface GraphHeaderProps {
    t: (key: string) => string;
}

const GraphHeader: React.FC<GraphHeaderProps> = ({ t }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
            <h2
                style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    margin: '0 0 0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
                <Network size={28} color="#a855f7" aria-hidden="true" /> {t('knowledge.title')}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                {t('knowledge.subtitle')}
            </p>
        </div>
    </div>
);

export default GraphHeader;
