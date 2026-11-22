import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatInputArea from './ChatInputArea';

const navMock = vi.hoisted(() => vi.fn());
const keyListState = vi.hoisted((): { activeKeys: unknown[] } => ({ activeKeys: [] }));

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => navMock };
});

vi.mock('../../stores/useKeyStore', () => ({
    useKeyList: () => ({ activeKeys: keyListState.activeKeys }),
}));

vi.mock('../../stores/useChatStore', () => ({
    useChatStore: () => vi.fn(),
}));

vi.mock('./VoiceButton', () => ({ VoiceButton: () => null }));
vi.mock('../ProviderIcon/ProviderIcon', () => ({ default: () => null }));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    keyListState.activeKeys = [];
});

type AreaOverrides = {
    selectedKeys?: string[];
    selectedModel?: string;
    selectedModelPerKey?: Record<string, string>;
    isSending?: boolean;
};

function areaElement(overrides: AreaOverrides = {}) {
    return (
        <MemoryRouter>
            <ChatInputArea
                selectedKeys={overrides.selectedKeys ?? []}
                selectedModel={overrides.selectedModel ?? ''}
                selectedModelPerKey={overrides.selectedModelPerKey ?? {}}
                onSend={vi.fn()}
                isSending={overrides.isSending ?? false}
                onError={vi.fn()}
                onKeysChange={vi.fn()}
                onModelChange={vi.fn()}
                onSelectedModelsChange={vi.fn()}
            />
        </MemoryRouter>
    );
}

function renderArea(overrides: AreaOverrides = {}) {
    return render(areaElement(overrides));
}

describe('ChatInputArea zero-keys CTA (Zone 1)', () => {
    it('offers a Providers shortcut instead of only a disabled box', () => {
        keyListState.activeKeys = [];
        renderArea();
        const cta = screen.getByRole('button', {
            name: /chat\.add_provider_key|Add a provider key/,
        });
        expect(cta).toBeDefined();
        fireEvent.click(cta);
        expect(navMock).toHaveBeenCalledWith('/keys');
    });

    it('hides the shortcut when keys exist', () => {
        keyListState.activeKeys = [{ id: 'k1' }];
        renderArea();
        expect(
            screen.queryByRole('button', { name: /chat\.add_provider_key|Add a provider key/ }),
        ).toBeNull();
    });
});

describe('ChatInputArea pending switch', () => {
    it('shows a hint when the model changes during sending', () => {
        const view = renderArea({ selectedKeys: ['k1'], selectedModel: 'm1', isSending: true });
        expect(screen.queryByRole('status')).toBeNull();
        view.rerender(areaElement({ selectedKeys: ['k1'], selectedModel: 'm2', isSending: true }));
        expect(screen.getByRole('status').textContent).toMatch(
            /pending_switch|next message|следующему/,
        );
    });

    it('clears the hint when sending stops', () => {
        const view = renderArea({ selectedKeys: ['k1'], selectedModel: 'm1', isSending: true });
        view.rerender(areaElement({ selectedKeys: ['k1'], selectedModel: 'm2', isSending: true }));
        view.rerender(areaElement({ selectedKeys: ['k1'], selectedModel: 'm2', isSending: false }));
        expect(screen.queryByRole('status')).toBeNull();
    });
});
