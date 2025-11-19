import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import PlayerSidebar from '../PlayerSidebar';
import type { Player, Creature } from '../../../types/shared';

const mockPlayers: Player[] = [
  {
    id: 'player-1',
    userId: 'user-1',
    name: 'Alice',
    character: {
      name: 'Elara',
      race: 'Elf',
      characterClass: 'Wizard',
      level: 3,
      hp: 18,
      maxHp: 24,
      armorClass: 13,
      attributes: {
        Strength: 8,
        Dexterity: 16,
        Constitution: 12,
        Intelligence: 18,
        Wisdom: 14,
        Charisma: 10,
      },
      skills: [],
      alignment: 'Neutral Good',
      background: 'Sage',
    },
    action: null,
  },
  {
    id: 'player-2',
    userId: 'user-2',
    name: 'Bob',
    character: {
      name: 'Thrain',
      race: 'Dwarf',
      characterClass: 'Fighter',
      level: 3,
      hp: 32,
      maxHp: 32,
      armorClass: 18,
      attributes: {
        Strength: 16,
        Dexterity: 12,
        Constitution: 16,
        Intelligence: 10,
        Wisdom: 12,
        Charisma: 8,
      },
      skills: [],
      alignment: 'Lawful Good',
      background: 'Soldier',
    },
    action: 'I attack the goblin',
  },
];

const mockCreatures: Creature[] = [
  {
    name: 'Goblin Scout',
    hp: 7,
    maxHp: 15,
    attackBonus: 4,
    damage: '1d6+2',
  },
  {
    name: 'Dire Wolf',
    hp: 22,
    maxHp: 37,
    attackBonus: 5,
    damage: '2d6+3',
  },
];

describe('PlayerSidebar', () => {
  it('renders party heading', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={[]} />);
    expect(screen.getByText('Party')).toBeInTheDocument();
  });

  it('displays all player characters', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={[]} />);

    expect(screen.getByText('Elara')).toBeInTheDocument();
    expect(screen.getByText('Thrain')).toBeInTheDocument();
  });

  it('shows character race, class, and level', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={[]} />);

    expect(screen.getByText('Elf Wizard Lvl 3')).toBeInTheDocument();
    expect(screen.getByText('Dwarf Fighter Lvl 3')).toBeInTheDocument();
  });

  it('displays HP for each character', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={[]} />);

    expect(screen.getByText('18/24')).toBeInTheDocument();
    expect(screen.getByText('32/32')).toBeInTheDocument();
  });

  it('displays AC for each character', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={[]} />);

    const acCells = screen.getAllByText(/^13$|^18$/);
    expect(acCells.length).toBeGreaterThanOrEqual(2);
  });

  it('calculates and displays initiative modifier', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={[]} />);

    // Elara has Dex 16 = +3 modifier
    // Thrain has Dex 12 = +1 modifier
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('highlights players who have submitted actions', () => {
    const { container } = render(<PlayerSidebar players={mockPlayers} creatures={[]} />);

    // Player with action should have special styling
    const highlightedCards = container.querySelectorAll('.ring-aurora-300\\/50');
    expect(highlightedCards.length).toBeGreaterThan(0);

    // Should show checkmark
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('does not highlight players without actions', () => {
    render(<PlayerSidebar players={[mockPlayers[0]]} creatures={[]} />);

    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('renders creatures section when creatures exist', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={mockCreatures} />);

    expect(screen.getByText('Creatures')).toBeInTheDocument();
    expect(screen.getByText('Goblin Scout')).toBeInTheDocument();
    expect(screen.getByText('Dire Wolf')).toBeInTheDocument();
  });

  it('displays creature HP', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={mockCreatures} />);

    expect(screen.getByText('HP: 7/15')).toBeInTheDocument();
    expect(screen.getByText('HP: 22/37')).toBeInTheDocument();
  });

  it('displays creature attack bonus and damage', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={mockCreatures} />);

    expect(screen.getByText('ATK: +4 | DMG: 1d6+2')).toBeInTheDocument();
    expect(screen.getByText('ATK: +5 | DMG: 2d6+3')).toBeInTheDocument();
  });

  it('does not show creatures section when no creatures', () => {
    render(<PlayerSidebar players={mockPlayers} creatures={[]} />);

    expect(screen.queryByText('Creatures')).not.toBeInTheDocument();
  });

  it('handles empty players list', () => {
    render(<PlayerSidebar players={[]} creatures={[]} />);

    expect(screen.getByText('Party')).toBeInTheDocument();
    // Should not crash
  });

  it('handles negative ability modifiers', () => {
    const weakPlayer: Player = {
      ...mockPlayers[0],
      character: {
        ...mockPlayers[0].character,
        attributes: {
          ...mockPlayers[0].character.attributes,
          Dexterity: 6, // Modifier = -2
        },
      },
    };

    render(<PlayerSidebar players={[weakPlayer]} creatures={[]} />);

    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('applies proper styling to stat boxes', () => {
    const { container } = render(<PlayerSidebar players={mockPlayers} creatures={[]} />);

    const statBoxes = container.querySelectorAll('.bg-shadow-900\\/70.p-1\\.5.rounded.border.border-shadow-700');
    expect(statBoxes.length).toBeGreaterThan(0);
  });

  it('uses different styling for creatures vs players', () => {
    const { container } = render(<PlayerSidebar players={mockPlayers} creatures={mockCreatures} />);

    // Creatures should have nebula styling
    const creatureCards = container.querySelectorAll('.border-nebula-400\\/30');
    expect(creatureCards.length).toBe(mockCreatures.length);
  });

  it('has scrollable overflow', () => {
    const { container } = render(<PlayerSidebar players={mockPlayers} creatures={mockCreatures} />);

    const sidebar = container.firstChild as HTMLElement;
    expect(sidebar).toHaveClass('overflow-y-auto');
  });
});
