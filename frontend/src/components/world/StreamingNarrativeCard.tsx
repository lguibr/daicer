/**
 * Streaming Narrative Card
 * Shows LLM-generated text streaming in real-time
 */

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import MarkdownMessage from '../game/MarkdownMessage';

interface StreamingNarrativeCardProps {
  title: string;
  content: string;
  isStreaming?: boolean;
  icon?: string;
}

export function StreamingNarrativeCard({
  title,
  content,
  isStreaming = false,
  icon = '📜',
}: StreamingNarrativeCardProps) {
  const [displayedContent, setDisplayedContent] = useState(content);

  // Just show content directly - SSE already streams character by character
  // No need for typewriter effect, content updates naturally from SSE
  useEffect(() => {
    setDisplayedContent(content);
  }, [content]);

  return (
    <div className="rounded-lg border border-nebula-500/40 bg-gradient-to-br from-nebula-900/30 via-midnight-900/50 to-midnight-950/70 p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-nebula-200">{title}</h4>
            {isStreaming && <Sparkles className="w-4 h-4 text-nebula-400 animate-pulse" />}
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-midnight-950/80 p-4 max-h-64 overflow-y-auto">
        <div className="text-sm text-shadow-200 leading-relaxed prose prose-invert max-w-none">
          <MarkdownMessage content={displayedContent} />
          {isStreaming && <span className="inline-block w-2 h-4 bg-nebula-400 animate-pulse ml-1" />}
        </div>
      </div>
    </div>
  );
}
