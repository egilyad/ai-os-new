import { useNotificationStore } from '../../stores/useNotificationStore';

interface NavBadgeProps {
    routeId: string;
}

export const NavBadge: React.FC<NavBadgeProps> = ({ routeId }) => {
    const count = useNotificationStore((s) => s.badges[routeId]);
    if (!count) return null;
    return (
        <span
            style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                background: 'var(--error)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                lineHeight: 1,
                boxShadow: '0 0 4px rgba(239,68,68,0.5)',
                pointerEvents: 'none',
            }}
        >
            {count > 9 ? '9+' : count}
        </span>
    );
};
