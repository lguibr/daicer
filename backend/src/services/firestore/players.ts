import { getDb } from '@/config/firebase';
import type { Player, CharacterSheet } from '@/types/index';
import { logger } from '@/utils/logger';
import { getRace, getClass, getBackground } from '../game-data';

const db = () => getDb();

export async function addPlayer(roomId: string, player: Player): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('players').doc(player.id).set(player);
  logger.info(`Player added to room ${roomId}: ${player.id}`);
}

export async function getPlayers(roomId: string): Promise<Player[]> {
  const snapshot = await db().collection('rooms').doc(roomId).collection('players').get();

  return snapshot.docs.map((doc) => doc.data() as Player);
}

export async function getPlayer(roomId: string, playerId: string): Promise<Player | null> {
  const doc = await db().collection('rooms').doc(roomId).collection('players').doc(playerId).get();
  return doc.exists ? (doc.data() as Player) : null;
}

export async function updatePlayerAction(roomId: string, playerId: string, action: string | null): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('players').doc(playerId).update({ action });
}

export async function setPlayerReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('players').doc(playerId).update({
    isReady,
    updatedAt: Date.now(),
  });
  logger.info(`Player ${playerId} ready status set to ${isReady}`);
}

export async function updatePlayerCharacter(
  roomId: string,
  playerId: string,
  character: CharacterSheet,
  avatarPreview?: {
    portrait: import('@/types/index').AvatarPreviewImage;
    upperBody: import('@/types/index').AvatarPreviewImage;
    fullBody: import('@/types/index').AvatarPreviewImage;
  }
): Promise<void> {
  // Fetch and embed race/class/background data for denormalization
  const [raceData, classData, backgroundData] = await Promise.all([
    character.race ? getRace(character.race) : null,
    character.characterClass ? getClass(character.characterClass) : null,
    character.background ? getBackground(character.background) : null,
  ]);

  // Embed summary data in character sheet
  const enhancedCharacter: CharacterSheet = {
    ...character,
    ...(raceData && {
      raceData: {
        name: raceData.name,
        speed: raceData.speed,
        size: raceData.size,
      },
    }),
    ...(classData && {
      classData: {
        name: classData.name,
        hitDie: classData.hitDie,
        primaryAbility: classData.primaryAbility,
      },
    }),
    ...(backgroundData && {
      backgroundData: {
        name: backgroundData.name,
        description: backgroundData.description,
      },
    }),
  };

  const updateData: Partial<Player> = {
    character: enhancedCharacter,
    updatedAt: Date.now(),
  };

  if (avatarPreview) {
    updateData.avatarPreview = avatarPreview;
  }

  await db().collection('rooms').doc(roomId).collection('players').doc(playerId).update(updateData);
  logger.info(`Player ${playerId} character updated with embedded data`);
}

export async function areAllPlayersReady(roomId: string): Promise<boolean> {
  const players = await getPlayers(roomId);
  return players.length > 0 && players.every((p) => p.isReady);
}

export async function removePlayer(roomId: string, playerId: string): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('players').doc(playerId).delete();
  logger.info(`Player removed from room ${roomId}: ${playerId}`);
}
