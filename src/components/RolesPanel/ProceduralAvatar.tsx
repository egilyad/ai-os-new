import React, { useMemo } from 'react';

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

const AVATAR_PALETTES: [string, string, string][] = [
    ['#3b82f6', '#60a5fa', '#1d4ed8'],
    ['#8b5cf6', '#a78bfa', '#6d28d9'],
    ['#10b981', '#34d399', '#059669'],
    ['#f59e0b', '#fbbf24', '#d97706'],
    ['#ef4444', '#f87171', '#dc2626'],
    ['#ec4899', '#f472b6', '#db2777'],
    ['#06b6d4', '#22d3ee', '#0891b2'],
    ['#84cc16', '#a3e635', '#65a30d'],
    ['#f97316', '#fb923c', '#ea580c'],
    ['#6366f1', '#818cf8', '#4f46e5'],
];

function getColors(seed: number): [string, string, string] {
    return AVATAR_PALETTES[seed % AVATAR_PALETTES.length]!;
}

function generateGrid(seed: number): boolean[][] {
    const grid: boolean[][] = [];
    for (let y = 0; y < 5; y++) {
        const row: boolean[] = [];
        for (let x = 0; x < 3; x++) {
            const bit = (seed >> (y * 3 + x)) & 1;
            row.push(bit === 1);
        }
        grid.push(row);
    }
    return grid;
}

interface ProceduralAvatarProps {
    seed: string;
    size?: number;
    shape?: 'circle' | 'square' | 'rounded' | 'hexagon' | 'shield' | 'star';
}

export const ProceduralAvatar: React.FC<ProceduralAvatarProps> = ({
    seed,
    size = 40,
    shape = 'circle',
}) => {
    const svg = useMemo(() => {
        const h = hashString(seed);
        const [c1, c2, c3] = getColors(h);
        const grid = generateGrid(h);
        const cellSize = size / 5;
        const halfCell = cellSize / 2;
        const rows: string[] = [];

        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 3; x++) {
                if (grid[y]![x]) {
                    const cx = x * cellSize + halfCell;
                    const cy = y * cellSize + halfCell;
                    const fill = (x + y) % 3 === 0 ? c1 : (x + y) % 3 === 1 ? c2 : c3;
                    rows.push(
                        `<rect x="${cx - halfCell}" y="${cy - halfCell}" width="${cellSize}" height="${cellSize}" fill="${fill}" rx="1" />`,
                    );
                    const mx = (4 - x) * cellSize + halfCell;
                    if (mx !== cx) {
                        rows.push(
                            `<rect x="${mx - halfCell}" y="${cy - halfCell}" width="${cellSize}" height="${cellSize}" fill="${fill}" rx="1" />`,
                        );
                    }
                }
            }
        }

        const clipPath =
            shape === 'circle'
                ? `<clipPath id="c-${seed}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></clipPath>`
                : shape === 'rounded'
                  ? `<clipPath id="c-${seed}"><rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.2}" /></clipPath>`
                  : shape === 'hexagon'
                    ? `<clipPath id="c-${seed}"><polygon points="${Array.from(
                          { length: 6 },
                          (_, i) => {
                              const angle = (Math.PI / 3) * i - Math.PI / 2;
                              return `${size / 2 + (size / 2) * Math.cos(angle)},${size / 2 + (size / 2) * Math.sin(angle)}`;
                          },
                      ).join(' ')}" /></clipPath>`
                    : shape === 'shield'
                      ? `<clipPath id="c-${seed}"><path d="M${size / 2} 0 L${size} ${size * 0.2} L${size} ${size * 0.6} Q${size} ${size}, ${size / 2} ${size} Q0 ${size}, 0 ${size * 0.6} L0 ${size * 0.2} Z" /></clipPath>`
                      : shape === 'star'
                        ? `<clipPath id="c-${seed}"><polygon points="${Array.from(
                              { length: 10 },
                              (_, i) => {
                                  const angle = (Math.PI / 5) * i - Math.PI / 2;
                                  const r = i % 2 === 0 ? size / 2 : size * 0.2;
                                  return `${size / 2 + r * Math.cos(angle)},${size / 2 + r * Math.sin(angle)}`;
                              },
                          ).join(' ')}" /></clipPath>`
                        : '';

        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            ${clipPath}
            <g${clipPath ? ` clip-path="url(#c-${seed})"` : ''}>
                <rect width="${size}" height="${size}" fill="#1e293b" rx="${shape === 'square' ? 0 : size * 0.15}" />
                ${rows.join('\n')}
                <rect x="${2 * cellSize}" y="${2 * cellSize}" width="${cellSize}" height="${cellSize}" fill="rgba(255,255,255,0.08)" rx="1" />
            </g>
        </svg>`;
    }, [seed, size, shape]);

    const encoded = useMemo(() => `data:image/svg+xml,${encodeURIComponent(svg)}`, [svg]);

    return (
        <img
            src={encoded}
            alt={`${seed} avatar`}
            style={{
                width: size,
                height: size,
                borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? 0 : '20%',
                objectFit: 'cover',
                background: 'var(--slate-800)',
            }}
        />
    );
};
