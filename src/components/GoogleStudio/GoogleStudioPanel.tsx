import { useState, useEffect } from 'react';
import { googleGenAIService } from '../../kernel/instances';
import { Shield, Brain, Image, Send, Globe, Building2, Loader2 } from 'lucide-react';
import { GoogleChatTab } from './GoogleChatTab';
import { GoogleGroundingTab } from './GoogleGroundingTab';
import { GoogleThinkingTab } from './GoogleThinkingTab';
import { GoogleImagenTab } from './GoogleImagenTab';
import { GoogleMultimodalTab } from './GoogleMultimodalTab';
import { GoogleVertexTab } from './GoogleVertexTab';

type TabId = 'chat' | 'grounding' | 'thinking' | 'multimodal' | 'imagen' | 'vertex';

export function GoogleStudioPanel() {
    const [configured, setConfigured] = useState(false);
    const [autoConfiguring, setAutoConfiguring] = useState(true);
    const [configError, setConfigError] = useState('');
    const [activeTab, setActiveTab] = useState<TabId>('chat');
    const [model, setModel] = useState('gemini-3.1-flash-lite');
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await googleGenAIService.ensureConfigured();
                if (!cancelled) setConfigured(true);
            } catch {
                if (!cancelled)
                    setConfigError(
                        'No Gemini key found in Key Manager. Add one or enter a key manually.',
                    );
            } finally {
                if (!cancelled) setAutoConfiguring(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!configured) {
        if (autoConfiguring) {
            return (
                <div style={{ padding: '32px', maxWidth: 600, margin: '0 auto' }}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}
                    >
                        <Shield size={32} color="#4285F4" />
                        <div>
                            <h2 style={{ margin: 0 }}>Google Studio</h2>
                            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
                                Google GenAI SDK integration — Multimodal · Thinking · Grounding
                            </p>
                        </div>
                    </div>
                    <div
                        style={{
                            background: '#1a1a2e',
                            borderRadius: 12,
                            padding: 24,
                            border: '1px solid #2a2a4e',
                            textAlign: 'center',
                        }}
                    >
                        <Loader2
                            size={32}
                            style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }}
                        />
                        <p>Auto-configuring from Key Manager...</p>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ padding: '32px', maxWidth: 600, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <Shield size={32} color="#4285F4" />
                    <div>
                        <h2 style={{ margin: 0 }}>Google Studio</h2>
                        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
                            Google GenAI SDK integration — Multimodal · Thinking · Grounding
                        </p>
                    </div>
                </div>
                {configError && (
                    <div
                        style={{
                            background: 'rgba(255,68,68,0.1)',
                            borderRadius: 8,
                            padding: 12,
                            border: '1px solid rgba(255,68,68,0.3)',
                            marginBottom: 16,
                            fontSize: 13,
                            color: '#f44',
                        }}
                    >
                        {configError}
                    </div>
                )}
                <div
                    style={{
                        background: '#1a1a2e',
                        borderRadius: 12,
                        padding: 24,
                        border: '1px solid #2a2a4e',
                    }}
                >
                    <p style={{ fontSize: 14, color: '#ccc', marginBottom: 16 }}>
                        Add a Gemini key in{' '}
                        <a href="/providers" style={{ color: '#4285F4' }}>
                            Key Manager
                        </a>{' '}
                        first, then return here. Or enter a key manually below:
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="password"
                            placeholder="AIza..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
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
                            onClick={() => {
                                if (apiKey.trim()) {
                                    googleGenAIService.setApiKey(apiKey.trim());
                                    setConfigured(true);
                                    setConfigError('');
                                }
                            }}
                            style={{
                                padding: '10px 20px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#4285F4',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            Connect
                        </button>
                    </div>
                    <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                        Your key stays local. Uses the official Google GenAI SDK.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Shield size={28} color="#4285F4" />
                <div>
                    <h2 style={{ margin: 0 }}>Google Studio</h2>
                    <p style={{ margin: '2px 0 0', color: '#888', fontSize: 12 }}>
                        SDK v0.24.1 · {model}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #333',
                            background: '#0d0d1a',
                            color: '#fff',
                            fontSize: 13,
                        }}
                    >
                        <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                        <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                        <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                    </select>
                    <button
                        onClick={() => {
                            setConfigured(false);
                            googleGenAIService.clearApiKey();
                        }}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #333',
                            background: 'transparent',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: 12,
                        }}
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                    { id: 'chat' as const, label: 'Chat', icon: Send },
                    { id: 'grounding' as const, label: 'Grounding', icon: Globe },
                    { id: 'thinking' as const, label: 'Thinking', icon: Brain },
                    { id: 'multimodal' as const, label: 'Multimodal', icon: Image },
                    { id: 'imagen' as const, label: 'Imagen', icon: Image },
                    { id: 'vertex' as const, label: 'Vertex Search', icon: Building2 },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: activeTab === tab.id ? '2px solid #4285F4' : '1px solid #333',
                            background:
                                activeTab === tab.id ? 'rgba(66,133,244,0.1)' : 'transparent',
                            color: activeTab === tab.id ? '#4285F4' : '#888',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: activeTab === tab.id ? 600 : 400,
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'chat' && <GoogleChatTab model={model} />}
            {activeTab === 'grounding' && <GoogleGroundingTab model={model} />}
            {activeTab === 'thinking' && <GoogleThinkingTab model={model} />}
            {activeTab === 'imagen' && <GoogleImagenTab />}
            {activeTab === 'multimodal' && <GoogleMultimodalTab model={model} />}
            {activeTab === 'vertex' && <GoogleVertexTab model={model} />}
        </div>
    );
}

export default GoogleStudioPanel;
