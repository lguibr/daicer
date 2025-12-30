export interface KnowledgeChunk {
  title: string;
  content: string;
  level: number;
  path: string[];
}

/**
 * Splits markdown content into chunks based on headers.
 * Each chunk includes the header and all content up to the next header of the same or higher level.
 */
export function chunkMarkdown(content: string): KnowledgeChunk[] {
  const lines = content.split('\n');
  const chunks: KnowledgeChunk[] = [];

  console.log('[MarkdownChunker] v2: STRICT H1 SPLIT MODE ACTIVE');

  let currentTitle = 'Introduction';
  let currentLevel = 0;
  let currentBuffer: string[] = [];
  const headerStack: { title: string; level: number }[] = [];

  const flushBuffer = () => {
    if (currentBuffer.length > 0) {
      // Clean up the text
      const text = currentBuffer.join('\n').trim();
      if (text) {
        // Build the full path
        const path = headerStack.map((h) => h.title);
        // If the current chunk is the header itself, the path includes it.
        // If we are flushing before a new header, the path logic holds.

        chunks.push({
          title: currentTitle,
          content: text,
          level: currentLevel,
          path: path.length > 0 ? path : [currentTitle],
        });
      }
    }
    currentBuffer = [];
  };

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1})\s+(.*)/);

    if (headerMatch) {
      flushBuffer();

      const level = headerMatch![1]!.length;
      const title = headerMatch![2]!.trim();

      // Update stack for hierarchy
      // Remove headers from stack that are deeper or same level as current
      while (headerStack.length > 0 && headerStack[headerStack.length - 1]!.level >= level) {
        headerStack.pop();
      }

      headerStack.push({ title, level });

      currentTitle = title;
      currentLevel = level;

      // We include the header in the content of the chunk for context
      currentBuffer.push(line);
    } else {
      currentBuffer.push(line);
    }
  }

  // Flush remaining content
  flushBuffer();

  return chunks;
}
