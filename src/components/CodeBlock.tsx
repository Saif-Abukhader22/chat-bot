import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

// Import Prism.js for syntax highlighting
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock = ({ code, language = 'javascript', className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // Dynamically import language components if needed
        if (language && !Prism.languages[language]) {
          switch (language) {
            case 'typescript':
              await import('prismjs/components/prism-typescript');
              break;
            case 'python':
              await import('prismjs/components/prism-python');
              break;
            case 'java':
              await import('prismjs/components/prism-java');
              break;
            case 'json':
              await import('prismjs/components/prism-json');
              break;
            case 'css':
              await import('prismjs/components/prism-css');
              break;
            case 'html':
              await import('prismjs/components/prism-markup');
              break;
            case 'bash':
              await import('prismjs/components/prism-bash');
              break;
            default:
              break;
          }
        }

        const highlighted = Prism.highlight(
          code, 
          Prism.languages[language] || Prism.languages.javascript, 
          language
        );
        setHighlightedCode(highlighted);
      } catch (error) {
        setHighlightedCode(code);
      }
    };

    loadLanguage();
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className={cn(
      "relative rounded-lg bg-code-block border border-border overflow-hidden",
      className
    )}>
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
        <span className="text-sm font-mono text-muted-foreground">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
};