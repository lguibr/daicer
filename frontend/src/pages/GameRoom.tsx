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
import { Layout } from '../components/layout/Layout';
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
      <Layout showNavbar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aurora-300"></div>
        </div>
      </Layout>
    );
  }

  if (error || !room) {
    return (
      <Layout showRoomInfo={false}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md p-6 card">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-shadow-200 mb-4">{error || 'Room not found'}</p>
            <button
              onClick={() => navigate('/lobby')}
              className="btn-primary"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Render based on game phase
  switch (room.phase) {
    case 'SETUP':
    case 'CHARACTER_CREATION':
      return (
        <Layout room={room} playerCount={players.length} showRoomInfo>
          <CharacterCreation room={room} players={players} />
        </Layout>
      );

    case 'GAMEPLAY':
      return (
        <Layout room={room} playerCount={players.length} showRoomInfo>
          <GameplayScreen room={room} players={players} />
        </Layout>
      );

    default:
      return (
        <Layout room={room} playerCount={players.length} showRoomInfo>
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-shadow-300">Unknown game phase</p>
          </div>
        </Layout>
      );
  }
}

