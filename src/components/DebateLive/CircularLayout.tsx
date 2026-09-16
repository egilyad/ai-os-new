import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SpeakerNode } from './SpeakerNode';
import { agentAvatarService } from '../../kernel/instances';
import type { TopologyNode } from '../../kernel/contracts/debate-runtime';
import type { ArenaLayout } from '../../kernel/contracts/debate-emotion';
import type { Avatar } from '../../kernel/services/agent-avatar-service';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { EyeLine } from './EyeLine';

interface Props {
    participants: TopologyNode[];
    activeSpeakerId: string | null;
    sessionId: string;
    layout?: ArenaLayout;
}

interface Position {
    x: number;
    y: number;
    radius: number;
}

function computePositions(participants: TopologyNode[], layout: ArenaLayout): Position[] {
    const count = participants.length;
    if (count === 0) return [];

    switch (layout) {
        case 'circle': {
            const radius = Math.max(120, Math.min(300, count * 60));
            return participants.map((_, i) => {
                const angle = (2 * Math.PI * i) / count - Math.PI / 2;
                return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), radius };
            });
        }

        case 'proscenium': {
            const spacing = Math.max(80, Math.min(160, 400 / count));
            const startX = -((count - 1) * spacing) / 2;
            return participants.map((_, i) => ({
                x: startX + i * spacing,
                y: 80 + (i % 2 === 0 ? 0 : 40),
                radius: 120,
            }));
        }

        case 'colosseum': {
            const rows = Math.min(3, Math.ceil(count / 6));
            const perRow = Math.ceil(count / rows);
            const positions: Position[] = [];
            participants.forEach((_, i) => {
                const row = Math.min(rows - 1, Math.floor(i / perRow));
                const idxInRow = i % perRow;
                const rowRadius = 60 + row * 90;
                const angle = (Math.PI * idxInRow) / Math.max(1, perRow - 1) - Math.PI / 2;
                const limitedAngle = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, angle));
                positions.push({
                    x: rowRadius * Math.sin(limitedAngle),
                    y: -(rowRadius * Math.cos(limitedAngle)) + 80,
                    radius: rowRadius,
                });
            });
            return positions;
        }

        case 'parliament': {
            const half = Math.ceil(count / 2);
            const spacing = Math.max(70, Math.min(140, 300 / half));
            const startX = -((half - 1) * spacing) / 2;
            const positions: Position[] = [];
            participants.forEach((_, i) => {
                const side = i < half ? -1 : 1;
                const idx = i < half ? i : i - half;
                positions.push({
                    x: startX + idx * spacing,
                    y: side * 100,
                    radius: 140,
                });
            });
            return positions;
        }

        case 'round-table': {
            const radius = Math.max(80, Math.min(180, count * 35));
            return participants.map((_, i) => {
                const angle = (2 * Math.PI * i) / count - Math.PI / 2;
                return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), radius };
            });
        }

        case 'lecture': {
            const positions: Position[] = [];
            participants.forEach((_, i) => {
                if (i === 0) {
                    positions.push({ x: 0, y: -140, radius: 160 });
                } else {
                    const row = Math.floor((i - 1) / 4);
                    const col = (i - 1) % 4;
                    const spacing = Math.max(70, Math.min(120, 360 / Math.min(4, count - 1)));
                    const startX = (-(Math.min(4, count - 1) - 1) * spacing) / 2;
                    positions.push({
                        x: startX + col * spacing,
                        y: 40 + row * 90,
                        radius: 160,
                    });
                }
            });
            return positions;
        }

        case 'ring': {
            const half = Math.ceil(count / 2);
            const positions: Position[] = [];
            participants.forEach((_, i) => {
                const side = i < half ? -1 : 1;
                const idx = i < half ? i : i - half;
                const spread = Math.max(40, Math.min(120, 200 / Math.max(1, half - 1)));
                const xOffset = (idx - (half - 1) / 2) * spread;
                positions.push({
                    x: side * 120 + xOffset * 0.3,
                    y: (idx % 2 === 0 ? -40 : 40) + (i < half ? 0 : 20),
                    radius: 160,
                });
            });
            return positions;
        }

        case 'triangle': {
            const positions: Position[] = [];
            participants.forEach((_, i) => {
                if (count <= 3) {
                    const angle = (2 * Math.PI * i) / 3 - Math.PI / 2;
                    positions.push({
                        x: 160 * Math.cos(angle),
                        y: 160 * Math.sin(angle),
                        radius: 160,
                    });
                } else {
                    const groupSize = Math.ceil(count / 3);
                    const groupIdx = Math.floor(i / groupSize);
                    const idxInGroup = i % groupSize;
                    const groupAngle = (2 * Math.PI * groupIdx) / 3 - Math.PI / 2;
                    const spread = Math.max(20, Math.min(60, 80 / Math.max(1, groupSize - 1)));
                    const offset = (idxInGroup - (groupSize - 1) / 2) * spread;
                    const perpAngle = groupAngle + Math.PI / 2;
                    const baseX = 180 * Math.cos(groupAngle);
                    const baseY = 180 * Math.sin(groupAngle);
                    positions.push({
                        x: baseX + offset * Math.cos(perpAngle),
                        y: baseY + offset * Math.sin(perpAngle),
                        radius: 160,
                    });
                }
            });
            return positions;
        }

        case 'tree': {
            const positions: Position[] = [];
            participants.forEach((_, i) => {
                const level = Math.floor(Math.log2(i + 1));
                const idxInLevel = i - (Math.pow(2, level) - 1);
                const nodesAtLevel = Math.pow(2, level);
                const xSpacing = Math.max(40, Math.min(200, 400 / nodesAtLevel));
                const startX = -((nodesAtLevel - 1) * xSpacing) / 2;
                positions.push({
                    x: startX + idxInLevel * xSpacing,
                    y: -200 + level * 100,
                    radius: 180,
                });
            });
            return positions;
        }

        case 'freeform': {
            const positions: Position[] = [];
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            const cellW = Math.max(80, Math.min(160, 350 / Math.max(1, cols - 1)));
            const cellH = Math.max(80, Math.min(160, 350 / Math.max(1, rows - 1)));
            participants.forEach((_, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const jitterX = Math.sin(i * 2.7) * cellW * 0.15;
                const jitterY = Math.cos(i * 3.1) * cellH * 0.15;
                positions.push({
                    x: (-(cols - 1) * cellW) / 2 + col * cellW + jitterX,
                    y: (-(rows - 1) * cellH) / 2 + row * cellH + jitterY,
                    radius: 140,
                });
            });
            return positions;
        }

        default:
            return [];
    }
}

export const CircularLayout: React.FC<Props> = ({
    participants,
    activeSpeakerId,
    sessionId,
    layout = 'circle',
}) => {
    const positions = useMemo(() => computePositions(participants, layout), [participants, layout]);
    const svgRadius = positions.length > 0 ? Math.max(...positions.map((p) => p.radius)) : 120;

    const activeIdx = activeSpeakerId
        ? participants.findIndex((p) => p.id === activeSpeakerId)
        : -1;
    const activePos = activeIdx >= 0 ? positions[activeIdx] : null;

    return (
        <div
            style={{
                position: 'absolute',
                width: 1,
                height: 1,
                left: '50%',
                top: '50%',
            }}
        >
            <svg
                width={svgRadius * 2 + 120}
                height={svgRadius * 2 + 120}
                style={{
                    position: 'absolute',
                    left: -(svgRadius + 60),
                    top: -(svgRadius + 60),
                    pointerEvents: 'none',
                }}
            >
                {participants.map((_p, i) => {
                    void _p;
                    const next = (i + 1) % participants.length;
                    return (
                        <line
                            key={`edge-${i}`}
                            x1={positions[i]!.x + 60}
                            y1={positions[i]!.y + 60}
                            x2={positions[next]!.x + 60}
                            y2={positions[next]!.y + 60}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                        />
                    );
                })}
                <circle
                    cx={svgRadius + 60}
                    cy={svgRadius + 60}
                    r={svgRadius}
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                />
            </svg>

            {activePos &&
                participants.map((p, i) => {
                    if (p.id === activeSpeakerId) return null;
                    const toPos = positions[i]!;
                    const fromX = activePos.x + 60;
                    const fromY = activePos.y + 60;
                    const toX = toPos.x + 60;
                    const toY = toPos.y + 60;
                    return (
                        <EyeLine
                            key={`eyeline-${activeSpeakerId}-${p.id}`}
                            fromPos={{ x: fromX, y: fromY }}
                            toPos={{ x: toX, y: toY }}
                            color="rgba(139,92,246,0.5)"
                        />
                    );
                })}

            {participants.map((p, i) => {
                const identity = resolveAgentIdentity(p.id);
                const avatar: Avatar = {
                    ...agentAvatarService.generate(p.id),
                    emoji: identity.avatar.emoji,
                    color: identity.avatar.color,
                };
                const css = agentAvatarService.getAvatarCSS(avatar);
                return (
                    <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: activeSpeakerId === p.id ? 1 : 0.5,
                            scale: activeSpeakerId === p.id ? 1.2 : 1,
                            x: positions[i]!.x,
                            y: positions[i]!.y,
                        }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        style={{
                            position: 'absolute',
                            width: 120,
                            height: 120,
                            marginLeft: -60,
                            marginTop: -60,
                            zIndex: activeSpeakerId === p.id ? 10 : 1,
                        }}
                    >
                        <SpeakerNode
                            node={p}
                            avatar={avatar}
                            avatarCSS={css}
                            isActive={activeSpeakerId === p.id}
                            sessionId={sessionId}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
};
