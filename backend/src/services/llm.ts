/**
 * LLM service - re-exports from centralized llm module
 */

export { generateText, generateWithHistory } from './llm/text';
export { generateImage } from './llm/image';
export {
  streamText,
  streamWithHistory,
  streamTextTask,
  batchStreamChunks,
  collectStreamedText,
  type StreamChunk,
} from './llm/streaming';
export type { GeminiConfig } from './llm/types';
