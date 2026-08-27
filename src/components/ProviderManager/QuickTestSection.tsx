import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send } from 'lucide-react';
import type { ApiKey } from '../../types/metrics';
import { eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('QuickTestSection');
import { PROVIDER_DEFAULT_MODELS } from '../../kernel/utils/provider-default-models';
import { useTranslation } from '../../i18n/useTranslation';
import {
    successBox,
    flexBetweenSuccessLabel,
    textResultBox,
    errorBox,
    textErrorLabel,
    textErrorContent,
    flexWrapGap2,
    iconBtn36,
    selectSmall,
} from '../../styles/common';

interface QuickTestSectionProps {
    apiKey: ApiKey;
}

export const QuickTestSection: React.FC<QuickTestSectionProps> = ({ apiKey }) => {
    const { t } = useTranslation();
    const [testPrompt, setTestPrompt] = useState('');
    const [testModel, setTestModel] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testResult, setTestResult] = useState<{
        content: string;
        latency?: number;
        model?: string;
    } | null>(null);
    const [testError, setTestError] = useState<string | null>(null);

    const handleTest = async () => {
        const prompt = testPrompt.trim();
        if (!prompt || testStatus === 'loading') return;
        setTestStatus('loading');
        setTestResult(null);
        setTestError(null);

        const keyId = apiKey.id;
        const reqId = `quick-test-${keyId}-${crypto.randomUUID().slice(0, 6)}`;
        const start = Date.now();
        let isDone = false;

        const p = apiKey.provider.toLowerCase();
        const defaultModel = PROVIDER_DEFAULT_MODELS[p] || 'auto';

        const resolvedModel = testModel || apiKey.availableModels?.[0] || defaultModel;

        LOGGER.debug('QuickTestSection', `SEND_MESSAGE to ${p}/${resolvedModel} (reqId=${reqId})`);
        eventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: p,
            model: resolvedModel,
            messages: [{ role: 'user', content: prompt }],
            requestId: reqId,
            keyId,
            options: { temperature: 0.7, maxTokens: 1024 },
        });

        const cleanup = () => {
            subResp();
            subStreamEnd();
            subStreamErr();
        };

        const subResp = eventBus.on(EVENTS.MESSAGE_RESPONSE, (res) => {
            if (isDone) return;
            if (res.requestId === reqId) {
                isDone = true;
                cleanup();
                clearTimeout(timeout);
                LOGGER.debug(`MESSAGE_RESPONSE received in ${Date.now() - start}ms`, res.status);
                if (res.status === 'error') {
                    setTestStatus('error');
                    setTestError(res.error || 'Unknown error');
                } else {
                    setTestStatus('success');
                    setTestResult({
                        content: res.content,
                        latency: Date.now() - start,
                        model: resolvedModel,
                    });
                }
            }
        });

        const subStreamEnd = eventBus.on(EVENTS.STREAM_END, ({ requestId, fullContent }) => {
            if (isDone) return;
            if (requestId === reqId) {
                isDone = true;
                cleanup();
                clearTimeout(timeout);
                LOGGER.debug('QuickTestSection', `STREAM_END received in ${Date.now() - start}ms`);
                setTestStatus('success');
                setTestResult({
                    content: fullContent,
                    latency: Date.now() - start,
                    model: resolvedModel,
                });
            }
        });

        const subStreamErr = eventBus.on(EVENTS.STREAM_ERROR, ({ requestId, error }) => {
            if (isDone) return;
            if (requestId === reqId) {
                isDone = true;
                cleanup();
                clearTimeout(timeout);
                LOGGER.debug(`STREAM_ERROR received in ${Date.now() - start}ms`, error);
                setTestStatus('error');
                setTestError(error || 'Stream error');
            }
        });

        const timeout = setTimeout(() => {
            if (isDone) return;
            isDone = true;
            cleanup();
            eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId: reqId });
            LOGGER.warn('QuickTestSection', `TIMEOUT after 60000ms (reqId=${reqId})`);
            setTestStatus('error');
            setTestError('Request timed out');
        }, 60000);
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div
                style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--slate-400)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                }}
            >
                {t('provider.quick_test')}
            </div>
            <div style={flexWrapGap2}>
                <textarea
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleTest();
                        }
                    }}
                    placeholder={t('provider.enter_prompt')}
                    rows={1}
                    style={{
                        flex: 1,
                        minWidth: 120,
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        resize: 'none',
                        fontSize: '0.85rem',
                        outline: 'none',
                    }}
                />
                {apiKey.availableModels && apiKey.availableModels.length > 0 && (
                    <select
                        value={testModel}
                        onChange={(e) => setTestModel(e.target.value)}
                        style={selectSmall}
                        aria-label={t('provider.select_model')}
                    >
                        <option value="">{t('provider.default_model')}</option>
                        {apiKey.availableModels.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                )}
                <button
                    onClick={handleTest}
                    disabled={!testPrompt.trim() || testStatus === 'loading'}
                    className="btn-primary"
                    style={iconBtn36}
                >
                    {testStatus === 'loading' ? (
                        <Loader2 size={16} className="provider-spin" />
                    ) : (
                        <Send size={16} />
                    )}
                </button>
            </div>
            {testStatus === 'success' && testResult && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={successBox}
                >
                    <div style={flexBetweenSuccessLabel}>
                        <span>{testResult.model}</span>
                        <span>{testResult.latency}ms</span>
                    </div>
                    <div style={textResultBox}>{testResult.content}</div>
                </motion.div>
            )}
            {testStatus === 'error' && testError && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={errorBox}
                >
                    <div style={textErrorLabel}>{t('common.error').toUpperCase()}</div>
                    <div style={textErrorContent}>{testError}</div>
                </motion.div>
            )}
        </div>
    );
};
