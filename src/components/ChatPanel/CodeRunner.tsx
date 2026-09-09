import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Terminal, X } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import DOMPurify from 'dompurify';
import { rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('CodeRunner');

const EXECUTABLE_LANGS = new Set(['js', 'javascript', 'ts', 'typescript', 'html', 'css']);
// Python removed from EXECUTABLE_LANGS — sandbox iframe does not support Python execution.

// C-6: Allowlist-based sanitizer — only permits known-safe tags and strips
// all event handlers, javascript: URLs, and dangerous attributes. This is
// more robust than the previous blocklist which missed vectors like <svg onload>.
const ALLOWED_TAGS = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'code',
    'pre',
    'span',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'a',
]);

/**
 * Convert an HTML string to a Blob URL so it can be loaded into an iframe
 * via `src` instead of `srcdoc`. This completely eliminates HTML/script
 * injection vectors because the content is never parsed as inline HTML.
 */
function htmlToBlobUrl(html: string): string {
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
}

function escapeForStyleContent(s: string): string {
    // Prevent breaking out of <style> tag — neutralize </style> and </script> closers
    return s.replace(/<\/\s*(style|script)\s*>/gi, '\\x3c/$1>');
}

function sanitizeAllowedHtml(s: string): string {
    // Use DOMPurify with strict tag allowlist instead of regex
    const purified = DOMPurify.sanitize(s, {
        ALLOWED_TAGS: Array.from(ALLOWED_TAGS),
        ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false,
    });
    return purified;
}

interface CodeRunnerProps {
    code: string;
    language: string;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({ code, language }) => {
    const { confirm, ConfirmDialog } = useConfirm();
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showOutput, setShowOutput] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listenerRef = useRef<((e: MessageEvent) => void) | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    /**
     * Cleanup helper.  Removes the sandbox iframe and any associated message
     * listener; called from runCode(), the result/error paths, the timeout
     * path, and (on unmount) the effect below.  Without this the iframe leaks
     * if the user navigates away mid-execution.
     */
    const cleanup = useCallback(() => {
        if (listenerRef.current) {
            window.removeEventListener('message', listenerRef.current);
            listenerRef.current = null;
        }
        if (iframeRef.current) {
            try {
                document.body.removeChild(iframeRef.current);
            } catch {
                LOGGER.warn('CodeRunner', 'Failed to remove iframe');
            }
            iframeRef.current = null;
        }
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    const normalizeLang = (lang: string): string => {
        const l = lang
            .toLowerCase()
            .replace(/^node/i, 'js')
            .replace(/^javascript/i, 'js')
            .replace(/^typescript/i, 'ts')
            .replace(/^python/i, 'py');
        return l;
    };

    const runCode = useCallback(async () => {
        cleanup();
        if (
            !(await confirm({
                title: 'Execute Code',
                message: 'Warning: Executing arbitrary code. Proceed?',
                variant: 'danger',
            }))
        )
            return;

        setIsRunning(true);
        setError(null);
        setOutput(null);
        setShowOutput(true);

        const normLang = normalizeLang(language);

        if (normLang === 'html') {
            const iframe = document.createElement('iframe');
            iframe.sandbox.add('allow-scripts');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframeRef.current = iframe;

            const expectedOrigin = window.location.origin;
            const listener = (e: MessageEvent) => {
                if (e.source !== iframe.contentWindow) return;
                if (e.origin !== expectedOrigin && e.origin !== 'null') return;
                if (e.data?.type === 'sandbox-result') {
                    setOutput((e.data.body || '(no output)').slice(0, 5000));
                    setIsRunning(false);
                    window.removeEventListener('message', listener);
                    setTimeout(cleanup, 100);
                }
            };
            listenerRef.current = listener;
            window.addEventListener('message', listener);

            const safeBody = sanitizeAllowedHtml(code);
            const htmlContent =
                `<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none';"></head><body>${safeBody}<script>parent.postMessage({type:'sandbox-result',body:document.body.innerText},${JSON.stringify(expectedOrigin)});</scr` +
                `ipt></body></html>`;
            blobUrlRef.current = htmlToBlobUrl(htmlContent);
            iframe.src = blobUrlRef.current;
            timeoutRef.current = setTimeout(() => {
                setOutput('(rendered — check iframe for visual output)');
                setIsRunning(false);
                window.removeEventListener('message', listener);
                cleanup();
            }, 2000);
            return;
        }

        if (normLang === 'css') {
            setOutput('CSS applied to sandbox (visual output in iframe)');
            const iframe = document.createElement('iframe');
            iframe.sandbox.add('allow-scripts');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframeRef.current = iframe;

            const cssContent = `<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>${escapeForStyleContent(code)}</style></head><body><div class="test">Preview</div></body></html>`;
            blobUrlRef.current = htmlToBlobUrl(cssContent);
            iframe.src = blobUrlRef.current;
            const capturedIframe = iframe;
            timeoutRef.current = setTimeout(() => {
                try {
                    const doc = capturedIframe.contentDocument;
                    const bodyText = doc?.body?.innerText || '(no output)';
                    setOutput(bodyText.slice(0, 5000));
                } catch {
                    setOutput('(rendered — check iframe for visual output)');
                }
                setIsRunning(false);
                cleanup();
            }, 1000);
            return;
        }

        // JS/TS/Python: use iframe with console capture
        const iframe = document.createElement('iframe');
        iframe.sandbox.add('allow-scripts');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframeRef.current = iframe;

        const logs: string[] = [];
        const maxLogs = 200;
        const expectedOrigin = window.location.origin;

        const listener = (e: MessageEvent) => {
            // Security: only accept messages from our sandbox iframe (same origin
            // since allow-same-origin is NOT set, origin is "null" in modern
            // browsers; we accept either that or our own origin to cover both
            // browser behaviors).
            if (e.source !== iframe.contentWindow) return;
            const isOwnOrigin = e.origin === expectedOrigin;
            const isNullOrigin = e.origin === 'null';
            if (!isOwnOrigin && !isNullOrigin) return;

            if (e.data?.type === 'sandbox-log') {
                logs.push(e.data.args?.join(' ') || String(e.data.args));
                if (logs.length > maxLogs) logs.length = maxLogs;
            } else if (e.data?.type === 'sandbox-result') {
                setOutput(logs.join('\n') || '(no output)');
                setIsRunning(false);
                window.removeEventListener('message', listener);
                setTimeout(cleanup, 100);
            } else if (e.data?.type === 'sandbox-error') {
                setError(e.data.message || 'Execution failed');
                setOutput(logs.join('\n') || '(no output before error)');
                setIsRunning(false);
                window.removeEventListener('message', listener);
                setTimeout(cleanup, 100);
            }
        };
        listenerRef.current = listener;
        window.addEventListener('message', listener);

        timeoutRef.current = setTimeout(() => {
            setError('Execution timed out (10s limit)');
            setOutput(logs.join('\n') || '(no output)');
            setIsRunning(false);
            window.removeEventListener('message', listener);
            cleanup();
        }, 10000);

        const sandboxHtml = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none';">
<script>
var _targetOrigin = ${JSON.stringify(expectedOrigin)};
var _origConsole = { ...console };
['log','warn','error','info'].forEach(function(m) {
  console[m] = function() {
    var args = Array.prototype.slice.call(arguments);
    try { parent.postMessage({ type: 'sandbox-log', method: m, args: args.map(function(a) {
      if (a === null) return 'null';
      if (a === undefined) return 'undefined';
      if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch { return String(a); } }
      return String(a);
    })}, _targetOrigin); } catch(e) {}
    try { _origConsole[m].apply(console, args); } catch(e) {}
  };
});
window.onerror = function(msg, src, line, col, err) {
  try { parent.postMessage({ type: 'sandbox-error', message: msg + ' (line ' + line + ')' }, _targetOrigin); } catch(e) {}
};
window.addEventListener('unhandledrejection', function(e) {
  try { parent.postMessage({ type: 'sandbox-error', message: 'Unhandled: ' + (e.reason && e.reason.message || e.reason) }, _targetOrigin); } catch(e) {}
});
</script></head>
<body>
<script>
try {
  ${
      normLang === 'py' || normLang === 'python'
          ? `
    parent.postMessage({ type: 'sandbox-error', message: 'Python execution is not yet supported' }, _targetOrigin);
  `
          : `
    (async function() {
      ${code}
      parent.postMessage({ type: 'sandbox-result' }, _targetOrigin);
    })();
  `
  }
} catch(e) {
  parent.postMessage({ type: 'sandbox-error', message: e.message }, _targetOrigin);
}
</script>
</body>
</html>`;

        blobUrlRef.current = htmlToBlobUrl(sandboxHtml);
        iframe.src = blobUrlRef.current;
    }, [code, language, cleanup, confirm]);

    const closeOutput = useCallback(() => {
        setShowOutput(false);
        setOutput(null);
        setError(null);
        cleanup();
    }, [cleanup]);

    if (!EXECUTABLE_LANGS.has(normalizeLang(language))) return null;

    return (
        <>
            <button
                onClick={runCode}
                disabled={isRunning}
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 56,
                    background: isRunning ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    color: '#60a5fa',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: isRunning ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s',
                    zIndex: 1,
                }}
                onMouseEnter={(e) => {
                    if (!isRunning) e.currentTarget.style.background = 'rgba(59,130,246,0.3)';
                }}
                onMouseLeave={(e) => {
                    if (!isRunning) e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                }}
                title={`Run ${language} code in sandbox`}
            >
                {isRunning ? (
                    <>
                        <Terminal size={10} className="spinning" /> Running...
                    </>
                ) : (
                    <>
                        <Play size={10} /> Run
                    </>
                )}
            </button>

            {showOutput && (
                <div
                    style={{
                        margin: '0.5rem 0',
                        borderRadius: 8,
                        border: '1px solid rgba(59,130,246,0.3)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.3rem 0.6rem',
                            background: 'var(--accent-tint)',
                            borderBottom: '1px solid rgba(59,130,246,0.2)',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: '#60a5fa',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Terminal size={10} /> Output
                            {isRunning && (
                                <span style={{ animation: 'pulse 1s infinite' }}>...</span>
                            )}
                        </span>
                        <button
                            onClick={closeOutput}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                                padding: 2,
                            }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                    <pre
                        style={{
                            margin: 0,
                            padding: '0.6rem',
                            background: 'rgba(0,0,0,0.4)',
                            fontSize: '0.75rem',
                            fontFamily: "'JetBrains Mono', monospace",
                            color: error ? '#fca5a5' : '#e2e8f0',
                            maxHeight: 200,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                        }}
                    >
                        {error && <span style={{ color: 'var(--error)' }}>Error: {error}</span>}
                        {output && !error && output}
                        {!output && !error && isRunning && (
                            <span style={{ color: 'var(--slate-500)' }}>Executing...</span>
                        )}
                    </pre>
                </div>
            )}
            <ConfirmDialog />
        </>
    );
};

export { EXECUTABLE_LANGS };
