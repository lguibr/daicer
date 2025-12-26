/**
 * Combat Screen Component
 * Main combat interface with grid, character cards, log, and time-travel
 * Enhanced with optional feature radius panel
 */

import { useState, useMemo } from 'react';

import type { Player, CharacterSheet } from '@daicer/engine';
import { useCombat } from '../../hooks/useCombat';
import type { Position } from '../../types/combat';
import { ResizablePanelGroup, ResizablePanel } from '../ui/resizable';

import { CombatGrid } from '../combat/CombatGrid';
import { CharacterCard } from '../combat/CharacterCard';
import { CombatLog } from '../combat/CombatLog';
import { TimeTravelPanel } from '../combat/TimeTravelPanel';
import { CombatCharacterSheet } from '../combat/CombatCharacterSheet';

interface CombatScreenProps {
  roomId: string;
  players?: Player[];
}

export function CombatScreen({ roomId, players = [] }: CombatScreenProps) {
  const { combatState, history, attack, move, endTurn, restoreState, getActiveCharacter } = useCombat(roomId);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [_selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isTimeTravelOpen, setIsTimeTravelOpen] = useState(false);

  const activeCharacter = getActiveCharacter();
  const selectedCharacter = selectedCharacterId
    ? combatState?.characters.find((c) => c.id === selectedCharacterId)
    : null;

  const selectedCharacterSheet: CharacterSheet | null = useMemo(() => {
    if (!selectedCharacter || players.length === 0) {
      return null;
    }

    const normalizedName = selectedCharacter.name.trim().toLowerCase();
    const matchingPlayer = players.find((player) => player.character?.name.trim().toLowerCase() === normalizedName);

    return matchingPlayer?.character ?? null;
  }, [players, selectedCharacter]);

  // Calculate reachable squares for movement
  const reachableSquares = useMemo((): Position[] => {
    if (!combatState || !selectedCharacter || selectedCharacter.id !== activeCharacter?.id) {
      return [];
    }

    // Simple reach calculation
    const squares: Position[] = [];
    const movement = selectedCharacter.movementRemaining;

    for (let x = 0; x < combatState.gridWidth; x++) {
      for (let y = 0; y < combatState.gridHeight; y++) {
        const distance = Math.max(
          Math.abs(x - selectedCharacter.position.x),
          Math.abs(y - selectedCharacter.position.y)
        );

        if (distance <= movement && distance > 0) {
          // Check if square is occupied
          const isOccupied = combatState.characters.some(
            (c) => c.hp > 0 && c.id !== selectedCharacter.id && c.position.x === x && c.position.y === y
          );

          if (!isOccupied) {
            squares.push({ x, y });
          }
        }
      }
    }

    return squares;
  }, [combatState, selectedCharacter, activeCharacter]);

  const handleSquareClick = (position: Position) => {
    if (!combatState || !activeCharacter || !selectedCharacter) return;

    // Check if it's the active character's turn and they're selected
    if (selectedCharacter.id === activeCharacter.id && !selectedCharacter.hasMoved) {
      // Move to the square
      move(selectedCharacter.id, position.x, position.y);
    }
  };

  const handleCharacterClick = (characterId: string) => {
    if (!combatState) return;

    const clickedChar = combatState.characters.find((c) => c.id === characterId);
    if (!clickedChar) return;

    // If selecting our own active character, select for movement
    if (characterId === activeCharacter?.id) {
      setSelectedCharacterId(characterId);
      setSelectedTargetId(null);
      return;
    }

    // If we have a character selected and click an enemy, attack
    if (selectedCharacterId === activeCharacter?.id && clickedChar.isPlayer !== activeCharacter.isPlayer) {
      setSelectedTargetId(characterId);
      // Auto-attack
      if (!activeCharacter.hasActed) {
        attack(activeCharacter.id, characterId, {
          weaponDamage: '1d8',
          damageType: 'slashing',
        });
      }
    } else {
      // Just select the character
      setSelectedCharacterId(characterId);
      setSelectedTargetId(null);
    }
  };

  const handleEndTurn = () => {
    endTurn();
    setSelectedCharacterId(null);
    setSelectedTargetId(null);
  };

  if (!combatState) {
    return (
      <div className="flex items-center justify-center h-screen bg-midnight-900 text-shadow-300">
        <div className="text-center">
          <div className="text-xl mb-2">No active combat</div>
          <div className="text-sm text-shadow-400">Combat will begin when initiated by the DM</div>
        </div>
      </div>
    );
  }

  const playerCharacters = combatState.characters.filter((c) => c.isPlayer);
  const enemyCharacters = combatState.characters.filter((c) => !c.isPlayer);

  return (
    <div className="h-screen bg-midnight-900 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-midnight-300 border-b border-shadow-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-shadow-50">⚔️ Combat</h2>
            <div className="text-sm text-shadow-400">
              Round {combatState.round} • {activeCharacter?.name}&apos;s Turn
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEndTurn}
              disabled={!activeCharacter || activeCharacter.id !== selectedCharacterId}
              className="px-4 py-2 bg-nebula-600 hover:bg-nebula-500 disabled:bg-shadow-800 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              End Turn
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Content Area */}
          <ResizablePanel defaultSize={100} minSize={50}>
            <div className="h-full grid grid-cols-12 gap-4 p-4 overflow-hidden">
              {/* Left Sidebar - Player Characters */}
              <div className="col-span-2 overflow-y-auto space-y-2">
                <h3 className="text-sm font-bold text-shadow-300 mb-2">PLAYERS</h3>
                {playerCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isActive={char.id === activeCharacter?.id}
                    isSelected={char.id === selectedCharacterId}
                    onClick={() => handleCharacterClick(char.id)}
                  />
                ))}
              </div>

              {/* Center - Combat Grid */}
              <div className="col-span-6 flex items-center justify-center">
                <CombatGrid
                  characters={combatState.characters}
                  gridWidth={combatState.gridWidth}
                  gridHeight={combatState.gridHeight}
                  activeCharacterId={combatState.activeCharacterId}
                  selectedCharacterId={selectedCharacterId}
                  reachableSquares={reachableSquares}
                  onSquareClick={handleSquareClick}
                  onCharacterClick={handleCharacterClick}
                />
              </div>

              {/* Right Side - Combat Log and Enemies */}
              <div className="col-span-4 flex flex-col gap-4 overflow-hidden">
                {/* Enemies */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-shadow-300 mb-2">ENEMIES</h3>
                  <div className="grid gap-2">
                    {enemyCharacters.map((char) => (
                      <CharacterCard
                        key={char.id}
                        character={char}
                        isActive={char.id === activeCharacter?.id}
                        isSelected={char.id === selectedCharacterId}
                        onClick={() => handleCharacterClick(char.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Combat Log */}
                <div className="flex-1 min-h-0">
                  <CombatLog log={combatState.log} diceHistory={combatState.diceHistory} />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Time Travel Panel */}
      <TimeTravelPanel
        history={history}
        currentIndex={history.length - 1}
        onRestore={restoreState}
        isOpen={isTimeTravelOpen}
        onToggle={() => setIsTimeTravelOpen(!isTimeTravelOpen)}
      />

      {/* Combat Over Overlay */}
      {combatState.isCombatOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="bg-midnight-300 p-8 rounded-lg border-2 border-aurora-500 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <div className="text-2xl font-bold text-shadow-50 mb-2">Combat Complete!</div>
            <div className="text-lg text-aurora-300 mb-6">
              {combatState.winner === 'player' ? 'The party is victorious!' : 'The enemies have won...'}
            </div>
            <button
              type="button"
              onClick={() => {
                // Signal to return to gameplay
                window.location.reload(); // Temporary - should be handled by phase transition
              }}
              className="px-6 py-3 bg-nebula-600 hover:bg-nebula-500 text-white rounded-lg transition-colors"
            >
              Return to Gameplay
            </button>
          </div>
        </div>
      )}
      {selectedCharacter && (
        <CombatCharacterSheet
          character={selectedCharacter}
          characterSheet={selectedCharacterSheet}
          onClose={() => setSelectedCharacterId(null)}
        />
      )}
    </div>
  );
}
