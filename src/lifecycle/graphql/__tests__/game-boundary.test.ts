import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildSchema, parse, validate } from 'graphql';
import { registerGraphQLExtension } from '../resolvers';

const require = createRequire(import.meta.url);
const shadowFactory = require(path.resolve('node_modules/@strapi/plugin-graphql/dist/server/services/extension/shadow-crud-manager.js'));

describe('registered game schema boundary', () => {
  it('builds registered SDL and disables raw roots, writes and reverse fields', () => {
    let registration;
    const shadowCRUD = shadowFactory();
    const extension = { shadowCRUD, use: (value) => { registration = value; } };
    const strapi = {
      plugin: () => ({ service: () => extension }),
      contentTypes: {
        'api::room.room': { attributes: { turnData: { type: 'json' } } },
        'plugin::users-permissions.user': { attributes: { rooms: { type: 'relation', target: 'api::room.room' } } },
        'api::entity.entity': { attributes: { sheets: { type: 'relation', target: 'api::entity-sheet.entity-sheet' } } },
      },
      components: { 'game.link': { attributes: { sheet: { type: 'relation', target: 'api::entity-sheet.entity-sheet' } } } },
    };
    registerGraphQLExtension(strapi);
    const schema = buildSchema('scalar JSON\ntype Query { _unused: Boolean }\ntype Mutation { _unused: Boolean }\n' + registration.typeDefs);
    expect(validate(schema, parse('mutation { setReady(input: { requestId:"r",roomId:"room",ready:true }) { phase } }'))).toEqual([]);
    expect(validate(schema, parse('{ gameView(roomId:"room") { room { turnData } } }')).length).toBeGreaterThan(0);
    expect(schema.getQueryType().getFields().gameView.type.toString()).toBe('RoomView!');
    expect(shadowCRUD('api::room.room').isDisabled()).toBe(true);
    expect(shadowCRUD('api::turn-lock.turn-lock').isDisabled()).toBe(true);
    expect(shadowCRUD('api::knowledge-snippet.knowledge-snippet').isDisabled()).toBe(true);
    expect(shadowCRUD('api::entity.entity').areMutationsDisabled()).toBe(true);
    expect(shadowCRUD('plugin::users-permissions.user').field('rooms').isEnabled()).toBe(false);
    expect(shadowCRUD('game.link').field('sheet').isEnabled()).toBe(false);
    expect(shadowCRUD('api::room.room').field('turnData').isEnabled()).toBe(false);
    expect(registration.resolvers.Mutation.resolveTurn).toBeTypeOf('function');
    expect(registration.resolvers.Room).toBeUndefined();
    expect(registration.resolvers.EntitySheet).toBeUndefined();
  });
});
