import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { personaService } from '../../kernel/instances';
import { PERSONA_DEFINITIONS } from '../../data/persona-definitions';
import PersonaPickerPanel from '../PersonaPickerPanel';
import type { PersonaEntry } from '../../kernel/contracts/persona-entry';
import type { Persona } from '../../kernel/services/persona-service';

export const PersonaSelector: React.FC = () => {
    const setSystemPrompt = useChatStore((s) => s.setSystemPrompt);
    const [open, setOpen] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [activePersona, setActivePersona] = useState<Persona | null>(null);
    const [libraryPersona, setLibraryPersona] = useState<PersonaEntry | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setOpen(false);
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    useEffect(() => {
        const tryLoad = () => {
            const ps = personaService as
                { getAll?: () => Persona[]; getActive?: () => Persona | null } | undefined;
            if (!ps) return false;
            const all = ps.getAll ? ps.getAll() : [];
            const personas = Array.isArray(all) ? all : [];
            const active = ps.getActive ? ps.getActive() : null;
            setActivePersona(active ?? (personas.length > 0 ? personas[0]! : null));
            return true;
        };

        if (tryLoad()) return;

        const timeout = setTimeout(() => {
            tryLoad();
        }, 500);
        return () => clearTimeout(timeout);
    }, []);

    const handlePersonaChange = (personaId: string) => {
        const ps = personaService as
            { setActive?: (id: string) => void; getActive?: () => Persona | null } | undefined;
        ps?.setActive?.(personaId);
        const active = ps?.getActive?.();
        if (active) setSystemPrompt(active.systemPrompt);
        setOpen(false);
    };

    const handleLibrarySelect = (entry: PersonaEntry) => {
        setLibraryPersona(entry);
        setShowLibrary(false);
        setSystemPrompt(entry.systemPrompt);
        const ps = personaService as { setActive?: (id: string) => void } | undefined;
        ps?.setActive?.(entry.id);
        setActivePersona({
            id: entry.id,
            name: entry.name,
            icon: entry.icon,
            systemPrompt: entry.systemPrompt,
            isBuiltIn: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: entry.tags,
            description: entry.description,
            temperature: entry.temperature,
            color: entry.color,
        });
    };

    if (!activePersona && !libraryPersona) return null;

    const displayName = libraryPersona?.name || activePersona?.name || 'Persona';
    const displayIcon = libraryPersona?.icon || activePersona?.icon || '🧑';

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative',
                }}
            >
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        minWidth: 120,
                        color: 'inherit',
                    }}
                >
                    <span style={{ fontSize: '1.1rem' }}>{displayIcon}</span>
                    <div style={{ fontWeight: 600 }}>{displayName}</div>
                    <svg
                        width={12}
                        height={12}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                        }}
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                {open && (
                    <div
                        ref={containerRef}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 1000,
                            marginTop: '0.5rem',
                            minWidth: 220,
                            maxHeight: 350,
                            overflowY: 'auto',
                            background: 'rgba(0,0,0,0.8)',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        {(() => {
                            const ps = personaService as { getAll?: () => Persona[] } | undefined;
                            const all = ps?.getAll ? ps.getAll() : [];
                            const personas = Array.isArray(all) ? all : [];
                            return personas.map((persona) => (
                                <div
                                    key={persona.id}
                                    onClick={() => handlePersonaChange(persona.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        cursor: 'pointer',
                                        background:
                                            persona.id === (activePersona?.id || libraryPersona?.id)
                                                ? 'rgba(59,130,246,0.2)'
                                                : 'transparent',
                                        borderRadius: 6,
                                    }}
                                >
                                    <span style={{ fontSize: '1rem' }}>{persona.icon || '🧑'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                            {persona.name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            {persona.description ||
                                                (persona.systemPrompt
                                                    ? persona.systemPrompt.slice(0, 40) + '...'
                                                    : '')}
                                        </div>
                                    </div>
                                    {persona.id === activePersona?.id && (
                                        <svg
                                            width={16}
                                            height={16}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                        >
                                            <path d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    )}
                                </div>
                            ));
                        })()}

                        <div
                            style={{
                                borderTop: '1px solid rgba(100,116,139,0.2)',
                                margin: '4px 0',
                            }}
                        />

                        <div
                            onClick={() => {
                                setOpen(false);
                                setShowLibrary(true);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                cursor: 'pointer',
                                borderRadius: 6,
                                color: '#818cf8',
                            }}
                        >
                            <svg
                                width={16}
                                height={16}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                Browse Persona Library ({PERSONA_DEFINITIONS.length})...
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showLibrary && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1001,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'auto',
                        padding: 20,
                    }}
                    onClick={() => setShowLibrary(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--slate-900)',
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.1)',
                            maxWidth: 900,
                            width: '100%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                        }}
                    >
                        <PersonaPickerPanel
                            standalone={false}
                            onSelectForChat={handleLibrarySelect}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
