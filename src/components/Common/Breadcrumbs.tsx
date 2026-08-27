import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NAV_SECTIONS } from '../../route-registry';
import type { TranslationKey } from '../../i18n/translations';

interface BreadcrumbsProps {
    path: string;
    t: (key: TranslationKey) => string;
}

function getCrumbs(
    path: string,
    t: (key: TranslationKey) => string,
): Array<{ label: string; path: string }> {
    const segments = path.replace(/^\//, '').split('/').filter(Boolean);
    if (segments.length === 0) segments.push('dashboard');

    if (segments.length >= 2) {
        const section = NAV_SECTIONS.find((s) => s.id === `section-${segments[0]}`);
        if (section) {
            const item = section.items.find((i) => i.id === segments.slice(1).join('-'));
            if (item) {
                return [
                    { label: t(section.labelKey), path: `/${segments[0]}` },
                    { label: t(item.labelKey), path: `/${segments.join('/')}` },
                ];
            }
        }
    }

    const id = segments[0];
    for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
            if (item.id === id) {
                return [
                    { label: t(section.labelKey), path: `/${id}` },
                    { label: t(item.labelKey), path: `/${item.id}` },
                ];
            }
        }
    }
    return [{ label: id!, path: `/${id}` }];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, t }) => {
    const navigate = useNavigate();
    // Deduplicate crumbs that share the same path (e.g. section-id === item-id → both '/debate')
    const crumbs = getCrumbs(path, t).reduce<Array<{ label: string; path: string }>>(
        (acc, crumb) => {
            if (!acc.some((c) => c.path === crumb.path)) acc.push(crumb);
            return acc;
        },
        [],
    );

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
            }}
        >
            {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb.path}>
                    {i > 0 && <ChevronRight size={12} style={{ opacity: 0.4 }} />}
                    {i < crumbs.length - 1 ? (
                        <button
                            onClick={() => navigate(crumb.path)}
                            style={{
                                opacity: 0.6,
                                fontWeight: 400,
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: 'inherit',
                            }}
                        >
                            {crumb.label}
                        </button>
                    ) : (
                        <span style={{ opacity: 1, fontWeight: 700 }}>{crumb.label}</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
