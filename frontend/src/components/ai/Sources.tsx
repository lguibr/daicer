import { type ReactNode } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import cn from '@/lib/utils';

interface SourcesProps {
  children: ReactNode;
  className?: string;
}

interface SourcesTriggerProps {
  count?: number;
  children?: ReactNode;
  className?: string;
}

interface SourcesContentProps {
  children: ReactNode;
  className?: string;
}

interface SourceProps {
  href: string;
  title?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Collapsible sources container
 */
export function Sources({ children, className }: SourcesProps) {
  return (
    <Collapsible.Root
      defaultOpen={false}
      className={cn('rounded-2xl border border-nebula-500/30 bg-nebula-900/10 overflow-hidden', className)}
    >
      {children}
    </Collapsible.Root>
  );
}

/**
 * Trigger button showing source count
 */
export function SourcesTrigger({ count, children, className }: SourcesTriggerProps) {
  // Extract hostname from first source if count is undefined
  const defaultContent =
    count !== undefined ? (
      <>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span className="text-sm font-semibold">
          Used {count} {count === 1 ? 'source' : 'sources'}
        </span>
      </>
    ) : null;

  return (
    <Collapsible.Trigger asChild>
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-nebula-500/5',
          className
        )}
      >
        <div className="flex items-center gap-2 text-nebula-200">{children || defaultContent}</div>

        {/* Chevron */}
        <svg
          className="h-4 w-4 text-nebula-400 transition-transform duration-200 data-[state=open]:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </Collapsible.Trigger>
  );
}

/**
 * Content container for source links
 */
export function SourcesContent({ children, className }: SourcesContentProps) {
  return (
    <Collapsible.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      <div className={cn('border-t border-nebula-500/20 bg-midnight-900/20 px-4 py-3 space-y-2', className)}>
        {children}
      </div>
    </Collapsible.Content>
  );
}

/**
 * Individual source link with icon
 */
export function Source({ href, title, children, className }: SourceProps) {
  // Extract hostname from URL
  let hostname = href;
  try {
    const url = new URL(href);
    hostname = url.hostname.replace('www.', '');
  } catch {
    // Invalid URL, use as-is
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-nebula-500/20 bg-nebula-900/20 px-3 py-2',
        'text-sm text-nebula-100 transition hover:border-nebula-500/40 hover:bg-nebula-900/30',
        className
      )}
    >
      {/* Book icon */}
      <svg
        className="h-4 w-4 flex-shrink-0 mt-0.5 text-nebula-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>

      <div className="flex-1 min-w-0">
        {children || (
          <>
            <p className="font-medium text-nebula-100 truncate">{title || hostname}</p>
            <p className="text-xs text-nebula-400 truncate">{hostname}</p>
          </>
        )}
      </div>

      {/* External link icon */}
      <svg className="h-3 w-3 flex-shrink-0 mt-1 text-nebula-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}

Sources.displayName = 'Sources';
SourcesTrigger.displayName = 'SourcesTrigger';
SourcesContent.displayName = 'SourcesContent';
Source.displayName = 'Source';
