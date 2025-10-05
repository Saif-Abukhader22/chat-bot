import { useState, useEffect } from 'react';
import { ChatHistory } from '../components/ChatHistory';
import { ChatInterface } from '../components/ChatInterface';
import { SettingsDialog } from '../components/SettingsDialog';
import { useChat } from '../hooks/useChat';
import { Button } from '../components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const ChatApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const {
    sessions,
    currentSession,
    isLoading,
    sendMessage,
    selectSession,
    createNewSession,
    deleteSession,
    updateSessionTitle
  } = useChat();

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  // Debug logs
  useEffect(() => {
    console.log('[ChatApp] mounted');
    // Ensure any previously stored OpenAI key is removed from the browser
    try { localStorage.removeItem('openai-api-key'); } catch {}
    return () => console.log('[ChatApp] unmounted');
  }, []);

  useEffect(() => {
    console.log('[ChatApp] sessions count:', sessions.length);
  }, [sessions.length]);

  useEffect(() => {
    console.log('[ChatApp] currentSession changed:', currentSession?.id || null);
  }, [currentSession?.id]);

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative z-50 lg:z-auto",
        "w-80 h-full transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <ChatHistory
          sessions={sessions}
          currentSession={currentSession}
          onSelectSession={(session) => {
            console.log('[ChatApp] selectSession:', session.id);
            selectSession(session);
            setSidebarOpen(false);
          }}
          onNewSession={async () => {
            console.log('[ChatApp] createNewSession');
            await createNewSession();
            setSidebarOpen(false);
          }}
          onDeleteSession={(id) => {
            console.log('[ChatApp] deleteSession:', id);
            deleteSession(id);
          }}
          onRenameSession={(id, title) => {
            console.log('[ChatApp] renameSession:', id, title);
            updateSessionTitle(id, title);
          }}
          onOpenSettings={handleOpenSettings}
          className="h-full"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-semibold bg-gradient-text bg-clip-text text-transparent">
            Future Compass
          </h1>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Chat interface */}
        <ChatInterface 
          onOpenSettings={handleOpenSettings}
          currentSession={currentSession}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          className="flex-1 min-h-0"
        />
      </div>

      {/* Settings dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
};
