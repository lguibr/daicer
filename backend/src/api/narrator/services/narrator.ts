/**
 * narrator service
 */

import { getFlashModel } from '../../../utils/llm/gemini';
import { SystemMessage, HumanMessage, AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { getRegistryTools } from './tool-registry';
import { streamManager } from '../../../utils/llm/stream-manager';

interface NarratorInput {
  roomId: string; // DocumentID
  input: string;
  mode?: 'debug' | 'game';
  userId?: string; // DocumentID
}

interface Strapi {
  documents: (uid: string) => {
    findOne: (params: unknown) => Promise<any>;
    findMany: (params: unknown) => Promise<any[]>;
    create: (params: unknown) => Promise<any>;
    update: (params: unknown) => Promise<any>;
  };
  log: {
    info: (msg: string) => void;
    warn: (msg: string, ...args: any[]) => void;
    error: (msg: string, ...args: any[]) => void;
  };
}

export default ({ strapi }: { strapi: Strapi }) => ({
  async processAction({ roomId, input, mode, userId }: NarratorInput) {
    // Determine user via userId if provided (passed from controller)
    let senderName = 'Player';
    // let userDocumentId = null;

    if (userId) {
      // Attempt to fetch user to get name
      try {
        const user = await strapi.documents('plugin::users-permissions.user').findOne({ documentId: userId });
        if (user) {
          senderName = user.username || 'Player';
          // userDocumentId = user.documentId;
        }
      } catch (e) {
        console.warn('Failed to fetch user for narrator action', e);
      }
    }

    // 0. Find the Room (needed for relation)
    // Support both Strapi documentId and custom roomId (UUID)
    const rooms = await strapi.documents('api::room.room').findMany({
      filters: {
        $or: [
          { documentId: roomId },
          { roomId: roomId }, // Custom field
        ],
      },
    });
    const room = rooms[0];
    if (!room) throw new Error(`Room not found for ID: ${roomId}`);

    // 1. Persist & Broadcast User Message
    const userMessageData = {
      content: input,
      senderName: senderName,
      senderType: 'player',
      room: room.documentId, // Use resolved documentId
      timestamp: Date.now(),
    };

    const savedUserMessage = await strapi.documents('api::message.message').create({
      data: userMessageData,
      status: 'published',
    });

    streamManager.broadcast(room.documentId, 'message:new', {
      // Broadcast using resolved ID? Usually roomId (UUID) is used for socket rooms...
      // check stream-manager. Actually streamManager uses 'room:${roomId}' usually.
      // If roomId input is UUID, that's likely the socket room name.
      // If roomId input is documentId, that's also valid.
      // Let's stick to input roomId for broadcast if that's what the frontend joined.
      // But for DB relation, use room.documentId.
      ...savedUserMessage,
      id: savedUserMessage.documentId,
    });

    // 2. Initialize LLM
    const llm = getFlashModel();

    // 3. Setup Tools
    const tools = getRegistryTools(strapi, room.documentId, mode);
    // Explicitly bind tools. Langchain's bindTools returns a Runnable.
    const llmWithTools = llm.bindTools(tools);

    // 4. Construct Context
    const toolNames = tools.map((t) => t.name).join(', ');
    const systemPrompt =
      mode === 'debug'
        ? `You are the DEBUG CONTROLLER. The user (${senderName}) is a developer/admin.
         You have access to the following tools: ${toolNames}.
         1. If the user asks to summon, move, or inspect, USE THE TOOLS.
         2. DO NOT return raw JSON or 'functionCall' text.
         3. If you use a tool, do NOT describe the tool call structure, just output the result.
         4. If no tool matches, say "I don't have a tool for that."
         5. The 'get_current_room' tool does not exist. Do not call it.`
        : `You are the DUNGEON MASTER. The user (${senderName}) is a player in your D&D world. 
         Your goal is to narrate the result of their actions.
         Tools available: ${toolNames}.
         1. Check if the action requires a tool.
         2. Call the tool if needed.
         3. Narrate the outcome based on the tool result.`;

    const messages: BaseMessage[] = [new SystemMessage(systemPrompt), new HumanMessage(input)];

    // 5. Run Agent Loop
    const response = (await llmWithTools.invoke(messages)) as AIMessage;

    // 6. Handle Tool Calls
    let finalContent = response.content;
    const generatedImages: string[] = [];
    let shouldBroadcastEntities = false;

    strapi.log.info(`[Narrator] LLM Response Content Type: ${typeof response.content}`);
    strapi.log.info(`[Narrator] LLM Tool Calls: ${response.tool_calls?.length || 0}`);

    if (response.tool_calls && response.tool_calls.length > 0) {
      // Add the AI's response (with tool calls) to history
      messages.push(response);

      for (const toolCall of response.tool_calls) {
        const tool = tools.find((t) => t.name === toolCall.name);

        if (!tool) {
          strapi.log.warn(`[Narrator] Skipping hallucinated tool: ${toolCall.name}`);
          messages.push(
            new ToolMessage({
              content: `Tool "${toolCall.name}" does not exist. Available tools: ${toolNames}`,
              tool_call_id: toolCall.id!,
              name: toolCall.name,
            })
          );
          continue;
        }

        strapi.log.info(`[Narrator] Executing Tool: ${tool.name}`);
        let toolResultRaw;
        try {
          toolResultRaw = await tool.invoke(toolCall.args);
        } catch (e) {
          toolResultRaw = `Error executing tool: ${e.message}`;
        }

        if (tool.name === 'summon_entity' || tool.name === 'move_entity') {
          shouldBroadcastEntities = true;
        }

        let toolResultContent = typeof toolResultRaw === 'string' ? toolResultRaw : JSON.stringify(toolResultRaw);

        // Check for structured image output
        try {
          const parsed = JSON.parse(toolResultContent);
          if (parsed && parsed.type === 'image' && parsed.base64) {
            generatedImages.push(parsed.base64);
            toolResultContent = parsed.description || 'Image generated successfully.';
          }
        } catch (e) {
          // Not JSON
        }

        messages.push(
          new ToolMessage({
            content: toolResultContent,
            tool_call_id: toolCall.id!,
            name: toolCall.name,
          })
        );
      }

      // Final generation after tools
      const finalResponse = await llm.invoke(messages);
      finalContent = finalResponse.content;

      // Broadcast entities if needed
      if (shouldBroadcastEntities) {
        try {
          const updatedRoom = await strapi.documents('api::room.room').findOne({
            documentId: room.documentId,
            populate: ['character_sheets'],
          });

          if (updatedRoom && updatedRoom.character_sheets) {
            const entitiesUpdate = updatedRoom.character_sheets.map((cs: any) => ({
              id: cs.documentId,
              name: cs.name,
              type: cs.type,
              position: cs.position,
              stats: cs.stats,
              currentHp: cs.currentHp,
              maxHp: cs.maxHp,
            }));

            try {
              // DEBUG: Write to a file to verify execution and data
              const fs = await import('fs');
              const path = await import('path');
              const logPath = path.join(process.cwd(), 'debug_narrator_broadcast.log');

              const logMsg = `
[${new Date().toISOString()}] Broadcasting to room ${updatedRoom.roomId} (docId: ${updatedRoom.documentId})
Entities Count: ${entitiesUpdate.length}
Payload Start: ${JSON.stringify(entitiesUpdate[0] || {})}
------------------------------------------------------------------
`;
              fs.appendFileSync(logPath, logMsg);
            } catch (err) {
              console.error('Failed to write debug log', err);
            }

            strapi.log.info(
              `[Narrator] Broadcasting entities:update to room ${updatedRoom.roomId} (docId: ${updatedRoom.documentId})`
            );
            strapi.log.info(`[Narrator] Entities count: ${entitiesUpdate.length}`);
            strapi.log.info(`[Narrator] Payload sample: ${JSON.stringify(entitiesUpdate[0] || {})}`);

            streamManager.broadcast(updatedRoom.roomId, 'entities:update', {
              entities: entitiesUpdate,
            });
          }
        } catch (err) {
          strapi.log.error('Failed to broadcast entities update after tool use', err);
        }
      }
    }

    return {
      message: typeof finalContent === 'string' ? finalContent : JSON.stringify(finalContent),
      events: [],
    };
  },
});
