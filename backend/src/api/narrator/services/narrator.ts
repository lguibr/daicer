/**
 * narrator service
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { createGameTools } from './tools';

import { streamManager } from '../../../utils/llm/stream-manager';

export default ({ strapi }) => ({
  async processAction({ roomId, input, mode, userId }) {
    // Determine user via userId if provided (passed from controller)
    let senderName = 'Player';
    let userDocumentId = null;

    if (userId) {
      // Attempt to fetch user to get name
      try {
        const user = await strapi.documents('plugin::users-permissions.user').findOne({ documentId: userId });
        if (user) {
          senderName = user.username || 'Player';
          userDocumentId = user.documentId;
        }
      } catch (e) {
        console.warn('Failed to fetch user for narrator action', e);
      }
    }

    // 0. Find the Room (needed for relation)
    const rooms = await strapi.documents('api::room.room').findMany({ filters: { documentId: roomId } });
    const room = rooms[0];
    if (!room) throw new Error('Room not found');

    // 1. Persist & Broadcast User Message
    const userMessageData = {
      content: input,
      senderName: senderName,
      senderType: 'player',
      room: roomId,
      timestamp: Date.now(),
      // Link to user if possible? schema has 'recipient' but not 'senderUser'.
      // Usually senderName is enough for display.
    };

    const savedUserMessage = await strapi.documents('api::message.message').create({
      data: userMessageData,
      status: 'published',
    });

    streamManager.broadcast(roomId, 'message:new', {
      ...savedUserMessage,
      id: savedUserMessage.documentId,
    });

    // 2. Initialize LLM
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // 3. Setup Tools
    const tools = createGameTools(strapi, roomId);
    // @ts-ignore
    const llmWithTools = llm.bindTools(tools);

    // 4. Construct Context
    const systemPrompt =
      mode === 'debug'
        ? `You are the DEBUG CONTROLLER. The user (${senderName}) will give you direct commands to modify the game state. Execute them precisely using the tools. Do not roleplay. Just confirm the action.`
        : `You are the DUNGEON MASTER. The user (${senderName}) is a player in your D&D world. 
         Your goal is to narrate the result of their actions.
         1. Check if the action requires a tool (e.g. moving, checking map).
         2. Call the tool if needed.
         3. Narrate the outcome based on the tool result.
         4. Be immersive but concise.`;

    const messages = [new SystemMessage(systemPrompt), new HumanMessage(input)];

    // 5. Run Agent Loop
    const response = await llmWithTools.invoke(messages);

    // 6. Handle Tool Calls
    let finalContent = response.content;

    // @ts-ignore
    if (response.tool_calls && response.tool_calls.length > 0) {
      // @ts-ignore
      for (const toolCall of response.tool_calls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (tool) {
          console.log(`[Narrator] Executing Tool: ${tool.name}`);
          const toolResult = await tool.invoke(toolCall.args);

          // Append result and ask LLM for final response
          // @ts-ignore
          messages.push(response);
          messages.push(
            new HumanMessage({
              content: `Tool ${tool.name} returned: ${toolResult}`,
            })
          );
        }
      }
      // Final generation after tools
      const finalResponse = await llm.invoke(messages);
      finalContent = finalResponse.content;
    }

    // 7. Persist & Broadcast Narrator Message
    if (typeof finalContent === 'string' && finalContent.trim().length > 0) {
      const botMessageData = {
        content: finalContent,
        senderName: 'Narrator', // Or "DM"
        senderType: 'dm',
        room: roomId,
        timestamp: Date.now(),
      };

      const savedBotMessage = await strapi.documents('api::message.message').create({
        data: botMessageData,
        status: 'published',
      });

      streamManager.broadcast(roomId, 'message:new', {
        ...savedBotMessage,
        id: savedBotMessage.documentId,
      });
    }

    return {
      message: finalContent,
      events: [],
    };
  },
});
