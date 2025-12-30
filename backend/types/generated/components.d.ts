import type { Schema, Struct } from '@strapi/strapi';

export interface GameAction extends Struct.ComponentSchema {
  collectionName: 'components_game_actions';
  info: {
    description: 'Structured action (attack, spell, utility)';
    displayName: 'Action';
    icon: 'fist-raised';
  };
  attributes: {
    area: Schema.Attribute.Component<'game.area-effect', false>;
    damage: Schema.Attribute.Component<'game.damage-dice', true>;
    description: Schema.Attribute.Text;
    duration: Schema.Attribute.Enumeration<
      [
        'instantaneous',
        'concentration',
        'one_minute',
        'ten_minutes',
        'one_hour',
        'eight_hours',
        'twenty_four_hours',
        'until_dispelled',
        'special',
      ]
    > &
      Schema.Attribute.DefaultTo<'instantaneous'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    reach: Schema.Attribute.Integer;
    save: Schema.Attribute.Component<'game.save-dc', false>;
    toHit: Schema.Attribute.Integer;
    type: Schema.Attribute.Enumeration<['melee', 'ranged', 'spell', 'utility']> & Schema.Attribute.DefaultTo<'melee'>;
  };
}

export interface GameAreaEffect extends Struct.ComponentSchema {
  collectionName: 'components_game_area_effects';
  info: {
    description: 'Area of effect definition';
    displayName: 'Area Effect';
    icon: 'expand';
  };
  attributes: {
    shape: Schema.Attribute.Enumeration<['line', 'cone', 'cube', 'sphere', 'circle', 'cylinder']> &
      Schema.Attribute.Required;
    size: Schema.Attribute.Integer & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface GameDamageDice extends Struct.ComponentSchema {
  collectionName: 'components_game_damage_dice';
  info: {
    description: 'A single damage roll component (e.g. 2d6 + 3 slashing)';
    displayName: 'Damage Dice';
    icon: 'dice';
  };
  attributes: {
    bonus: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    dice: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.String;
  };
}

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

export interface GameFeature extends Struct.ComponentSchema {
  collectionName: 'components_game_features';
  info: {
    description: 'Trait or Special Ability';
    displayName: 'Feature';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    source: Schema.Attribute.Enumeration<['race', 'class', 'monster', 'feat', 'item', 'other']> &
      Schema.Attribute.DefaultTo<'monster'>;
    usage_max: Schema.Attribute.Integer;
    usage_per: Schema.Attribute.Enumeration<['short_rest', 'long_rest', 'day', 'dawn', 'dusk', 'other']>;
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
    z: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface GameSaveDc extends Struct.ComponentSchema {
  collectionName: 'components_game_save_dcs';
  info: {
    description: 'Saving throw difficulty class';
    displayName: 'Save DC';
    icon: 'shield-alt';
  };
  attributes: {
    dc: Schema.Attribute.Integer & Schema.Attribute.Required;
    stat: Schema.Attribute.Enumeration<['str', 'dex', 'con', 'int', 'wis', 'cha']> & Schema.Attribute.Required;
    success_type: Schema.Attribute.Enumeration<['none', 'half', 'other']> & Schema.Attribute.DefaultTo<'none'>;
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
    blindsight: Schema.Attribute.Integer;
    burrowSpeed: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    charisma: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    climbSpeed: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    constitution: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    darkvision: Schema.Attribute.Integer;
    dexterity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    flySpeed: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    hover: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    intelligence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    languages: Schema.Attribute.Relation<'oneToMany', 'api::language.language'>;
    passivePerception: Schema.Attribute.Integer;
    saves: Schema.Attribute.JSON;
    skills: Schema.Attribute.JSON;
    strength: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
    swimSpeed: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    tremorsense: Schema.Attribute.Integer;
    truesight: Schema.Attribute.Integer;
    walkSpeed: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    wisdom: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<10>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'game.action': GameAction;
      'game.area-effect': GameAreaEffect;
      'game.damage-dice': GameDamageDice;
      'game.dm-style': GameDmStyle;
      'game.feature': GameFeature;
      'game.inventory-item': GameInventoryItem;
      'game.player': GamePlayer;
      'game.position': GamePosition;
      'game.save-dc': GameSaveDc;
      'game.stats': GameStats;
    }
  }
}
