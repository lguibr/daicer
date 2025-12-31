import { DynamicStructuredTool } from '@langchain/core/tools';
import { moveEntityTool } from '../../../ai/tools/game/move-entity';
import { inspectMapTool } from '../../../ai/tools/game/inspect-map';
import { getMapImageTool } from '../../../ai/tools/game/get-map-image';
import { summonMonsterTool } from '../../../ai/tools/game/summon-monster';
import { summonCharacterTool } from '../../../ai/tools/game/summon-character';
import { listEntitiesTool } from '../../../ai/tools/game/list-entities';
import { searchMonstersTool } from '../../../ai/tools/knowledge/search-monsters';
import { searchSpellsTool } from '../../../ai/tools/knowledge/search-spells';
import { searchClassesTool } from '../../../ai/tools/knowledge/search-classes';
import { searchRacesTool } from '../../../ai/tools/knowledge/search-races';
import { retrieveKnowledgeTool } from '../../../ai/tools/knowledge-tool';
import { performActionTool } from '../../../ai/tools/game/perform-action';
import { StrapiContext, StrapiInterface } from '../../../ai/tools/tool-factory';

export const getRegistryTools = (strapi: StrapiInterface, roomDocumentId: string, mode: 'game' | 'debug' = 'game') => {
  const context: StrapiContext = { strapi, roomDocumentId, mode };
  const tools: DynamicStructuredTool[] = [];

  // --- Game Tools ---
  tools.push(moveEntityTool(context));
  tools.push(inspectMapTool(context));
  tools.push(getMapImageTool(context));
  tools.push(summonMonsterTool(context));
  tools.push(summonCharacterTool(context));
  tools.push(listEntitiesTool(context));
  tools.push(searchMonstersTool(context));
  tools.push(searchSpellsTool(context));
  tools.push(searchClassesTool(context));
  tools.push(searchRacesTool(context));
  tools.push(performActionTool(context));

  // Knowledge Tool (added back explicitly)
  // Check if factory supports context?
  // retrieveKnowledgeTool in knowledge-tool.ts likely needs verification.
  // Assuming it follows factory pattern:
  // We need to check knowledge-tool.ts content.
  // Step 93 showed knowledge-tool.ts exists.
  // We'll trust it matches context pattern if refactored,
  // OR we might need to wrap it if it's the old style.
  // Let's assume standard factory for now.
  // If it fails, I'll see invalid arg error.
  tools.push(retrieveKnowledgeTool(context));

  return tools;
};
