import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockSessions = [
  { id: 's1', title: 'Chat about AI', history: [{ text: 'Hello', responses: [{ provider: 'openai', content: 'Hi!' }] }], createdAt: Date.now() - 10000, updatedAt: Date.now() - 5000 },
  { id: 's2', title: 'Code Review', history: [{ text: 'Review this', responses: [{ provider: 'anthropic', content: 'Looks good' }] }], createdAt: Date.now() - 20000, updatedAt: Date.now() - 10000 },
  { id: 's3', title: 'Debugging Session', history: Array.from({ length: 5 }, (_, i) => ({ text: `msg${i}`, responses: [{ provider: 'openai', content: `resp${i}` }] })), createdAt: Date.now() - 30000, updatedAt: Date.now() - 15000 },
];

vi.mock('../../stores/useChatStore', () => ({
  useChatStore: () => ({
    sessions: mockSessions,
    deleteSession: vi.fn(),
    setActiveSessionId: vi.fn(),
    importSessions: vi.fn(),
  }),
}));

vi.mock('../../kernel/events/event-bus', () => ({
  eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
  EVENTS: { NOTIFICATION: 'notification' },
}));

describe('ChatAdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Conversation History Admin heading', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    expect(await screen.findByText('Conversation History Admin')).toBeDefined();
  });

  it('renders stats cards', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    expect(await screen.findByText('Total Sessions')).toBeDefined();
    expect(screen.getByText('Total Prompts Executed')).toBeDefined();
    expect(screen.getByText('AI Responses Generated')).toBeDefined();
    expect(screen.getByText('Avg Turns / Session')).toBeDefined();
  });

  it('shows correct session count', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    expect(await screen.findByText('3')).toBeDefined();
  });

  it('renders session titles in table', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    expect(await screen.findByText('Chat about AI')).toBeDefined();
    expect(screen.getByText('Code Review')).toBeDefined();
    expect(screen.getByText('Debugging Session')).toBeDefined();
  });

  it('renders Import JSON and Export JSON buttons', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    expect(await screen.findByText('Import JSON')).toBeDefined();
    expect(screen.getByText('Export JSON')).toBeDefined();
  });

  it('renders Delete All button', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    expect(await screen.findByText('Delete All')).toBeDefined();
  });

  it('search filters sessions', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    await screen.findByText('Chat about AI');
    const search = screen.getByLabelText('Search chat sessions');
    fireEvent.change(search, { target: { value: 'Code' } });
    await waitFor(() => {
      expect(screen.queryByText('Chat about AI')).toBeNull();
    });
    expect(screen.getByText('Code Review')).toBeDefined();
  });

  it('shows no conversations when search has no match', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    await screen.findByText('Chat about AI');
    const search = screen.getByLabelText('Search chat sessions');
    fireEvent.change(search, { target: { value: 'ZZZNoMatch' } });
    expect(await screen.findByText('No conversations found')).toBeDefined();
  });

  it('renders filter dropdowns', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    await screen.findByText('Chat about AI');
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('renders Select All checkbox', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    await screen.findByText('Chat about AI');
    expect(screen.getByLabelText('Toggle select all sessions')).toBeDefined();
  });

  it('shows preview modal on eye button click', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    await screen.findByText('Chat about AI');
    const previewButtons = screen.getAllByLabelText(/Preview session/);
    fireEvent.click(previewButtons[0]);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });
  });

  it('shows session ID in table', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    expect(await screen.findByText(/s1/)).toBeDefined();
  });

  it('renders prompt count badges', async () => {
    const ChatAdminPanel = (await import('./ChatAdminPanel')).default;
    render(<ChatAdminPanel />);
    const onePromptBadges = await screen.findAllByText('1 Prompts');
    expect(onePromptBadges.length).toBe(2);
    expect(screen.getByText('5 Prompts')).toBeDefined();
  });
});
