import React, { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { GenerationTrigger } from '../../kernel/types/generator-types';

interface TriggerConfigProps {
    onTrigger: (trigger: GenerationTrigger) => void;
    running: boolean;
}

const KINDS: GenerationTrigger['kind'][] = [
    'scheduled',
    'anomaly',
    'gap',
    'forum-question',
    'crystal-conflict',
    'cross-domain',
];

/**
 * TriggerConfig — build a GenerationTrigger (scheduled/anomaly/gap/forum/
 * conflict/cross-domain) and start a generation job.
 */
const TriggerConfig: React.FC<TriggerConfigProps> = ({ onTrigger, running }) => {
    const { t } = useTranslation();
    const [kind, setKind] = useState<GenerationTrigger['kind']>('gap');
    const [cron, setCron] = useState('0 3 * * 1');
    const [topic, setTopic] = useState('');
    const [anomalyId, setAnomalyId] = useState('');
    const [gap, setGap] = useState('');
    const [forumTopicId, setForumTopicId] = useState('');
    const [crystalIds, setCrystalIds] = useState('');
    const [domains, setDomains] = useState('arch, security');

    const buildTrigger = (): GenerationTrigger | null => {
        switch (kind) {
            case 'scheduled':
                if (!topic.trim()) return null;
                return { kind: 'scheduled', cron: cron.trim() || '0 3 * * 1', topic: topic.trim() };
            case 'anomaly':
                if (!anomalyId.trim()) return null;
                return { kind: 'anomaly', detectedAnomalyId: anomalyId.trim() };
            case 'gap':
                if (!gap.trim()) return null;
                return { kind: 'gap', gapDescription: gap.trim() };
            case 'forum-question':
                if (!forumTopicId.trim()) return null;
                return { kind: 'forum-question', topicId: forumTopicId.trim() };
            case 'crystal-conflict': {
                const ids = crystalIds
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                if (ids.length < 2) return null;
                return { kind: 'crystal-conflict', crystalIds: ids };
            }
            case 'cross-domain': {
                const ds = domains
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                if (ds.length === 0) return null;
                return { kind: 'cross-domain', sourceDomains: ds };
            }
        }
    };

    const submit = (): void => {
        const trigger = buildTrigger();
        if (trigger) onTrigger(trigger);
    };

    return (
        <div
            style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#0b1220',
                borderRadius: 10,
                padding: '0.85rem 1rem',
                marginBottom: 12,
            }}
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {KINDS.map((k) => (
                    <button
                        key={k}
                        onClick={() => setKind(k)}
                        style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: 6,
                            border:
                                kind === k
                                    ? '1px solid #22c55e'
                                    : '1px solid rgba(255,255,255,0.12)',
                            background: kind === k ? '#22c55e22' : 'transparent',
                            color: kind === k ? '#86efac' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                    >
                        {t(`generator.kind_${k}`)}
                    </button>
                ))}
            </div>

            <div style={{ marginTop: 10 }}>
                {kind === 'scheduled' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input
                            value={cron}
                            onChange={(e) => setCron(e.target.value)}
                            placeholder={t('generator.cron_placeholder')}
                            style={inputStyle}
                        />
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={t('generator.topic_placeholder')}
                            style={inputStyle}
                        />
                    </div>
                )}
                {kind === 'anomaly' && (
                    <input
                        value={anomalyId}
                        onChange={(e) => setAnomalyId(e.target.value)}
                        placeholder={t('generator.anomaly_id_placeholder')}
                        style={inputStyle}
                    />
                )}
                {kind === 'gap' && (
                    <input
                        value={gap}
                        onChange={(e) => setGap(e.target.value)}
                        placeholder={t('generator.gap_placeholder')}
                        style={inputStyle}
                    />
                )}
                {kind === 'forum-question' && (
                    <input
                        value={forumTopicId}
                        onChange={(e) => setForumTopicId(e.target.value)}
                        placeholder={t('generator.forum_topic_placeholder')}
                        style={inputStyle}
                    />
                )}
                {kind === 'crystal-conflict' && (
                    <input
                        value={crystalIds}
                        onChange={(e) => setCrystalIds(e.target.value)}
                        placeholder={t('generator.crystal_ids_placeholder')}
                        style={inputStyle}
                    />
                )}
                {kind === 'cross-domain' && (
                    <input
                        value={domains}
                        onChange={(e) => setDomains(e.target.value)}
                        placeholder={t('generator.domains_placeholder')}
                        style={inputStyle}
                    />
                )}
            </div>

            <div style={{ marginTop: 10, textAlign: 'right' }}>
                <button
                    onClick={submit}
                    disabled={running || !buildTrigger()}
                    style={{
                        padding: '0.45rem 1rem',
                        borderRadius: 7,
                        border: 'none',
                        background: 'var(--success)',
                        color: '#06210f',
                        cursor: running ? 'wait' : 'pointer',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        opacity: running ? 0.7 : 1,
                    }}
                >
                    {running ? t('generator.running') : t('generator.start')}
                </button>
            </div>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'var(--slate-900)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: 'var(--slate-200)',
    fontSize: '0.72rem',
    padding: '0.35rem 0.6rem',
    width: '100%',
};

export default TriggerConfig;
