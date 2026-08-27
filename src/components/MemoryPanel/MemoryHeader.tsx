import { Database, Trash2, Download } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import {
    flexGap3,
    pageSubtitleMuted,
    pageTitleLarge,
    sectionHeaderBottom,
} from '../../styles/common';

interface MemoryHeaderProps {
    onWipe: () => void;
    onExport: () => void;
}

const MemoryHeader: React.FC<MemoryHeaderProps> = ({ onWipe, onExport }) => {
    const { t } = useTranslation();
    return (
        <div style={sectionHeaderBottom}>
            <div>
                <h2 style={pageTitleLarge}>
                    <Database size={28} color="#10b981" /> {t('memory.title')}
                </h2>
                <p style={pageSubtitleMuted}>{t('memory.subtitle')}</p>
            </div>
            <div style={flexGap3}>
                <button
                    onClick={onWipe}
                    className="btn-secondary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'var(--error)',
                        borderColor: 'rgba(239,68,68,0.2)',
                        background: 'rgba(239,68,68,0.05)',
                    }}
                    aria-label={t('memory.wipe_index')}
                >
                    <Trash2 size={16} aria-hidden="true" /> {t('memory.wipe_index')}
                </button>
                <button
                    onClick={onExport}
                    className="btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                        fontWeight: 700,
                    }}
                    aria-label={t('memory.export_vectors')}
                >
                    <Download size={16} aria-hidden="true" /> {t('memory.export_vectors')}
                </button>
            </div>
        </div>
    );
};

export default MemoryHeader;
