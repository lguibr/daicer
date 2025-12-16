import type { Schema, Struct } from '@strapi/strapi';

export interface GameDmStyle extends Struct.ComponentSchema {
  collectionName: 'components_game_dm_styles';
  info: {
    displayName: 'DM Style';
    icon: 'dungeon';
  };
  attributes: {
    customDirectives: Schema.Attribute.Text;
    detail: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    engagement: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    narrative: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    specialMode: Schema.Attribute.String;
    verbosity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
  };
}

export interface GameGenerationParams extends Struct.ComponentSchema {
  collectionName: 'components_game_generation_params';
  info: {
    displayName: 'Generation Params';
    icon: 'mountain';
  };
  attributes: {
    bspMaxRoomSize: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<12>;
    bspMinRoomSize: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<4>;
    bspSize: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<64>;
    caveBirthLimit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<4>;
    caveDeathLimit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    caveFillPercentage: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.45>;
    caveIterations: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<5>;
    elevationOctaves: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<4>;
    elevationPersistence: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.5>;
    elevationScale: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.02>;
    featureAttempts: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<30>;
    featureMinDistance: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<20>;
    generateRoads: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    maxStructures: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    moistureOctaves: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    moisturePersistence: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.5>;
    moistureScale: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.03>;
    structureMinDistance: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<30>;
  };
}

export interface GameInventoryItem extends Struct.ComponentSchema {
  collectionName: 'components_game_inventory_items';
  info: {
    description: 'An item in an inventory or slot';
    displayName: 'Inventory Item';
  };
  attributes: {
    isEquipped: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    item: Schema.Attribute.Relation<'oneToOne', 'api::equipment.equipment'>;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    slot: Schema.Attribute.Enumeration<
      [
        'backpack',
        'main_hand',
        'off_hand',
        'armor',
        'head',
        'feet',
        'neck',
        'hands',
        'cloak',
        'ring_1',
        'ring_2',
        'accessory',
      ]
    > &
      Schema.Attribute.DefaultTo<'backpack'>;
  };
}

export interface GamePlayer extends Struct.ComponentSchema {
  collectionName: 'components_game_players';
  info: {
    description: 'A player in a room';
    displayName: 'Player';
    icon: 'user';
  };
  attributes: {
    action: Schema.Attribute.String;
    character: Schema.Attribute.Relation<'oneToOne', 'api::character.character'>;
    characterSheet: Schema.Attribute.Relation<'oneToOne', 'api::character-sheet.character-sheet'>;
    isOnline: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isReady: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    joinedAt: Schema.Attribute.DateTime;
    name: Schema.Attribute.String;
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
  };
}

export interface GamePosition extends Struct.ComponentSchema {
  collectionName: 'components_game_positions';
  info: {
    description: 'Grid coordinates';
    displayName: 'Position';
    icon: 'map';
  };
  attributes: {
    mapId: Schema.Attribute.String;
    x: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    y: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

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
    speed: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<30>;
    strength: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    wisdom: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'game.dm-style': GameDmStyle;
      'game.generation-params': GameGenerationParams;
      'game.inventory-item': GameInventoryItem;
      'game.player': GamePlayer;
      'game.position': GamePosition;
      'game.stats': GameStats;
    }
  }
}
