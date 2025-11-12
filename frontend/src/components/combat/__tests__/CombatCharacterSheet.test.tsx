import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatCharacterSheet } from '../CombatCharacterSheet';
import type { CombatCharacter } from '../../../types/combat';

const mockCharacter: CombatCharacter = {
  id: 'player-fighter',
  name: 'Sir Amaranth',
  hp: 32,
  maxHp: 40,
  tempHp: 5,
  armorClass: 18,
  position: { x: 4, y: 6 },
  initiative: 14,
  avatar: 'player-fighter',
  isPlayer: true,
  strength: 18,
  dexterity: 12,
  constitution: 16,
  intelligence: 10,
  wisdom: 11,
  charisma: 13,
  proficiencyBonus: 3,
  speed: 6,
  reach: 1,
  hasMoved: true,
  hasActed: false,
  hasReaction: true,
  hasBonusAction: false,
  movementRemaining: 0,
  conditions: [{ type: 'blessed' }],
  deathSaves: {
    successes: 1,
    failures: 0,
  },
};

describe('CombatCharacterSheet', () => {
  it('renders character vitals, ability scores, and status flags', () => {
    render(<CombatCharacterSheet character={mockCharacter} onClose={() => {}} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Sir Amaranth/i)).toBeInTheDocument();
    expect(screen.getByText(/Player Character · Initiative 14/i)).toBeInTheDocument();
    expect(screen.getByText(/32\/40/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('+5 temp'))).toBeInTheDocument();
    expect(screen.getByText(/Armor Class/i)).toBeInTheDocument();
    expect(screen.getByText(/Speed/i)).toBeInTheDocument();
    expect(screen.getByText(/Strength/i)).toBeInTheDocument();
    expect(screen.getByText(/\+4/)).toBeInTheDocument(); // STR modifier for 18
    expect(screen.getByText(/Death Saves/i)).toBeInTheDocument();
    expect(screen.getByText(/blessed/i)).toBeInTheDocument();
  });

  it('invokes onClose when close button clicked or escape pressed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<CombatCharacterSheet character={mockCharacter} onClose={handleClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
