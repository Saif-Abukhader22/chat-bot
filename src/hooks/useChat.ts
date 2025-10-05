import { useState, useEffect, useCallback } from 'react';
import { ChatSession, Message } from '../services/geminiService';
import { useToast } from './use-toast';
import {
  getAgents,
  listThreads as apiListThreads,
  createThread as apiCreateThread,
  listMessages as apiListMessages,
  sendMessage as apiSendMessage,
  updateThread as apiUpdateThread,
  type Thread as ApiThread,
  type Message as ApiMessage,
} from '../services/apiService';
import { health as apiHealth } from '../services/apiService';

export const useChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();

  // Load threads from backend on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        // Quick connectivity check with helpful error
        try {
          await apiHealth();
        } catch (e) {
          if (!cancelled) {
            toast({
              title: 'Backend not reachable',
              description:
                'Cannot connect to API. Start FastAPI on http://localhost:8000 (uvicorn pyserver.app.main:app --reload --port 8000), or set VITE_API_BASE_URL to your backend URL.',
              variant: 'destructive',
            });
          }
          throw e;
        }
        const threads = await apiListThreads();
        const mapped: ChatSession[] = threads
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .map((t): ChatSession => ({
            id: t.id,
            title: t.title,
            messages: [],
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          }));
        if (cancelled) return;
        setSessions(mapped);
        if (mapped.length > 0) {
          // Load messages for most recent thread
          const first = mapped[0];
          setCurrentSession(first);
          const msgs = await apiListMessages(first.id);
          if (cancelled) return;
          const uiMsgs: Message[] = msgs
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map((m): Message => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.createdAt),
            }));
          setCurrentSession({ ...first, messages: uiMsgs });
          setSessions(prev => prev.map(s => (s.id === first.id ? { ...s, messages: uiMsgs } : s)));
        }
      } catch (e) {
        console.error('Failed to load threads/messages:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const createNewSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const agents = await getAgents();
      const agentId = agents[0]?.id;
      if (!agentId) throw new Error('No agent available');
      const thread = await apiCreateThread(agentId, 'New Guidance');
      const newSession: ChatSession = {
        id: thread.id,
        title: thread.title,
        messages: [],
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      return newSession;
    } catch (e: any) {
      console.error('Failed to create new session:', e);
      toast({
        title: 'Cannot create chat',
        description: 'Backend unreachable or no agents available. Ensure the API server is running.',
        variant: 'destructive',
      });
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (currentSession?.id === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSession(remainingSessions[0]);
      } else {
        setCurrentSession(null);
      }
    }
  }, [currentSession, sessions]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    const prevSessions = sessions;
    const prevCurrent = currentSession;

    // Optimistic update
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title, updatedAt: new Date() }
        : session
    ));
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? { ...prev, title, updatedAt: new Date() } : null);
    }

    try {
      await apiUpdateThread(sessionId, { title });
    } catch (e) {
      console.error('Failed to update session title:', e);
      // Revert on failure and notify
      setSessions(prevSessions);
      setCurrentSession(prevCurrent);
      toast({ title: 'Rename failed', description: 'Could not save the new title. Check your connection.', variant: 'destructive' });
    }
  }, [currentSession, sessions, toast]);

  const sendMessage = useCallback(async (content: string) => {
    let session = currentSession;
    if (!session) {
      session = await createNewSession();
    }

    const userMessage: Message = {
      id: `tmp_user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: `tmp_assistant_${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    const updatedSession: ChatSession = {
      ...session!,
      messages: [...session!.messages, userMessage, assistantMessage],
      updatedAt: new Date(),
      title: session!.messages.length === 0 ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : session!.title,
    };

    setSessions(prev => prev.map(s => (s.id === session!.id ? updatedSession : s)));
    setCurrentSession(updatedSession);
    setIsLoading(true);
    setIsStreaming(true);

    try {
      let assistantResponse = '';
      await apiSendMessage(session!.id, content, (delta: string) => {
        assistantResponse += delta;
        setSessions(prev => prev.map(s => {
          if (s.id !== session!.id) return s;
          return {
            ...s,
            messages: s.messages.map(m => (m.id === assistantMessage.id ? { ...m, content: assistantResponse } : m)),
          };
        }));
        setCurrentSession(prev => {
          if (!prev || prev.id !== session!.id) return prev;
          return {
            ...prev,
            messages: prev.messages.map(m => (m.id === assistantMessage.id ? { ...m, content: assistantResponse } : m)),
          };
        });
      });

      // Mark streaming complete
      setSessions(prev => prev.map(s => {
        if (s.id !== session!.id) return s;
        return {
          ...s,
          messages: s.messages.map(m => (m.id === assistantMessage.id ? { ...m, isStreaming: false } : m)),
        };
      }));
      setCurrentSession(prev => {
        if (!prev || prev.id !== session!.id) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m => (m.id === assistantMessage.id ? { ...m, isStreaming: false } : m)),
        };
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message via server.', variant: 'destructive' });
      // Remove failed assistant message
      setSessions(prev => prev.map(s => (s.id === session!.id ? { ...s, messages: s.messages.filter(m => m.id !== assistantMessage.id) } : s)));
      setCurrentSession(prev => (prev && prev.id === session!.id ? { ...prev, messages: prev.messages.filter(m => m.id !== assistantMessage.id) } : prev));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [currentSession, createNewSession, toast]);

  // Wrap setCurrentSession to auto-load messages when needed
  const selectSession = useCallback(async (session: ChatSession) => {
    setCurrentSession(session);
    if (session.messages.length === 0) {
      try {
        const msgs = await apiListMessages(session.id);
        const uiMsgs: Message[] = msgs
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map((m): Message => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content, timestamp: new Date(m.createdAt) }));
        setSessions(prev => prev.map(s => (s.id === session.id ? { ...s, messages: uiMsgs } : s)));
        setCurrentSession(prev => (prev && prev.id === session.id ? { ...prev, messages: uiMsgs } : prev));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }
  }, []);

  return {
    sessions,
    currentSession,
    isLoading,
    isStreaming,
    setCurrentSession, // raw state setter (for internal/advanced use)
    selectSession,     // loads messages if needed
    createNewSession: () => createNewSession(),
    deleteSession,
    updateSessionTitle,
    sendMessage
  };
};
