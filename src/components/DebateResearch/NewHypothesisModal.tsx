import { Lightbulb, X, Plus, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { CATEGORY_CONFIG } from './hypothesis-constants';
import type { HypothesisCategory } from '../../kernel/types/research-types';

interface NewHypothesisModalProps {
    sourceFile: string | null;
    formData: {
        title: string;
        description: string;
        category: HypothesisCategory;
        sourceFile: string;
    };
    onFormDataChange: (data: {
        title: string;
        description: string;
        category: HypothesisCategory;
        sourceFile: string;
    }) => void;
    onClose: () => void;
    onCreate: () => void;
}

const NewHypothesisModal: React.FC<NewHypothesisModalProps> = ({
    sourceFile,
    formData,
    onFormDataChange,
    onClose,
    onCreate,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
            }}
        >
            <div
                style={{
                    width: 500,
                    maxWidth: '92vw',
                    background: 'var(--slate-800)',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '1.5rem',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.25rem',
                    }}
                >
                    <span
                        style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--slate-50)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Lightbulb size={16} color="#f59e0b" /> {t('hypothesis_generator.new')}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            padding: 3,
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: 'var(--slate-400)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {t('hypothesis_generator.form_title')} *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                                onFormDataChange({ ...formData, title: e.target.value })
                            }
                            placeholder="e.g. Split debate-service.ts into modules"
                            style={{
                                width: '100%',
                                padding: '0.55rem 0.75rem',
                                borderRadius: 7,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--slate-200)',
                                fontSize: '0.82rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: 'var(--slate-400)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {t('hypothesis_generator.form_description')} *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                onFormDataChange({ ...formData, description: e.target.value })
                            }
                            placeholder="Describe the hypothesis, its expected impact, and the evidence that supports it..."
                            style={{
                                width: '100%',
                                height: 90,
                                padding: '0.55rem 0.75rem',
                                borderRadius: 7,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--slate-200)',
                                fontSize: '0.82rem',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: 'var(--slate-400)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {t('hypothesis_generator.form_category')}
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {(Object.keys(CATEGORY_CONFIG) as HypothesisCategory[]).map((key) => {
                                const cfg = CATEGORY_CONFIG[key];
                                const isActive = formData.category === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() =>
                                            onFormDataChange({ ...formData, category: key })
                                        }
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 4,
                                            background: isActive
                                                ? `${cfg.color}20`
                                                : 'rgba(0,0,0,0.2)',
                                            border: isActive
                                                ? `1px solid ${cfg.color}40`
                                                : '1px solid rgba(255,255,255,0.06)',
                                            color: isActive ? cfg.color : 'var(--slate-500)',
                                        }}
                                    >
                                        {cfg.icon} {t(cfg.labelKey)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: 'var(--slate-400)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            Source File
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <input
                                type="text"
                                value={formData.sourceFile}
                                onChange={(e) =>
                                    onFormDataChange({ ...formData, sourceFile: e.target.value })
                                }
                                placeholder="src/kernel/services/..."
                                style={{
                                    flex: 1,
                                    padding: '0.55rem 0.75rem',
                                    borderRadius: 7,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.82rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {formData.sourceFile && (
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/project-os?file=${encodeURIComponent(formData.sourceFile)}`,
                                        )
                                    }
                                    style={{
                                        padding: '0.55rem 0.7rem',
                                        borderRadius: 7,
                                        border: '1px solid rgba(139,92,246,0.3)',
                                        background: 'var(--purple-tint)',
                                        color: '#a855f7',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: '0.72rem',
                                    }}
                                >
                                    Open <ExternalLink size={12} />
                                </button>
                            )}
                        </div>
                        {sourceFile && (
                            <div
                                style={{
                                    marginTop: '0.35rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 5,
                                    background: 'rgba(168,85,247,0.08)',
                                    fontSize: '0.68rem',
                                    color: '#a855f7',
                                }}
                            >
                                <ExternalLink size={10} /> Pre-filled from Project OS Explorer
                            </div>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'flex-end',
                        marginTop: '1.25rem',
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.55rem 1.1rem',
                            borderRadius: 7,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                        }}
                    >
                        {t('hypothesis_generator.cancel')}
                    </button>
                    <button
                        onClick={onCreate}
                        disabled={!formData.description.trim()}
                        style={{
                            padding: '0.55rem 1.1rem',
                            borderRadius: 7,
                            border: 'none',
                            background: formData.description.trim() ? '#f59e0b' : '#475569',
                            color: formData.description.trim() ? '#1e293b' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <Plus size={13} /> {t('hypothesis_generator.create')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewHypothesisModal;
