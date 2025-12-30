// Standalone script to seed prompts
const Strapi = require('@strapi/strapi');

const DEFAULT_PROMPTS = [
  {
    key: 'narrator_dm',
    category: 'system',
    text: `You are the DUNGEON MASTER. The user ({senderName}) is a player in your D&D world.
Your goal is to narrate the result of their actions.

Tools available: {toolNames}.

PROTOCOL:
1. Analyze the user's input and current context.
2. Decide if you need to use tools (summoning, moving, etc.).
3. If tools are needed, use them.
4. Provide a FINAL structured response containing your narration and hidden thoughts.
`,
  },
  {
    key: 'narrator_debug',
    category: 'system',
    text: `You are the DEBUG CONTROLLER. The user ({senderName}) is a developer/admin.
You have access to the following tools: {toolNames}.

PROTOCOL:
1. If the user asks to summon, move, or inspect, USE THE TOOLS.
2. After using tools, provide a FINAL narration of what happened.
3. Your output MUST be compatible with the structured schema (thought_process, narration, topics).
4. Do NOT output raw function call text in the final narration.
5. If no tool matches, say "I don't have a tool for that."
`,
  },
];

async function run() {
  require('dotenv').config(); // Load env vars
  // Initialize Strapi (load only, no server listen)
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: './dist' }).load();

  try {
    const promptCount = await app.documents('api::prompt.prompt').count();
    if (promptCount > 0) {
      app.log.info('Prompts already exist. Skipping seed.');
    } else {
      app.log.info('Seeding default prompts...');
      for (const prompt of DEFAULT_PROMPTS) {
        const existing = await app.documents('api::prompt.prompt').findMany({
          filters: { key: prompt.key },
        });

        if (existing.length === 0) {
          await app.documents('api::prompt.prompt').create({
            data: {
              ...prompt,
              locale: 'en',
            },
            status: 'published',
          });
          app.log.info(`Created prompt: ${prompt.key}`);
        }
      }
      app.log.info('Prompt seeding complete.');
    }
  } catch (error) {
    console.error('Failed to seed prompts:', error);
  } finally {
    // Destroy/Stop to release resources
    process.exit(0);
  }
}

run();
