import React, { useState, useCallback, useRef, useEffect } from 'react';

export const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        },
        [],
    );

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setCopied(false);
            timeoutRef.current = null;
        }, 1500);
    }, [text]);

    return (
        <button
            onClick={handleCopy}
            style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6,
                padding: '4px 8px',
                color: copied ? '#10b981' : 'var(--text-muted)',
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
                e.currentTarget.style.background = copied
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(255,255,255,0.08)';
            }}
        >
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};
