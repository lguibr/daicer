import type { Server as HttpServer } from 'http';
import type { Core } from '@strapi/strapi';

export interface StrapiWithServer extends Core.Strapi {
  server: Core.Strapi['server'] & {
    httpServer: HttpServer;
  };
}

export type { RoomJoinPayload, TurnProcessPayload, PlayerActionPayload, PlayerReadyPayload } from '@daicer/shared';

export interface SocketErrorPayload {
  message: string;
  code?: string;
}
