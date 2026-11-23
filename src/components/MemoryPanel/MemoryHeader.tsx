import { useRef } from 'react';
import { Database, Trash2, Download, Upload } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ImportMode } from '../../kernel/utils/roundtrip';
import {
    flexGap3,
    pageSubtitleMuted,
    pageTitleLarge,
    sectionHeaderBottom,
} from '../../styles/common';

interface MemoryHeaderProps {
    onWipe: () => void;
    onExport: () => void;
    onImport: (file: File) => void;
    importMode: ImportMode;
    onImportModeChange: (mode: ImportMode) => void;
    onSeedDemo?: () => void;
}

const MemoryHeader: React.FC<MemoryHeaderProps> = ({
    onWipe,
    onExport,
    onImport,
    importMode,
    onImportModeChange,
    onSeedDemo,
}) => {
    const { t } = useTranslation();
    const fileRef = useRef<HTMLInputElement>(null);
    return (
        <div style={sectionHeaderBottom}>
            <div>
                <h2 style={pageTitleLarge}>
                    <Database size={28} color="#10b981" /> {t('memory.title')}
                </h2>
                <p style={pageSubtitleMuted}>{t('memory.subtitle')}</p>
            </div>
            <div style={flexGap3}>
                <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    aria-label={t('memory.import_vectors')}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImport(file);
                        e.target.value = '';
                    }}
                />
                <select
                    value={importMode}
                    onChange={(e) => onImportModeChange(e.target.value as ImportMode)}
                    aria-label={t('memory.import_mode')}
                    style={{ padding: '0.45rem', borderRadius: 8 }}
                >
                    <option value="merge">{t('memory.import_merge')}</option>
                    <option value="replace">{t('memory.import_replace')}</option>
                </select>
                <button
                    onClick={() => fileRef.current?.click()}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    aria-label={t('memory.import_vectors')}
                >
                    <Upload size={16} aria-hidden="true" /> {t('memory.import_vectors')}
                </button>
                {onSeedDemo && (
                    <button
                        onClick={onSeedDemo}
                        className="btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                        aria-label={t('memory.seed_demo')}
                        title={t('memory.seed_demo')}
                    >
                        ☕
                    </button>
                )}
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
