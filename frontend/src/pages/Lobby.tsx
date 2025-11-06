/**
 * Lobby page - create or join rooms
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../services/api';
import { useI18n } from '../i18n';
import { LanguageSelector } from '../components/ui/LanguageSelector';

/**
 * Lobby page component
 * @returns Lobby UI
 */
export function LobbyPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = () => {
    navigate('/create');
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const room = await joinRoom(roomCode.toUpperCase());
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">Game Lobby</h1>
          <p className="text-slate-300">Create a new adventure or join an existing one</p>
        </div>

        <div className="p-6 bg-slate-800 rounded-xl shadow-lg space-y-4">
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full px-6 py-4 bg-cyan-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-cyan-700 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            Create New Adventure
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">OR</span>
            </div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Join with Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              maxLength={6}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none text-center text-2xl tracking-widest font-mono uppercase"
            />
            <button
              type="submit"
              disabled={loading || !roomCode.trim()}
              className="w-full px-6 py-3 bg-slate-600 text-white font-bold rounded-lg shadow-md hover:bg-slate-700 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

