import { describe, expect, it } from 'vitest';
import events from '../schema.json';
import frames from '../../../../time-frame/content-types/time-frame/schema.json';

describe('snapshot event relation', () => {
  it('defines an owning relation for the existing inverse so Strapi can populate committed snapshots', () => {
    expect(events.attributes.timeFrames).toMatchObject({
      type: 'relation', relation: 'manyToMany', target: 'api::time-frame.time-frame', inversedBy: 'events',
    });
    expect(frames.attributes.events).toMatchObject({
      type: 'relation', relation: 'manyToMany', target: 'api::game-event.game-event', mappedBy: 'timeFrames',
    });
  });
});
