/**
 * Lobby page - create or join rooms
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../services/api';
import { useI18n } from '../i18n';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { Layout } from '../components/layout/Layout';

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
    <Layout showRoomInfo={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-aurora-300 mb-2">Game Lobby</h1>
            <p className="text-shadow-200">Create a new adventure or join an existing one</p>
          </div>

          <div className="p-6 card space-y-4">
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="btn-primary w-full text-lg py-4"
            >
              Create New Adventure
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-midnight-600/60"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-midnight-400/70 text-shadow-400">OR</span>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <label className="block text-sm font-medium text-shadow-300">
                Join with Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={6}
                className="w-full px-4 py-3 bg-midnight-500/60 text-shadow-50 rounded-lg border border-shadow-800 focus:border-aurora-400 focus:outline-none focus:ring-2 focus:ring-aurora-400 text-center text-2xl tracking-widest font-mono uppercase transition-all"
              />
              <button
                type="submit"
                disabled={loading || !roomCode.trim()}
                className="btn-secondary w-full"
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
    </Layout>
  );
}

