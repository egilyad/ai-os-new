import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({
    data,
    color,
    height = 40,
}) => {
    const { t } = useTranslation();
    if (!data.length) return null;
    if (data.length === 1) {
        return (
            <div
                style={{
                    width: '100%',
                    height,
                    background: `${color}20`,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color,
                    fontSize: '0.75rem',
                }}
            >
                {t('analytics.sparkline.insufficient_data')}
            </div>
        );
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 200;

    const smoothLine = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - min) / range) * height;
            if (i === 0) return `M ${x},${y}`;
            const prevX = ((i - 1) / (data.length - 1)) * width;
            const prevY = height - ((data[i - 1]! - min) / range) * height;
            const cpX = prevX + (x - prevX) / 2;
            return `C ${cpX},${prevY} ${cpX},${y} ${x},${y}`;
        })
        .join(' ');

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
            </defs>
            <path
                d={`${smoothLine}`}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d={`${smoothLine} L ${width},${height} L 0,${height} Z`}
                fill={`url(#grad-${color})`}
            />
        </svg>
    );
};

export const SparklineMemo = React.memo(Sparkline);
