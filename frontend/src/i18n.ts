import { useState } from 'react';

export type Language = 'en' | 'es' | 'pt-BR';

const T = {
  en: {
    'auth.title': 'D20 AI',
    'auth.subtitle': 'Multiplayer D&D with AI Dungeon Master',
    'auth.login': 'Continue with Google',
    'auth.loggingIn': 'Signing in...',
    'auth.emulatorNote': 'Using Firebase emulators',
    'auth.emulatorTip': 'Enter any email',
    'lobby.title': 'Game Lobby',
    'lobby.subtitle': 'Create or join adventure',
    'lobby.createRoom': 'Create New Adventure',
    'lobby.joinRoom': 'Join Room',
    'lobby.enterCode': 'Room Code',
    'lobby.codePlaceholder': 'CODE',
    'lobby.joining': 'Joining...',
    'lobby.orDivider': 'OR',
    'worldSettings.title': 'Create Your Adventure',
    'worldSettings.subtitle': 'Configure the world',
    'worldSettings.story': 'Story',
    'worldSettings.scope': 'Scope',
    'worldSettings.theme': 'Theme',
    'worldSettings.themePlaceholder': 'High Fantasy',
    'worldSettings.setting': 'Setting',
    'worldSettings.settingPlaceholder': 'Ancient Ruins',
    'worldSettings.tone': 'Tone',
    'worldSettings.tonePlaceholder': 'Dark and Gritty',
    'worldSettings.playerCount': 'Players',
    'worldSettings.adventureLength': 'Length',
    'worldSettings.lengthShort': 'Short',
    'worldSettings.lengthMedium': 'Medium',
    'worldSettings.lengthEpic': 'Epic',
    'worldSettings.difficulty': 'Difficulty',
    'worldSettings.difficultyEasy': 'Easy',
    'worldSettings.difficultyMedium': 'Medium',
    'worldSettings.difficultyHard': 'Hard',
    'worldSettings.cancel': 'Cancel',
    'worldSettings.create': 'Create',
    'worldSettings.creating': 'Creating...',
  },
  es: {
    'auth.title': 'D20 AI',
    'auth.subtitle': 'D&D Multijugador con IA',
    'auth.login': 'Continuar con Google',
    'auth.loggingIn': 'Entrando...',
    'auth.emulatorNote': 'Usando emuladores',
    'auth.emulatorTip': 'Cualquier email',
    'lobby.title': 'Lobby',
    'lobby.subtitle': 'Crea o únete',
    'lobby.createRoom': 'Crear Aventura',
    'lobby.joinRoom': 'Unirse',
    'lobby.enterCode': 'Código',
    'lobby.codePlaceholder': 'CÓDIGO',
    'lobby.joining': 'Uniéndose...',
    'lobby.orDivider': 'O',
    'worldSettings.title': 'Crea Aventura',
    'worldSettings.subtitle': 'Configura el mundo',
    'worldSettings.story': 'Historia',
    'worldSettings.scope': 'Alcance',
    'worldSettings.theme': 'Tema',
    'worldSettings.themePlaceholder': 'Alta Fantasía',
    'worldSettings.setting': 'Escenario',
    'worldSettings.settingPlaceholder': 'Ruinas',
    'worldSettings.tone': 'Tono',
    'worldSettings.tonePlaceholder': 'Oscuro',
    'worldSettings.playerCount': 'Jugadores',
    'worldSettings.adventureLength': 'Duración',
    'worldSettings.lengthShort': 'Corta',
    'worldSettings.lengthMedium': 'Media',
    'worldSettings.lengthEpic': 'Épica',
    'worldSettings.difficulty': 'Dificultad',
    'worldSettings.difficultyEasy': 'Fácil',
    'worldSettings.difficultyMedium': 'Media',
    'worldSettings.difficultyHard': 'Difícil',
    'worldSettings.cancel': 'Cancelar',
    'worldSettings.create': 'Crear',
    'worldSettings.creating': 'Creando...',
  },
  'pt-BR': {
    'auth.title': 'D20 AI',
    'auth.subtitle': 'D&D Multiplayer com IA',
    'auth.login': 'Continuar com Google',
    'auth.loggingIn': 'Entrando...',
    'auth.emulatorNote': 'Usando emuladores',
    'auth.emulatorTip': 'Qualquer email',
    'lobby.title': 'Lobby',
    'lobby.subtitle': 'Crie ou entre',
    'lobby.createRoom': 'Criar Aventura',
    'lobby.joinRoom': 'Entrar',
    'lobby.enterCode': 'Código',
    'lobby.codePlaceholder': 'CÓDIGO',
    'lobby.joining': 'Entrando...',
    'lobby.orDivider': 'OU',
    'worldSettings.title': 'Crie Aventura',
    'worldSettings.subtitle': 'Configure mundo',
    'worldSettings.story': 'História',
    'worldSettings.scope': 'Escopo',
    'worldSettings.theme': 'Tema',
    'worldSettings.themePlaceholder': 'Alta Fantasia',
    'worldSettings.setting': 'Cenário',
    'worldSettings.settingPlaceholder': 'Ruínas',
    'worldSettings.tone': 'Tom',
    'worldSettings.tonePlaceholder': 'Sombrio',
    'worldSettings.playerCount': 'Jogadores',
    'worldSettings.adventureLength': 'Duração',
    'worldSettings.lengthShort': 'Curta',
    'worldSettings.lengthMedium': 'Média',
    'worldSettings.lengthEpic': 'Épica',
    'worldSettings.difficulty': 'Dificuldade',
    'worldSettings.difficultyEasy': 'Fácil',
    'worldSettings.difficultyMedium': 'Média',
    'worldSettings.difficultyHard': 'Difícil',
    'worldSettings.cancel': 'Cancelar',
    'worldSettings.create': 'Criar',
    'worldSettings.creating': 'Criando...',
  },
};

export const supportedLanguages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR' as Language, name: 'Português', flag: '🇧🇷' },
];

export function useI18n() {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('d20ai-language');
    return stored === 'es' || stored === 'pt-BR' ? stored : 'en';
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('d20ai-language', lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => T[language][key as keyof typeof T.en] || key;

  return {
    t,
    language,
    setLanguage,
    availableLanguages: supportedLanguages,
  };
}
