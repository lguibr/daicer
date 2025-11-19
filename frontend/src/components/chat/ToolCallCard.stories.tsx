/**
 * Storybook stories for ToolCallCard
 */

import type { Meta, StoryObj } from '@storybook/react';
import ToolCallCard from './ToolCallCard';
import type { ToolCall } from '../../services/socket';

const meta: Meta<typeof ToolCallCard> = {
  title: 'Chat/ToolCallCard',
  component: ToolCallCard,
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
type Story = StoryObj<typeof ToolCallCard>;

const diceRollTool: ToolCall = {
  id: 'tool-1',
  toolName: 'roll_dice',
  parameters: {
    dice: '1d20',
    modifier: 5,
    purpose: 'Attack Roll',
  },
  result: {
    total: 23,
    breakdown: '[18] + 5',
    success: true,
  },
  timestamp: Date.now(),
};

const ruleLookupTool: ToolCall = {
  id: 'tool-2',
  toolName: 'lookup_rule',
  parameters: {
    query: 'grappling rules',
    section: 'combat',
  },
  result: {
    rule: "Grappling requires an Athletics check contested by the target's Athletics or Acrobatics check.",
    reference: 'PHB p.195',
  },
  timestamp: Date.now(),
};

const combatTool: ToolCall = {
  id: 'tool-3',
  toolName: 'initiate_combat',
  parameters: {
    creatures: ['Goblin', 'Goblin', 'Hobgoblin'],
    location: 'Forest Clearing',
  },
  result: {
    combatId: 'combat-789',
    initiative: [
      { name: 'Alice', roll: 18 },
      { name: 'Hobgoblin', roll: 15 },
      { name: 'Bob', roll: 12 },
      { name: 'Goblin', roll: 8 },
    ],
  },
  timestamp: Date.now(),
};

const spawnTool: ToolCall = {
  id: 'tool-4',
  toolName: 'spawn_creature',
  parameters: {
    creatureType: 'Ancient Red Dragon',
    level: 20,
    position: { x: 5, y: 10 },
  },
  result: {
    creatureId: 'creature-dragon-1',
    hp: 546,
    ac: 22,
  },
  timestamp: Date.now(),
};

const inventoryTool: ToolCall = {
  id: 'tool-5',
  toolName: 'check_inventory',
  parameters: {
    playerName: 'Alice the Brave',
  },
  result: {
    items: [
      { name: 'Longsword +1', quantity: 1 },
      { name: 'Healing Potion', quantity: 3 },
      { name: 'Rope (50 ft)', quantity: 1 },
    ],
    gold: 247,
  },
  timestamp: Date.now(),
};

export const DiceRollComplete: Story = {
  args: {
    toolCall: diceRollTool,
    status: 'complete',
  },
};

export const DiceRollRunning: Story = {
  args: {
    toolCall: diceRollTool,
    status: 'running',
  },
};

export const DiceRollPending: Story = {
  args: {
    toolCall: diceRollTool,
    status: 'pending',
  },
};

export const DiceRollError: Story = {
  args: {
    toolCall: {
      ...diceRollTool,
      result: undefined,
    },
    status: 'error',
  },
};

export const RuleLookup: Story = {
  args: {
    toolCall: ruleLookupTool,
    status: 'complete',
  },
};

export const CombatInitiation: Story = {
  args: {
    toolCall: combatTool,
    status: 'complete',
  },
};

export const CreatureSpawn: Story = {
  args: {
    toolCall: spawnTool,
    status: 'complete',
  },
};

export const InventoryCheck: Story = {
  args: {
    toolCall: inventoryTool,
    status: 'complete',
  },
};

export const MultipleTools: Story = {
  render: () => (
    <div className="space-y-4">
      <ToolCallCard toolCall={diceRollTool} status="complete" />
      <ToolCallCard toolCall={ruleLookupTool} status="running" />
      <ToolCallCard toolCall={combatTool} status="pending" />
    </div>
  ),
};

export const ExpandedView: Story = {
  args: {
    toolCall: combatTool,
    status: 'complete',
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the card to expand and see full parameters and results.',
      },
    },
  },
};
