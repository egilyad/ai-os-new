import { Swords, Shield, Scale, Check, X } from 'lucide-react';

export const PAGE_SIZE = 10;

export const ROLE_ICONS: Record<string, React.ReactNode> = {
    pro: <Swords size={12} />,
    con: <Shield size={12} />,
    neutral: <Scale size={12} />,
};

export function getPositionIcon(position?: string): React.ReactNode {
    if (position === 'pro') return <Check size={12} color="#3b82f6" />;
    if (position === 'con') return <X size={12} color="#ef4444" />;
    return null;
}
