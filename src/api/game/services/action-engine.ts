import { normalizeWorldConfig } from '@/api/world/utils/world-config';
/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
/**
 * Action Engine Service (Refactored for Sandwich Pipeline)
 * Handles game action dispatching.
 * Separates Logic (Resolution) from Persistence for the Command Pipeline.
 */

// import { factories } from '@strapi/strapi'; // Not needed for plain service
import { Alea } from '@daicer/engine/voxel/utils/math';
import { TerrainGenerator } from '@daicer/engine/voxel/terrain-generator';
import { WorldConfig, ZLevel } from '@daicer/engine/types';

// New Schemas
import {
  EngineCommand,
  MoveCommand,
  AttackCommand,
  ModifyTerrainCommand,
  DropItemCommand,
  PickupItemCommand,
  ThrowItemCommand,
} from '@/api/game/schemas/commands';

import {
  GameEvent,
  EntityMovedEventSchema,
  AttackResultEventSchema,
  DamageDealtEventSchema,
  EntityDeathEventSchema,
  TerrainModifiedEventSchema,
  ItemDroppedEventSchema,
} from '@/api/game/schemas/events';

import { findPath } from '@daicer/engine/rules/spatial';

import type { UID } from '@strapi/types';

// Types
export interface StateDiff {
  updates: Array<{ collection: string; documentId: string; data: Record<string, unknown> }>;
  creates: Array<{ collection: string; data: Record<string, unknown> }>;
  deletes: Array<{ collection: string; documentId: string }>;
}

export interface ActionResult {
  success: boolean;
  message: string;
  events: GameEvent[];
  stateDiff: StateDiff;
}

// Helper Type for populated Entity
interface PopulatedEntity {
  documentId: string;
  room?: {
    documentId: string;
    config?: unknown;
  } | null;
  position?: { x: number; y: number; z: number };
  speed?: number | { walk: number };
  computedActions?: Array<{
    id: string; // Component ID
    name: string;
    type: string;
    attackBonus?: number;
    damage?: Array<{
      diceCount?: number;
      diceValue?: number;
      flatBonus?: number;
      damageType?: string;
    }>;
  }>;
  stats?: Record<string, unknown>;
  armorClass?: number;
  hp?: number;
}

export default ({ strapi }) => ({
  rng: new Alea('default-seed'),

  /**
   * Dispatches a Command (or batch of Commands) to the engine for resolution.
   * acts as the primary entry point for all game logic affecting world state.
   *
   * @param roomId - The room context.
   * @param commands - Array of commands to execute.
   * @param dryRun - If true, returns the result without persisting state changes.
   * @returns Array of ActionResults, one for each command.
   */
  async dispatch(roomId: string, commands: EngineCommand[], dryRun = false): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    // Recording Hook
    const recordMode = process.env.RECORD_SCENARIO === 'true';
    let recorder;
    if (recordMode) {
      try {
        const { GameplayRecorder } = await import('../../../engine/debug/recorder');
        recorder = new GameplayRecorder('latest_scenario.json');
      } catch (e) {
        console.warn('Recorder load failed', e);
      }
    }

    for (const cmd of commands) {
      console.log(`[ActionEngine] Resolving command: ${cmd.type}`, cmd.payload);

      let result: ActionResult;

      try {
        switch (cmd.type) {
          case 'MOVE':
            result = await this.resolveMove(cmd, roomId);
            break;
          case 'ATTACK':
            result = await this.resolveAttack(cmd, roomId);
            break;
          case 'MODIFY_TERRAIN':
            result = await this.resolveModifyTerrain(cmd, roomId);
            break;
          case 'DROP_ITEM':
            result = await this.resolveDropItem(cmd, roomId);
            break;
          case 'PICKUP_ITEM':
            result = await this.resolvePickupItem(cmd, roomId);
            break;
          case 'THROW_ITEM':
            result = await this.resolveThrowItem(cmd, roomId);
            break;
          // TODO: Implement others
          default:
            result = {
              success: false,
              message: `Unknown command type: ${(cmd as { type: string }).type}`,
              events: [],
              stateDiff: { updates: [], creates: [], deletes: [] },
            };
        }
      } catch (error: unknown) {
        console.error('[ActionEngine] Resolution Error:', error);
        const msg = error instanceof Error ? error.message : 'Internal Error';
        result = {
          success: false,
          message: msg,
          events: [],
          stateDiff: { updates: [], creates: [], deletes: [] },
        };
      }

      results.push(result);

      if (recorder && result.success) {
        recorder.recordStep(cmd, { events: result.events, stateDiff: result.stateDiff });
      }

      // Legacy Persistence Mode (Default if not dryRun)
      if (!dryRun && result.success) {
        await this.persistResult(result);
      }
    }

    if (recorder) {
      await recorder.save();
    }

    return results;
  },

  /**
   * Persist the result of an action (State Diff + Events) to Strapi.
   */
  async persistResult(result: ActionResult) {
    // 1. Apply State Diffs
    for (const update of result.stateDiff.updates) {
      // Avoid 'collection as any' by using string which Strapi accepts generally,
      // or map to UID.ContentType if strictly required.
      // Strapi documents() accepts string UID.
      await strapi.documents(update.collection as UID.ContentType).update({
        documentId: update.documentId,
        data: update.data,
      });
    }

    // 2. Persist Events
    for (const event of result.events) {
      await strapi.documents('api::game-event.game-event').create({
        data: event as unknown as Record<string, unknown>, // Casting to unknown then Record to satisfy loose Strapi Types
      });
    }

    // Creates/Deletes not fully implemented in legacy shim yet
  },

  // --- RESOLVERS (Pure Logic) ---

  async resolveMove(command: MoveCommand, roomId: string): Promise<ActionResult> {
    const { actorId, targetPosition } = command.payload;

    // 1. Fetch State (Read Only)
    const actor = (await strapi.documents('api::entity-sheet.entity-sheet').findOne({
      documentId: actorId,
      populate: ['room', 'room.config'],
    })) as PopulatedEntity | null;

    if (!actor) throw new Error('Actor not found');

    const targetPos = { ...targetPosition, z: targetPosition.z ?? 0 };

    // 2. Fetch Collision Context
    const roomEntities = (await strapi.documents('api::entity-sheet.entity-sheet').findMany({
      filters: { room: { documentId: roomId } },
      fields: ['position', 'documentId'],
    })) as PopulatedEntity[];

    // 3. Collision Logic
    let checkCollision = (p: { x: number; y: number; z: number }): boolean => {
      const occupied = roomEntities.some(
        (e) =>
          e.documentId !== actorId &&
          e.position &&
          Math.round(e.position.x) === p.x &&
          Math.round(e.position.y) === p.y &&
          Math.round(e.position.z) === p.z
      );
      return occupied;
    };

    if (actor.room?.config) {
      const config = actor.room.config as WorldConfig;
      const generator = new TerrainGenerator(config);
      const baseCheck = checkCollision;
      checkCollision = (p: { x: number; y: number; z: number }) => {
        if (baseCheck(p)) return true;
        const tile = generator.getTileAt(p.x, p.y, Math.round(p.z) as ZLevel);
        return !tile.isWalkable;
      };
    }

    // 4. Pathfinding
    const startPos = actor.position || { x: 0, y: 0, z: 0 };
    const path = findPath(startPos, targetPos, checkCollision, 500);

    if (path.length === 0) {
      return {
        success: false,
        message: 'Path blocked from ' + JSON.stringify(startPos) + ' to ' + JSON.stringify(targetPos),
        events: [],
        stateDiff: { updates: [], creates: [], deletes: [] },
      };
    }

    // 5. Cost Calculation
    // Ensure actor.speed is handled if it is Object or Number
    const baseSpeed = typeof actor.speed === 'number' ? actor.speed : actor.speed?.walk || 30;

    let traveled = 0;
    let finalPos = path[0];

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const next = path[i];
      const dist = Math.sqrt(
        Math.pow(next.x - prev.x, 2) + Math.pow(next.y - prev.y, 2) + Math.pow(next.z - prev.z, 2)
      );
      if (traveled + dist > baseSpeed) break;
      traveled += dist;
      finalPos = next;
    }

    // 6. Construct Result
    const event = EntityMovedEventSchema.parse({
      type: 'ENTITY_MOVED',
      timestamp: Date.now(),
      room: roomId,
      actor: actorId,
      payload: {
        from: startPos,
        to: finalPos,
        path: path.map((p) => ({ x: p.x, y: p.y, z: p.z })),
        cost: traveled,
        mode: command.payload.mode,
      },
    });

    return {
      success: true,
      message: `Moved to ${finalPos.x}, ${finalPos.y}, ${finalPos.z}`,
      events: [event],
      stateDiff: {
        updates: [
          {
            collection: 'api::entity-sheet.entity-sheet',
            documentId: actorId,
            data: { position: finalPos },
          },
        ],
        creates: [],
        deletes: [],
      },
    };
  },

  async resolveAttack(command: AttackCommand, roomId: string): Promise<ActionResult> {
    const { actorId, targetId, weaponId } = command.payload;

    // 1. Fetch Context
    const [actor, target] = await Promise.all([
      strapi.documents('api::entity-sheet.entity-sheet').findOne({
        documentId: actorId,
        populate: ['computedActions', 'computedActions.damage', 'inventory', 'stats'],
      }) as Promise<PopulatedEntity | null>,
      strapi.documents('api::entity-sheet.entity-sheet').findOne({
        documentId: targetId,
        populate: ['stats', 'defenses', 'position'],
      }) as Promise<PopulatedEntity | null>,
    ]);

    if (!actor || !target) {
      return {
        success: false,
        message: 'Actor or Target not found',
        events: [],
        stateDiff: { updates: [], creates: [], deletes: [] },
      };
    }

    // 2. Identify Action
    // If weaponId is provided, we might search by name or ID within computedActions.
    // For now, if no weaponId, default to first action.
    let actionDef = actor.computedActions?.[0];

    if (weaponId && actor.computedActions) {
      // Logic to find specific action if weaponId is passed (might matching inventory item or action name)
      // Assuming weaponId matches action 'id' (component id) or name for now.
      actionDef = actor.computedActions.find((a) => a.id === weaponId || a.name === weaponId);
    }

    if (!actionDef) {
      return {
        success: false,
        message: 'Action not found',
        events: [],
        stateDiff: { updates: [], creates: [], deletes: [] },
      };
    }

    // 3. Roll
    const attackBonus = actionDef.attackBonus || 0;
    const ac = target.armorClass || 10; // TODO: Calculate AC from armor + dex
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + attackBonus;
    const isHit = total >= ac || d20 === 20;
    const isCrit = d20 === 20;

    const events: GameEvent[] = [];
    const updates: Array<{ collection: string; documentId: string; data: Record<string, unknown> }> = [];

    // 4. Damage
    let damageTotal = 0;
    if (isHit || isCrit) {
      if (actionDef.damage && Array.isArray(actionDef.damage)) {
        for (const di of actionDef.damage) {
          const count = di.diceCount ?? 1;
          const face = di.diceValue ?? 6;
          const flat = di.flatBonus ?? 0;
          let roll = 0;
          for (let i = 0; i < count; i++) roll += Math.floor(Math.random() * face) + 1;
          if (isCrit) for (let i = 0; i < count; i++) roll += Math.floor(Math.random() * face) + 1; // Double dice
          damageTotal += roll + flat;
        }
      }
    }

    // 5. Build Events
    events.push(
      AttackResultEventSchema.parse({
        type: 'ATTACK_RESULT',
        timestamp: Date.now(),
        room: roomId,
        actor: actorId,
        payload: {
          targetId,
          actionId: actionDef.id,
          roll: d20,
          total,
          isHit,
          isCrit,
          damage: damageTotal,
        },
      })
    );

    if (damageTotal > 0) {
      const newHp = Math.max(0, (target.hp || 0) - damageTotal);

      updates.push({
        collection: 'api::entity-sheet.entity-sheet',
        documentId: targetId,
        data: { hp: newHp },
      });

      events.push(
        DamageDealtEventSchema.parse({
          type: 'DAMAGE_DEALT',
          timestamp: Date.now(),
          room: roomId,
          actor: actorId,
          payload: {
            targetId,
            amount: damageTotal,
            type: 'physical', // TODO: Fetch from action
            source: actionDef.name,
            isLethal: newHp === 0,
          },
        })
      );

      if (newHp === 0) {
        events.push(
          EntityDeathEventSchema.parse({
            type: 'ENTITY_DEATH',
            timestamp: Date.now(),
            room: roomId,
            actor: targetId,
            payload: {
              killerId: actorId,
              position: target.position || { x: 0, y: 0, z: 0 },
            },
          })
        );

        // Side Effects: Drop Loot & Create Death Marker
        try {
          const inventoryService = strapi.service('api::game.inventory-service');

          // Only drop loot if NOT a player
          if ((target as { type?: string }).type !== 'player') {
            await inventoryService.dropAll(targetId);
          }

          // Create Death Marker (Terrain/Chunk)
          // Dynamic import to avoid cycles
          const module = await import('../../voxel-engine/services/chunk-manager');
          const { ChunkManager } = module;
          const cm = ChunkManager.getInstance();
          const room = await strapi.documents('api::room.room').findOne({ documentId: roomId, populate: ['world'] });
          if (!room?.world?.documentId) throw new Error('Room world is missing');
          const worldConfig = normalizeWorldConfig(room.world);
          const chunkSize = worldConfig.chunkSize;

          const px = Math.round(target.position?.x || 0);
          const py = Math.round(target.position?.y || 0);
          const pz = Math.round(target.position?.z || 0);

          const cx = Math.floor(px / chunkSize);
          const cy = Math.floor(py / chunkSize);
          const lx = ((px % chunkSize) + chunkSize) % chunkSize;
          const ly = ((py % chunkSize) + chunkSize) % chunkSize;

          await cm.editVoxel({ worldId: room.world.documentId, config: worldConfig, chunkX: cx, chunkY: cy, voxelX: lx, voxelY: ly, voxelZ: pz, reason: 'Entity Death', metadata: {
            type: 'death_marker', victim: (target as { name?: string }).name || 'Entity',
          } });
        } catch (e) {
          console.warn('[ActionEngine] Death side-effects failed', e);
        }
      }
    }

    return {
      success: true,
      message: isHit ? `Hit for ${damageTotal}` : 'Missed',
      events,
      stateDiff: {
        updates,
        creates: [],
        deletes: [],
      },
    };
  },

  async resolveModifyTerrain(command: ModifyTerrainCommand, roomId: string): Promise<ActionResult> {
    const { actorId, center, radius, type } = command.payload;

    // Delegate to legacy or external service
    // Ensure we handle potential errors from service
    try {
      await strapi.service('api::game.action-engine').handleModifyTerrain(command);
    } catch (err: unknown) {
      console.error('Modify Terrain Failed', err);
    }

    return {
      success: true,
      message: 'Terrain Modified',
      events: [
        TerrainModifiedEventSchema.parse({
          type: 'TERRAIN_MODIFIED',
          timestamp: Date.now(),
          room: roomId,
          actor: actorId,
          payload: {
            center,
            radius,
            blockType: type,
            count: 0,
          },
        }),
      ],
      stateDiff: { updates: [], creates: [], deletes: [] },
    };
  },

  async resolveDropItem(command: DropItemCommand, roomId: string): Promise<ActionResult> {
    const inventoryService = strapi.service('api::game.inventory-service');

    const result = await inventoryService.dropItem(command.payload.actorId, command.payload.itemComponentId);

    if (result.success) {
      const actor = (await strapi
        .documents('api::entity-sheet.entity-sheet')
        .findOne({ documentId: command.payload.actorId, populate: ['room'] })) as PopulatedEntity | null;

      return {
        success: true,
        message: 'Item Dropped',
        events: [
          ItemDroppedEventSchema.parse({
            type: 'ITEM_DROPPED',
            timestamp: Date.now(),
            room: roomId,
            actor: command.payload.actorId,
            payload: {
              itemId: command.payload.itemComponentId,
              position: actor?.position || { x: 0, y: 0, z: 0 },
            },
          }),
        ],
        stateDiff: { updates: [], creates: [], deletes: [] },
      };
    }

    return {
      success: false,
      message: 'Failed to drop',
      events: [],
      stateDiff: { updates: [], creates: [], deletes: [] },
    };
  },

  async resolvePickupItem(command: PickupItemCommand, _roomId: string): Promise<ActionResult> {
    const inventoryService = strapi.service('api::game.inventory-service');
    // Assuming inventoryService has a pickupItem method
    const result = await inventoryService.pickupItem(command.payload.actorId, command.payload.targetId);

    if (result.success) {
      return {
        success: true,
        message: 'Item Picked Up',
        events: [], // TODO: ITEM_PICKUP event
        stateDiff: { updates: [], creates: [], deletes: [] },
      };
    }
    return {
      success: false,
      message: 'Failed to pickup',
      events: [],
      stateDiff: { updates: [], creates: [], deletes: [] },
    };
  },

  async resolveThrowItem(command: ThrowItemCommand, roomId: string): Promise<ActionResult> {
    const inventoryService = strapi.service('api::game.inventory-service');
    // Logic: Throwing is basically dropping at a specific location (with potential physics/damage later)
    // For now, we delegate to dropItemAt via inventory service or similar helper
    const result = await inventoryService.dropItemAt(
      command.payload.actorId,
      command.payload.itemComponentId,
      command.payload.targetPosition
    );

    if (result.success) {
      return {
        success: true,
        message: 'Item Thrown',
        events: [
          // Using ItemDroppedEvent for now or a new ItemThrownEvent
          ItemDroppedEventSchema.parse({
            type: 'ITEM_DROPPED', // Reusing schema as per current available schemas
            timestamp: Date.now(),
            room: roomId,
            actor: command.payload.actorId,
            payload: {
              itemId: command.payload.itemComponentId,
              position: command.payload.targetPosition,
            },
          }),
        ],
        stateDiff: { updates: [], creates: [], deletes: [] },
      };
    }
    return {
      success: false,
      message: 'Failed to throw',
      events: [],
      stateDiff: { updates: [], creates: [], deletes: [] },
    };
  },

  // --- LEGACY PROXY METHODS (Keep them working for existing calls) ---

  async handleMove(command: EngineCommand) {
    if (command.type !== 'MOVE') throw new Error('Invalid command type for handleMove');

    const result = await this.resolveMove(
      command,
      command.payload.actorId ? await this.getRoomFor(command.payload.actorId) : ''
    );
    if (result.success) await this.persistResult(result);
    return result;
  },

  async handleAttack(command: EngineCommand) {
    if (command.type !== 'ATTACK') throw new Error('Invalid command type for handleAttack');

    const result = await this.resolveAttack(
      command,
      command.payload.actorId ? await this.getRoomFor(command.payload.actorId) : ''
    );
    if (result.success) await this.persistResult(result);
    return result;
  },

  async handleModifyTerrain(command: EngineCommand) {
    // Validate Payload
    const payload = command.payload as {
      actorId: string;
      center: { x: number; y: number; z: number };
      radius?: number;
      type?: string;
      blockType?: string;
    };

    const actorId = payload.actorId;
    const center = payload.center;
    const radius = payload.radius || 0;
    const blockType = (payload.type || payload.blockType || 'Stone') as string; // Explicit string

    const actor = (await strapi.documents('api::entity-sheet.entity-sheet').findOne({
      documentId: actorId,
      populate: ['room', 'room.config'],
    })) as PopulatedEntity | null;

    if (!actor || !actor.room) throw new Error('Actor must be in a room');

    const worldConfig = (actor.room.config as WorldConfig) || { chunkSize: 16 };
    const chunkSize = worldConfig.chunkSize || 16;
    const startX = Math.floor(center.x - radius);
    const endX = Math.ceil(center.x + radius);
    const startY = Math.floor(center.y - radius);
    const endY = Math.ceil(center.y + radius);

    // We use ChunkManager directly now? Or VoxelEngine?
    // The code used `voxel-engine.voxel-engine`.
    // Let's stick to legacy `voxel-engine` service if it's the intended API, or `chunk-manager`?
    // `voxel-engine` service likely wraps `chunk-manager`.
    // We assume strict typing for `voxel-engine` service call.
    interface VoxelEngine {
      editTerrain(
        cx: number,
        cy: number,
        lx: number,
        ly: number,
        z: number,
        type: string,
        source: string
      ): Promise<void>;
    }
    const voxelEngine = strapi.service('api::voxel-engine.voxel-engine') as unknown as VoxelEngine;

    let modifications = 0;
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const dist = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
        if (dist <= radius + 0.5) {
          const chunkX = Math.floor(x / chunkSize);
          const chunkY = Math.floor(y / chunkSize);
          const localX = ((x % chunkSize) + chunkSize) % chunkSize;
          const localY = ((y % chunkSize) + chunkSize) % chunkSize;

          await voxelEngine.editTerrain(
            chunkX,
            chunkY,
            localX,
            localY,
            Math.round(center.z),
            blockType,
            'Tool Modification'
          );
          modifications++;
        }
      }
    }
    return {
      success: true,
      message: `Modified ${modifications}`,
      events: [],
      stateDiff: { updates: [], creates: [], deletes: [] },
    };
  },

  // Helper to find room for legacy calls that don't pass it
  async getRoomFor(actorId: string) {
    const actor = (await strapi
      .documents('api::entity-sheet.entity-sheet')
      .findOne({ documentId: actorId, populate: ['room'] })) as PopulatedEntity | null;
    return actor?.room?.documentId || '';
  },
});
