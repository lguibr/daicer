/**
 * Combat Grid Component
 * Displays the tactical grid for D&D combat
 * Enhanced with tile click details
 */

import { useState } from 'react';
import type { CombatCharacter, Position } from '../../types/combat';

interface CombatGridProps {
  characters: CombatCharacter[];
  gridWidth: number;
  gridHeight: number;
  activeCharacterId: string | null;
  selectedCharacterId: string | null;
  reachableSquares: Position[];
  onSquareClick: (position: Position) => void;
  onCharacterClick: (characterId: string) => void;
}

export function CombatGrid({
  characters,
  gridWidth,
  gridHeight,
  activeCharacterId,
  selectedCharacterId,
  reachableSquares,
  onSquareClick,
  onCharacterClick,
}: CombatGridProps) {
  const [clickedSquare, setClickedSquare] = useState<Position | null>(null);

  const isSquareReachable = (x: number, y: number): boolean => reachableSquares.some((sq) => sq.x === x && sq.y === y);

  const getCharacterAt = (x: number, y: number): CombatCharacter | undefined =>
    characters.find((c) => c.position.x === x && c.position.y === y && c.hp > 0);

  const handleSquareClick = (x: number, y: number, character?: CombatCharacter) => {
    if (character) {
      onCharacterClick(character.id);
      setClickedSquare({ x, y });
    } else {
      onSquareClick({ x, y });
      setClickedSquare({ x, y });
    }
  };

  const renderSquare = (x: number, y: number) => {
    const character = getCharacterAt(x, y);
    const isReachable = isSquareReachable(x, y);
    const isActive = character?.id === activeCharacterId;
    const isSelected = character?.id === selectedCharacterId;
    const isClicked = clickedSquare?.x === x && clickedSquare?.y === y;

    const baseClasses =
      'relative border border-shadow-700 aspect-square flex items-center justify-center cursor-pointer transition-all';
    const reachableClasses = isReachable
      ? 'bg-aurora-900/30 hover:bg-aurora-800/50 border-aurora-600'
      : 'bg-shadow-900/50 hover:bg-shadow-800/70';
    const activeClasses = isActive ? 'ring-2 ring-nebula-400' : '';
    const selectedClasses = isSelected ? 'ring-2 ring-aurora-400' : '';
    const clickedClasses = isClicked ? 'ring-2 ring-accent' : '';

    const squareElement = (
      <div
        key={`${x}-${y}`}
        role="button"
        tabIndex={0}
        className={`${baseClasses} ${reachableClasses} ${activeClasses} ${selectedClasses} ${clickedClasses}`}
        onClick={() => handleSquareClick(x, y, character)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSquareClick(x, y, character);
          }
        }}
        data-testid={`combat-square-${x}-${y}`}
      >
        {character && (
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                character.isPlayer ? 'bg-aurora-500 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {character.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-[10px] text-shadow-200 font-semibold">
              {character.hp}/{character.maxHp}
            </div>
          </div>
        )}
        <div className="absolute top-0 left-0 text-[8px] text-shadow-500 p-0.5">
          {x},{y}
        </div>
      </div>
    );

    return squareElement;
  };

  return (
    <div className="bg-midnight-300 p-4 rounded-lg border border-shadow-800">
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: gridHeight }, (_row, y) =>
          Array.from({ length: gridWidth }, (_col, x) => renderSquare(x, y))
        )}
      </div>
    </div>
  );
}
