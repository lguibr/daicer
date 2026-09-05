/** Application transaction boundary for TurnPipeline's simultaneous submission milestone. */
import { randomUUID } from 'node:crypto';
import { Alea } from '../src/engine/voxel/utils/math';
import { KernelCommandSchema, KernelStateSchema, resolveCommandBatch } from '../src/engine/core/command-kernel';
import { OPERATION_UID, ROOM_UID, documentId, gameError, requireLobby, requireRoom, requireUser } from './room-access';
import { claimRoomRevision, requestIdentity } from './room-lifecycle';
import { initialState, loadPlayerSheets, resetBudgets, terrainSnapshot } from './turn-kernel-adapter';
import { proposeIntent } from './intent-proposal';

function runtime(room, turnNumber?: number) {
  const value = room.turnData;
  if (room.phase !== 'gameplay' || value?.version !== 1) gameError('INVALID_PHASE', 'Room is not in supported gameplay.');
  if (turnNumber != null && value.turnNumber !== turnNumber) gameError('STALE_TURN', 'Refresh the current turn.');
  if (value.status !== 'collecting') gameError('TURN_RESOLVING', 'Turn is being resolved.');
  KernelStateSchema.parse(value.state);
  return value;
}
function validTurn(input) {
  if (!Number.isInteger(input.turnNumber) || input.turnNumber < 1) gameError('INVALID_INPUT', 'Invalid turn number.');
}
function receipt(submission, state) {
  return { submissionId: submission.submissionId, turnNumber: state.turnNumber, status: submission.status,
    submittedCount: state.submissions.filter((entry) => entry.status === 'submitted').length,
    requiredCount: state.requiredUserIds.length };
}

export default ({ strapi }) => {
  const records = () => strapi.documents(OPERATION_UID);
  /** A claim survives network work. Failed or abandoned proposals require a fresh request ID. */
  async function claim(operation, input, user, ownerOnly = false) {
    const userId = requireUser(user);
    await requireRoom(strapi, input.roomId, user, ownerOnly);
    const { key, hash } = requestIdentity(operation, input, userId);
    const existing = async () => {
      const prior = await records().findFirst({ filters: { key } });
      if (!prior) return null;
      if (prior.requestHash !== hash) gameError('IDEMPOTENCY_CONFLICT', 'Request ID was reused with different input.');
      if (prior.status === 'complete') return { prior: prior.result.response };
      gameError(prior.status === 'failed' ? 'OPERATION_FAILED' : 'STATE_CONFLICT',
        prior.status === 'failed' ? 'Request failed. Refresh and submit with a new request ID.' : 'Request is running. Refresh before retrying; an abandoned request requires a new request ID.');
    };
    const prior = await existing();
    if (prior) return prior;
    try {
      return { operation: await records().create({ data: { key, requestHash: hash, status: 'running', room: input.roomId,
        result: { input, operation } } }) };
    } catch (error) {
      const duplicate = await existing();
      if (duplicate) return duplicate;
      throw error;
    }
  }
  async function execute(operationName, input, user, ownerOnly, work) {
    const claimed = await claim(operationName, input, user, ownerOnly);
    if ('prior' in claimed) return claimed.prior;
    try {
      return await work(claimed.operation);
    } catch (error) {
      // A lost commit response may still represent a successful transaction.
      const latest = await records().findOne({ documentId: claimed.operation.documentId });
      if (latest?.status === 'complete') return latest.result.response;
      await records().update({ documentId: claimed.operation.documentId, data: { status: 'failed' } });
      throw error;
    }
  }
  async function complete(operation, response) {
    await records().update({ documentId: operation.documentId, data: { status: 'complete', result: { response } } });
    return response;
  }
  async function persistState(room, nextRuntime) {
    for (const entity of nextRuntime.state.entities) {
      await strapi.documents('api::entity-sheet.entity-sheet').update({ documentId: entity.id,
        data: { currentHp: entity.hp, position: entity.position } });
    }
    await strapi.documents(ROOM_UID).update({ documentId: room.documentId,
      data: { phase: 'gameplay', turnData: nextRuntime, entropyState: nextRuntime.rngState } });
  }
  async function snapshot(roomId, turnNumber, state, rngState) {
    await strapi.documents('api::time-frame.time-frame').create({ data: { room: roomId, turnNumber,
      timestamp: new Date().toISOString(), gameState: state, entropySnapshot: rngState } });
  }
  return {
    async startGame(input, user) {
      return execute('startGame', input, user, true, async (operation) => {
        const { room } = await requireRoom(strapi, input.roomId, user, true);
        requireLobby(room);
        if ((room.players?.length ?? 0) < 2 || !room.players.every((player) => player.isReady)) gameError('NOT_ALL_READY', 'At least two ready players are required.');
        const sheets = await loadPlayerSheets(strapi, room);
        const history = await strapi.documents('api::turn.turn').findFirst({ filters: { room: { documentId: input.roomId } } });
        if (history) gameError('LEGACY_STATE_UNSUPPORTED', 'Room already has game history.');
        const terrain = await terrainSnapshot(strapi, room.world, [-3, -2, -1, 0, 1, 2, 3].map((z) => ({ x: 0, y: 0, z })));
        const initial = initialState(room, sheets, terrain);
        const rngState = new Alea(`${room.world.seed}:${room.documentId}:basic-v1`).snapshot();
        const next = { version: 1, turnNumber: 1, lastResolvedNumber: 0, status: 'collecting',
          requiredUserIds: room.players.map((player) => documentId(player.user)), submissions: [], ...initial, rngState };
        return strapi.db.transaction(async () => {
          const { room: current } = await requireRoom(strapi, input.roomId, user, true);
          requireLobby(current);
          if (current.revision !== room.revision) gameError('STATE_CONFLICT', 'Lobby changed during initialization.');
          await claimRoomRevision(strapi, current);
          await persistState(current, next);
          await strapi.documents('api::turn.turn').create({ data: { room: input.roomId, turnNumber: 0, status: 'complete',
            metadata: { version: 1, initialState: initial.state, rules: initial.rules, terrain, rngState }, characterSnapshots: initial.state.entities } });
          await snapshot(input.roomId, 0, initial.state, rngState);
          return complete(operation, { operationId: operation.documentId, roomId: input.roomId, phase: 'gameplay', turnNumber: 1, status: 'complete' });
        });
      });
    },

    async submitAction(input, user) {
      validTurn(input);
      if (!['intent', 'pass'].includes(input.kind) || (input.kind === 'intent' && (typeof input.text !== 'string' || !input.text.trim() || input.text.length > 4000)) ||
          (input.kind === 'pass' && input.text != null)) gameError('INVALID_INPUT', 'Submit a bounded intent or an explicit pass.');
      return execute('submitAction', input, user, false, async (operation) => {
        const { room, player, userId } = await requireRoom(strapi, input.roomId, user);
        const state = runtime(room, input.turnNumber), actorId = documentId(player.characterSheet);
        if (!state.requiredUserIds.includes(userId)) gameError('FORBIDDEN', 'Player is not in this turn.');
        if (state.submissions.some((entry) => entry.userId === userId && (entry.status === 'submitted' || (entry.status === 'proposing' && entry.proposalExpiresAt > Date.now())))) gameError('ALREADY_SUBMITTED', 'An action is already submitted or being proposed.');
        const submissionId = randomUUID();
        // Durable private input exists before any network call. Expiry permits explicit recovery.
        await strapi.db.transaction(async () => {
          const { room: current } = await requireRoom(strapi, input.roomId, user);
          const currentState = runtime(current, input.turnNumber);
          const prior = currentState.submissions.find((entry) => entry.userId === userId);
          if (prior && (prior.status === 'submitted' || (prior.status === 'proposing' && prior.proposalExpiresAt > Date.now()))) gameError('ALREADY_SUBMITTED', 'An action is already submitted or being proposed.');
          await claimRoomRevision(strapi, current);
          await strapi.documents(ROOM_UID).update({ documentId: input.roomId, data: { turnData: {
            ...currentState, submissions: [...currentState.submissions.filter((entry) => entry.userId !== userId), {
              submissionId, userId, actorId, kind: input.kind, text: input.text ?? null,
              status: 'proposing', proposalExpiresAt: Date.now() + 120000, command: null, feedback: null,
            }],
          } } });
        });
        let proposal: any = { type: 'PASS', payload: {} }, feedback: string = null;
        const view = await strapi.service('api::game.room-access').gameView(input.roomId, user);
        if (input.kind === 'intent') {
          const actor = state.state.entities.find((entry) => entry.id === actorId);
          try {
            const parsed = await proposeIntent(input.text, { myself: view.myself, targets: view.visibleEntities,
              actions: state.rules.attacks.filter((attack) => actor?.attackIds.includes(attack.id)) }, room.world.language);
            if (!parsed.success || parsed.data.type === 'UNSUPPORTED') feedback = 'Use a clear move, supported basic attack, or pass.';
            else proposal = parsed.data;
          } catch {
            feedback = 'A usable proposal was unavailable. Your intent is saved; revise or retry.';
          }
        }
        if (proposal.type === 'ATTACK' && !view.visibleEntities.some((entry) => entry.characterSheetId === proposal.payload.targetId)) feedback = 'Choose a visible target.';
        const command = KernelCommandSchema.parse({ ...proposal, commandId: submissionId, actorId });
        return strapi.db.transaction(async () => {
          const { room: current, player: currentPlayer } = await requireRoom(strapi, input.roomId, user);
          const currentState = runtime(current, input.turnNumber);
          if (documentId(currentPlayer.characterSheet) !== actorId) gameError('STATE_CONFLICT', 'Character changed.');
          const pending = currentState.submissions.find((entry) => entry.userId === userId);
          if (pending?.submissionId !== submissionId || pending.status !== 'proposing') gameError('STATE_CONFLICT', 'Proposal was superseded.');
          if (pending.proposalExpiresAt <= Date.now()) feedback = 'Proposal expired. Your intent is saved; submit again.';
          await claimRoomRevision(strapi, current);
          // Mechanical validation is repeated against the turn snapshot. No speculative effects persist.
          if (!feedback) {
            const terrain = await terrainSnapshot(strapi, current.world, currentState.state.entities.map((entry) => entry.position), 20);
            const checked = resolveCommandBatch({ state: currentState.state, rules: currentState.rules, terrain, commands: [command], rngState: currentState.rngState });
            if (checked.outcomes[0].status === 'rejected') feedback = `Action needs revision: ${checked.outcomes[0].code}.`;
          }
          const submission = { submissionId, userId, actorId, kind: input.kind, text: input.text ?? null,
            status: feedback ? 'needs_revision' : 'submitted', feedback, command: feedback ? null : command };
          const next = { ...currentState, submissions: [...currentState.submissions.filter((entry) => entry.userId !== userId), submission] };
          await strapi.documents(ROOM_UID).update({ documentId: input.roomId, data: { turnData: next } });
          return complete(operation, receipt(submission, next));
        });
      });
    },

    async resolveTurn(input, user) {
      validTurn(input);
      return execute('resolveTurn', input, user, true, async (operation) => {
        const { room } = await requireRoom(strapi, input.roomId, user, true);
        const state = runtime(room, input.turnNumber);
        if (!state.requiredUserIds.every((id) => state.submissions.some((entry) => entry.userId === id && entry.status === 'submitted'))) gameError('NOT_ALL_SUBMITTED', 'Every player must submit or pass.');
        await loadPlayerSheets(strapi, room);
        const terrain = await terrainSnapshot(strapi, room.world, state.state.entities.map((entry) => entry.position), 20);
        const commands = [...state.submissions].sort((a, b) => a.actorId < b.actorId ? -1 : a.actorId > b.actorId ? 1 : 0).map((entry) => entry.command);
        const result = resolveCommandBatch({ state: state.state, rules: state.rules, terrain, commands, rngState: state.rngState });
        return strapi.db.transaction(async () => {
          const { room: current } = await requireRoom(strapi, input.roomId, user, true);
          runtime(current, input.turnNumber);
          if (current.revision !== room.revision) gameError('STATE_CONFLICT', 'Room changed during resolution.');
          await claimRoomRevision(strapi, current);
          const nextCollectingState = resetBudgets(result.nextState, state.movementFeet);
          const turn = await strapi.documents('api::turn.turn').create({ data: { room: input.roomId, turnNumber: input.turnNumber, status: 'complete', actions: commands,
            metadata: { version: 1, before: state.state, after: result.nextState, nextCollectingState, rules: state.rules, terrain,
              rngBefore: state.rngState, rngAfter: result.nextRngState, events: result.events, outcomes: result.outcomes }, characterSnapshots: result.nextState.entities } });
          await snapshot(input.roomId, input.turnNumber, nextCollectingState, result.nextRngState);
          const next = { ...state, turnNumber: input.turnNumber + 1, lastResolvedNumber: input.turnNumber,
            state: nextCollectingState, rngState: result.nextRngState, submissions: [] };
          await persistState(current, next);
          for (const [index, outcome] of result.outcomes.entries()) {
            const submission = state.submissions.find((entry) => entry.submissionId === commands[index].commandId);
            await strapi.documents('api::message.message').create({ data: { room: input.roomId, turn: turn.documentId,
              recipient: submission.userId, senderName: 'System', senderType: 'system', timestamp: String(Date.now()),
              content: outcome.status === 'resolved' ? 'Your action resolved.' : `Your action could not resolve: ${outcome.code}.` } });
          }
          await strapi.documents('api::message.message').create({ data: { room: input.roomId, turn: turn.documentId,
            senderName: 'System', senderType: 'system', timestamp: String(Date.now()), content: `Turn ${input.turnNumber} resolved.` } });
          return complete(operation, { operationId: operation.documentId, roomId: input.roomId, phase: 'gameplay', turnNumber: next.turnNumber, status: 'complete' });
        });
      });
    },
  };
};
