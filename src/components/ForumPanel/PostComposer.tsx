import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface PostComposerProps {
    onSubmit: (body: string) => void;
    draftKey?: string;
    injectText?: string | null;
    injectNonce?: number;
}

const DRAFT_PREFIX = 'forum:draft:';

/**
 * PostComposer — new post input for the selected topic.
 * Persists an unsent draft to localStorage, keyed by `draftKey` (topic id).
 * `injectText`/`injectNonce` let a "quote" action append a quoted block.
 */
const PostComposer: React.FC<PostComposerProps> = ({
    onSubmit,
    draftKey,
    injectText,
    injectNonce = 0,
}) => {
    const { t } = useTranslation();
    const [body, setBody] = React.useState('');

    React.useEffect(() => {
        if (!draftKey) return;
        const saved = localStorage.getItem(DRAFT_PREFIX + draftKey);
        if (saved) setBody(saved);
    }, [draftKey]);

    React.useEffect(() => {
        if (!draftKey) return;
        if (body) localStorage.setItem(DRAFT_PREFIX + draftKey, body);
        else localStorage.removeItem(DRAFT_PREFIX + draftKey);
    }, [body, draftKey]);

    React.useEffect(() => {
        if (injectNonce > 0 && injectText) {
            const quoted = injectText
                .split('\n')
                .map((l) => `> ${l}`)
                .join('\n');
            setBody((prev) => (prev.trim() ? `${prev}\n\n${quoted}` : quoted));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [injectNonce]);

    const submit = (): void => {
        if (!body.trim()) return;
        onSubmit(body.trim());
        setBody('');
        if (draftKey) localStorage.removeItem(DRAFT_PREFIX + draftKey);
    };

    return (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        submit();
                    }
                }}
                placeholder={t('forum.composer_placeholder')}
                rows={2}
                style={{
                    flex: 1,
                    background: 'var(--slate-900)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: 'var(--slate-200)',
                    fontSize: '0.75rem',
                    padding: '0.5rem 0.7rem',
                    resize: 'none',
                }}
            />
            <button
                onClick={submit}
                disabled={!body.trim()}
                style={{
                    alignSelf: 'flex-end',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 7,
                    border: 'none',
                    background: 'var(--purple)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    opacity: body.trim() ? 1 : 0.5,
                }}
            >
                {t('forum.post')}
            </button>
        </div>
    );
};

export default PostComposer;
