import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { PersonalityBadge } from '../ProviderManager/PersonalityBadge';

interface ProviderItem {
    id: string;
    name: string;
    desc: string;
    docsUrl: string | null;
}

interface ProviderSelectionStepProps {
    providers: ProviderItem[];
    provider: string;
    onSelect: (id: string) => void;
}

const ProviderSelectionStep: React.FC<ProviderSelectionStepProps> = ({
    providers,
    provider,
    onSelect,
}) => (
    <div className="modal-provider-grid">
        {providers.map((p) => (
            <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`modal-provider-btn${provider === p.id ? ' modal-provider-btn--active' : ''}`}
                aria-pressed={provider === p.id}
            >
                <ProviderIcon provider={p.id} size={24} />
                <div>
                    <div
                        className={`modal-provider-name${provider === p.id ? ' modal-provider-name--active' : ''}`}
                    >
                        {p.name}
                    </div>
                    <div className="modal-provider-desc">{p.desc}</div>
                    <PersonalityBadge provider={p.id} compact />
                </div>
            </button>
        ))}
    </div>
);

export default ProviderSelectionStep;
