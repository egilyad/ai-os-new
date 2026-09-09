import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockKeys = [
  { id: 'k1', provider: 'OpenRouter', key: 'sk-1', label: 'OpenRouter Pro', status: 'active', availableModels: ['gpt-4'], stats: { successCount: 50, errorCount: 2, totalTokens: 10000, avgLatency: 1200, minLatency: 800, maxLatency: 2000, extended: { reputationScore: 85, state: 'HEALTHY', latencyBreakdown: { tokensPerSec: 45 } } } },
  { id: 'k2', provider: 'Gemini', key: 'sk-2', label: 'Gemini Ultra', status: 'active', availableModels: ['gemini-pro'], stats: { successCount: 10, errorCount: 1, totalTokens: 2000, avgLatency: 800, minLatency: 600, maxLatency: 1200, extended: { reputationScore: 70, state: 'HEALTHY', latencyBreakdown: { tokensPerSec: 30 } } } },
];

vi.mock('../../stores/useKeyStore', () => ({
  useKeyStore: () => ({ keys: mockKeys }),
}));

vi.mock('../../kernel/events/event-bus', () => ({
  eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
  EVENTS: { MESSAGE_RESPONSE: 'message:response', NAVIGATE: 'navigate', SELECT_MODEL: 'select:model' },
}));

vi.mock('../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'aquarium.title': 'Аквариум Интеллекта',
        'aquarium.subtitle': 'Наблюдайте за активностью провайдеров',
        'aquarium.feed_fish': 'ПОКОРМИТЬ РЫБ',
        'aquarium.temp_env': 'ТЕМП. СРЕДЫ',
        'aquarium.provider_population': 'Популяция провайдеров',
        'aquarium.move_cursor_hint': 'ДВИГАЙТЕ КУРСОРОМ ДЛЯ ИНФОРМАЦИИ',
        'aquarium.ecosystem_health': 'Здоровье экосистемы',
        'aquarium.agent_population': 'Популяция агентов',
        'aquarium.active_entities': 'активных сущностей',
        'aquarium.empty_title': 'Пустой аквариум',
        'aquarium.empty_desc': 'Добавьте провайдеров',
        'debate.pause': 'Пауза',
        'debate.resume': 'Продолжить',
        'common.active': 'Активен',
        'common.not_available': 'N/A',
        'aquarium.offline_suffix': '(Офлайн)',
        'aquarium.close_info': 'Закрыть',
        'aquarium.reputation_index': 'Индекс репутации',
        'aquarium.latency_label': 'Задержка',
        'aquarium.success_label': 'Успех',
        'aquarium.personality_status': 'Характер',
        'aquarium.personality_normal': 'Обычный',
        'aquarium.active_models': 'Модели',
        'aquarium.manage_key': 'Управлять',
        'aquarium.error_message': 'Ошибка',
        'aquarium.stable_suffix': 'Стабильный',
        'aquarium.energy_tooltip': 'Энергия: {value}%',
        'sidepanel.add_provider': 'Добавить провайдера',
      };
      return dict[key] || key;
    },
    lang: 'ru',
  }),
}));

vi.mock('../../styles/common', () => ({
  providerColors: { openrouter: '#60a5fa', gemini: '#c084fc', groq: '#34d399', nvidia: '#fbbf24', default: '#94a3b8' },
  infoCardMini: { background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' },
  flexBetweenMb05: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
}));

vi.mock('./hooks/useAquariumEngine', () => ({
  useAquariumEngine: () => ({
    fishes: [
      { id: 'k1', provider: 'OpenRouter', x: 20, y: 30, scale: 1, speed: 3, direction: 1, color: '#60a5fa', energy: 100, status: 'active', personality: 'brave', wagDuration: 0.5 },
      { id: 'k2', provider: 'Gemini', x: 50, y: 40, scale: 0.9, speed: 2, direction: -1, color: '#c084fc', energy: 90, status: 'active', personality: 'shy', wagDuration: 0.7 },
    ],
    bubbles: [],
    food: [],
    bot: { x: 10, y: 92, direction: 1 },
    setFood: vi.fn(),
  }),
}));

vi.mock('./hooks/useAquariumScene', () => ({
  useAquariumScene: () => ({
    jellyfishes: [],
    seaweeds: [],
    ripples: [],
    handleMouseMove: vi.fn(),
    handleContainerClick: vi.fn(),
    feedAllFishes: vi.fn(),
  }),
}));

vi.mock('./hooks/useLatest', () => ({
  useLatest: (val: unknown) => ({ current: val }),
}));

vi.mock('../../hooks/useAutoClearError', () => ({
  useAutoClearError: () => vi.fn(),
}));

vi.mock('./hooks/useLatest', () => ({
  useLatest: (val: unknown) => ({ current: val }),
}));

vi.mock('../ModuleInfo', () => ({ default: () => null }));

vi.mock('./components/Fish', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ fish, onSelect, isSelected }: any) => (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${fish.provider}: ${fish.status === 'active' ? 'Активен' : 'N/A'}, ${Math.round(fish.energy)}%`}
        onClick={() => onSelect(isSelected ? null : fish.id)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(isSelected ? null : fish.id); } }}
      >
        {fish.provider}
      </div>
    </div>
  ),
}));
vi.mock('./components/CleanerBot', () => ({ default: () => null }));
vi.mock('./components/ProviderAquariumShape', () => ({ default: () => null }));
vi.mock('./PerfOverlay', () => ({ PerfOverlay: () => null }));
vi.mock('./components/Jellyfish', () => ({ default: () => null }));
vi.mock('./components/Seaweed', () => ({ default: () => null }));
vi.mock('./components/FoodParticle', () => ({ default: () => null }));
vi.mock('./components/Bubble', () => ({ default: () => null }));

vi.mock('../../i18n/translations', () => ({
  t: (key: string) => key,
  setLanguage: vi.fn(),
}));

describe('AquariumPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders aquarium heading in Russian', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    expect(await screen.findByText('Аквариум Интеллекта')).toBeDefined();
  });

  it('renders provider fishes', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    expect(await screen.findByText('OpenRouter')).toBeDefined();
    expect(screen.getAllByText('Gemini').length).toBeGreaterThan(0);
  });

  it('shows temperature badge with reputation', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    expect(await screen.findByText(/ТЕМП. СРЕДЫ/)).toBeDefined();
  });

  it('renders feed button', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    expect(await screen.findByText('ПОКОРМИТЬ РЫБ')).toBeDefined();
  });

  it('renders legend with provider colors', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    expect(await screen.findByText('Популяция провайдеров')).toBeDefined();
    expect(screen.getByText('Openrouter')).toBeDefined();
    expect(screen.getAllByText('Gemini').length).toBeGreaterThan(0);
  });

  it('shows fish hover hint', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    expect(await screen.findByText(/ДВИГАЙТЕ КУРСОРОМ/)).toBeDefined();
  });

  it('shows ecosystem health footer', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    expect(await screen.findByText(/Здоровье экосистемы/)).toBeDefined();
    expect(screen.getByText(/Популяция агентов/)).toBeDefined();
  });

  it('shows fish count in footer', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    expect(await screen.findByText(/активных сущностей/)).toBeDefined();
  });

  it('fish buttons have aria-labels', async () => {
    const AquariumPanel = (await import('./AquariumPanel')).default;
    render(<AquariumPanel />);
    await screen.findByText('OpenRouter');
    const buttons = screen.getAllByRole('button');
    const fishBtns = buttons.filter(b => b.getAttribute('aria-label')?.toLowerCase().includes('активен'));
    expect(fishBtns.length).toBeGreaterThan(0);
  });
});
