import { useState, useCallback, useRef, useEffect } from 'react';
import { googleGenAIService } from '../../kernel/instances';
import { Image, Send, Loader2, CheckCircle2 } from 'lucide-react';
import type { ChatMessage } from '../../kernel/types/llm-types';

interface GoogleMultimodalTabProps {
    model: string;
}

export function GoogleMultimodalTab({ model }: GoogleMultimodalTabProps) {
    const [imageBase64, setImageBase64] = useState('');
    const [imageMime, setImageMime] = useState('');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            setImageBase64(base64!);
            setImageMime(file.type);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleSend = useCallback(async () => {
        if (!input.trim() && !imageBase64) return;
        setLoading(true);
        setError('');
        const abort = new AbortController();
        abortRef.current = abort;

        const chatMessages: ChatMessage[] = [
            {
                role: 'user',
                content: input,
                inlineData: imageBase64 ? [{ mimeType: imageMime, data: imageBase64 }] : undefined,
            },
        ];
        try {
            await googleGenAIService.generateContent(chatMessages, model, {}, abort.signal);
            setInput('');
            setImageBase64('');
            setImageMime('');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    }, [input, model, imageBase64, imageMime]);

    return (
        <div
            style={{
                background: '#1a1a2e',
                borderRadius: 12,
                border: '1px solid #2a2a4e',
                padding: 24,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Image size={20} color="#EA4335" />
                <h3 style={{ margin: 0, fontSize: 16 }}>Multimodal I/O</h3>
            </div>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                Send images to Gemini for analysis. Uses{' '}
                <code style={{ background: '#0d0d1a', padding: '2px 6px', borderRadius: 4 }}>
                    inlineData
                </code>{' '}
                in SDK parts.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ fontSize: 13, color: '#888' }}
                />
                {imageBase64 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} color="#34A853" />
                        <span style={{ fontSize: 12, color: '#888' }}>
                            Image loaded ({Math.round((imageBase64.length * 3) / 4 / 1024)} KB)
                        </span>
                        <button
                            onClick={() => {
                                setImageBase64('');
                                setImageMime('');
                            }}
                            style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                border: '1px solid #333',
                                background: 'transparent',
                                color: '#888',
                                cursor: 'pointer',
                                fontSize: 11,
                            }}
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>
            {error && (
                <div
                    style={{
                        padding: 8,
                        background: 'var(--error-tint)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--error)',
                        marginBottom: 12,
                    }}
                >
                    {error}
                </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about the image..."
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #333',
                        background: '#0d0d1a',
                        color: '#fff',
                        fontSize: 14,
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() && !imageBase64}
                    style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#4285F4',
                        color: '#fff',
                        cursor: 'pointer',
                        opacity: input.trim() || imageBase64 ? 1 : 0.5,
                    }}
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
}
