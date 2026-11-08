import React from 'react';
import { Link } from 'react-router-dom';
import { getCrossPanelLinks, type NavItemRef } from '../../kernel/utils/cross-panel-links';

interface CrossPanelLinksProps {
    panelId: string;
    items: NavItemRef[];
    curated?: Record<string, string[]>;
    max?: number;
}

export const CrossPanelLinks: React.FC<CrossPanelLinksProps> = ({
    panelId,
    items,
    curated,
    max,
}) => {
    const links = getCrossPanelLinks(panelId, items, curated, max);
    if (links.length === 0) return null;
    return (
        <div
            data-testid="cross-panel-links"
            style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginBottom: '1rem',
            }}
        >
            {links.map((link) => (
                <Link
                    key={link.id}
                    to={`/${link.id}`}
                    title={link.reason === 'related' ? 'Related' : 'Same section'}
                    style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: 8,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        color: 'var(--text-muted)',
                    }}
                >
                    {link.label}
                </Link>
            ))}
        </div>
    );
};
