/**
 * BottomNav — Phase 3 Navigation (mobile, presentation only).
 *
 * 5 core actions (desktop sidebar 280px → mobile bottom nav 44px).
 * No kernel change — just route shortcuts. D panels stay desktop-recommended.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Brain, Database, FlaskConical } from 'lucide-react';

const ITEMS: Array<{ id: string; path: string; label: string; Icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'fleet', path: 'fleet', label: 'Fleet', Icon: Users },
    { id: 'councils', path: 'fleet', label: 'Councils', Icon: Brain }, // Fleet tab councils (same route, query handled inside)
    { id: 'dashboard', path: 'dashboard', label: 'Home', Icon: LayoutDashboard },
    { id: 'memory', path: 'memory', label: 'Memory', Icon: Database },
    { id: 'simulation', path: 'simulation', label: 'Sim', Icon: FlaskConical },
];

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const active = location.pathname.split('/')[1] || 'dashboard';

    return (
        <nav
            aria-label="Mobile navigation"
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 60,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                height: 56,
                padding: '0 0.25rem  env(safe-area-inset-bottom, 0px)',
                background: 'var(--bg-sidebar, #0f0f14)',
                borderTop: '1px solid var(--border, #2a2a35)',
                backdropFilter: 'blur(12px)',
            }}
        >
            {ITEMS.map((it) => {
                const isActive = active === it.path;
                return (
                    <button
                        key={it.id}
                        onClick={() => navigate(`/${it.path}`)}
                        aria-label={it.label}
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            padding: '0.35rem 0',
                            background: 'transparent',
                            border: 'none',
                            color: isActive ? '#3b82f6' : 'var(--text-muted)',
                            cursor: 'pointer',
                            minHeight: 44,
                            fontSize: '0.68rem',
                            fontWeight: isActive ? 700 : 600,
                        }}
                    >
                        <it.Icon size={18} />
                        <span>{it.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};
