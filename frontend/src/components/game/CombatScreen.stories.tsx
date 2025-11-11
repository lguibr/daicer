/**
 * @file frontend/src/components/game/CombatScreen.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CombatScreen } from './CombatScreen';

const meta = {
  title: 'Game/CombatScreen',
  component: CombatScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CombatScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// Note: This component requires useCombat hook which needs Socket.IO context
// These stories demonstrate the component structure but may not be fully functional
// in isolation. For full functionality, use the actual app with Socket.IO connection.

export const NoCombat: Story = {
  args: {
    roomId: 'demo-room',
  },
};

// Note: Additional functional stories would require mocking the useCombat hook
// which returns complex combat state. See the test files for examples of proper mocking.
