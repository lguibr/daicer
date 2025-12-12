import type { Schema, Struct } from '@strapi/strapi';

export interface GameStats extends Struct.ComponentSchema {
  collectionName: 'components_game_stats';
  info: {
    description: '';
    displayName: 'Stats';
    icon: 'chart-bar';
  };
  attributes: {
    charisma: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    constitution: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    dexterity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    intelligence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    strength: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    wisdom: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'game.stats': GameStats;
    }
  }
}
