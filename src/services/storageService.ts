import { ChatSession, Message } from './geminiService';

const STORAGE_KEYS = {
  CHAT_SESSIONS: 'chat-sessions',
  CURRENT_SESSION: 'current-session-id',
  SETTINGS: 'app-settings'
};

export interface AppSettings {
  theme: 'dark' | 'light';
  apiKey?: string;
  aiProvider: 'gemini' | 'openai';
}

class StorageService {
  // Chat Sessions
  saveChatSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }

  loadChatSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      // Convert date strings back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  }

  saveCurrentSessionId(sessionId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
  }

  loadCurrentSessionId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  }

  // Settings
  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) return { theme: 'dark', aiProvider: 'gemini' };
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return { theme: 'dark', aiProvider: 'gemini' };
    }
  }

  // Utility methods
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  exportData(): string {
    const data = {
      sessions: this.loadChatSessions(),
      settings: this.loadSettings(),
      currentSessionId: this.loadCurrentSessionId()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.sessions) {
        this.saveChatSessions(data.sessions);
      }
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      if (data.currentSessionId) {
        this.saveCurrentSessionId(data.currentSessionId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();