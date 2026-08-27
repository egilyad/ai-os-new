import React, { useState, useMemo } from 'react';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { INITIAL_NOTES } from './pattern-constants';
import type { PatternNote } from './pattern-constants';
import PatternHeader from './PatternHeader';
import ProviderNav from './ProviderNav';
import PatternCard from './PatternCard';
import InsightFeed from './InsightFeed';
import PatternDetailModal from './PatternDetailModal';

const PatternsPanel: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<string>('all');
    const [notes] = useState<PatternNote[]>(INITIAL_NOTES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<PatternNote | null>(null);

    const filteredNotes = useMemo(
        () =>
            notes.filter((n) => {
                const matchesTab = activeTab === 'all' || n.provider === activeTab;
                const matchesSearch =
                    !searchQuery ||
                    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    n.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesTab && matchesSearch;
            }),
        [notes, activeTab, searchQuery],
    );

    const notifyComingSoon = () =>
        eventBus.emit(EVENTS.NOTIFICATION, { message: t('patterns.coming_soon'), type: 'info' });

    return (
        <div
            className="patterns-container"
            style={{
                padding: '2rem',
                maxWidth: 1400,
                margin: '0 auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <PatternHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onCreateClick={notifyComingSoon}
                createDisabled
            />

            <ProviderNav activeTab={activeTab} onTabChange={setActiveTab} />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 350px',
                    gap: '2rem',
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <div style={{ overflowY: 'auto', paddingRight: '1rem' }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                            gap: '1.5rem',
                        }}
                    >
                        {filteredNotes.map((note) => (
                            <PatternCard
                                key={note.id}
                                note={note}
                                onClick={() => setSelectedNote(note)}
                            />
                        ))}
                    </div>
                </div>

                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <InsightFeed />
                </aside>
            </div>

            <PatternDetailModal
                note={selectedNote}
                onClose={() => setSelectedNote(null)}
                onEdit={notifyComingSoon}
                onSave={notifyComingSoon}
                editDisabled
            />

            <ModuleInfo moduleKey="patterns" />
        </div>
    );
};

export default PatternsPanel;
