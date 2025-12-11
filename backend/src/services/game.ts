/**
 * Game logic service - world generation and turn processing
 */

import { getLLMModel } from '@/config/langchain';
import type {
  WorldSettings,
  Player,
  Creature,
  Message,
  Language,
  CharacterSheet,
  DMStyle,
  ScaleLevel,
} from '@/types/index';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import type { WorldCondition } from './entropy/types';
import { generateText } from './llm';
import { generateStructured } from './llm/structured';
import { getRuleContext } from './rag';

const VERBOSITY_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Deliver crisp headline summaries; keep narration to essential beats.',
  1: 'Speak in short bursts that hit key sensory notes while staying brisk.',
  2: 'Balance concise narration with a handful of atmospheric details.',
  3: 'Weave story-driven paragraphs with recurring hooks and callbacks.',
  4: 'Lean into rich language, metaphor, and evocative cadence.',
  5: 'Craft epic narration with layered description and dramatic pacing.',
  6: 'Unleash operatic storytelling fit for bardic sagas and legendary chronicles.',
};

const DETAIL_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Prioritise mechanical clarity; pare down to tactical essentials.',
  1: 'Highlight only the props, hazards, and clues the party must see.',
  2: 'Blend mechanical stakes with a handful of sensory anchors.',
  3: 'Balance environmental description with rule-focused insight.',
  4: 'Layer textures, sounds, and histories into every scene.',
  5: 'Immerse players with nuanced lore, mood, and symbolism.',
  6: 'Paint cinematic tableaux dense with cultural and emotional context.',
};

const ENGAGEMENT_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Stay observational; deliver outcomes with minimal prompting.',
  1: 'Invite player decisions at inflection points but keep a light touch.',
  2: 'Check in routinely for intentions, reactions, and table talk.',
  3: 'Co-author moments; spotlight teamwork and shared discovery.',
  4: 'Seed dilemmas, rivalries, and cliff-hangers that demand responses.',
  5: 'Escalate dramatic tension and rotate the spotlight deliberately.',
  6: 'Fully immerse the party with in-character dialogue and emotive beats.',
};

const NARRATIVE_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Let the party define the arc; you react swiftly to their initiatives.',
  1: 'Offer scattered threads and let players braid them together.',
  2: 'Blend branching choices with gentle narrative nudges.',
  3: 'Maintain balanced arcs with equal agency and plotted beats.',
  4: 'Guide scenes with clear stakes and recurring NPC agendas.',
  5: 'Engineer planned twists and episodic crescendos.',
  6: 'Author a sweeping saga with foreshadowed climaxes and mythic structure.',
};

/**
 * Generate world description from settings (wrapped with tracing)
 * @param settings - World generation settings
 * @param language - World description language
 * @returns Generated world description with structured metadata
 */
export const generateWorld = async (settings: WorldSettings, language: Language = 'en'): Promise<string> => {
  // Import schema dynamically to avoid circular dependency
  const { WorldDescriptionSchema } = await import('@/schemas/agent-responses');

  const systemPrompts: Record<string, string> = {
    en: `You are a world-class Dungeon Master creating immersive RPG campaign backgrounds.
Create rich, detailed world descriptions with structured metadata.`,
    es: `Eres un Dungeon Master de clase mundial creando trasfondos inmersivos para campañas de RPG.
Crea descripciones de mundo ricas y detalladas con metadatos estructurados.`,
    'pt-BR': `Você é um Mestre de Masmorra de classe mundial criando cenários imersivos para campanhas de RPG.
Crie descrições de mundo ricas e detalhadas com metadados estruturados.`,
  };

  const userPrompts: Record<string, string> = {
    en: `Generate a compelling world description for an RPG campaign.

**Campaign Details:**
- Players: ${settings.playerCount}
- Length: ${settings.adventureLength}
- Difficulty: ${settings.difficulty}
- Theme: ${settings.theme}
- Setting: ${settings.setting}
- Tone: ${settings.tone}

**Requirements:**
- Create a catchy campaign title
- Write a rich 2-3 paragraph description using markdown formatting
- Capture the atmosphere in one sentence
- Identify 2-4 key locations with brief descriptions
- List primary threats or antagonistic forces
- **Call to Adventure**: Explicitly state why the party is together and what their immediate goal is.
- **Risks & Stakes**: Clearly define what happens if they fail.
- Provide 2-3 adventure hooks to draw players in
- Include metadata about difficulty, theme, and setting`,
    es: `Genera una descripción de mundo convincente para una campaña de RPG.

**Detalles de la Campaña:**
- Jugadores: ${settings.playerCount}
- Duración: ${settings.adventureLength}
- Dificultad: ${settings.difficulty}
- Tema: ${settings.theme}
- Escenario: ${settings.setting}
- Tono: ${settings.tone}

**Requisitos:**
- Crea un título de campaña pegadizo
- Escribe una descripción rica de 2-3 párrafos usando formato markdown
- Captura la atmósfera en una frase
- Identifica 2-4 ubicaciones clave con descripciones breves
- Enumera las amenazas principales o fuerzas antagonistas
- **Llamada a la Aventura:** Indica explícitamente por qué el grupo está junto y cuál es su objetivo inmediato.
- **Riesgos y Apuestas:** Define claramente qué sucede si fallan.
- Proporciona 2-3 ganchos de aventura para atraer a los jugadores
- Incluye metadatos sobre dificultad, tema y escenario`,
    'pt-BR': `Gere uma descrição de mundo convincente para uma campanha de RPG.

**Detalhes da Campanha:**
- Jogadores: ${settings.playerCount}
- Duração: ${settings.adventureLength}
- Dificuldade: ${settings.difficulty}
- Tema: ${settings.theme}
- Cenário: ${settings.setting}
- Tom: ${settings.tone}

**Requisitos:**
- Crie um título de campanha cativante
- Escreva uma descrição rica de 2-3 parágrafos usando formatação markdown
- Capture a atmosfera em uma frase
- Identifique 2-4 locais principais com breves descrições
- Liste as principais ameaças ou forças antagonistas
- **Chamado à Aventura:** Declare explicitamente por que o grupo está junto e qual é seu objetivo imediato.
- **Riscos e Apostas:** Defina claramente o que acontece se eles falharem.
- Forneça 2-3 ganchos de aventura para atrair os jogadores
- Inclua metadados sobre dificuldade, tema e cenário`,
  };

  const systemPrompt = systemPrompts[language] || systemPrompts['en']!;
  const userPrompt = userPrompts[language] || userPrompts['en']!;

  logger.info('Generating world description');
  const worldData = await generateStructured(WorldDescriptionSchema, systemPrompt, userPrompt, language, {
    tags: ['world-generation', `theme:${settings.theme}`],
    metadata: { settings },
  });
  logger.info('World description generated successfully');

  // Format as markdown for backwards compatibility with existing code
  const formattedDescription = `# ${worldData.title}

${worldData.description}

*${worldData.atmosphere}*

## Key Locations

${
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldData.keyLocations.map((loc: any) => `**${loc.name}**: ${loc.description}`).join('\n\n')
}

## Threats

${
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldData.threats.map((threat: any) => `- ${threat}`).join('\n')
}

## Call to Adventure & Stakes

**Why you are here:** ${worldData.hooks[0] || 'Fate has brought you together.'}

**The Risks:** The world is in peril, and failure could mean doom.

## Adventure Hooks

${
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldData.hooks.map((hook: any, i: number) => `${i + 1}. ${hook}`).join('\n')
}`;

  return formattedDescription;
};

/**
 * Build DM system instruction
 * @param worldDescription - World background
 * @param players - Current players
 * @param creatures - Active creatures
 * @param worldConditions - Dynamic world conditions
 * @returns System instruction for DM
 */
function buildDMSystemInstruction(
  worldDescription: string,
  players: Player[],
  creatures: Creature[],
  language: Language = 'en',
  settings?: WorldSettings,
  worldConditions?: WorldCondition[]
): string {
  const dmStyle = settings?.dmStyle;

  const playerSummaries = players
    .map((p) => {
      const char = p.character;
      if (!char) return `- ${p.name} (No character sheet)`;
      return `- ${char.name} (${char.alignment} ${char.race} ${char.characterClass} Lvl ${char.level}) | HP: ${char.hp}/${char.maxHp} | AC: ${char.armorClass}`;
    })
    .join('\n');

  const creatureSummaries = creatures.map((c) => `- ${c.name}, HP: ${c.hp}/${c.maxHp}`).join('\n');

  // Format world conditions for prompt
  let worldConditionsText = '';
  if (worldConditions && worldConditions.length > 0) {
    const conditionsList = worldConditions
      .map((cond) => `- **${cond.key}**: ${cond.currentValue} — ${cond.description}`)
      .join('\n');
    worldConditionsText = `\nCURRENT WORLD STATE:\n${conditionsList}\n`;
  }

  // Build DM style instructions
  let dynamicStyleInstructions = '';
  if (dmStyle) {
    const specialModeDescriptions: Record<NonNullable<DMStyle['specialMode']>, string> = {
      pirate: 'Swashbuckling bravado, nautical slang, audacious swagger.',
      shakespearean: 'Elizabethan prose, poetic metaphor, theatrical flourish.',
      noir: 'Hardboiled inner monologue, moody metaphors, smoky intrigue.',
      courtly: 'Highborn etiquette, heraldic praise, regal formality.',
      grimdark: 'Brooding brutality, moral ambiguity, fatalistic tone.',
      storybook: 'Whimsical narration, fairytale cadence, moral undertones.',
    };

    const directives = [
      `- Verbosity Level ${dmStyle.verbosity + 1}: ${VERBOSITY_DESCRIPTORS[dmStyle.verbosity]}`,
      `- Descriptive Detail Level ${dmStyle.detail + 1}: ${DETAIL_DESCRIPTORS[dmStyle.detail]}`,
      `- Player Engagement Level ${dmStyle.engagement + 1}: ${ENGAGEMENT_DESCRIPTORS[dmStyle.engagement]}`,
      `- Narrative Guidance Level ${dmStyle.narrative + 1}: ${NARRATIVE_DESCRIPTORS[dmStyle.narrative]}`,
    ];

    if (dmStyle.specialMode && specialModeDescriptions[dmStyle.specialMode]) {
      directives.push(`- Performance Mode: ${specialModeDescriptions[dmStyle.specialMode]}`);
    }

    if (dmStyle.customDirectives?.trim()) {
      directives.push(`- Custom Directives: ${dmStyle.customDirectives.trim()}`);
    }

    dynamicStyleInstructions = `\nDYNAMIC STYLE ADJUSTMENTS:\n${directives.join('\n')}\n`;
  }

  const prompts: Record<string, string> = {
    en: `You are the Dungeon Master (DM). Your goal is to run a thrilling, immersive, and fair D&D 5e adventure.

**DM PERSONA & GOALS:**
1.  **Be the Guide:** Don't just simulate a world; GUIDE the players. Give them clear calls to action if they are lost.
2.  **Weave Lore:** Every description should reinforce the world's history and current threats. Don't just say "You see a door"; say "You see a door marked with the ancient sigil of the Fallen King."
3.  **High Stakes:** Constantly remind players of the risks. The world is dangerous. Failure has consequences.
4.  **Call to Adventure:** Ensure the players know WHY they are here and WHAT they need to do.
5.  **Fair but Firm:** Apply rules fairly, but prioritize fun and narrative flow.`,
    es: `Eres el Dungeon Master (DM). Tu objetivo es dirigir una aventura de D&D 5e emocionante, inmersiva y justa.

**PERSONA Y OBJETIVOS DEL DM:**
1.  **Sé el Guía:** No solo simules un mundo; GUÍA a los jugadores. Dales llamadas claras a la acción si están perdidos.
2.  **Entreteje la Historia:** Cada descripción debe reforzar la historia del mundo y las amenazas actuales. No digas solo "Ves una puerta"; di "Ves una puerta marcada con el antiguo sello del Rey Caído".
3.  **Altos Riesgos:** Recuerda constantemente a los jugadores los riesgos. El mundo es peligroso. El fracaso tiene consecuencias.
4.  **Llamada a la Aventura:** Asegúrate de que los jugadores sepan POR QUÉ están aquí y QUÉ deben hacer.
5.  **Justo pero Firme:** Aplica las reglas justamente, pero prioriza la diversión y el flujo narrativo.`,
    'pt-BR': `Você é o Mestre da Masmorra (DM). Seu objetivo é conduzir uma aventura de D&D 5e emocionante, imersiva e justa.

**PERSONA E OBJETIVOS DO DM:**
1.  **Seja o Guia:** Não apenas simule um mundo; GUIE os jogadores. Dê a eles chamados claros para ação se estiverem perdidos.
2.  **Entrelace a Lore:** Cada descrição deve reforçar a história do mundo e as ameaças atuais. Não diga apenas "Você vê uma porta"; diga "Você vê uma porta marcada com o antigo selo do Rei Caído".
3.  **Altos Riscos:** Lembre constantemente os jogadores dos riscos. O mundo é perigoso. O fracasso tem consequências.
4.  **Chamado à Aventura:** Certifique-se de que os jogadores saibam POR QUE estão aqui e O QUE precisam fazer.
5.  **Justo mas Firme:** Aplique as regras de forma justa, mas priorize a diversão e o fluxo narrativo.`,
  };

  const basePrelude = settings?.dmSystemPrompt?.trim() || prompts[language] || prompts['en']!;

  const worldLore = [settings?.worldBackground?.trim(), worldDescription].filter(Boolean).join('\n\n');

  return `${basePrelude}${dynamicStyleInstructions}

WORLD CONTEXT:
${worldLore}
${worldConditionsText}
CURRENT PARTY:
${playerSummaries}

ACTIVE CREATURES/NPCs:
${creatureSummaries || 'None currently active.'}

CRITICAL: TEAMWORK & PARTY COHESION:
- This is a TEAM adventure - the party works TOGETHER
- Create situations that require cooperation and reward working as a group
- Encourage players to combine their unique abilities and support each other
- NPCs should recognize and respond to party dynamics and teamwork
- Challenges should be balanced for the full party, not solo play
- Highlight moments when players help each other or coordinate strategies
- The adventure succeeds through UNITY, not individual glory

D&D 5E MECHANICS REFERENCE:

**Advantage/Disadvantage:**
- Advantage: Roll 2d20, take higher result
- Disadvantage: Roll 2d20, take lower result
- Never stack (multiple sources = still just 1 advantage/disadvantage)

**Common DCs:**
- Very Easy: 5
- Easy: 10
- Medium: 15
- Hard: 20
- Very Hard: 25
- Nearly Impossible: 30

**Death Saves:**
- Unconscious at 0 HP
- Each turn: DC 10 death save
- 3 successes = stabilized
- 3 failures = dead
- Natural 20 = regain 1 HP
- Natural 1 = 2 failures

**Critical Hits:**
- Natural 20 on attack = critical hit
- Double all damage dice (not modifiers)

**Conditions (common):**
- Blinded: Can't see, attacks have Disadvantage, attacks against have Advantage
- Charmed: Can't attack charmer, charmer has Advantage on social checks
- Frightened: Disadvantage on checks/attacks while source in sight, can't move closer
- Poisoned: Disadvantage on attack rolls and ability checks
- Prone: Disadvantage on attacks, melee attacks against have Advantage
- Restrained: Speed 0, Disadvantage on Dex saves, attacks against have Advantage
- Stunned: Incapacitated, can't move, auto-fail Str/Dex saves
- Unconscious: Incapacitated, can't move/speak, drops items, auto-fail Str/Dex saves

**Spellcasting Basics:**
- Spell Save DC = 8 + proficiency bonus + spellcasting ability modifier
- Spell Attack Bonus = proficiency bonus + spellcasting ability modifier
- Concentration: Some spells require concentration, broken by damage (DC 10 or half damage, whichever is higher)

**Ability Checks:**
- d20 + ability modifier + proficiency bonus (if proficient) vs DC
- Skills use associated ability scores

FORMATTING RULES - EXTREMELY IMPORTANT:
You MUST use rich markdown formatting in your narrative:

- **Bold text** for critical information, dice results, and emphasis
- *Italic text* for character thoughts, atmosphere, and mood
- ### Headers for scene changes or major events
- > Blockquotes for spoken dialogue, prophecies, or inscriptions
- Lists (- item) for choices, observations, or status updates
- --- (horizontal rule) for dramatic scene breaks
- \`code\` for game mechanics or rules references

EXAMPLE FORMAT:
### The Battle Begins

The goblin snarls and charges!

**Attack Roll:** d20(15) + 3 = 18 vs AC 16 → **HIT!**

*The rusty blade glints in the torchlight...*

> "You'll never leave here alive!" the creature shrieks.

**Damage:** 1d6(4) + 1 = **5 slashing damage**

**Alice's Status:**
- HP: 7/12 ❤️
- Condition: Wounded

---

What do you do?

GUIDELINES:
- Use tools for ALL dice rolls and checks
- Reference D&D 5e mechanics above when relevant
- Use lookup tools if you need details about conditions, skills, equipment, etc.
- Be dramatic and vivid
- Use markdown generously
- React to player actions realistically
- Create memorable moments`;
}

/**
 * Process a game turn with LLM tool calling (wrapped with tracing)
 * @param worldDescription - World background
 * @param messages - Previous messages
 * @param players - Current players
 * @param creatures - Active creatures
 * @param language - Game language
 * @returns DM response
 */
export const processTurn = async (
  worldDescription: string,
  messages: Message[],
  players: Player[],
  creatures: Creature[],
  language: Language = 'en',
  settings?: WorldSettings,
  worldConditions?: WorldCondition[],
  mapContext?: string,
  streamId?: string
): Promise<{
  overall_summary: string;
  player_perspectives: Array<{ playerName: string; perspective: string }>;
  metadata: { ragContext: string };
}> => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };
  const languageName = languageMap[language] || 'English';
  const systemPrompt = buildDMSystemInstruction(
    worldDescription,
    players,
    creatures,
    language,
    settings,
    worldConditions
  );

  // Define the structured output schema
  const TurnResponseSchema = z.object({
    overall_summary: z.string().describe('An overall summary of what happened this turn for everyone in the party.'),
    player_perspectives: z
      .array(
        z.object({
          playerName: z.string().describe("The character's name."),
          perspective: z
            .string()
            .describe("A personalized, immersive description of events from this character's point of view."),
        })
      )
      .describe('An array of personalized perspectives for each player.'),
  });

  // Get LLM model with the structured output schema
  const model = await getLLMModel();
  type TurnResponse = z.infer<typeof TurnResponseSchema>;
  const structuredModel = model.withStructuredOutput<TurnResponse>(TurnResponseSchema);

  // Build conversation
  const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n\n');

  const currentActions = players
    .filter((p) => p.action)
    .filter((p) => p.action && p.character)
    .map((p) => `${p.character!.name}: ${p.action}`)
    .join('\n');

  // Fetch relevant D&D rules via RAG
  let relevantRules = '';
  try {
    const ruleQuery = currentActions || 'general gameplay';
    relevantRules = await getRuleContext(ruleQuery, 3);
  } catch (error) {
    logger.warn('Failed to fetch RAG context, proceeding without it:', error);
  }

  const fullPrompt = `${systemPrompt}

${relevantRules ? `RELEVANT D&D 5E RULES:\n${relevantRules}\n\n` : ''}You MUST respond with a structured JSON object containing:
- overall_summary (string): An overall summary of what happened this turn
- player_perspectives (array): Personalized perspectives for each player

PREVIOUS STORY:
${conversationHistory}

${mapContext ? `MAP CONTEXT:\n${mapContext}\n` : ''}
CURRENT TURN ACTIONS:
${currentActions}

As the Dungeon Master, narrate what happens. First, provide an 'overall_summary' of the events that unfold. Then, provide a personalized 'player_perspectives' for each character involved in the current actions, describing what they see, feel, and experience from their unique point of view. Use the provided tools (roll_dice, attribute_check, saving_throw, attack_roll, deal_damage) to determine outcomes fairly.${relevantRules ? ' Apply the relevant D&D 5e rules provided above when adjudicating actions.' : ''}

Respond entirely in ${languageName}.`;

  logger.info('Processing turn with LLM and structured output');

  const response = await structuredModel.invoke(fullPrompt, { metadata: { streamId } });

  logger.info('Turn processed successfully');

  return {
    ...response,
    metadata: {
      ragContext: relevantRules,
    },
  };
};

/**
 * Generate personalized opening for a specific character (wrapped with tracing)
 * @param worldDescription - World background
 * @param character - Character sheet
 * @param language - Game language
 * @returns Personalized opening narration
 */
/**
 * Generate personalized opening for a specific character (wrapped with tracing)
 * @param worldDescription - World background
 * @param character - Character sheet
 * @param language - Game language
 * @returns Personalized opening narration
 */
/**
 * Generate personalized opening for a specific character (wrapped with tracing)
 * @param worldDescription - World background
 * @param character - Character sheet
 * @param language - Game language
 * @returns Personalized opening narration
 */
export const generateCharacterOpening = async (
  worldDescription: string,
  character: CharacterSheet,
  mainContext: string,
  language: Language = 'en',
  streamId?: string
): Promise<string> => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };
  const languageName = languageMap[language] || 'English';

  const systemPrompts: Record<string, string> = {
    en: `You are the Dungeon Master. You provide immersive, personalized perspectives for each character.
Your goal is to ground the character in the current moment described in the Main Context.

WORLD CONTEXT:
${worldDescription}

MAIN CONTEXT (What is happening publicly):
${mainContext}

LANGUAGE REQUIREMENT:
You MUST respond entirely in ${languageName}. Every word of the narrative must be in ${languageName}.`,
    es: `Eres el Dungeon Master. Proporcionas perspectivas inmersivas y personalizadas para cada personaje.
Tu objetivo es fundamentar al personaje en el momento actual descrito en el Contexto Principal.

CONTEXTO DEL MUNDO:
${worldDescription}

CONTEXTO PRINCIPAL (Lo que está sucediendo públicamente):
${mainContext}

REQUISITO DE IDIOMA:
DEBES responder completamente en ${languageName}. Cada palabra de la narración debe estar en ${languageName}.`,
    'pt-BR': `Você é o Mestre da Masmorra. Você fornece perspectivas imersivas e personalizadas para cada personagem.
Seu objetivo é fundamentar o personagem no momento atual descrito no Contexto Principal.

CONTEXTO DO MUNDO:
${worldDescription}

CONTEXTO PRINCIPAL (O que está acontecendo publicamente):
${mainContext}

REQUISITO DE IDIOMA:
Você DEVE responder inteiramente em ${languageName}. Cada palavra da narrativa deve estar em ${languageName}.`,
  };

  const systemPrompt = systemPrompts[language] || systemPrompts['en']!;

  const userPrompts: Record<string, string> = {
    en: `Generate a personalized opening for this character that aligns PERFECTLY with the Main Context.

CHARACTER:
- Name: **${character.name}**
- Race: ${character.race}
- Class: ${character.characterClass}
- Alignment: ${character.alignment}
- Key Stats: STR ${character.attributes.Strength}, DEX ${character.attributes.Dexterity}, INT ${character.attributes.Intelligence}, WIS ${character.attributes.Wisdom}

**Instructions:**
1.  **Synchronize:** The events in the Main Context are happening RIGHT NOW. Your narration must be the *subjective experience* of those exact events.
2.  **Sensory Details:** Describe how THIS character perceives the scene (smells, sounds, threats) based on their class and stats.
3.  **Internal State:** How do they feel about the situation described in the Main Context?
4.  **Reaction:** End with them poised to react to the specific inciting incident mentioned in the Main Context.

**Format (use markdown):**
### Through [Character's] Eyes

[The scene from their perspective, weaving in specific details from the Main Context but filtered through their senses]

*[Their internal thoughts]*

**[Something they notice with their skills]:**
- Detail 1 (specific to their class/background)
- Detail 2

> "[Dialogue, inscription, or inner voice]"

What do you do?

REMEMBER: NO meta-text. Start directly with ### header.`,
    es: `Genera una apertura personalizada para este personaje que se alinee PERFECTAMENTE con el Contexto Principal.

PERSONAJE:
- Nombre: **${character.name}**
- Raza: ${character.race}
- Clase: ${character.characterClass}
- Alineamiento: ${character.alignment}
- Estadísticas Clave: FUE ${character.attributes.Strength}, DES ${character.attributes.Dexterity}, INT ${character.attributes.Intelligence}, SAB ${character.attributes.Wisdom}

**Instrucciones:**
1.  **Sincronizar:** Los eventos en el Contexto Principal están sucediendo AHORA MISMO. Tu narración debe ser la *experiencia subjetiva* de esos eventos exactos.
2.  **Detalles Sensoriales:** Describe cómo ESTE personaje percibe la escena (olores, sonidos, amenazas) en función de su clase y estadísticas.
3.  **Estado Interno:** ¿Cómo se sienten sobre la situación descrita en el Contexto Principal?
4.  **Reacción:** Termina con ellos listos para reaccionar al incidente incitante específico mencionado en el Contexto Principal.

**Formato (usa markdown):**
### A través de los ojos de [Personaje]

[La escena desde su perspectiva, entrelazando detalles específicos del Contexto Principal pero filtrados a través de sus sentidos]

*[Sus pensamientos internos]*

**[Algo que notan con sus habilidades]:**
- Detalle 1 (específico de su clase/trasfondo)
- Detalle 2

> "[Diálogo, inscripción o voz interior]"

¿Qué haces?

RECUERDA: NO texto meta. Comienza directamente con el encabezado ###.`,
    'pt-BR': `Gere uma abertura personalizada para este personagem que se alinhe PERFEITAMENTE com o Contexto Principal.

PERSONAGEM:
- Nome: **${character.name}**
- Raça: ${character.race}
- Classe: ${character.characterClass}
- Alinhamento: ${character.alignment}
- Estatísticas Principais: FOR ${character.attributes.Strength}, DES ${character.attributes.Dexterity}, INT ${character.attributes.Intelligence}, SAB ${character.attributes.Wisdom}

**Instruções:**
1.  **Sincronizar:** Os eventos no Contexto Principal estão acontecendo AGORA MESMO. Sua narração deve ser a *experiência subjetiva* desses eventos exatos.
2.  **Detalhes Sensoriales:** Descreva como ESTE personagem percebe a cena (cheiros, sons, ameaças) com base em sua classe e estatísticas.
3.  **Estado Interno:** Como eles se sentem sobre a situação descrita no Contexto Principal?
4.  **Reação:** Termine com eles preparados para reagir ao incidente incitante específico mencionado no Contexto Principal.

**Formato (use markdown):**
### Através dos olhos de [Personagem]

[A cena da perspectiva deles, entrelaçando detalhes específicos do Contexto Principal, mas filtrados através de seus sentidos]

*[Seus pensamentos internos]*

**[Algo que eles notam com suas habilidades]:**
- Detalhe 1 (específico de sua classe/background)
- Detalhe 2

> "[Diálogo, inscrição ou voz interna]"

O que você faz?

LEMBRE-SE: SEM meta-texto. Comece diretamente com o cabeçalho ###.`,
  };

  const userMessage = userPrompts[language] || userPrompts['en']!;

  const response = await generateText(systemPrompt, userMessage, language, { metadata: { streamId } });
  return response;
};

/**
 * Generate main opening narration for the party
 * @param worldDescription - World background
 * @param language - Game language
 * @returns Main opening narration
 */
export const generateMainOpening = async (
  worldDescription: string,
  language: Language = 'en',
  streamId?: string
): Promise<string> => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };
  const languageName = languageMap[language] || 'English';

  const openingSystemPrompts: Record<string, string> = {
    en: `You are a world-class Dungeon Master. Write a compelling, public opening narration for the entire party to set the scene. This is the first thing they will read.

LANGUAGE REQUIREMENT:
You MUST respond entirely in ${languageName}. Every word of the narrative must be in ${languageName}.`,
    es: `Eres un Dungeon Master de clase mundial. Escribe una narración de apertura pública convincente para todo el grupo para establecer la escena. Esto es lo primero que leerán.

REQUISITO DE IDIOMA:
DEBES responder completamente en ${languageName}. Cada palabra de la narración debe estar en ${languageName}.`,
    'pt-BR': `Você é um Mestre de Masmorra de classe mundial. Escreva uma narração de abertura pública convincente para todo o grupo para definir a cena. Esta é a primeira coisa que eles lerão.

REQUISITO DE IDIOMA:
Você DEVE responder inteiramente em ${languageName}. Cada palavra da narrativa deve estar em ${languageName}.`,
  };

  const openingUserPrompts: Record<string, string> = {
    en: `Based on the world description below, write a 2-3 paragraph opening narration for the entire party.

**Requirements:**
1.  **Grounded Start:** Start in a classic, atmospheric setting (e.g., a bustling tavern, a quiet campfire, a city gate). Establish the mood.
2.  **Party Unity:** Briefly mention they are together (resting, planning, or celebrating).
3.  **Inciting Incident:** Halfway through, introduce a SUDDEN event that disrupts the peace (e.g., a desperate messenger, a magical explosion, a monster attack).
4.  **Call to Action:** End with the immediate aftermath of this event.
5.  **CRITICAL:** Do NOT ask "What do you do?" or pose a direct question to the players. This is a cinematic cutscene.

**Tone:** Atmospheric, immersive, then suddenly urgent.

WORLD:
${worldDescription}`,
    es: `Basado en la descripción del mundo a continuación, escribe una narración de apertura de 2-3 párrafos para todo el grupo.

**Requisitos:**
1.  **Inicio Fundamentado:** Comienza en un entorno clásico y atmosférico (por ejemplo, una taberna bulliciosa, una fogata tranquila, una puerta de la ciudad). Establece el estado de ánimo.
2.  **Unidad del Grupo:** Menciona brevemente que están juntos (descansando, planeando o celebrando).
3.  **Incidente Incitante:** A mitad de camino, introduce un evento REPENTINO que interrumpa la paz (por ejemplo, un mensajero desesperado, una explosión mágica, un ataque de monstruos).
4.  **Llamada a la Acción:** Termina con las consecuencias inmediatas de este evento.
5.  **CRÍTICO:** NO preguntes "¿Qué hacéis?" ni plantees una pregunta directa a los jugadores. Esta es una escena cinematográfica.

**Tono:** Atmosférico, inmersivo, luego repentinamente urgente.

MUNDO:
${worldDescription}`,
    'pt-BR': `Com base na descrição do mundo abaixo, escreva uma narração de abertura de 2-3 parágrafos para todo o grupo.

**Requisitos:**
1.  **Início Fundamentado:** Comece em um cenário clássico e atmosférico (por exemplo, uma taverna movimentada, uma fogueira tranquila, um portão da cidade). Estabeleça o clima.
2.  **Unidade do Grupo:** Mencione brevemente que eles estão juntos (descansando, planejando ou comemorando).
3.  **Incidente Incitante:** No meio do caminho, introduza um evento REPENTINO que perturbe a paz (por exemplo, um mensageiro desesperado, uma explosão mágica, um ataque de monstros).
4.  **Chamada à Ação:** Termine com as consequências imediatas deste evento.
5.  **CRÍTICO:** NÃO pergunte "O que vocês fazem?" ou faça uma pergunta direta aos jogadores. Esta é uma cena cinematográfica.

**Tom:** Atmosférico, imersivo, então repentinamente urgente.

MUNDO:
${worldDescription}`,
  };

  const openingSystemPrompt = openingSystemPrompts[language] || openingSystemPrompts['en']!;
  const openingUserPrompt = openingUserPrompts[language] || openingUserPrompts['en']!;

  return generateText(openingSystemPrompt, openingUserPrompt, language, { metadata: { streamId } });
};

/**
 * Generate personalized openings for all characters (wrapped with tracing)
 * @param worldDescription - World background
 * @param players - All players
 * @param language - Game language
 * @returns Array of personalized messages and a main opening message
 */
export const generateCharacterOpenings = async (
  worldDescription: string,
  players: Player[],
  language: Language = 'en'
): Promise<{ openings: Array<{ playerId: string; message: string }>; mainMessage: string }> => {
  logger.info(`Generating personalized openings for ${players.length} characters in language: ${language}`);

  // 1. Generate Main Message FIRST to establish the shared reality
  const mainMessage = await generateMainOpening(worldDescription, language);

  // 2. Generate Character Openings using the Main Message as context
  const openings = await Promise.all(
    players
      .filter((p) => p.character !== null)
      .map(async (player) => {
        const message = await generateCharacterOpening(
          worldDescription,
          player.character!, // Safe assertion due to filter
          mainMessage,
          language
        );
        return {
          playerId: player.id,
          message,
        };
      })
  );

  logger.info('All character openings generated');
  return { openings, mainMessage };
};

/**
 * Generate a draft of the opening story based on map context
 */
export const generateStoryDraft = async (
  worldDescription: string,
  players: Player[],
  mapContext: string,
  language: Language = 'en',
  streamId?: string
): Promise<string> => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };
  const languageName = languageMap[language] || 'English';

  const systemPrompts: Record<string, string> = {
    en: `You are a world-class Dungeon Master. Draft a compelling opening scene for an RPG adventure.
This is a DRAFT that will be used to identify NPCs and finalize the scene later.
Focus on the immediate environment, the atmosphere, and the inciting incident.

LANGUAGE REQUIREMENT:
You MUST respond entirely in ${languageName}.`,
    es: `Eres un Dungeon Master de clase mundial. Redacta una escena de apertura convincente para una aventura de RPG.
Esto es un BORRADOR que se utilizará para identificar NPCs y finalizar la escena más tarde.
Céntrate en el entorno inmediato, la atmósfera y el incidente incitante.

REQUISITO DE IDIOMA:
DEBES responder completamente en ${languageName}.`,
    'pt-BR': `Você é um Mestre de Masmorra de classe mundial. Faça um rascunho de uma cena de abertura convincente para uma aventura de RPG.
Este é um RASCUNHO que será usado para identificar NPCs e finalizar a cena mais tarde.
Concentre-se no ambiente imediato, na atmosfera e no incidente incitante.

REQUISITO DE IDIOMA:
Você DEVE responder inteiramente em ${languageName}.`,
  };

  const userPrompts: Record<string, string> = {
    en: `Draft an opening scene based on the following context:

WORLD:
${worldDescription}

MAP CONTEXT (Nearby structures/terrain):
${mapContext}

PLAYERS:
${players
  .filter((p) => p.character)
  .map((p) => `- ${p.character!.name} (${p.character!.race} ${p.character!.characterClass})`)
  .join('\n')}

Requirements:
1. Set the scene in a specific location mentioned in the Map Context (or a generic one if none fits).
2. Establish a mood (e.g., tense, festive, ominous).
3. Introduce an inciting incident involving NPCs (e.g., a messenger, an attacker, a mysterious figure).
4. Do NOT resolve the incident.
5. Mention 1-2 specific NPCs by name and description.`,
    es: `Redacta una escena de apertura basada en el siguiente contexto:

MUNDO:
${worldDescription}

CONTEXTO DEL MAPA (Estructuras/terreno cercanos):
${mapContext}

JUGADORES:
${players
  .filter((p) => p.character)
  .map((p) => `- ${p.character!.name} (${p.character!.race} ${p.character!.characterClass})`)
  .join('\n')}

Requisitos:
1. Establece la escena en una ubicación específica mencionada en el Contexto del Mapa (o una genérica si ninguna encaja).
2. Establece un estado de ánimo (ej: tenso, festivo, ominoso).
3. Introduce un incidente incitante que involucre NPCs (ej: un mensajero, un atacante, una figura misteriosa).
4. NO resuelvas el incidente.
5. Menciona 1-2 NPCs específicos por nombre y descripción.`,
    'pt-BR': `Faça um rascunho de uma cena de abertura com base no seguinte contexto:

MUNDO:
${worldDescription}

CONTEXTO DO MAPA (Estruturas/terreno próximos):
${mapContext}

JOGADORES:
${players
  .filter((p) => p.character)
  .map((p) => `- ${p.character!.name} (${p.character!.race} ${p.character!.characterClass})`)
  .join('\n')}

Requisitos:
1. Defina a cena em um local específico mencionado no Contexto do Mapa (ou um genérico, se nenhum se adequar).
2. Estabeleça um clima (ex: tenso, festivo, sinistro).
3. Introduza um incidente incitante envolvendo NPCs (ex: um mensageiro, um atacante, uma figura misteriosa).
4. NÃO resolva o incidente.
5. Mencione 1-2 NPCs específicos por nome e descrição.`,
  };

  const systemPrompt = systemPrompts[language] || systemPrompts['en']!;
  const userPrompt = userPrompts[language] || userPrompts['en']!;

  return generateText(systemPrompt, userPrompt, language, { metadata: { streamId } });
};

/**
 * Extract NPCs from a story draft
 */
export const extractNPCsFromDraft = async (
  draft: string,
  language: Language = 'en',
  streamId?: string
): Promise<Array<{ name: string; race: string; class: string; description: string }>> => {
  const NPCSchema = z.object({
    npcs: z.array(
      z.object({
        name: z.string().describe('Name of the NPC'),
        race: z.string().describe('Race of the NPC (e.g., Human, Elf, Goblin)'),
        class: z.string().describe('Class or role of the NPC (e.g., Fighter, Merchant, Guard)'),
        description: z.string().describe('Brief visual description of the NPC'),
      })
    ),
  });

  const systemPrompts: Record<string, string> = {
    en: `You are an expert at analyzing RPG stories. Identify all significant NPCs mentioned in the text.`,
    es: `Eres un experto analizando historias de RPG. Identifica todos los NPCs significativos mencionados en el texto.`,
    'pt-BR': `Você é um especialista em analisar histórias de RPG. Identifique todos os NPCs significativos mencionados no texto.`,
  };

  const userPrompts: Record<string, string> = {
    en: `Extract the NPCs from the following story draft:

${draft}

Return a list of NPCs with their details.
IMPORTANT: For 'race' and 'class', you MUST use standard D&D 5e SRD options where possible (e.g., 'Human', 'Elf', 'Dwarf', 'Fighter', 'Wizard', 'Rogue'). 
If an NPC is a monster, use the monster name as 'race' (e.g. 'Goblin') and 'Monster' or their role as 'class'.`,
    es: `Extrae los NPCs del siguiente borrador de historia:

${draft}

Devuelve una lista de NPCs con sus detalles.
IMPORTANTE: Para 'raza' y 'clase', DEBES usar opciones estándar del SRD de D&D 5e donde sea posible (ej: 'Humano', 'Elfo', 'Enano', 'Guerrero', 'Mago', 'Pícaro').
Si un NPC es un monstruo, usa el nombre del monstruo como 'raza' (ej: 'Goblin') y 'Monstruo' o su rol como 'clase'.`,
    'pt-BR': `Extraia os NPCs do seguinte rascunho de história:

${draft}

Retorne uma lista de NPCs com seus detalhes.
IMPORTANTE: Para 'raça' e 'classe', você DEVE usar opções padrão do SRD de D&D 5e sempre que possível (ex: 'Humano', 'Elfo', 'Anão', 'Guerreiro', 'Mago', 'Ladino').
Se um NPC for um monstro, use o nome do monstro como 'raça' (ex: 'Goblin') e 'Monstro' ou sua função como 'classe'.`,
  };

  const systemPrompt = systemPrompts[language] || systemPrompts['en']!;
  const userPrompt = userPrompts[language] || userPrompts['en']!;

  const result = await generateStructured(NPCSchema, systemPrompt, userPrompt, language, { metadata: { streamId } });
  return result.npcs;
};

/**
 * Generate the final opening narrative
 */
export const generateFinalOpening = async (
  draft: string,
  npcs: Array<{ name: string; description: string }>,
  language: Language = 'en',
  streamId?: string
): Promise<string> => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };
  const languageName = languageMap[language] || 'English';

  const systemPrompts: Record<string, string> = {
    en: `You are a world-class Dungeon Master. Write the final, polished opening narrative for an RPG adventure.
Use the provided draft and NPC details to create a cinematic scene.

LANGUAGE REQUIREMENT:
You MUST respond entirely in ${languageName}.`,
    es: `Eres un Dungeon Master de clase mundial. Escribe la narrativa de apertura final y pulida para una aventura de RPG.
Usa el borrador proporcionado y los detalles de los NPCs para crear una escena cinematográfica.

REQUISITO DE IDIOMA:
DEBES responder completamente en ${languageName}.`,
    'pt-BR': `Você é um Mestre de Masmorra de classe mundial. Escreva a narrativa de abertura final e polida para uma aventura de RPG.
Use o rascunho fornecido e os detalhes dos NPCs para criar uma cena cinematográfica.

REQUISITO DE IDIOMA:
Você DEVE responder inteiramente em ${languageName}.`,
  };

  const userPrompts: Record<string, string> = {
    en: `Finalize this opening scene:

DRAFT:
${draft}

NPCs PRESENT:
${npcs.map((n) => `- ${n.name}: ${n.description}`).join('\n')}

Requirements:
1. Polish the prose to be immersive and atmospheric.
2. Clearly describe the NPCs and their actions.
3. End with a strong Call to Action or immediate threat.
4. Do NOT ask "What do you do?".`,
    es: `Finaliza esta escena de apertura:

BORRADOR:
${draft}

NPCs PRESENTES:
${npcs.map((n) => `- ${n.name}: ${n.description}`).join('\n')}

Requisitos:
1. Pule la prosa para que sea inmersiva y atmosférica.
2. Describe claramente a los NPCs y sus acciones.
3. Termina con una fuerte Llamada a la Acción o amenaza inmediata.
4. NO preguntes "¿Qué hacéis?".`,
    'pt-BR': `Finalize esta cena de abertura:

RASCUNHO:
${draft}

NPCs PRESENTES:
${npcs.map((n) => `- ${n.name}: ${n.description}`).join('\n')}

Requisitos:
1. Dê polimento à prosa para ser imersiva e atmosférica.
2. Descreva claramente os NPCs e suas ações.
3. Termine com um forte Chamado à Ação ou ameaça imediata.
4. NÃO pergunte "O que vocês fazem?".`,
  };

  const systemPrompt = systemPrompts[language] || systemPrompts['en']!;
  const userPrompt = userPrompts[language] || userPrompts['en']!;

  return generateText(systemPrompt, userPrompt, language, { metadata: { streamId } });
};
