import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import cn from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface CodeBlockCopyButtonProps {
  code: string;
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
  className?: string;
}

/**
 * Copy button with success feedback
 */
function CodeBlockCopyButtonComponent({ code, onCopy, onError, timeout = 2000, className }: CodeBlockCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();

      setTimeout(() => {
        setCopied(false);
      }, timeout);
    } catch (error) {
      console.error('Failed to copy code:', error);
      onError?.(error as Error);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      size="sm"
      variant="ghost"
      className={cn(
        'h-8 px-3 bg-midnight-700/80 hover:bg-midnight-600/80 backdrop-blur-sm',
        copied && 'bg-emerald-900/50 hover:bg-emerald-900/50',
        className
      )}
      title={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? (
        <>
          <svg className="mr-1.5 h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-emerald-300">Copied!</span>
        </>
      ) : (
        <>
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">Copy</span>
        </>
      )}
    </Button>
  );
}

const CodeBlockCopyButton = CodeBlockCopyButtonComponent;
CodeBlockCopyButtonComponent.displayName = 'CodeBlockCopyButton';

/**
 * Syntax-highlighted code block with copy functionality
 * Uses Prism for highlighting with oneDark theme
 */
export function CodeBlock({ code, language = 'text', showLineNumbers = false, className, children }: CodeBlockProps) {
  return (
    <div
      className={cn(
        'group relative my-4 overflow-hidden rounded-2xl border border-midnight-600/60 bg-midnight-900',
        className
      )}
    >
      {/* Language badge */}
      {language && language !== 'text' && (
        <div className="flex items-center justify-between border-b border-midnight-600/40 bg-midnight-800/80 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-aurora-300">{language}</span>
          {children}
        </div>
      )}

      {/* Code content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Copy button appears on hover if no children */}
      {!children && (
        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
          <CodeBlockCopyButton code={code} />
        </div>
      )}
    </div>
  );
}

CodeBlock.displayName = 'CodeBlock';

export { CodeBlockCopyButton };
