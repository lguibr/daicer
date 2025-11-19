/**
 * Graph Visualizer Script
 * Generates Mermaid diagrams from graph definitions
 *
 * Usage: npx tsx src/scripts/visualize-graphs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate Mermaid diagram for Gameplay Graph
 */
function generateGameplayGraphDiagram(): string {
  return `graph TD
    START([START]) --> combat_check

    combat_check{Combat Check<br/>Has pending actions?}
    combat_check -->|Yes| turn_processing[Turn Processing<br/>- Process player actions<br/>- Generate DM responses<br/>- Create perspective messages]
    combat_check -->|No or Waiting| END([END])

    turn_processing --> combat_check

    style START fill:#90EE90
    style END fill:#FFB6C1
    style combat_check fill:#87CEEB
    style turn_processing fill:#DDA0DD

    classDef nodeStyle fill:#f9f,stroke:#333,stroke-width:2px
    classDef decisionStyle fill:#ff9,stroke:#333,stroke-width:2px
`;
}

/**
 * Generate Mermaid diagram for Combat Graph
 */
function generateCombatGraphDiagram(): string {
  return `graph TD
    START([START]) --> initiative

    initiative[Initiative Node<br/>- Roll d20 + DEX for all<br/>- Establish turn order<br/>- Set round to 1]
    initiative --> turn_start

    turn_start[Turn Start Node<br/>- Increment round if needed<br/>- Log turn start]
    turn_start --> combat_check

    combat_check{Combat Over?<br/>All enemies or<br/>players defeated?}
    combat_check -->|Yes| END([END])
    combat_check -->|No| action_selection

    action_selection[Action Selection<br/>- Move<br/>- Attack<br/>- Cast Spell<br/>- Use Item<br/>- End Turn]
    action_selection --> execute_action

    execute_action[Execute Action<br/>- MoveNode<br/>- AttackNode<br/>- SpellCastNode]
    execute_action --> turn_end

    turn_end[Turn End Node<br/>- Advance to next character<br/>- Check victory conditions<br/>- Record state history]
    turn_end --> turn_start

    style START fill:#90EE90
    style END fill:#FFB6C1
    style initiative fill:#DDA0DD
    style turn_start fill:#87CEEB
    style combat_check fill:#FFD700
    style action_selection fill:#FFA07A
    style execute_action fill:#98FB98
    style turn_end fill:#87CEEB

    classDef nodeStyle fill:#f9f,stroke:#333,stroke-width:2px
    classDef decisionStyle fill:#ff9,stroke:#333,stroke-width:2px
`;
}

/**
 * Generate Mermaid diagram for Complete Turn Flow
 */
function generateTurnFlowDiagram(): string {
  return `sequenceDiagram
    participant Player
    participant Frontend
    participant Socket
    participant Backend
    participant Graph
    participant LLM

    Player->>Frontend: Submit action
    Frontend->>Socket: player:action
    Socket->>Backend: Update Firestore
    Backend-->>Socket: Confirm

    alt All players have actions
        Backend->>Graph: Invoke gameplay graph
        Graph->>Graph: START → combat_check
        Graph->>Graph: combat_check: has actions? YES
        Graph->>Graph: turn_processing
        Graph->>LLM: Process turn with context
        
        loop For each needed roll
            LLM->>Backend: Call tool (roll_dice, etc.)
            Backend-->>LLM: Return result
        end

        LLM-->>Graph: Structured response<br/>(summary + perspectives)
        Graph->>Graph: Create messages
        Graph->>Graph: Clear player actions
        Graph->>Graph: combat_check: no actions
        Graph->>Graph: END

        Backend->>Socket: Emit tool:calls
        Backend->>Socket: Emit turn:complete
        Socket-->>Frontend: Tool notifications
        Socket-->>Frontend: New messages
        Frontend-->>Player: Display results
    end
`;
}

/**
 * Generate Mermaid diagram for State Flow
 */
function generateStateFlowDiagram(): string {
  return `stateDiagram-v2
    [*] --> SETUP: Room Created

    SETUP --> CHARACTER_CREATION: World Generated

    CHARACTER_CREATION --> CHARACTER_CREATION: Players Creating Characters
    CHARACTER_CREATION --> GAMEPLAY: All Players Ready

    GAMEPLAY --> GAMEPLAY: Turn Processing
    GAMEPLAY --> COMBAT: Combat Triggered
    GAMEPLAY --> [*]: Adventure Complete

    COMBAT --> COMBAT: Combat Rounds
    COMBAT --> GAMEPLAY: Combat Resolved

    note right of SETUP
        Phase: SETUP
        - Room configuration
        - World settings
    end note

    note right of CHARACTER_CREATION
        Phase: CHARACTER_CREATION
        - Character sheets
        - Party composition
        - Opening narratives
    end note

    note right of GAMEPLAY
        Phase: GAMEPLAY
        - Narrative gameplay
        - NPC interactions
        - Exploration
        - Turn-based actions
    end note

    note right of COMBAT
        Phase: COMBAT
        - Tactical grid combat
        - Initiative order
        - Time-travel enabled
    end note
`;
}

/**
 * Main function
 */
function main() {
  const docsDir = path.join(__dirname, '..', '..', 'docs', 'graphs');

  // Create docs directory if it doesn't exist
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Generate diagrams
  const diagrams = {
    'gameplay-graph.mmd': generateGameplayGraphDiagram(),
    'combat-graph.mmd': generateCombatGraphDiagram(),
    'turn-flow.mmd': generateTurnFlowDiagram(),
    'state-flow.mmd': generateStateFlowDiagram(),
  };

  // Write files
  for (const [filename, content] of Object.entries(diagrams)) {
    const filepath = path.join(docsDir, filename);
    fs.writeFileSync(filepath, content);
    console.log(`✓ Generated ${filename}`);
  }

  console.log(`\n✨ All Mermaid diagrams generated in ${docsDir}\n`);
  console.log('To view these diagrams:');
  console.log('1. Use a Mermaid preview extension in your editor');
  console.log('2. Visit https://mermaid.live and paste the content');
  console.log('3. Use GitHub/GitLab markdown preview (they support Mermaid)');
}

// Run the script
main();
