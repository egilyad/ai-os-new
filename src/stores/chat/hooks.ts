import { useChatStore } from './store';
import type { ChatEntry } from './types';
import { DEFAULT_HISTORY } from './types';

export function useActiveSessionHistory(): ChatEntry[] {
  return useChatStore((s) => {
    const session = s.sessions.find((x) => x.id === s.activeSessionId);
    return session ? session.history : DEFAULT_HISTORY;
  });
}

export const useSessions = () => useChatStore(s => s.sessions);
export const useActiveSessionId = () => useChatStore(s => s.activeSessionId);
export const useSystemPrompt = () => useChatStore(s => s.systemPrompt);
export const useHasMoreSessions = () => useChatStore(s => s.hasMoreSessions);
