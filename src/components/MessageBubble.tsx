import { Message } from '../services/geminiService';
import { cn } from '../lib/utils';
import { GraduationCap, User, Loader2 } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { PlanVisualizer, type DegreePlan } from './PlanVisualizer';

interface MessageBubbleProps {
  message: Message;
  className?: string;
}

const parseCodeBlocks = (content: string) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore });
      }
    }

    // Add code block
    const language = match[1] || 'text';
    const code = match[2];
    parts.push({ type: 'code', content: code, language });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex);
    if (textAfter.trim()) {
      parts.push({ type: 'text', content: textAfter });
    }
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }];
};

export const MessageBubble = ({ message, className }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const parsedContent = parseCodeBlocks(message.content);

  return (
    <div className={cn(
      "flex items-start gap-3 max-w-4xl animate-fade-in",
      isUser ? "ml-auto flex-row-reverse" : "mr-auto",
      className
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-chat-user text-white" 
          : "bg-chat-assistant text-white"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <GraduationCap className="w-4 h-4" />
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        "flex-1 space-y-2",
        isUser ? "text-right" : "text-left"
      )}>
        <div className={cn(
          "inline-block px-4 py-3 rounded-2xl max-w-full",
          isUser 
            ? "bg-chat-bubble-user text-white rounded-tr-md" 
            : "bg-chat-bubble-assistant border border-border rounded-tl-md"
        )}>
          {parsedContent.map((part, index) => (
            <div key={index} className={cn(
              index > 0 && "mt-3"
            )}>
              {part.type === 'code' ? (
                (() => {
                  const lang = String(part.language || '').toLowerCase();
                  const looksLikePlan = (obj: any) => obj && Array.isArray(obj.nodes);
                  if (lang === 'degreeplan' || lang === 'degree-plan' || lang === 'plan-json' || lang === 'plan' || lang === 'json') {
                    try {
                      const plan: DegreePlan = JSON.parse(part.content);
                      if (!looksLikePlan(plan)) throw new Error('Invalid plan');
                      return (
                        <div className="my-2 max-w-full">
                          <PlanVisualizer plan={plan} />
                        </div>
                      );
                    } catch (e) {
                      return (
                        <div className="text-xs text-red-400">Invalid degree plan JSON</div>
                      );
                    }
                  }
                  return (
                    <CodeBlock 
                      code={part.content} 
                      language={part.language}
                      className="my-2"
                    />
                  );
                })()
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {part.content}
                  {message.isStreaming && index === parsedContent.length - 1 && (
                    <Loader2 className="inline-block w-4 h-4 ml-1 animate-spin" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Timestamp */}
        <div className={cn(
          "text-xs text-muted-foreground px-1",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};
