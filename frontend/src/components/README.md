# Frontend Components

React components for the D20 AI multiplayer game.

## Architecture

```mermaid
graph TB
    App[App.tsx] --> Auth{Authenticated?}
    Auth -->|No| Login[LoginScreen]
    Auth -->|Yes| Lobby{In Room?}
    Lobby -->|No| LobbyScreen
    Lobby -->|Yes| Room{Room Phase?}
    
    Room -->|SETUP| SetupWizard
    Room -->|CHARACTER_CREATION| CharCreator[CharacterCreator]
    Room -->|GAMEPLAY| GameScreen
    
    GameScreen --> CharSheet[CharacterSheetDisplay]
    GameScreen --> ChatBox[ChatBox]
    GameScreen --> Actions[ActionInput]
    
    App --> Debug[DebugPanel]
```

## Components

- **LoginScreen** - Google OAuth authentication
- **LobbyScreen** - Create or join game rooms
- **SetupWizard** - Configure world settings
- **CharacterCreator** - Create player characters
- **GameScreen** - Main gameplay interface
- **DebugPanel** - Development/troubleshooting tool

## Conventions

- All components use TypeScript
- Functional components with hooks
- Props are fully typed
- JSDoc comments for complex logic
- Tailwind CSS for styling

