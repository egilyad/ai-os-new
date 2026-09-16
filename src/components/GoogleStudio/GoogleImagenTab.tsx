import { useState, useCallback } from 'react';
import { googleGenAIService } from '../../kernel/instances';
import { Image, Loader2 } from 'lucide-react';

export function GoogleImagenTab() {
    const [prompt, setPrompt] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError('');
        setImages([]);
        try {
            const result = await googleGenAIService.generateImage(prompt.trim());
            setImages(result.images);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, [prompt]);

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
                <Image size={20} color="#4285F4" />
                <h3 style={{ margin: 0, fontSize: 16 }}>Imagen Image Generation</h3>
            </div>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                Generate images from text prompts using{' '}
                <code style={{ background: '#0d0d1a', padding: '2px 6px', borderRadius: 4 }}>
                    imagen-3.0-generate-001
                </code>
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="A serene mountain lake at sunset, digital art..."
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
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || loading}
                    style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#4285F4',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        opacity: !prompt.trim() || loading ? 0.5 : 1,
                    }}
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Generate'}
                </button>
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
            {images.length > 0 && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: 16,
                    }}
                >
                    {images.map((img, i) => (
                        <div
                            key={i}
                            style={{
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid #333',
                                background: '#0d0d1a',
                            }}
                        >
                            <img
                                src={`data:image/png;base64,${img}`}
                                alt={`Generated ${i + 1}`}
                                style={{ width: '100%', display: 'block' }}
                            />
                            <div style={{ padding: '8px 12px', fontSize: 11, color: '#666' }}>
                                Imagen · {i + 1}/{images.length}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {images.length === 0 && !loading && !error && (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    <Image size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>Enter a prompt to generate an image</p>
                </div>
            )}
        </div>
    );
}
