/**
 * Markdown message renderer for DM narratives
 */

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownMessageProps {
  content: string;
}

const customRenderers: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold text-aurora-300 mb-3 mt-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold text-aurora-200 mb-2 mt-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-bold text-aurora-100 mb-2 mt-2">{children}</h3>,
  p: ({ children }) => <p className="text-shadow-100 mb-2 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="text-aurora-200 font-bold">{children}</strong>,
  em: ({ children }) => <em className="text-shadow-200 italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-aurora-400/70 pl-4 py-2 my-3 italic text-shadow-200 bg-midnight-700/60 rounded-r">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-shadow-100">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-shadow-100">{children}</ol>,
  li: ({ children }) => <li className="ml-2">{children}</li>,
  hr: () => <hr className="border-t-2 border-aurora-400/30 my-4" />,
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !props.node?.position;
    return !isInline && match ? (
      <code className="block bg-midnight-800 p-3 rounded my-2 text-aurora-200 font-mono text-sm overflow-x-auto">
        {children}
      </code>
    ) : (
      <code className="bg-midnight-800 px-1.5 py-0.5 rounded text-aurora-100 font-mono text-sm">{children}</code>
    );
  },
  pre: ({ children }) => <pre className="my-2">{children}</pre>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-aurora-200 hover:text-aurora-100 underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border border-midnight-600">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-midnight-700">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-midnight-600">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2 text-left text-aurora-200 font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2 text-shadow-100">{children}</td>,
};

/**
 * Render markdown with custom dark theme styling
 * @param props - Component props
 * @returns Styled markdown
 */
export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={customRenderers}>
      {content}
    </ReactMarkdown>
  );
}
