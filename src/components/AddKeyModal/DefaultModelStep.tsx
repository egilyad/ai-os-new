
interface DefaultModelStepProps {
    provider: string;
    availableModels: string[];
    onSelect: (model: string) => void;
    onSkip: () => void;
}

const DefaultModelStep: React.FC<DefaultModelStepProps> = ({
    provider,
    availableModels,
    onSelect,
    onSkip,
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
            Key for <strong style={{ color: 'var(--slate-200)' }}>{provider}</strong> verified successfully.
            {availableModels.length > 0
                ? ' Choose a default model for new conversations:'
                : ' No models were fetched — you can set a default model later.'}
        </div>
        {availableModels.length > 0 ? (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    maxHeight: 280,
                    overflowY: 'auto',
                }}
            >
                {availableModels.map((m) => (
                    <button
                        key={m}
                        onClick={() => onSelect(m)}
                        className="modal-provider-btn"
                        style={{
                            textAlign: 'left',
                            padding: '0.6rem 0.75rem',
                        }}
                    >
                        <div className="modal-provider-name">{m}</div>
                    </button>
                ))}
            </div>
        ) : null}
        <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
            <button
                onClick={onSkip}
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem 1.25rem' }}
            >
                {availableModels.length > 0 ? 'Skip — use default' : 'Done'}
            </button>
        </div>
    </div>
);

export default DefaultModelStep;
