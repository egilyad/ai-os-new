import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface VitalCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle: string;
    fill: number;
    color: string;
}

export const VitalCard: React.FC<VitalCardProps> = memo(
    ({ icon, title, value, subtitle, fill, color }) => (
        <div
            style={{
                padding: '1.5rem',
                borderRadius: 16,
                borderTop: `4px solid ${color}`,
                background: `linear-gradient(180deg, ${color}0A 0%, rgba(0,0,0,0) 100%)`,
                backgroundColor: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.5rem',
                }}
            >
                <div
                    style={{
                        color,
                        padding: '0.5rem',
                        background: `${color}15`,
                        borderRadius: 10,
                    }}
                    aria-hidden="true"
                >
                    {icon}
                </div>
                <span
                    style={{
                        fontSize: '0.65rem',
                        color,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    {title}
                </span>
            </div>
            <div
                style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--slate-50)',
                    marginBottom: '0.25rem',
                }}
            >
                {value}
            </div>
            <div
                style={{
                    fontSize: '0.75rem',
                    color: 'var(--slate-500)',
                    fontWeight: 600,
                    marginBottom: '1rem',
                }}
            >
                {subtitle}
            </div>
            <div
                style={{
                    height: 4,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    overflow: 'hidden',
                }}
            >
                <motion.div
                    animate={{ width: `${fill}%` }}
                    transition={{ type: 'spring' }}
                    style={{ height: '100%', background: color, borderRadius: 2 }}
                />
            </div>
        </div>
    ),
);
