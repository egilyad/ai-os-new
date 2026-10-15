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

function renderArea() {
    return render(
        <MemoryRouter>
            <ChatInputArea
                selectedKeys={[]}
                selectedModel=""
                selectedModelPerKey={{}}
                onSend={vi.fn()}
                isSending={false}
                onError={vi.fn()}
                onKeysChange={vi.fn()}
                onModelChange={vi.fn()}
                onSelectedModelsChange={vi.fn()}
            />
        </MemoryRouter>,
    );
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
