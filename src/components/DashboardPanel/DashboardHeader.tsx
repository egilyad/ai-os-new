import React from 'react';
import { Key, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import { flexCenterGap2Mb05, statusDot } from '../../styles/common';

interface DashboardHeaderProps {
    checkAllHealth: () => void;
    onNavigate: (page: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ checkAllHealth, onNavigate }) => {
    const { t } = useTranslation();

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '1rem',
                flexWrap: 'wrap',
            }}
        >
            <div>
                <div style={flexCenterGap2Mb05}>
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={statusDot}
                        aria-hidden="true"
                    />
                    <span
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--success)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {t('dashboard.system_online')}
                    </span>
                </div>
                <h1
                    style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        margin: '0 0 0.25rem',
                        letterSpacing: '-0.02em',
                        color: 'var(--slate-50)',
                    }}
                >
                    {t('dashboard.mission_control')}
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--slate-400)', margin: 0 }}>
                    {t('dashboard.subtitle')}
                </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={() => {
                        checkAllHealth();
                    }}
                    style={{
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-200)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                    aria-label={t('dashboard.run_diagnostics_aria')}
                >
                    <RefreshCw size={16} aria-hidden="true" /> {t('dashboard.run_diagnostics')}
                </button>
                <button
                    onClick={() => onNavigate('keys')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 12,
                        background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 700,
                        boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                    }}
                    aria-label={t('dashboard.add_provider_aria')}
                >
                    <Key size={16} aria-hidden="true" /> {t('dashboard.add_provider')}
                </button>
            </div>
        </div>
    );
};

export default DashboardHeader;
