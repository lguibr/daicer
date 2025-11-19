/**
 * Centralized LLM service exports
 * Single source of truth for all text and image generation
 */

// Re-export types
export * from './types';

// Re-export model factories
export { getGeminiModel, getFlashModel, getProModel, getFlashImageModel, extractErrorDetails } from './gemini';
export { getGPT51Model, getGPT5MiniModel, getGPT5NanoModel, getGPT5ProModel } from './openai';

// Re-export text generation (both direct and task-wrapped)
export {
  generateText,
  generateTextWithModel,
  generateWithHistory,
  generateTextTask,
  generateTextWithModelTask,
  generateWithHistoryTask,
} from './text';

// Re-export streaming
export { streamText, streamTextTask } from './streaming';

// Re-export image generation (both direct and task-wrapped)
export {
  generateImage,
  generateImageVariation,
  generateImageFromText,
  transformImage,
  generateImageTask,
  generateImageVariationTask,
  generateImageFromTextTask,
  transformImageTask,
} from './image';
