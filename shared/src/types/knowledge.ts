export interface Spell {
  id: string; // or documentId
  documentId: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  desc: string;
  higher_level?: string;
  material?: string;
  ritual?: boolean;
  concentration?: boolean;
}

export interface Monster {
  id: string;
  documentId: string;
  name: string;
  size: string;
  type: string;
  subtype?: string;
  alignment?: string;
  armor_class: number;
  hit_points: number;
  hit_dice: string;
  speed: Record<string, string>; // json
  stats: Record<string, number>; // json { strength: 10, ... }
  proficiencies?: Record<string, number>; // json
  damage_vulnerabilities?: string;
  damage_resistances?: string;
  damage_immunities?: string;
  condition_immunities?: string;
  senses?: string;
  languages?: string;
  challenge_rating: number;
  special_abilities?: Array<{ name: string; desc: string }>;
  actions?: Array<{ name: string; desc: string }>;
  legendary_actions?: Array<{ name: string; desc: string }>;
}

export interface Race {
  id: string;
  documentId: string;
  name: string;
  speed: number;
  size: string;
  desc: string;
  traits: Array<{ name: string; desc: string }>; // relation
}

export interface Class {
  id: string;
  documentId: string;
  name: string;
  hit_die: number;
  proficiencies: string;
  saving_throws?: string;
  features: Array<any>; // Component or relation?
}
