import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCard } from '../CharacterCard';
import type { CombatCharacter } from '../../../types/combat';

const mockCharacter: CombatCharacter = {
  id: 'char-1',
  name: 'Warrior',
  hp: 30,
  maxHp: 50,
  tempHp: 5,
  armorClass: 16,
  position: { x: 2, y: 3 },
  initiative: 15,
  avatar: 'warrior-avatar',
  isPlayer: true,
  strength: 16,
  dexterity: 14,
  constitution: 14,
  intelligence: 10,
  wisdom: 12,
  charisma: 8,
  proficiencyBonus: 2,
  speed: 30,
  reach: 1,
  hasMoved: false,
  hasActed: false,
  hasReaction: true,
  hasBonusAction: true,
  movementRemaining: 30,
  conditions: [],
};

describe('CharacterCard', () => {
  it('renders character name and basic info', () => {
    render(<CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={() => {}} />);

    expect(screen.getByText('Warrior')).toBeInTheDocument();
    expect(screen.getByText(/Init: 15/i)).toBeInTheDocument();
  });

  it('displays HP as fraction', () => {
    render(<CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={() => {}} />);

    expect(screen.getByText('30/50')).toBeInTheDocument();
  });

  it('shows HP bar with correct percentage', () => {
    const { container } = render(
      <CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={() => {}} />
    );

    // HP is 30/50 = 60% which shows green (>50%), not yellow
    const hpBar = container.querySelector('.bg-green-500');
    expect(hpBar).toBeInTheDocument();
    expect(hpBar).toHaveStyle({ width: '60%' }); // 30/50 = 60%
  });

  it('shows green HP bar when > 50%', () => {
    const healthyChar = { ...mockCharacter, hp: 40 };
    const { container } = render(
      <CharacterCard character={healthyChar} isActive={false} isSelected={false} onClick={() => {}} />
    );

    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  it('shows red HP bar when <= 25%', () => {
    const lowHpChar = { ...mockCharacter, hp: 10 };
    const { container } = render(
      <CharacterCard character={lowHpChar} isActive={false} isSelected={false} onClick={() => {}} />
    );

    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('displays temporary HP', () => {
    render(<CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={() => {}} />);

    expect(screen.getByText('+5 temp HP')).toBeInTheDocument();
  });

  it('does not display temporary HP when zero', () => {
    const noTempHp = { ...mockCharacter, tempHp: 0 };
    render(<CharacterCard character={noTempHp} isActive={false} isSelected={false} onClick={() => {}} />);

    expect(screen.queryByText(/temp HP/i)).not.toBeInTheDocument();
  });

  it('displays AC, Speed, and Reach', () => {
    render(<CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={() => {}} />);

    expect(screen.getByText('16')).toBeInTheDocument(); // AC
    expect(screen.getByText('30 ft')).toBeInTheDocument(); // Speed
    expect(screen.getByText('5 ft')).toBeInTheDocument(); // Reach (1 * 5)
  });

  it('displays ability score modifiers', () => {
    render(<CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={() => {}} />);

    const modifiers = screen.getAllByText(/^[+-]\d+$/);
    const modifierTexts = modifiers.map((m) => m.textContent);

    expect(modifierTexts).toContain('+3'); // STR modifier (16 => +3)
    expect(modifierTexts).toContain('+2'); // DEX modifier (14 => +2) or CON
    expect(modifierTexts).toContain('-1'); // CHA modifier (8 => -1)
  });

  it('shows ACTIVE badge when active', () => {
    render(<CharacterCard character={mockCharacter} isActive={true} isSelected={false} onClick={() => {}} />);

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('shows turn status when active', () => {
    render(<CharacterCard character={mockCharacter} isActive={true} isSelected={false} onClick={() => {}} />);

    expect(screen.getByText('Can Move')).toBeInTheDocument();
    expect(screen.getByText('Can Act')).toBeInTheDocument();
  });

  it('shows completed actions when acted', () => {
    const actedChar = { ...mockCharacter, hasMoved: true, hasActed: true };
    render(<CharacterCard character={actedChar} isActive={true} isSelected={false} onClick={() => {}} />);

    expect(screen.getByText('✓ Moved')).toBeInTheDocument();
    expect(screen.getByText('✓ Acted')).toBeInTheDocument();
  });

  it('applies active styling', () => {
    const { container } = render(
      <CharacterCard character={mockCharacter} isActive={true} isSelected={false} onClick={() => {}} />
    );

    expect(container.querySelector('.border-nebula-400')).toBeInTheDocument();
  });

  it('applies selected styling', () => {
    const { container } = render(
      <CharacterCard character={mockCharacter} isActive={false} isSelected={true} onClick={() => {}} />
    );

    expect(container.querySelector('.ring-aurora-400')).toBeInTheDocument();
  });

  it('applies defeated styling when HP is 0', () => {
    const deadChar = { ...mockCharacter, hp: 0 };
    const { container } = render(
      <CharacterCard character={deadChar} isActive={false} isSelected={false} onClick={() => {}} />
    );

    expect(container.querySelector('.opacity-50.grayscale')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={onClick} />);

    await user.click(screen.getByText('Warrior'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('displays player avatar with colored background', () => {
    const { container } = render(
      <CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={() => {}} />
    );

    const avatar = container.querySelector('.bg-aurora-500');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent('W'); // First letter of Warrior
  });

  it('displays enemy avatar with red background', () => {
    const enemy = { ...mockCharacter, isPlayer: false };
    const { container } = render(
      <CharacterCard character={enemy} isActive={false} isSelected={false} onClick={() => {}} />
    );

    expect(container.querySelector('.bg-red-600')).toBeInTheDocument();
  });

  it('displays conditions', () => {
    const conditionedChar = {
      ...mockCharacter,
      conditions: [{ type: 'poisoned' }, { type: 'frightened', level: 2 }],
    };
    render(<CharacterCard character={conditionedChar} isActive={false} isSelected={false} onClick={() => {}} />);

    expect(screen.getByText('poisoned')).toBeInTheDocument();
    expect(screen.getByText('frightened 2')).toBeInTheDocument();
  });

  it('does not show conditions when none present', () => {
    const { container } = render(
      <CharacterCard character={mockCharacter} isActive={false} isSelected={false} onClick={() => {}} />
    );

    expect(container.querySelector('.bg-red-900\\/50')).not.toBeInTheDocument();
  });
});
