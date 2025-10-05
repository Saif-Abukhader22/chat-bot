import { ChatSession } from '../services/geminiService';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Settings,
  MoreVertical 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
  onOpenSettings: () => void;
  className?: string;
}

export const ChatHistory = ({ 
  sessions, 
  currentSession, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  className 
}: ChatHistoryProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setTitleValue(session.title || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = (session: ChatSession) => {
    const next = titleValue.trim();
    const current = session.title || '';
    if (!next || next === current) {
      setTitleValue(current);
      setEditingId(null);
      return;
    }
    onRenameSession(session.id, next);
    setEditingId(null);
  };

  const cancel = (session: ChatSession) => {
    setTitleValue(session.title || '');
    setEditingId(null);
  };
  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold bg-gradient-text bg-clip-text text-transparent">
            Future Compass
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          onClick={onNewSession}
          variant="gradient"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Guidance
          </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative flex items-center",
                "rounded-lg transition-colors duration-200",
                "hover:bg-muted/50 cursor-pointer",
                currentSession?.id === session.id && "bg-muted"
              )}
            >
              <div
                className="flex-1 flex items-center gap-3 p-3 min-w-0"
                onClick={() => onSelectSession(session)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  {editingId === session.id ? (
                    <input
                      ref={inputRef}
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={() => commit(session)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commit(session);
                        if (e.key === 'Escape') cancel(session);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-transparent border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Title"
                      aria-label="Chat title"
                    />
                  ) : (
                    <p
                      className="text-sm font-medium truncate"
                      title={session.title}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditing(session);
                      }}
                    >
                      {session.title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {session.messages.length} messages
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => startEditing(session)}
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteSession(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No guidance sessions yet</p>
              <p className="text-xs">Start a new session to begin</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
