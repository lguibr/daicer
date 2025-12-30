import { z } from 'zod';

export const ToolCallSchema = z.object({
  tool: z.string().describe('The name of the tool to call'),
  args: z.record(z.string(), z.any()).describe('The arguments for the tool'),
  reasoning: z.string().describe('Why this tool is being called'),
});

export const NarratorResponseSchema = z.object({
  thought_process: z.string().describe("Hidden reasoning for the Dungeon Master's decisions."),
  narration: z.string().describe('The public narration content to be displayed to the players.'),
  // We can include tool calls here if we want the model to return them as part of the structure,
  // OR we can rely on LangChain's bindTools depending on the strategy.
  // The user wants 'Structured Output' which implies the FINAL response is structured.
  // Tool calls might happen *before* this final response in an agent loop.
  // However, often for game DMs we want a single pass that includes 'intent' to call tools.
  // Let's stick to narration + thought_process for now, and let tools be handled by the agent loop if we use create_agent.
  // User docs say: "The structured response is returned in the 'structured_response' key of the agent's final state."
  topics: z.array(z.string()).describe('Key topics or entities mentioned in the narration.'),
});

export type NarratorResponse = z.infer<typeof NarratorResponseSchema>;
