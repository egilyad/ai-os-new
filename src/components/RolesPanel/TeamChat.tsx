import React, { useState, useRef, useEffect } from 'react';
import { Send, AtSign, ArrowRight, X, MessageSquare } from 'lucide-react';
import type { RoleTeam } from '../../kernel/contracts/role-team';

interface ChatMessage {
    id: string;
    roleId: string;
    content: string;
    timestamp: number;
    type: 'role' | 'system' | 'user';
}

interface TeamChatProps {
    team: RoleTeam;
    onClose: () => void;
}

const ROLE_COLORS = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
    '#14b8a6',
    '#a855f7',
];

const TeamChat: React.FC<TeamChatProps> = ({ team, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'sys-1',
            roleId: 'system',
            content: `Team "${team.name}" session started. Roles: ${team.roleIds.join(', ')}. Strategy: ${team.coordinationStrategy}. Type @roleName to address a specific role.`,
            timestamp: Date.now(),
            type: 'system',
        },
    ]);
    const [input, setInput] = useState('');
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const [passTarget, setPassTarget] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getRoleColor = (index: number) => ROLE_COLORS[index % ROLE_COLORS.length];

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            roleId: 'user',
            content: input.trim(),
            timestamp: Date.now(),
            type: 'user',
        };
        setMessages((prev) => [...prev, userMsg]);

        // Simulate role responses
        const addressedRoles = team.roleIds.filter((r) =>
            input.toLowerCase().includes(`@${r.toLowerCase()}`),
        );
        const rolesToRespond =
            addressedRoles.length > 0 ? addressedRoles : activeRole ? [activeRole] : team.roleIds;

        setTimeout(
            () => {
                const newMessages: ChatMessage[] = rolesToRespond.map((roleId, i) => ({
                    id: `role-${Date.now()}-${i}`,
                    roleId,
                    content: simulateRoleResponse(roleId, input, team.coordinationStrategy),
                    timestamp: Date.now() + i * 200,
                    type: 'role',
                }));
                setMessages((prev) => [...prev, ...newMessages]);
            },
            500 + Math.random() * 1000,
        );

        setInput('');
    };

    const handlePassToRole = (roleId: string) => {
        const sysMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            roleId: 'system',
            content: `Turn passed to @${roleId}. They now have the floor.`,
            timestamp: Date.now(),
            type: 'system',
        };
        setMessages((prev) => [...prev, sysMsg]);
        setActiveRole(roleId);
        setPassTarget(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: '#1a1b2e',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.1)',
                    maxWidth: 700,
                    width: '100%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MessageSquare size={18} color="#a78bfa" />
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--slate-200)', fontSize: '0.9rem' }}>
                                {team.icon} {team.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                {team.roleIds.length} roles · {team.coordinationStrategy}
                                {activeRole && ` · Active: @${activeRole}`}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Role badges */}
                <div
                    style={{
                        padding: '8px 18px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        background: 'rgba(0,0,0,0.1)',
                    }}
                >
                    {team.roleIds.map((roleId, i) => {
                        const color = getRoleColor(i);
                        const isActive = roleId === activeRole;
                        return (
                            <div
                                key={roleId}
                                onClick={() => setActiveRole(isActive ? null : roleId)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    borderRadius: 20,
                                    background: isActive ? `${color}25` : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${isActive ? color : 'var(--border-subtle)'}`,
                                    color: isActive ? color : 'var(--slate-400)',
                                    fontSize: '0.7rem',
                                    fontWeight: isActive ? 700 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                                title={isActive ? 'Click to deactivate' : `Focus @${roleId}`}
                            >
                                <AtSign size={10} />
                                {roleId}
                                {isActive && (
                                    <X
                                        size={10}
                                        style={{ marginLeft: 2, cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveRole(null);
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Messages */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '12px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        minHeight: 300,
                        maxHeight: 400,
                    }}
                >
                    {messages.map((msg) => {
                        if (msg.type === 'system') {
                            return (
                                <div
                                    key={msg.id}
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                        padding: '6px 12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 8,
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {msg.content}
                                </div>
                            );
                        }

                        const isUser = msg.type === 'user';
                        const color = isUser
                            ? '#3b82f6'
                            : getRoleColor(team.roleIds.indexOf(msg.roleId));

                        return (
                            <div
                                key={msg.id}
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                }}
                            >
                                {!isUser && (
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            background: `${color}20`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            color,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {msg.roleId[0]!.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    {!isUser && (
                                        <div
                                            style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                color,
                                                marginBottom: 2,
                                            }}
                                        >
                                            @{msg.roleId}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 12,
                                            background: isUser
                                                ? 'rgba(59,130,246,0.15)'
                                                : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${
                                                isUser
                                                    ? 'rgba(59,130,246,0.2)'
                                                    : 'rgba(255,255,255,0.06)'
                                            }`,
                                            fontSize: '0.78rem',
                                            color: 'var(--slate-200)',
                                            lineHeight: 1.4,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {msg.content}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.6rem',
                                            color: 'var(--slate-500)',
                                            marginTop: 2,
                                            textAlign: isUser ? 'right' : 'left',
                                        }}
                                    >
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Pass-to-role controls */}
                {passTarget && (
                    <div
                        style={{
                            padding: '6px 18px',
                            background: 'rgba(139,92,246,0.08)',
                            borderTop: '1px solid rgba(139,92,246,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.75rem',
                            color: 'var(--purple-muted)',
                        }}
                    >
                        <ArrowRight size={12} />
                        Pass turn to:
                        <select
                            value=""
                            onChange={(e) => {
                                if (e.target.value) handlePassToRole(e.target.value);
                            }}
                            style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                border: '1px solid rgba(139,92,246,0.2)',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'var(--slate-200)',
                                fontSize: '0.75rem',
                            }}
                        >
                            <option value="">-- Select role --</option>
                            {team.roleIds.map((r) => (
                                <option key={r} value={r}>
                                    @{r}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setPassTarget(null)}
                            style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                            }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}

                {/* Input */}
                <div
                    style={{
                        padding: '10px 18px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        gap: 8,
                    }}
                >
                    <button
                        onClick={() => setPassTarget(passTarget ? null : team.roleIds[0]!)}
                        style={{
                            padding: '6px',
                            borderRadius: 8,
                            border: `1px solid ${passTarget ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            background: passTarget ? 'rgba(139,92,246,0.1)' : 'transparent',
                            color: passTarget ? '#a78bfa' : '#64748b',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                        title="Pass turn to role"
                    >
                        <ArrowRight size={14} />
                    </button>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                activeRole
                                    ? `Message @${activeRole}...`
                                    : 'Type a message or @role to address someone...'
                            }
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'var(--slate-200)',
                                fontSize: '0.82rem',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: input.trim()
                                ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                                : 'rgba(59,130,246,0.15)',
                            color: input.trim() ? 'white' : '#64748b',
                            cursor: input.trim() ? 'pointer' : 'default',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Send size={14} /> Send
                    </button>
                </div>
            </div>
        </div>
    );
};

function simulateRoleResponse(roleId: string, userInput: string, strategy: string): string {
    const templates = [
        `From ${roleId}'s perspective: "${userInput.slice(0, 50)}" raises several important considerations. First, we should examine the underlying assumptions. Second, the implications for our ${strategy} approach need careful thought. I recommend we explore alternative scenarios.`,
        `As ${roleId}, I see this differently. The core issue here is not what it seems. We need to step back and analyze the systemic patterns before jumping to conclusions. Let me propose a framework for this discussion.`,
        `I agree with the direction. My analysis as ${roleId} suggests three key action items: (1) validate the premise, (2) gather cross-domain evidence, (3) synthesize using our ${strategy} coordination. I'll take point on step one.`,
        `Critical perspective from ${roleId}: I see potential blind spots. The question assumes X, but what if not-X is true? We should test this assumption before proceeding. I recommend a quick sensitivity analysis.`,
        `Building on the previous point, ${roleId} would like to add that the ${strategy} framework gives us a unique advantage here. By leveraging our team's diverse expertise, we can address this from multiple angles simultaneously.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)]!;
}

export default TeamChat;
