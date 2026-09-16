import { useTranslation } from '../../i18n/useTranslation';

const SHIMMER = {
    background:
        'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
    borderRadius: 6,
};

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 16,
    borderRadius = 6,
    style,
}) => (
    <div
        aria-hidden="true"
        style={{
            ...SHIMMER,
            width,
            height,
            borderRadius,
            ...style,
        }}
    />
);

export const SkeletonText: React.FC<{ lines?: number; width?: string }> = ({
    lines = 3,
    width = '100%',
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} width={i === lines - 1 ? '60%' : width} height={12} />
        ))}
    </div>
);

export const SkeletonCard: React.FC = () => (
    <div
        style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Skeleton width={36} height={36} borderRadius={8} />
            <Skeleton width="40%" height={14} />
        </div>
        <SkeletonText lines={2} />
    </div>
);

export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 12,
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
    >
        {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} width={i === 0 ? '70%' : '85%'} height={12} />
        ))}
    </div>
);

export const PanelSkeleton: React.FC<{ title?: boolean }> = ({ title = true }) => {
    const { t } = useTranslation();
    return (
        <div
            aria-label={t('common.aria.loading')}
            role="status"
            style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            {title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Skeleton width={28} height={28} borderRadius={8} />
                    <Skeleton width="180px" height={20} />
                </div>
            )}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                }}
            >
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
            <SkeletonText lines={4} />
        </div>
    );
};
