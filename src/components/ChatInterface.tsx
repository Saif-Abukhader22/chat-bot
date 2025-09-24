import { useEffect, useRef } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import heroImage from '../assets/ai-brain-hero.png';
import type { ChatSession } from '../services/geminiService';

interface ChatInterfaceProps {
  onOpenSettings: () => void;
  className?: string;
  currentSession: ChatSession | null;
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatInterface = ({ onOpenSettings, className, currentSession, isLoading, onSendMessage }: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);


  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-lg mx-auto">
        <div className="relative mb-8">
          <div className="w-48 h-36 mx-auto rounded-2xl overflow-hidden border border-border bg-gradient-glow">
            <img 
              src={heroImage} 
              alt="Future Compass" 
              className="w-full h-full object-cover opacity-80"
            />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
        </div>
        
        <h3 className="text-xl font-semibold mb-3 bg-gradient-text bg-clip-text text-transparent">
          Welcome to Future Compass
        </h3>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Your university study and career guide. Explore majors, compare
          programs and scholarships, and build a personalized study plan.
        </p>

        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Find majors that fit your interests and strengths</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Compare programs, careers, and admission requirements</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>Plan applications, timelines, and scholarships</span>
          </div>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          Tip: ask for a visual degree plan. Example prompt: "Create a 4-year Computer Science bachelor's plan with prerequisites and output it as JSON inside a code block with the language tag degreeplan."
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with chat title */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <h2
            className="text-base font-semibold truncate"
            title={currentSession?.title || 'New Guidance'}
          >
            {currentSession?.title || 'New Guidance'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Header right actions placeholder */}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {currentSession && currentSession.messages.length > 0 ? (
          <ScrollArea className="flex-1 px-4 py-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {currentSession.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 overflow-auto">
            <EmptyState />
          </div>
        )}

        {/* Input pinned at bottom */}
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          placeholder={
            currentSession && currentSession.messages.length > 0
              ? "Ask about majors, universities, or scholarships (Shift+Enter = newline)"
              : "Describe your interests and goals to get guidance..."
          }
        />
      </div>
    </div>
  );
};
