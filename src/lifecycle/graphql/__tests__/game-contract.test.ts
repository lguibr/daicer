import { buildSchema, parse, validate } from 'graphql';
import { describe, expect, it } from 'vitest';
import { standaloneGameSchema } from '../game-contract';

const schema = buildSchema(standaloneGameSchema);

describe('player game contract', () => {
  it('validates the complete reconnect projection without raw persistence relations', () => {
    const document = parse(`query Reconnect($roomId: ID!) {
      gameView(roomId: $roomId) {
        roomId code phase revision ownerUserId
        world { worldId language description config { seed chunkSize seaLevel fogRadius } }
        players { userId name characterSheetId characterName ready submitted }
        myself { characterSheetId blueprintId currentHp maxHp position { x y z } }
        turn { number status lastResolvedNumber submittedCount requiredCount }
        mySubmission { submissionId turnNumber kind text status feedback }
        visibleEntities { characterSheetId name type currentHp maxHp ac position { x y z } }
        messages { nodes { messageId turnNumber audience content timestamp }
          pageInfo { hasPreviousPage startCursor } }
        capabilities { canStart canSubmit canResolve }
      }
      gameMessages(roomId: $roomId, before: "cursor", last: 25) {
        nodes { messageId content } pageInfo { hasPreviousPage startCursor }
      }
    }`);
    expect(validate(schema, document)).toEqual([]);
  });

  it.each([
    'createRoom(input: {requestId:"c", language:"en", worldConfig:{seed:"s", chunkSize:16, seaLevel:0}}) { roomId code }',
    'joinRoom(input: {requestId:"j", code:"existing-uuid-code"}) { roomId }',
    'selectCharacter(input: {requestId:"s", roomId:"room", blueprintId:"blueprint"}) { players { characterSheetId } }',
    'setReady(input: {requestId:"r", roomId:"room", ready:true}) { players { ready } }',
    'startGame(input: {requestId:"start", roomId:"room"}) { operationId status phase turnNumber }',
    'submitAction(input: {requestId:"a", roomId:"room", turnNumber:1, kind:intent, text:"I walk east."}) { submissionId status }',
    'submitAction(input: {requestId:"p", roomId:"room", turnNumber:1, kind:pass}) { submissionId status }',
    'resolveTurn(input: {requestId:"t", roomId:"room", turnNumber:1}) { operationId status }',
  ])('validates lifecycle operation: %s', (field) => {
    expect(validate(schema, parse(`mutation { ${field} }`))).toEqual([]);
  });

  it.each([
    'query { gameView(roomId:"r") { room { documentId } } }',
    'query { gameView(roomId:"r") { entity_sheets { documentId } } }',
    'query { gameView(roomId:"r") { players { action } } }',
    'mutation { submitAction(input:{requestId:"x",roomId:"r",turnNumber:1,kind:intent,text:"x",actorId:"victim"}) { status } }',
    'mutation { setReady(input:{requestId:"x",roomId:"r",ready:true,userId:"other"}) { roomId } }',
    'mutation { submitAction(input:{requestId:"x",roomId:"r",turnNumber:1,kind:intent,text:"x",mode:"debug"}) { status } }',
  ])('rejects unsupported persistence or authority fields: %s', (operation) => {
    expect(validate(schema, parse(operation)).length).toBeGreaterThan(0);
  });
  it('represents a durable proposal in flight', () => {
    expect((schema.getType('GameSubmissionStatus') as any).getValues().map((value) => value.name)).toContain('proposing');
  });

});
