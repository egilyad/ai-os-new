import { useTranslation } from '../../i18n/useTranslation';
import { CARD, pLevelColor } from './pressure-map-constants';
import type { PressureTrendPoint } from '../../kernel/instances';

interface Props {
    trends: PressureTrendPoint[];
}

const TrendChart: React.FC<Props> = ({ trends }) => {
    const { t } = useTranslation();

    if (trends.length === 0) {
        return (
            <div style={CARD}>
                <div
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--slate-500)',
                        marginBottom: 8,
                    }}
                >
                    {t('pressure_map.trend')}
                </div>
                <div
                    style={{
                        color: 'var(--slate-500)',
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        padding: 20,
                    }}
                >
                    {t('pressure_map.no_trend')}
                </div>
            </div>
        );
    }

    return (
        <div style={CARD}>
            <div
                style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--slate-500)',
                    marginBottom: 8,
                }}
            >
                {t('pressure_map.trend')}
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 2,
                    height: 80,
                    padding: '8px 0',
                }}
            >
                {trends
                    .slice(0, 60)
                    .reverse()
                    .map((p, i) => {
                        const c = pLevelColor(p.level);
                        const h = Math.max(4, p.score * 80);
                        return (
                            <div
                                key={`trend-${i}`}
                                style={{
                                    width: '100%',
                                    height: h,
                                    background: c.text,
                                    borderRadius: '2px 2px 0 0',
                                    opacity: 0.7 + (i / trends.length) * 0.3,
                                    transition: 'height 0.3s',
                                }}
                                title={`${(p.score * 100).toFixed(0)} — ${p.level}`}
                            />
                        );
                    })}
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.6rem',
                    color: 'var(--slate-600)',
                    marginTop: 4,
                }}
            >
                <span>{t('pressure_map.points', { count: trends.length })}</span>
                <span>{t('pressure_map.now')}</span>
            </div>
        </div>
    );
};

export default TrendChart;
