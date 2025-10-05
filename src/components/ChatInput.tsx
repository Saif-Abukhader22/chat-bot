import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const ChatInput = ({ 
  onSendMessage, 
  isLoading = false, 
  disabled = false,
  placeholder = "Ask about majors, universities, scholarships, or careers...",
  className 
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debug: lifecycle
  useEffect(() => {
    console.log('[ChatInput] mounted');
    return () => console.log('[ChatInput] unmounted');
  }, []);

  // Debug: loading/disabled state changes
  useEffect(() => {
    console.log('[ChatInput] isLoading:', isLoading, 'disabled:', disabled);
  }, [isLoading, disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ChatInput] submit', { len: message.trim().length, isLoading, disabled });
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      resetTextareaHeight();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('[ChatInput] Enter pressed -> submit');
      handleSubmit(e);
    } else if (e.key === 'Enter' && e.shiftKey) {
      console.log('[ChatInput] Shift+Enter -> newline');
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      console.log('[ChatInput] resetTextareaHeight');
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
    console.log('[ChatInput] message length:', message.length);
  }, [message]);

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "flex items-end gap-3 p-4 bg-card border-t border-border",
        className
      )}
    >
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            console.log('[ChatInput] change', e.target.value.length);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "min-h-[44px] max-h-[120px] resize-none bg-input border-border",
            "focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all duration-200"
          )}
          rows={1}
        />
      </div>
      <Button
        type="submit"
        disabled={!message.trim() || isLoading || disabled}
        variant="gradient"
        className={cn(
          "h-11 w-11 p-0 shrink-0",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
};
