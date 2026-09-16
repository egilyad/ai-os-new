import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Layers,
    Activity,
    Search,
    BrainCircuit,
    DownloadCloud,
    Box,
    AlertCircle,
    Download,
    Upload,
    AlertTriangle,
} from 'lucide-react';
import { skillService } from '../../kernel/instances';
import type { CognitiveSkill } from '../../types/domain';
import { eventBus, EVENTS } from '../../kernel/instances';
import type { EventMap } from '../../kernel/instances';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import {
    dismissBtnRed,
    errorBannerLg,
    flexAlignCenterGap2,
    flexCenterGap3,
    flexCenterGap4,
    flexWrapGap2,
    pageSubtitleMuted,
    pageTitleLarge,
    posRelative,
    searchIconAbsolute,
    sectionHeaderBottom,
    statBox,
} from '../../styles/common';

const SkillsPanel: React.FC = () => {
    const [skills, setSkills] = useState<CognitiveSkill[]>(() => {
        try {
            return skillService.getSkills() ?? [];
        } catch {
            return [];
        }
    });
    const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');
    const [error, setError] = useState<string | null>(null);
    const [hubSearch, setHubSearch] = useState('');
    const [hubCategory, setHubCategory] = useState<string | null>(null);
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isMountedRef = useRef(true);

    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        const unsub = eventBus.on(EVENTS.SKILLS_UPDATED, (data: CognitiveSkill[]) => {
            if (!isMountedRef.current) return;
            setSkills([...data]);
        });
        return () => {
            isMountedRef.current = false;
            unsub();
        };
    }, []);

    const handleExportSkills = () => {
        try {
            const data = skillService.exportSkills();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `skills-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            eventBus.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                message: 'Skills exported successfully',
                type: 'success',
            });
            if (isMountedRef.current) setError(null);
        } catch (err) {
            console.warn('[SkillsPanel] Export failed:', err);
            if (isMountedRef.current) {
                setError(t('skills.error_export'));
                clearError();
            }
        }
    };

    const handleImportSkills = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const count = skillService.importSkills(event.target?.result as string);
                if (isMountedRef.current) {
                    setSkills(skillService.getSkills());
                    eventBus.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                        message: `Successfully imported ${count} skill(s)`,
                        type: 'success',
                    });
                    setError(null);
                }
            } catch (err) {
                console.warn('[SkillsPanel] Failed to import skills:', err);
                if (isMountedRef.current) {
                    setError(t('skills.error_import'));
                    clearError();
                }
                eventBus.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                    message: 'Failed to import skills',
                    type: 'error',
                });
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleSkillState = (id: string) => {
        try {
            const s = skills.find((x) => x.id === id);
            if (!s || s.status === 'not_installed') return;
            const nextStatus = s.status === 'active' ? 'installed' : 'active';
            skillService.toggleActive(id);
            if (isMountedRef.current) setSkills(skillService.getSkills());
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Cognitive Skill '${s.name}' is now ${nextStatus.toUpperCase()}`,
                type: nextStatus === 'active' ? 'success' : 'info',
            });
            if (isMountedRef.current) setError(null);
        } catch (err) {
            console.warn('[SkillsPanel] Failed to toggle skill state:', err);
            if (isMountedRef.current) {
                setError(t('skills.error_toggle'));
                clearError();
            }
        }
    };

    const installSkill = (id: string) => {
        try {
            const s = skills.find((x) => x.id === id);
            if (!s) return;
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Installing ${s.name} dependencies...`,
                type: 'info',
            });
            skillService.installSkill(id);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `${s.name} installed successfully.`,
                type: 'success',
            });
            if (isMountedRef.current) setError(null);
        } catch (err) {
            console.warn('[SkillsPanel] Failed to install skill:', err);
            if (isMountedRef.current) {
                setError(t('skills.error_install'));
                clearError();
            }
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'analysis':
                return '#3b82f6';
            case 'generation':
                return '#a855f7';
            case 'orchestration':
                return '#f59e0b';
            default:
                return '#10b981';
        }
    };

    const displayedSkills =
        activeTab === 'installed'
            ? skills.filter((s) => s.status !== 'not_installed')
            : skills
                  .filter(
                      (s) =>
                          s.status === 'not_installed' &&
                          (!hubCategory || s.category === hubCategory),
                  )
                  .filter(
                      (s) =>
                          !hubSearch ||
                          s.name.toLowerCase().includes(hubSearch.toLowerCase()) ||
                          s.description.toLowerCase().includes(hubSearch.toLowerCase()),
                  );

    const installedCount = skills.filter((s) => s.status !== 'not_installed').length;

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                overflowY: 'auto',
            }}
        >
            <div style={sectionHeaderBottom}>
                <div>
                    <h2 style={pageTitleLarge}>
                        <BrainCircuit size={28} color="#f59e0b" aria-hidden="true" />{' '}
                        {t('skills.title')}
                    </h2>
                    <p style={pageSubtitleMuted}>{t('skills.subtitle')}</p>
                </div>

                <div style={flexCenterGap3}>
                    <Button
                        variant="ghost"
                        onClick={handleExportSkills}
                        aria-label={t('common.aria.export')}
                    >
                        <Download size={16} aria-hidden="true" /> {t('common.export')}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label={t('common.aria.import')}
                    >
                        <Upload size={16} aria-hidden="true" /> {t('common.import')}
                    </Button>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.75rem',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '0.4rem',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                        role="tablist"
                        aria-label="Skills view"
                    >
                        <button
                            onClick={() => setActiveTab('installed')}
                            role="tab"
                            aria-selected={activeTab === 'installed'}
                            aria-controls="skills-installed-panel"
                            style={{
                                padding: '0.6rem 1.25rem',
                                borderRadius: 8,
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background:
                                    activeTab === 'installed'
                                        ? 'rgba(59,130,246,0.15)'
                                        : 'transparent',
                                color: activeTab === 'installed' ? '#60a5fa' : '#64748b',
                            }}
                        >
                            {t('skills.installed').replace('{0}', String(installedCount))}
                        </button>
                        <button
                            onClick={() => setActiveTab('marketplace')}
                            role="tab"
                            aria-selected={activeTab === 'marketplace'}
                            aria-controls="skills-marketplace-panel"
                            style={{
                                padding: '0.6rem 1.25rem',
                                borderRadius: 8,
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background:
                                    activeTab === 'marketplace'
                                        ? 'rgba(245,158,11,0.15)'
                                        : 'transparent',
                                color: activeTab === 'marketplace' ? '#f59e0b' : '#64748b',
                            }}
                        >
                            <DownloadCloud size={16} aria-hidden="true" /> {t('skills.hub')}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorBannerLg}
                        role="alert"
                        aria-live="polite"
                    >
                        <AlertTriangle size={18} aria-hidden="true" /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={dismissBtnRed}
                            aria-label={t('common.dismiss_error')}
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {activeTab === 'marketplace' && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                        }}
                    >
                        <div style={posRelative}>
                            <Search size={16} style={searchIconAbsolute} aria-hidden="true" />
                            <input
                                type="text"
                                placeholder={t('skills.search_placeholder')}
                                value={hubSearch}
                                onChange={(e) => setHubSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem 1rem 0.85rem 2.75rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 12,
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                }}
                                aria-label="Search skills in hub"
                            />
                        </div>
                        <div style={flexWrapGap2}>
                            {['analysis', 'generation', 'orchestration'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setHubCategory(hubCategory === cat ? null : cat)}
                                    aria-pressed={hubCategory === cat}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: 20,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background:
                                            hubCategory === cat
                                                ? 'rgba(245,158,11,0.2)'
                                                : 'rgba(255,255,255,0.05)',
                                        color: hubCategory === cat ? '#f59e0b' : '#94a3b8',
                                        border: `1px solid ${hubCategory === cat ? 'rgba(245,158,11,0.3)' : 'transparent'}`,
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                            {hubCategory && (
                                <button
                                    onClick={() => setHubCategory(null)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: 20,
                                        fontSize: '0.75rem',
                                        background: 'none',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                    }}
                                    aria-label={t('skills.clear')}
                                >
                                    {t('skills.clear')}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                        gap: '1.5rem',
                        alignContent: 'start',
                    }}
                    id={
                        activeTab === 'installed'
                            ? 'skills-installed-panel'
                            : 'skills-marketplace-panel'
                    }
                    role="tabpanel"
                >
                    {displayedSkills.length === 0 ? (
                        <div
                            style={{
                                gridColumn: '1 / -1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: 'var(--slate-500)',
                                padding: '4rem 0',
                            }}
                        >
                            <Layers
                                size={56}
                                style={{ opacity: 0.2, marginBottom: '1.5rem' }}
                                aria-hidden="true"
                            />
                            <p style={{ fontSize: '1rem', fontWeight: 600 }}>
                                {activeTab === 'installed'
                                    ? t('skills.empty_installed')
                                    : hubSearch
                                      ? t('skills.empty_search')
                                      : 'No skills available in the extension hub'}
                            </p>
                            <p
                                style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--slate-400)',
                                    marginTop: '0.5rem',
                                }}
                            >
                                {activeTab === 'installed'
                                    ? 'Install skills from the Extension Hub to get started'
                                    : hubSearch
                                      ? 'Try a different search term or category'
                                      : 'All skills are currently installed'}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {displayedSkills.map((skill, i) => {
                                const catColor = getCategoryColor(skill.category);
                                return (
                                    <motion.div
                                        key={skill.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{
                                            padding: '1.5rem',
                                            borderRadius: 16,
                                            border: `1px solid ${skill.status === 'active' ? `${catColor}40` : 'rgba(255,255,255,0.05)'}`,
                                            background:
                                                skill.status === 'active'
                                                    ? `linear-gradient(145deg, ${catColor}10 0%, rgba(255,255,255,0.01) 100%)`
                                                    : 'rgba(0,0,0,0.2)',
                                            backdropFilter: 'blur(10px)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1.25rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <div style={flexCenterGap4}>
                                                <div
                                                    style={{
                                                        padding: '0.75rem',
                                                        background: `${catColor}20`,
                                                        borderRadius: 12,
                                                        border: `1px solid ${catColor}40`,
                                                    }}
                                                >
                                                    <Box
                                                        size={24}
                                                        color={catColor}
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                                <div>
                                                    <h3
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: 800,
                                                            margin: '0 0 0.3rem',
                                                            color: 'var(--slate-50)',
                                                        }}
                                                    >
                                                        {skill.name}
                                                    </h3>
                                                    <div style={flexAlignCenterGap2}>
                                                        <span
                                                            style={{
                                                                fontSize: '0.65rem',
                                                                textTransform: 'uppercase',
                                                                fontWeight: 800,
                                                                color: catColor,
                                                            }}
                                                        >
                                                            {skill.category}
                                                        </span>
                                                        <span
                                                            style={{
                                                                width: 4,
                                                                height: 4,
                                                                borderRadius: '50%',
                                                                background: 'var(--slate-500)',
                                                            }}
                                                            aria-hidden="true"
                                                        />
                                                        <span
                                                            style={{
                                                                fontSize: '0.65rem',
                                                                color: 'var(--slate-400)',
                                                                fontFamily: 'monospace',
                                                            }}
                                                        >
                                                            v{skill.version}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {activeTab === 'installed' ? (
                                                <div style={flexCenterGap3}>
                                                    <span
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            color:
                                                                skill.status === 'active'
                                                                    ? '#10b981'
                                                                    : '#64748b',
                                                            letterSpacing: '0.05em',
                                                        }}
                                                    >
                                                        {skill.status === 'active'
                                                            ? t('skills.active')
                                                            : t('skills.inactive')}
                                                    </span>
                                                    <button
                                                        role="switch"
                                                        aria-checked={skill.status === 'active'}
                                                        onClick={() => toggleSkillState(skill.id)}
                                                        style={{
                                                            width: 44,
                                                            height: 24,
                                                            borderRadius: 12,
                                                            cursor: 'pointer',
                                                            background:
                                                                skill.status === 'active'
                                                                    ? '#10b981'
                                                                    : 'rgba(255,255,255,0.1)',
                                                            position: 'relative',
                                                            transition: 'all 0.2s',
                                                            boxShadow:
                                                                skill.status === 'active'
                                                                    ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                                                    : 'none',
                                                            border: 'none',
                                                        }}
                                                        aria-label={`Toggle ${skill.name} skill`}
                                                    >
                                                        <motion.div
                                                            animate={{
                                                                x:
                                                                    skill.status === 'active'
                                                                        ? 22
                                                                        : 2,
                                                            }}
                                                            style={{
                                                                width: 20,
                                                                height: 20,
                                                                background: 'white',
                                                                borderRadius: '50%',
                                                                position: 'absolute',
                                                                top: 2,
                                                                boxShadow:
                                                                    '0 1px 3px rgba(0,0,0,0.3)',
                                                            }}
                                                        />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={flexCenterGap3}>
                                                    {skill.executionCount > 0 && (
                                                        <span
                                                            style={{
                                                                fontSize: '0.65rem',
                                                                fontWeight: 800,
                                                                color: 'var(--warning)',
                                                                background: 'rgba(245,158,11,0.15)',
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: 20,
                                                                border: '1px solid rgba(245,158,11,0.3)',
                                                            }}
                                                        >
                                                            {t('skills.popular')}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => installSkill(skill.id)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            fontSize: '0.8rem',
                                                            borderRadius: 8,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            fontWeight: 700,
                                                            background:
                                                                'linear-gradient(90deg, #3b82f6, #2563eb)',
                                                            border: 'none',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                        }}
                                                        aria-label={`Install ${skill.name} skill`}
                                                    >
                                                        <DownloadCloud
                                                            size={16}
                                                            aria-hidden="true"
                                                        />{' '}
                                                        {t('skills.install')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <p
                                            style={{
                                                fontSize: '0.9rem',
                                                color: 'var(--slate-300)',
                                                lineHeight: 1.6,
                                                margin: 0,
                                            }}
                                        >
                                            {skill.description}
                                        </p>

                                        <div style={statBox}>
                                            <div
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--slate-500)',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 800,
                                                    marginBottom: '0.75rem',
                                                    letterSpacing: '0.05em',
                                                }}
                                            >
                                                Required Toolchains
                                            </div>
                                            <div style={flexWrapGap2}>
                                                {skill.toolsUsed.map((tool, _idx) => (
                                                    <span
                                                        key={tool}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            padding: '0.3rem 0.75rem',
                                                            borderRadius: 8,
                                                            color: 'var(--slate-200)',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                        }}
                                                    >
                                                        {tool}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {activeTab === 'installed' && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginTop: 'auto',
                                                    paddingTop: '1rem',
                                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                                }}
                                            >
                                                <button
                                                    onClick={() =>
                                                        eventBus.emit(EVENTS.NOTIFICATION, {
                                                            message: `Opening advanced configuration for ${skill.name}...`,
                                                            type: 'info',
                                                        })
                                                    }
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: catColor,
                                                        fontSize: '0.85rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                    }}
                                                    aria-label={`Configure ${skill.name}`}
                                                >
                                                    <Settings size={16} aria-hidden="true" />{' '}
                                                    Fine-tune Pipeline
                                                </button>
                                                <span
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--slate-400)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <Activity
                                                        size={14}
                                                        color="#10b981"
                                                        aria-hidden="true"
                                                    />{' '}
                                                    {skill.executionCount} Executions
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            <div
                style={{
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 16,
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    gap: '1.25rem',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        padding: '0.5rem',
                        background: 'var(--warning-tint)',
                        borderRadius: 10,
                    }}
                >
                    <AlertCircle
                        color="#f59e0b"
                        size={24}
                        style={{ flexShrink: 0 }}
                        aria-hidden="true"
                    />
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.6 }}>
                    <strong>Performance Notice:</strong> Cognitive Skills consume significantly more
                    context window tokens than basic tools. Enable them selectively based on the
                    agent's assigned role in the topology to prevent context starvation.
                </p>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportSkills}
                aria-hidden="true"
            />
            <ModuleInfo moduleKey="skills" />
        </div>
    );
};

export default SkillsPanel;
