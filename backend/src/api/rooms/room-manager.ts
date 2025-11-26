/**
 * RoomManager Service
 * Centralized service for room management with Socket.IO broadcasting
 */

import { getDb } from '@/config/firebase';
import { logger } from '@/utils/logger';
import type { Room, WorldSettings, Player, GamePhase } from '@/types/index';
import { getPlayers } from '@/services/firestore/players';
import { emitRoomPhaseChange, emitGameState, emitRoomUpdate, type GameState } from '@/socket/events/room-events';

export class RoomManager {
    /**
     * Broadcast room phase change to all clients
     */
    static async broadcastPhaseChange(roomId: string, phase: GamePhase): Promise<void> {
        emitRoomPhaseChange(roomId, phase);
        logger.info('[RoomManager] Broadcasted phase change', { roomId, phase });
    }

    /**
     * Broadcast complete game state to all clients
     */
    static async broadcastGameState(roomId: string): Promise<void> {
        const db = getDb();

        // Fetch room
        const roomDoc = await db.collection('rooms').doc(roomId).get();
        if (!roomDoc.exists) {
            throw new Error(`Room ${roomId} not found`);
        }
        const room = roomDoc.data() as Room;

        // Fetch players
        const players = await getPlayers(roomId);

        // Build state
        const state: GameState = {
            room,
            players,
            messages: [],
            creatures: [],
        };

        emitGameState(roomId, state);
        logger.info('[RoomManager] Broadcasted game state', { roomId, playerCount: players.length });
    }

    /**
     * Broadcast room update
     */
    static async broadcastRoomUpdate(roomId: string): Promise<void> {
        const db = getDb();
        const roomDoc = await db.collection('rooms').doc(roomId).get();

        if (!roomDoc.exists) {
            throw new Error(`Room ${roomId} not found`);
        }

        const room = roomDoc.data() as Room;
        emitRoomUpdate(roomId, room);
        logger.info('[RoomManager] Broadcasted room update', { roomId });
    }
}
