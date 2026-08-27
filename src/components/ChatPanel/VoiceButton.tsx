import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
    onTranscript: (text: string) => void;
    language?: string;
    disabled?: boolean;
    onError?: (message: string) => void;
}

const SpeechRecognitionAPI =
    typeof window !== 'undefined'
        ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition
        : null;

export const VoiceButton: React.FC<VoiceButtonProps> = ({
    onTranscript,
    language = 'en-US',
    disabled = false,
    onError,
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported] = useState(!!SpeechRecognitionAPI);
    const recognitionRef = useRef<unknown>(null);
    const onTranscriptRef = useRef(onTranscript);
    const onErrorRef = useRef(onError);
    const isMountedRef = useRef(true);
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            const rec = recognitionRef.current as {
                stop?: () => void;
                abort?: () => void;
                onresult?: null;
                onend?: null;
                onerror?: null;
            } | null;
            if (rec) {
                if (rec.stop) rec.stop();
                if (rec.abort) rec.abort();
                rec.onresult = null;
                rec.onend = null;
                rec.onerror = null;
            }
            recognitionRef.current = null;
        };
    }, []);

    const startListening = useCallback(() => {
        if (!SpeechRecognitionAPI || disabled) return;

        // Очистка предыдущей попытки
        const oldRec = recognitionRef.current as { abort: () => void } | null;
        if (oldRec) oldRec.abort();

        const recognition = new (
            SpeechRecognitionAPI as new () => {
                continuous: boolean;
                interimResults: boolean;
                lang: string;
                onresult: ((event: unknown) => void) | null;
                onend: (() => void) | null;
                onerror: ((event: unknown) => void) | null;
                start: () => void;
                stop: () => void;
                abort: () => void;
            }
        )();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: unknown) => {
            const e = event as {
                resultIndex: number;
                results: Array<{ isFinal: boolean; 0: { transcript: string } }>;
            };
            let finalTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i]!.isFinal) finalTranscript += e.results[i]![0]!.transcript;
            }
            if (finalTranscript) onTranscriptRef.current(finalTranscript.trim());
        };

        recognition.onend = () => {
            // Ownership check: if recognitionRef has been replaced by a newer
            // session (e.g. user clicked mic twice quickly), do NOT touch state.
            if (recognitionRef.current !== recognition) return;
            if (isMountedRef.current) setIsListening(false);
            if (isMountedRef.current) recognitionRef.current = null;
        };
        recognition.onerror = (event: unknown) => {
            // Ownership check: same as onend — ignore callbacks from stale
            // recognition instances that raced ahead of a new startListening().
            if (recognitionRef.current !== recognition) return;
            const err = event as { error: string };
            if (isMountedRef.current) setIsListening(false);
            if (isMountedRef.current) recognitionRef.current = null;
            const messages: Record<string, string> = {
                'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
                'no-speech': 'No speech detected. Please try again.',
                network: 'Network error. Check your connection.',
                aborted: '',
                'audio-capture': 'Microphone not found or busy.',
            };
            if (messages[err.error] && onErrorRef.current) {
                onErrorRef.current(messages[err.error]!);
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (e) {
            recognitionRef.current = null;
            if (isMountedRef.current) setIsListening(false);
            onErrorRef.current?.(
                `Failed to start voice recognition: ${e instanceof Error ? e.message : 'Unknown error'}`,
            );
            return;
        }
        if (isMountedRef.current) setIsListening(true);
    }, [language, disabled]);

    const stopListening = useCallback(() => {
        const rec = recognitionRef.current as { stop: () => void } | null;
        rec?.stop();
        setIsListening(false);
    }, []);

    if (!isSupported) return null;

    return (
        <button
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            title={isListening ? 'Stop recording' : 'Voice input'}
            aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                border: `1px solid ${isListening ? 'rgba(239,68,68,0.4)' : 'rgba(100,116,139,0.2)'}`,
                background: isListening ? 'rgba(239,68,68,0.15)' : 'rgba(30,30,50,0.4)',
                color: isListening ? '#ef4444' : '#64748b',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                flexShrink: 0,
            }}
        >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
    );
};
