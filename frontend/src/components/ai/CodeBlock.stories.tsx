/**
 * Storybook stories for CodeBlock
 * Demonstrates syntax highlighting, copy functionality, and line numbers
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock, CodeBlockCopyButton } from './CodeBlock';

const meta: Meta<typeof CodeBlock> = {
  title: 'AI/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0e1a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

const pythonCode = `def cast_fireball(target, damage_dice="8d6"):
    """Cast a Fireball spell at the target.
    
    Args:
        target: The creature or location to target
        damage_dice: Dice notation for damage (default: 8d6)
    
    Returns:
        int: Total damage dealt
    """
    roll = dice.roll(damage_dice)
    target.take_damage(roll, damage_type="fire")
    
    if roll >= 40:
        print("Critical hit! The fireball engulfs everything!")
    
    return roll`;

const javascriptCode = `function generateDungeon(width, height, roomCount) {
  const dungeon = Array(height).fill(null).map(() => 
    Array(width).fill('#')
  );
  
  const rooms = [];
  
  for (let i = 0; i < roomCount; i++) {
    const room = {
      x: Math.floor(Math.random() * (width - 10)) + 1,
      y: Math.floor(Math.random() * (height - 10)) + 1,
      width: Math.floor(Math.random() * 6) + 4,
      height: Math.floor(Math.random() * 6) + 4,
    };
    
    rooms.push(room);
  }
  
  return { dungeon, rooms };
}`;

const sqlCode = `SELECT 
    c.name AS character_name,
    c.level,
    c.class,
    SUM(i.value) AS total_inventory_value
FROM 
    characters c
LEFT JOIN 
    inventory i ON c.id = i.character_id
WHERE 
    c.is_active = true
GROUP BY 
    c.id, c.name, c.level, c.class
HAVING 
    SUM(i.value) > 1000
ORDER BY 
    total_inventory_value DESC;`;

const bashCode = `#!/bin/bash

# Start Daicer development environment
echo "🎮 Starting Daicer..."

# Start Firebase emulators
firebase emulators:start --import=./emulator-data &

# Wait for emulators to be ready
sleep 5

# Start backend
cd backend && yarn dev &

# Start frontend
cd frontend && yarn dev

echo "✅ Daicer is running!"`;

export const Python: Story = {
  args: {
    code: pythonCode,
    language: 'python',
  },
};

export const JavaScript: Story = {
  args: {
    code: javascriptCode,
    language: 'javascript',
  },
};

export const SQL: Story = {
  args: {
    code: sqlCode,
    language: 'sql',
  },
};

export const Bash: Story = {
  args: {
    code: bashCode,
    language: 'bash',
  },
};

export const WithLineNumbers: Story = {
  args: {
    code: pythonCode,
    language: 'python',
    showLineNumbers: true,
  },
};

export const ShortCode: Story = {
  args: {
    code: 'const greeting = "Hello, adventurer!";',
    language: 'javascript',
  },
};

export const MultipleBlocks: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <CodeBlock code="npm install @daicer/frontend" language="bash" />

      <CodeBlock
        code={`import { Conversation } from '@/components/ai';

export default function Chat() {
  return <Conversation>...</Conversation>;
}`}
        language="typescript"
      />

      <CodeBlock code="SELECT * FROM characters WHERE level > 10;" language="sql" showLineNumbers />
    </div>
  ),
};

export const WithCustomButton: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <CodeBlock code={javascriptCode} language="javascript">
        <div className="flex items-center gap-2">
          <CodeBlockCopyButton code={javascriptCode} />
          <button
            type="button"
            className="rounded bg-aurora-500/20 px-3 py-1 text-xs font-semibold text-aurora-300 hover:bg-aurora-500/30"
          >
            Run Code
          </button>
        </div>
      </CodeBlock>
    </div>
  ),
};

export const LongCode: Story = {
  args: {
    code: `class DungeonMaster {
  constructor(world, players) {
    this.world = world;
    this.players = players;
    this.currentScene = null;
    this.narrativeHistory = [];
  }

  async narrate(playerAction) {
    // Process player action
    const context = this.buildContext(playerAction);
    
    // Generate AI narrative
    const narrative = await this.generateNarrative(context);
    
    // Check for combat
    if (narrative.combat) {
      return this.initiateCombat(narrative.enemies);
    }
    
    // Check for skill checks
    if (narrative.skillCheck) {
      return this.processSkillCheck(narrative.skillCheck);
    }
    
    // Update world state
    this.updateWorldState(narrative);
    
    // Store in history
    this.narrativeHistory.push({
      action: playerAction,
      response: narrative,
      timestamp: Date.now(),
    });
    
    return narrative;
  }

  buildContext(action) {
    return {
      world: this.world,
      players: this.players,
      currentScene: this.currentScene,
      recentHistory: this.narrativeHistory.slice(-5),
      action,
    };
  }

  async generateNarrative(context) {
    // Call LangChain service
    const response = await langchain.generate({
      model: 'gemini-pro',
      prompt: this.buildPrompt(context),
      temperature: 0.8,
    });
    
    return this.parseResponse(response);
  }
}`,
    language: 'javascript',
    showLineNumbers: true,
  },
};

export const PlainText: Story = {
  args: {
    code: `The ancient scroll reads:

"When the moon turns crimson and the stars align,
The gateway shall open, the worlds combine.
Three keys are needed, three trials to pass,
Only the worthy shall come to pass."`,
    language: 'text',
  },
};

export const InteractiveCopy: Story = {
  render: () => {
    function CopyDemo() {
      const [log, setLog] = React.useState<string[]>([]);

      const handleCopy = () => {
        setLog((prev) => [...prev, `Copied at ${new Date().toLocaleTimeString()}`]);
      };

      return (
        <div className="space-y-4 bg-midnight-950 p-8">
          <CodeBlock code={pythonCode} language="python">
            <CodeBlockCopyButton code={pythonCode} onCopy={handleCopy} />
          </CodeBlock>

          {log.length > 0 && (
            <div className="rounded-lg border border-midnight-600/60 bg-midnight-800/60 p-4">
              <p className="mb-2 text-sm font-semibold text-shadow-200">Copy Log:</p>
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <p key={i} className="text-sm text-shadow-400 font-mono">
                    {entry}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <CopyDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the copy button to test the copy functionality.',
      },
    },
  },
};
