import React, { useState, useCallback, useRef, useEffect } from 'react';

export const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const [failed, setFailed] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        },
        [],
    );

    const flash = useCallback((ok: boolean) => {
        setCopied(ok);
        setFailed(!ok);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setCopied(false);
            setFailed(false);
            timeoutRef.current = null;
        }, 1500);
    }, []);

    const handleCopy = useCallback(() => {
        // Never claim success before the write resolves (denied permission,
        // insecure context, missing API) — otherwise the user is misled.
        try {
            const pending = navigator.clipboard?.writeText(text);
            if (!pending) {
                flash(false);
                return;
            }
            pending.then(
                () => flash(true),
                () => flash(false),
            );
        } catch {
            flash(false);
        }
    }, [text, flash]);

    const tone = failed ? 'failed' : copied ? 'ok' : 'idle';
    const palette =
        tone === 'ok'
            ? { bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.3)', color: '#10b981' }
            : tone === 'failed'
              ? { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.3)', color: '#ef4444' }
              : {
                    bg: 'rgba(255,255,255,0.08)',
                    border: 'rgba(255,255,255,0.1)',
                    color: 'var(--text-muted)',
                };
    return (
        <button
            onClick={handleCopy}
            title={failed ? 'Copy failed — clipboard unavailable or denied' : undefined}
            style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                borderRadius: 6,
                padding: '4px 8px',
                color: palette.color,
                fontSize: '0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                zIndex: 1,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = palette.bg;
            }}
        >
            {tone === 'ok' ? 'Copied!' : tone === 'failed' ? 'Failed' : 'Copy'}
        </button>
    );
};
