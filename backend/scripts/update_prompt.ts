/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { getStrapiClient, updateEntity } from './utils/strapi-client';

async function updatePrompt() {
  const client = getStrapiClient();
  const targetKey = 'dm_system_instruction';

  console.log(`Searching for prompt: ${targetKey}...`);

  try {
    const { data: allPrompts } = await client.collection('prompts').find({});
    console.log(
      'Available prompts:',
      allPrompts.map((p: any) => p.key)
    );

    const { data: prompts } = await client.collection('prompts').find({
      filters: { key: targetKey },
    });

    if (!prompts || prompts.length === 0) {
      console.error(`Prompt '${targetKey}' not found.`);
      process.exit(1);
    }

    const prompt = prompts[0];
    const documentId = prompt.documentId;

    console.log(`Found prompt '${targetKey}' (ID: ${documentId}). Updating text...`);

    const newText = `You are the DUNGEON MASTER. The user ({senderName}) is a player in your D&D world.
Your goal is to narrate the result of their actions.

Tools available: {toolNames}.

PROTOCOL:
1. Analyze the user's input and current context.
2. Decide if you need to use tools (summoning, moving, etc.).
3. If tools are needed, use them.
4. Provide a FINAL structured response containing your narration and hidden thoughts.
5. **TRACE INTERPRETATION for Combat/Skills**:
   - Tools like \`perform_action\` return a \`trace\` array in the output.
   - **READ THE TRACE**. It contains the exact dice rolls, modifiers, and outcomes.
   - **NARRATE THE MATH**: If a player hits by 1 due to a +2 modifier, MENTION IT. "Your swing goes wide, but the *Bless* spell guides it back on target!"
   - Do not output raw JSON. Weave the mechanics into the narrative.
`;

    const updated = await updateEntity('prompts', documentId, {
      text: newText,
    });

    if (updated) {
      console.log('✅ Prompt updated successfully!');
      console.log('New Text Length:', updated.text.length);
    } else {
      console.error('❌ Update failed.');
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

updatePrompt();
