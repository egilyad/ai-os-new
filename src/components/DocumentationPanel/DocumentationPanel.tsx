import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { NavItem, SearchBar } from './doc-helpers';
import { GettingStarted, Architecture, ApiReference, Safety, FAQ, Changelog } from './doc-sections';
import { NAV_ITEMS, ALL_CONTENT } from './doc-constants';
import type { DocSection, DocSearchResult } from './doc-constants';

const SECTION_COMPONENTS: Record<DocSection, React.FC> = {
    'getting-started': GettingStarted,
    architecture: Architecture,
    'api-reference': ApiReference,
    safety: Safety,
    faq: FAQ,
    changelog: Changelog,
};

const DocumentationPanel: React.FC = () => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<DocSection>('getting-started');
    const [searchQuery, setSearchQuery] = useState('');

    const searchResults = useMemo((): DocSearchResult[] => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        const results: DocSearchResult[] = [];

        for (const [section, data] of Object.entries(ALL_CONTENT)) {
            const titleMatch = data.title.toLowerCase().indexOf(q);
            const contentMatch = data.content.toLowerCase().indexOf(q);
            if (titleMatch >= 0 || contentMatch >= 0) {
                results.push({
                    section: section as DocSection,
                    title: data.title,
                    content: data.content,
                    matchIndex: Math.min(
                        titleMatch >= 0 ? titleMatch : Infinity,
                        contentMatch >= 0 ? contentMatch : Infinity,
                    ),
                });
            }
        }

        return results.sort((a, b) => a.matchIndex - b.matchIndex);
    }, [searchQuery]);

    const handleSectionSelect = useCallback((id: DocSection) => {
        setActiveSection(id);
        setSearchQuery('');
    }, []);

    const SectionComponent = SECTION_COMPONENTS[activeSection];

    return (
        <div style={{ display: 'flex', gap: '3rem', height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    width: 260,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        marginBottom: '1.5rem',
                        paddingBottom: '1.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '1.6rem',
                            fontWeight: 800,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: 'var(--slate-50)',
                        }}
                    >
                        <BookOpen size={28} color="#3b82f6" /> {t('docs.title')}
                    </h2>
                    <p
                        style={{
                            color: 'var(--slate-400)',
                            fontSize: '0.85rem',
                            marginTop: '0.5rem',
                            lineHeight: 1.5,
                        }}
                    >
                        {t('docs.subtitle')}
                    </p>
                </div>

                <SearchBar
                    query={searchQuery}
                    onChange={setSearchQuery}
                    results={searchResults}
                    onSelect={handleSectionSelect}
                    placeholder={t('docs.search_placeholder')}
                    t={t}
                />

                {NAV_ITEMS.map((item) => (
                    <NavItem
                        key={item.id}
                        id={item.id}
                        icon={item.icon}
                        label={t(item.labelKey)}
                        activeSection={activeSection}
                        onSelect={handleSectionSelect}
                    />
                ))}

                <div
                    style={{
                        marginTop: 'auto',
                        padding: '1.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <h4
                        style={{
                            margin: '0 0 0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: 'var(--slate-50)',
                        }}
                    >
                        {t('docs.dev_support')}
                    </h4>
                    <p
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--slate-400)',
                            lineHeight: 1.6,
                            marginBottom: '1rem',
                        }}
                    >
                        {t('docs.dev_support_desc')}
                    </p>
                    <a
                        href="https://github.com/n95887174-source/ai-os-new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            padding: '0.6rem',
                            borderRadius: 8,
                        }}
                    >
                        <ExternalLink size={14} /> {t('docs.view_repo')}
                    </a>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    maxWidth: 850,
                    overflowY: 'auto',
                    paddingRight: '2rem',
                    paddingBottom: '3rem',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection + (searchQuery ? '-search' : '')}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        <SectionComponent />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DocumentationPanel;
