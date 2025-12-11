export const SYSTEM_MESSAGES = {
  en: {
    START_ADVENTURE: 'The adventure begins! The story is being written...',
    DRAFTING_SCENE: 'Drafting the opening scene...',
    MAP_CONTEXT: '**Map Context Used:**',
    DRAFT_GENERATED: '**Draft Generated:**',
    SUMMONING_NPCS: 'Summoning NPCs...',
    NPCS_SUMMONED: '**NPCs Summoned:**',
    FINALIZING_STORY: 'Finalizing the story...',
    STORY_ERROR: 'The storyteller is having trouble... but the adventure must go on!',
  },
  es: {
    START_ADVENTURE: '¡La aventura comienza! La historia se está escribiendo...',
    DRAFTING_SCENE: 'Redactando la escena inicial...',
    MAP_CONTEXT: '**Contexto del Mapa Usado:**',
    DRAFT_GENERATED: '**Borrador Generado:**',
    SUMMONING_NPCS: 'Invocando personajes...',
    NPCS_SUMMONED: '**Personajes Invocados:**',
    FINALIZING_STORY: 'Finalizando la historia...',
    STORY_ERROR: 'El narrador tiene problemas... ¡pero la aventura debe continuar!',
  },
  'pt-BR': {
    START_ADVENTURE: 'A aventura começa! A história está sendo escrita...',
    DRAFTING_SCENE: 'Escrevendo o rascunho da cena inicial...',
    MAP_CONTEXT: '**Contexto do Mapa Utilizado:**',
    DRAFT_GENERATED: '**Rascunho Gerado:**',
    SUMMONING_NPCS: 'Invocando NPCs...',
    NPCS_SUMMONED: '**NPCs Invocados:**',
    FINALIZING_STORY: 'Finalizando a história...',
    STORY_ERROR: 'O narrador está com problemas... mas a aventura deve continuar!',
  },
};

export type SystemMessageKey = keyof (typeof SYSTEM_MESSAGES)['en'];

export function getSystemMessage(key: SystemMessageKey, language: string = 'en'): string {
  const lang = language === 'es' || language === 'pt-BR' ? language : 'en';
  return SYSTEM_MESSAGES[lang][key];
}
