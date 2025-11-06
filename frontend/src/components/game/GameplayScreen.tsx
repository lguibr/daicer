/**
 * Main gameplay screen with chat and turn system
 */

import React, { useState } from 'react';
import type { Room, Player } from '../../types/shared';
import { useSocket } from '../../hooks/useSocket';
import { submitAction, processTurn } from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';
import { ChatArea } from './ChatArea';
import { PlayerSidebar } from './PlayerSidebar';

interface GameplayScreenProps {
  room: Room;
  players: Player[];
}

/**
 * Gameplay screen component
 * @param props - Component props
 * @returns Gameplay UI
 */
export function GameplayScreen({ room, players }: GameplayScreenProps) {
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
      processTurn(room.id, 'en');
    }
  };

  return (
    <div className="h-screen w-screen grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-0 bg-slate-900">
      {/* Sidebar */}
      <div className="md:col-span-1 lg:col-span-1 border-r border-slate-700">
        <PlayerSidebar room={room} players={players} creatures={socket.creatures} />
      </div>

      {/* Main Chat Area */}
      <div className="md:col-span-3 lg:col-span-4 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          <ChatArea messages={socket.messages} worldDescription={room.worldDescription} />
        </div>

        {/* Action Input */}
        <div className="border-t border-slate-700 bg-slate-800 p-4">
          {/* Turn Status */}
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Actions submitted: {submittedCount} / {players.length}
            </span>
            {!hasSubmitted && (
              <span className="text-yellow-400 font-semibold">Your turn - submit an action</span>
            )}
            {hasSubmitted && !allSubmitted && (
              <span className="text-green-400 font-semibold">✓ Waiting for others...</span>
            )}
            {allSubmitted && (
              <span className="text-cyan-400 font-semibold animate-pulse">Ready to process turn!</span>
            )}
          </div>

          {/* Action Input */}
          {!hasSubmitted ? (
            <div className="flex gap-2">
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="What do you do? (e.g., 'I search the room for traps', 'I attack the goblin with my sword')"
                className="flex-1 bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={2}
                disabled={submitting}
              />
              <button
                onClick={handleSubmitAction}
                disabled={!action.trim() || submitting}
                className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Submit'}
              </button>
            </div>
          ) : allSubmitted && room.ownerId === user?.uid ? (
            <button
              onClick={handleProcessTurn}
              className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              Process Turn
            </button>
          ) : (
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-300">Action submitted. Waiting for turn to process...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

