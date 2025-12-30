import {
  RoomJoinSchema,
  TurnProcessSchema,
  PlayerActionSchema,
  PlayerReadySchema,
  RoomJoinPayload,
  TurnProcessPayload,
  PlayerActionPayload,
  PlayerReadyPayload,
} from '@daicer/shared';

export class SocketValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SocketValidationError';
  }
}

export const validateRoomJoin = (data: unknown): RoomJoinPayload => {
  return RoomJoinSchema.parse(data);
};

export const validateTurnProcess = (data: unknown): TurnProcessPayload => {
  return TurnProcessSchema.parse(data);
};

export const validatePlayerAction = (data: unknown): PlayerActionPayload => {
  return PlayerActionSchema.parse(data);
};

export const validatePlayerReady = (data: unknown): PlayerReadyPayload => {
  return PlayerReadySchema.parse(data);
};
