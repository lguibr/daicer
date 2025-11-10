import React, { useState } from 'react';
import type { Room, Player } from '../../types/shared';
import useSocket from '../../hooks/useSocket';
import { submitAction, processTurn } from '../../services/socket';
import useAuth from '../../hooks/useAuth';
import ChatArea from './ChatArea';
import PlayerSidebar from './PlayerSidebar';

interface GameplayScreenProps {
  room: Room;
  players: Player[];
}

/**
 * Gameplay screen component
 * @param props - Component props
 * @returns Gameplay UI
 */
export default function GameplayScreen({ room, players }: GameplayScreenProps) {
  const { user } = useAuth();
  const socket = useSocket(room.id);
  const [action, setAction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentPlayer = players.find((p) => p.userId === user?.uid);
  const hasSubmitted = currentPlayer?.action !== null && currentPlayer?.action !== '';
  const allSubmitted = players.every((p) => p.action);
  const submittedCount = players.filter((p) => p.action).length;

  const handleSubmitAction = async () => {
    if (!action.trim() || !room.id) return;

    try {
      setSubmitting(true);
      submitAction(room.id, action);
      setAction('');
    } catch (err) {
      console.error('Failed to submit action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessTurn = () => {
    if (room.id) {
      const language = room.settings?.language || 'en';
      processTurn(room.id, language);
    }
  };

  const renderActionInput = () => {
    if (hasSubmitted) {
      if (allSubmitted && room.ownerId === user?.uid) {
        return (
          <button
            type="button"
            onClick={handleProcessTurn}
            className="w-full px-6 py-3 bg-nebula-500 text-shadow-50 font-bold rounded-lg hover:bg-nebula-400 transition-colors shadow-lg"
          >
            Process Turn
          </button>
        );
      }
      return (
        <div className="text-center p-4 bg-shadow-900/80 rounded-lg border border-shadow-700">
          <p className="text-shadow-400">Action submitted. Waiting for turn to process...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="What do you do? (e.g., 'I search the room for traps', 'I attack the goblin with my sword')"
          className="flex-1 bg-shadow-900/85 border border-shadow-700 text-shadow-50 placeholder:text-shadow-400 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-aurora-400 resize-none min-h-[80px] sm:min-h-0"
          rows={2}
          disabled={submitting}
        />
        <button
          type="button"
          onClick={handleSubmitAction}
          disabled={!action.trim() || submitting}
          className="btn-primary sm:px-6 sm:py-2 whitespace-nowrap"
        >
          {submitting ? 'Sending...' : 'Submit'}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-5 h-[calc(100vh-4rem)] lg:h-screen w-full gap-0">
      {/* Sidebar - Collapsed on mobile, visible on desktop */}
      <div className="hidden lg:block lg:col-span-1 border-r border-shadow-800/70 overflow-y-auto">
        <PlayerSidebar room={room} players={players} creatures={socket.creatures} />
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-4 flex flex-col h-full">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          <ChatArea messages={socket.messages} worldDescription={room.worldDescription} />
        </div>

        {/* Action Input */}
        <div className="border-t border-shadow-800/70 bg-midnight-300/85 p-3 md:p-5 backdrop-blur">
          {/* Turn Status */}
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <span className="text-shadow-400">
              Actions: {submittedCount} / {players.length}
            </span>
            {!hasSubmitted && <span className="text-aurora-200 font-semibold">Your turn - submit an action</span>}
            {hasSubmitted && !allSubmitted && (
              <span className="text-nebula-200 font-semibold">✓ Waiting for others...</span>
            )}
            {allSubmitted && (
              <span className="text-aurora-200 font-semibold animate-pulse">Ready to process turn!</span>
            )}
          </div>

          {/* Action Input */}
          {renderActionInput()}
        </div>
      </div>
    </div>
  );
}
