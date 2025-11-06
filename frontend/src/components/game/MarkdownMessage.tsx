/**
 * Markdown message renderer for DM narratives
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownMessageProps {
  content: string;
}

/**
 * Render markdown with custom dark theme styling
 * @param props - Component props
 * @returns Styled markdown
 */
export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-cyan-400 mb-3 mt-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-cyan-300 mb-2 mt-3" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-cyan-200 mb-2 mt-2" {...props} />,
        p: ({ node, ...props }) => <p className="text-slate-100 mb-2 leading-relaxed" {...props} />,
        strong: ({ node, ...props }) => <strong className="text-cyan-300 font-bold" {...props} />,
        em: ({ node, ...props }) => <em className="text-slate-300 italic" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 my-3 italic text-slate-300 bg-slate-800/50 rounded-r" {...props} />
        ),
        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 text-slate-100" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-slate-100" {...props} />,
        li: ({ node, ...props }) => <li className="ml-2" {...props} />,
        hr: ({ node, ...props }) => <hr className="border-t-2 border-cyan-500/30 my-4" {...props} />,
        code: ({ node, inline, className, children, ...props }: any) =>
          inline ? (
            <code className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-sm" {...props}>
              {children}
            </code>
          ) : (
            <code className="block bg-slate-700 p-3 rounded my-2 text-cyan-200 font-mono text-sm overflow-x-auto" {...props}>
              {children}
            </code>
          ),
        pre: ({ node, ...props }) => <pre className="my-2" {...props} />,
        a: ({ node, ...props }) => (
          <a className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer" {...props} />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border border-slate-600" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-slate-700" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-600" {...props} />,
        tr: ({ node, ...props }) => <tr {...props} />,
        th: ({ node, ...props }) => <th className="px-4 py-2 text-left text-cyan-300 font-semibold" {...props} />,
        td: ({ node, ...props }) => <td className="px-4 py-2 text-slate-200" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

