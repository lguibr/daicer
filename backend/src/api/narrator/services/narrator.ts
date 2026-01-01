/**
 * narrator service
 */

import { getGeminiModel } from '../../../utils/llm/gemini';
import { GeminiModel } from '../../../utils/llm/types';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { getRegistryTools } from './tool-registry';
import { streamManager } from '../../../utils/llm/stream-manager';
import { NarratorResponse } from './schemas';
import { createAgent, todoListMiddleware, llmToolSelectorMiddleware } from 'langchain';
import { StrapiInterface } from '../../../ai/tools/tool-factory';

const safeParseJson = (str: string) => {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};

interface NarratorInput {
  roomId: string; // DocumentID or unique ID
  input: string;
  mode?: 'debug' | 'game';
  userId?: string; // DocumentID
}

interface CharacterSheet {
  documentId: string;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  stats: Record<string, unknown>;
  currentHp: number;
  maxHp: number;
}

export default ({ strapi }: { strapi: StrapiInterface }) => ({
  async processAction({ roomId, input, mode, userId }: NarratorInput) {
    strapi.log.info(`[Narrator] Processing action in room ${roomId} (mode: ${mode})`);

    // ---------------------------------------------------------
    // 0. Resolve User & Room (Fail Fast)
    // ---------------------------------------------------------
    let senderName = 'Player';
    if (userId) {
      const user = await strapi.documents('plugin::users-permissions.user').findOne({ documentId: userId });
      if (user?.username) senderName = user.username;
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: {
        $or: [{ documentId: roomId }, { roomId: roomId }],
      },
      populate: ['character_sheets'],
    });
    const room = rooms[0];
    if (!room) throw new Error(`Room not found for ID: ${roomId}`);

    // ---------------------------------------------------------
    // 1. Persist User Message
    // ---------------------------------------------------------
    let activeTurnId = null;
    const turns = await strapi.documents('api::turn.turn').findMany({
      filters: { room: { documentId: room.documentId } },
      sort: 'turnNumber:desc',
      limit: 1,
    });
    if (turns?.[0]) activeTurnId = turns[0].documentId;

    const savedUserMessage = await strapi.documents('api::message.message').create({
      data: {
        content: input,
        senderName: senderName,
        senderType: 'player',
        room: room.documentId,
        timestamp: Date.now(),
        turn: activeTurnId,
      },
      status: 'published',
    });

    streamManager.broadcast(room.documentId, 'message:new', {
      ...savedUserMessage,
      id: savedUserMessage.documentId,
    });

    // ---------------------------------------------------------
    // 2. Setup Agent & Executor
    // ---------------------------------------------------------
    const llm = getGeminiModel(GeminiModel.PRO, { temperature: 0.4 });
    const tools = getRegistryTools(strapi, room.documentId, mode);
    const promptKey = mode === 'debug' ? 'narrator_debug' : 'narrator_dm';

    // Load Prompt - Fail silently to default if missing, but log error
    let systemPromptText = `You are the DEBUG CONTROLLER.`;
    try {
      const prompts = await strapi.documents('api::prompt.prompt').findMany({
        filters: { key: promptKey },
      });
      if (prompts.length > 0) {
        systemPromptText = prompts[0].text;
      }
    } catch (e) {
      strapi.log.error('Failed to load prompt from DB', e);
    }

    const toolNames = tools.map((t) => t.name).join(', ');
    systemPromptText = systemPromptText.replace('{senderName}', senderName).replace('{toolNames}', toolNames);

    const agent = await createAgent({
      model: llm,
      tools: tools,

      systemPrompt: systemPromptText,
      middleware: [
        todoListMiddleware(),
        llmToolSelectorMiddleware({
          model: llm,
          maxTools: 5,
        }),
      ],
    });

    // ---------------------------------------------------------
    // 3. Execution
    // ---------------------------------------------------------
    let finalNarratorResponse: NarratorResponse;
    let shouldBroadcastEntities = false;
    let outputText = '';

    try {
      const result = await agent.invoke({
        messages: [new HumanMessage(input)],
      });

      const lastMessage =
        result.messages && result.messages.length > 0 ? result.messages[result.messages.length - 1] : null;

      if (lastMessage?.content) {
        outputText =
          typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
      } else {
        outputText = 'I have completed the task.';
      }

      // --------------------------------------------------------------------------------
      // AGGRESSIVE DEBUG LOGGING [START]
      // --------------------------------------------------------------------------------
      if (result.messages) {
        for (const msg of result.messages) {
          // Log Human Input
          if (msg._getType() === 'human') {
            strapi.log.debug(`[Narrator] 🗣️ User Input: 
${JSON.stringify({ input: msg.content }, null, 2)}
----------------------------------------`);
          }

          // Log AI Steps
          if (msg._getType() === 'ai') {
            const aiMsg = msg as AIMessage;
            if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
              // Log Tool Requests
              for (const tc of aiMsg.tool_calls) {
                strapi.log.debug(`[Narrator] 🛠️ TOOL CALL REQUEST: 
${JSON.stringify(
  {
    tool: tc.name,
    args: tc.args,
    id: tc.id,
  },
  null,
  2
)}
----------------------------------------`);

                if (['summon_entity', 'move_entity'].includes(tc.name)) {
                  shouldBroadcastEntities = true;
                }
              }
            } else if (aiMsg.content) {
              // Log Thoughts
              strapi.log.debug(`[Narrator] 🤔 AI THOUGHT: 
${JSON.stringify({ thought: aiMsg.content }, null, 2)}
----------------------------------------`);
            }
          }

          // Log Tool Outputs
          if (msg._getType() === 'tool') {
            strapi.log.debug(`[Narrator] 📦 TOOL RESULT (${msg.name}): 
${JSON.stringify(
  {
    tool: msg.name,
    output: typeof msg.content === 'string' ? safeParseJson(msg.content) : msg.content,
  },
  null,
  2
)}
----------------------------------------`);
          }
        }
      }
      // --------------------------------------------------------------------------------
      // AGGRESSIVE DEBUG LOGGING [END]
      // --------------------------------------------------------------------------------

      strapi.log.debug(`[Narrator] 🧠 FINAL RESPONSE GENERATED:
${JSON.stringify(
  {
    length: outputText.length,
    shouldBroadcastEntities,
    rawOutput: outputText.slice(0, 500) + (outputText.length > 500 ? '...' : ''),
  },
  null,
  2
)}`);

      // Parse Output
      // Simple logic: Try JSON, if fail, assume text narration
      const jsonMatch = outputText.match(/```json\n([\s\S]*?)\n```/) || outputText.match(/```([\s\S]*?)```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : outputText;
      try {
        const parsed = JSON.parse(cleanJson);
        // Validate minimal structure
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && 'narration' in parsed) {
          finalNarratorResponse = parsed;
        } else {
          // Fallback for malformed JSON structure (like array or missing fields)
          finalNarratorResponse = {
            thought_process: 'Malformed Response',
            narration: typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
            topics: [],
          };
        }
      } catch {
        finalNarratorResponse = {
          thought_process: 'Unstructured Response',
          narration: outputText,
          topics: [],
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      strapi.log.error('Agent execution failed', err);
      // Fail fast behavior: Retrowing might be too harsh for a game loop, but returning an error response is clear.
      finalNarratorResponse = {
        thought_process: 'Agent Error',
        narration: `I encountered an fatal error: ${errorMessage}`,
        topics: [],
      };
    }

    // ---------------------------------------------------------
    // 4. Post-Processing
    // ---------------------------------------------------------
    if (shouldBroadcastEntities) {
      // Re-fetch character sheets directly to ensure freshness (avoid Room populate cache/lag)
      const sheets = (await strapi.documents('api::entity-sheet.entity-sheet').findMany({
        filters: { room: { documentId: room.documentId } },
      })) as unknown as CharacterSheet[];

      strapi.log.info(`[Narrator] Found ${sheets.length} entities to broadcast for room ${room.documentId}`);

      if (sheets.length > 0) {
        const entitiesUpdate = sheets.map((cs) => ({
          id: cs.documentId,
          name: cs.name,
          type: cs.type,
          position: cs.position,
          stats: cs.stats,
          currentHp: cs.currentHp,
          maxHp: cs.maxHp,
        }));

        // Snapshot
        try {
          const existingFrames =
            (await strapi.documents('api::time-frame.time-frame').findMany({
              filters: { room: { documentId: room.documentId } },
              fields: ['turnNumber'],
            })) || [];

          const nextTurnNumber = existingFrames.length + 1;

          await strapi.documents('api::time-frame.time-frame').create({
            data: {
              room: room.documentId,
              timestamp: new Date().toISOString(),
              turnNumber: nextTurnNumber,
              gameState: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                entities: entitiesUpdate as any,
                meta: {
                  source: 'tool_update',
                  narration: finalNarratorResponse.narration,
                },
              },
              status: 'published',
            },
            status: 'published',
          });
          strapi.log.info(`[Narrator] Created snapshot #${nextTurnNumber} with ${entitiesUpdate.length} entities`);
        } catch (snapErr) {
          strapi.log.error('Snapshot failed', snapErr);
        }

        streamManager.broadcast(room.documentId, 'entities:update', {
          entities: entitiesUpdate,
        });
      }
    }

    // Save AI Message
    const savedAiMessage = await strapi.documents('api::message.message').create({
      data: {
        content: finalNarratorResponse.narration,
        senderName: 'DM',
        senderType: 'dm',
        room: room.documentId,
        timestamp: Date.now(),
        turn: activeTurnId,
      },
      status: 'published',
    });

    streamManager.broadcast(room.documentId, 'message:new', {
      ...savedAiMessage,
      id: savedAiMessage.documentId,
    });

    return finalNarratorResponse;
  },
});
