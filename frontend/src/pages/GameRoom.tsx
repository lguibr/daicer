/**
 * Game room page - handles character creation and gameplay
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomState } from '../services/api';
import { joinRoom as joinSocketRoom, leaveRoom } from '../services/socket';
import { useSocket } from '../hooks/useSocket';
import { CharacterCreation } from '../components/room/CharacterCreation';
import { GameplayScreen } from '../components/game/GameplayScreen';
import type { Room, Player } from '../types/shared';

/**
 * Game room page component
 * @returns Game room UI based on phase
 */
export function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const socket = useSocket(roomId);

  // Update players from socket events
  const handlePlayerCreated = React.useCallback((newPlayer: Player) => {
    setPlayers((prev) => {
      const exists = prev.find((p) => p.id === newPlayer.id);
      if (exists) return prev;
      return [...prev, newPlayer];
    });
  }, []);

  const handlePlayerReadyUpdated = React.useCallback((data: { userId: string; isReady: boolean }) => {
    setPlayers((prev) =>
      prev.map((p) => (p.userId === data.userId ? { ...p, isReady: data.isReady } : p))
    );
  }, []);

  const handlePhaseChanged = React.useCallback((data: { phase: string }) => {
    if (room) {
      setRoom({ ...room, phase: data.phase as Room['phase'] });
    }
  }, [room]);

  useEffect(() => {
    if (!roomId) {
      navigate('/lobby');
      return;
    }

    const loadRoom = async () => {
      try {
        const data = await getRoomState(roomId);
        setRoom(data.room);
        setPlayers(data.players);
        
        // Give socket time to initialize before joining
        setTimeout(() => {
          joinSocketRoom(roomId);
        }, 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();

    return () => {
      // Safe cleanup - leaveRoom handles uninitialized socket
      leaveRoom();
    };
  }, [roomId, navigate]);

  // Socket event listeners
  useEffect(() => {
    const sock = socket.socket;
    if (!sock) return;

    sock.on('player:created', handlePlayerCreated);
    sock.on('player:ready_updated', handlePlayerReadyUpdated);
    sock.on('room:phase_changed', handlePhaseChanged);

    return () => {
      sock.off('player:created', handlePlayerCreated);
      sock.off('player:ready_updated', handlePlayerReadyUpdated);
      sock.off('room:phase_changed', handlePhaseChanged);
    };
  }, [socket.socket, handlePlayerCreated, handlePlayerReadyUpdated, handlePhaseChanged]);

  // Update state from socket initial load
  useEffect(() => {
    if (socket.room) {
      setRoom(socket.room);
    }
    if (socket.players.length > 0) {
      setPlayers(socket.players);
    }
  }, [socket.room, socket.players]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md p-6 bg-slate-800 rounded-xl">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-slate-300 mb-4">{error || 'Room not found'}</p>
          <button
            onClick={() => navigate('/lobby')}
            className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Render based on game phase
  switch (room.phase) {
    case 'SETUP':
    case 'CHARACTER_CREATION':
      return <CharacterCreation room={room} players={players} />;

    case 'GAMEPLAY':
      return <GameplayScreen room={room} players={players} />;

    default:
      return <div>Unknown game phase</div>;
  }
}

